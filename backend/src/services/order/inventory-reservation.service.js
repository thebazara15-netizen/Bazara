'use strict';

const { Op, Transaction, UniqueConstraintError } = require('sequelize');
const {
  sequelize, CheckoutDraft, BuyerOrder, SellerOrder, BuyerOrderItem, InventoryReservation,
  Product, SellerTaxProfile, SellerShippingPolicy
} = require('../../models');
const checkoutService = require('../checkout/checkout.service');
const { CheckoutError, positiveId } = require('../checkout/checkout.validation');
const { addressSnapshot, buildMarketplaceOrderDraft } = require('./marketplace-order-snapshot.service');
const { priceCheckoutSnapshot } = require('../pricing/checkout-pricing');

function reservationTtlMinutes() {
  const parsed = Number.parseInt(process.env.INVENTORY_RESERVATION_TTL_MINUTES, 10);
  return Number.isInteger(parsed) && parsed >= 5 && parsed <= 60 ? parsed : 15;
}

const amount = (value, field) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new CheckoutError(`${field} is invalid`, 409, 'DRAFT_TOTAL_INVALID');
  return parsed;
};
const sum = (values, field) => values.reduce((total, value) => {
  const next = total + amount(value, field);
  if (!Number.isSafeInteger(next)) throw new CheckoutError(`${field} exceeds supported range`, 409, 'DRAFT_TOTAL_INVALID');
  return next;
}, 0);

async function expireReservations(now, transaction) {
  return InventoryReservation.update({ status: 'EXPIRED' }, {
    where: { status: 'RESERVED', expiresAt: { [Op.lte]: now } }, transaction
  });
}

async function releaseReservation(id, transaction = null) {
  const run = async (tx) => {
    const reservation = await InventoryReservation.findByPk(positiveId(id, 'reservation id'), { transaction: tx });
    if (!reservation || reservation.status !== 'RESERVED') return reservation;
    await reservation.update({ status: 'RELEASED', releasedAt: new Date() }, { transaction: tx });
    return reservation;
  };
  return transaction ? run(transaction) : sequelize.transaction(run);
}

async function releaseOrderReservations(buyerOrderId, transaction = null) {
  const run = (tx) => InventoryReservation.update({ status: 'RELEASED', releasedAt: new Date() }, {
    where: { buyerOrderId: positiveId(buyerOrderId, 'buyer order id'), status: 'RESERVED' }, transaction: tx
  });
  return transaction ? run(transaction) : sequelize.transaction(run);
}

async function commitOrderReservations(buyerOrderId, transaction = null) {
  const run = (tx) => InventoryReservation.update({ status: 'COMMITTED', committedAt: new Date() }, {
    where: { buyerOrderId: positiveId(buyerOrderId, 'buyer order id'), status: 'RESERVED' }, transaction: tx
  });
  return transaction ? run(transaction) : sequelize.transaction(run);
}

function assertTotals(snapshot, draft) {
  const sellers = snapshot.sellerOrders || [];
  const sellerFields = ['subtotalPaise', 'shippingPaise', 'taxPaise', 'discountPaise', 'grandTotalPaise'];
  for (const seller of sellers) {
    const items = seller.items || [];
    const itemSubtotal = sum(items.map((item) => item.lineSubtotalPaise), 'item subtotal');
    const itemTax = sum(items.map((item) => item.taxTotalPaise), 'item tax');
    const itemTotal = sum(items.map((item) => item.lineTotalPaise), 'item total');
    const expectedTotal = amount(seller.subtotalPaise, 'seller subtotal') + amount(seller.shippingPaise, 'seller shipping') + amount(seller.taxPaise, 'seller tax') - amount(seller.discountPaise, 'seller discount');
    if (itemSubtotal !== amount(seller.subtotalPaise, 'seller subtotal') || itemTax !== amount(seller.taxPaise, 'seller tax') ||
        itemTotal !== itemSubtotal + itemTax || expectedTotal !== amount(seller.grandTotalPaise, 'seller total')) {
      throw new CheckoutError('Checkout draft seller totals are inconsistent', 409, 'DRAFT_TOTAL_MISMATCH');
    }
  }
  for (const field of sellerFields) {
    if (sum(sellers.map((seller) => seller[field]), field) !== amount(draft[field], field)) {
      throw new CheckoutError(`Checkout draft ${field} is inconsistent`, 409, 'DRAFT_TOTAL_MISMATCH');
    }
  }
}

async function serializePreparedOrder(order, transaction = null) {
  const loaded = await BuyerOrder.findByPk(order.id, {
    include: [{ model: SellerOrder, as: 'sellerOrders', include: [{ model: BuyerOrderItem, as: 'items', include: [{ model: InventoryReservation, as: 'inventoryReservation' }] }] }],
    transaction
  });
  const raw = loaded.toJSON();
  const reservations = raw.sellerOrders.flatMap((seller) => seller.items.map((item) => item.inventoryReservation).filter(Boolean));
  const reservationsActive = reservations.length > 0 && reservations.every((item) => item.status === 'RESERVED' && new Date(item.expiresAt) > new Date());
  return {
    buyerOrderId: raw.id,
    checkoutDraftId: raw.checkoutDraftId,
    status: raw.status,
    currency: raw.currency,
    shippingAddressSnapshot: raw.shippingAddressSnapshot,
    billingAddressSnapshot: raw.billingAddressSnapshot,
    subtotalPaise: Number(raw.subtotalPaise), shippingPaise: Number(raw.shippingPaise), taxPaise: Number(raw.taxPaise),
    discountPaise: Number(raw.discountPaise), grandTotalPaise: Number(raw.grandTotalPaise),
    reservationExpiresAt: reservations.length ? reservations.map((item) => item.expiresAt).sort()[0] : null,
    sellerGroups: raw.sellerOrders,
    paymentReady: false,
    paymentPreparationReady: raw.status === 'PENDING_PAYMENT' && reservationsActive
  };
}

async function prepareAttempt(buyerId, draftId, req) {
  const type = sequelize.getDialect() === 'sqlite' ? Transaction.TYPES.IMMEDIATE : Transaction.TYPES.DEFERRED;
  return sequelize.transaction({ type }, async (transaction) => {
    const now = new Date();
    await expireReservations(now, transaction);
    const existing = await BuyerOrder.findOne({ where: { checkoutDraftId: draftId, buyerId }, transaction });
    if (existing) return serializePreparedOrder(existing, transaction);
    const draft = await CheckoutDraft.findOne({ where: { id: draftId, buyerId }, transaction, lock: transaction.LOCK.UPDATE });
    if (!draft) throw new CheckoutError('Checkout draft not found', 404, 'DRAFT_NOT_FOUND');
    if (draft.status !== 'ACTIVE') throw new CheckoutError('Checkout draft is not active', 409, 'DRAFT_NOT_ACTIVE');
    if (new Date(draft.expiresAt) <= new Date()) throw new CheckoutError('Checkout draft has expired', 409, 'DRAFT_EXPIRED');
    if (draft.pricingStatus !== 'READY') throw new CheckoutError('Checkout pricing is not ready', 409, 'DRAFT_PRICING_NOT_READY');

    const [{ shipping, billing }, context] = await Promise.all([
      checkoutService.ownedAddresses(buyerId, Number(draft.shippingAddressId), Number(draft.billingAddressId), transaction),
      checkoutService.contextForBuyer(buyerId, req, transaction)
    ]);
    if (context.fingerprint !== draft.cartFingerprint) throw new CheckoutError('Checkout draft is stale; create a new draft', 409, 'DRAFT_STALE');
    if (!checkoutService.sameJson(addressSnapshot(shipping, buyerId, 'shipping'), draft.shippingAddressSnapshot) ||
        !checkoutService.sameJson(addressSnapshot(billing, buyerId, 'billing'), draft.billingAddressSnapshot)) {
      throw new CheckoutError('Checkout addresses changed; create a new draft', 409, 'DRAFT_STALE');
    }
    const validatedCart = { ...context.cart, items: context.cart.items.map((item) => ({ ...item, unit: context.productMap.get(Number(item.productId)).unit || 'UNSPECIFIED' })) };
    const base = buildMarketplaceOrderDraft({ buyer: context.buyer, shippingAddress: shipping, billingAddress: billing, validatedCart, products: context.products, vendors: context.vendors });
    const vendorIds = context.vendors.map((vendor) => Number(vendor.id));
    const [taxProfiles, shippingPolicies] = await Promise.all([
      SellerTaxProfile.findAll({ where: { vendorId: { [Op.in]: vendorIds } }, transaction }),
      SellerShippingPolicy.findAll({ where: { vendorId: { [Op.in]: vendorIds }, isActive: true }, transaction })
    ]);
    const currentPricing = priceCheckoutSnapshot({ orderSnapshot: base, products: context.products, taxProfiles, shippingPolicies, placeOfSupplyStateCode: shipping.stateCode });
    if (currentPricing.pricingStatus !== 'READY' || !checkoutService.sameJson(currentPricing.orderSnapshot, draft.orderSnapshot)) {
      throw new CheckoutError('Checkout commercial configuration changed; create a new draft', 409, 'DRAFT_STALE');
    }
    assertTotals(draft.orderSnapshot, draft);

    for (const product of context.products) {
      const requested = draft.orderSnapshot.sellerOrders.flatMap((seller) => seller.items).filter((item) => Number(item.productId) === Number(product.id)).reduce((total, item) => total + Number(item.quantity), 0);
      const reserved = Number(await InventoryReservation.sum('quantity', { where: { productId: product.id, status: 'RESERVED', expiresAt: { [Op.gt]: now } }, transaction }) || 0);
      if (Math.max(0, Number(product.stock) - reserved) < requested) throw new CheckoutError(`Insufficient available stock for product ${product.id}`, 409, 'INSUFFICIENT_AVAILABLE_STOCK');
    }

    const buyerSnapshot = draft.orderSnapshot.buyerOrder;
    const buyerOrder = await BuyerOrder.create({ buyerId, checkoutDraftId: draft.id, status: 'PENDING_PAYMENT', currency: draft.currency,
      subtotalPaise: draft.subtotalPaise, shippingPaise: draft.shippingPaise, taxPaise: draft.taxPaise, discountPaise: draft.discountPaise, grandTotalPaise: draft.grandTotalPaise,
      shippingAddressSnapshot: draft.shippingAddressSnapshot, billingAddressSnapshot: draft.billingAddressSnapshot, checkoutReference: buyerSnapshot.checkoutReference || null
    }, { transaction });
    const expiresAt = new Date(now.getTime() + reservationTtlMinutes() * 60 * 1000);
    for (const seller of draft.orderSnapshot.sellerOrders) {
      const sellerOrder = await SellerOrder.create({ buyerOrderId: buyerOrder.id, vendorId: seller.vendorId, status: 'PENDING_PAYMENT', currency: seller.currency,
        subtotalPaise: seller.subtotalPaise, shippingPaise: seller.shippingPaise, taxPaise: seller.taxPaise, discountPaise: seller.discountPaise,
        grandTotalPaise: seller.grandTotalPaise, sellerSnapshot: seller.sellerSnapshot, freightMode: seller.shippingPolicySnapshot?.mode || seller.freightMode || null
      }, { transaction });
      for (const item of seller.items) {
        const orderItem = await BuyerOrderItem.create({ sellerOrderId: sellerOrder.id, productId: item.productId, vendorId: item.vendorId,
          productName: item.productName, descriptionSnapshot: item.descriptionSnapshot, imageUrlSnapshot: item.imageUrlSnapshot, quantity: item.quantity,
          unit: item.unit, moqSnapshot: item.moqSnapshot, unitPricePaise: item.unitPricePaise, lineSubtotalPaise: item.lineSubtotalPaise,
          discountPaise: item.discountPaise, taxableValuePaise: item.taxableValuePaise, gstRateBasisPoints: item.gstRateBasisPoints,
          cgstPaise: item.cgstPaise, sgstPaise: item.sgstPaise, igstPaise: item.igstPaise, taxTotalPaise: item.taxTotalPaise,
          lineTotalPaise: item.lineTotalPaise, hsnCode: item.hsnCode, currency: item.currency
        }, { transaction });
        await InventoryReservation.create({ buyerOrderId: buyerOrder.id, buyerOrderItemId: orderItem.id, productId: item.productId, quantity: item.quantity, status: 'RESERVED', expiresAt }, { transaction });
      }
    }
    return serializePreparedOrder(buyerOrder, transaction);
  });
}

async function prepareMarketplaceOrderFromDraft(buyerId, rawDraftId, body, req) {
  if (body && Object.keys(body).length) throw new CheckoutError('Order preparation does not accept commercial input', 400, 'PREPARE_BODY_NOT_ALLOWED');
  const draftId = positiveId(rawDraftId, 'draft id');
  try {
    return await prepareAttempt(Number(buyerId), draftId, req);
  } catch (error) {
    const code = error?.parent?.code || error?.original?.code;
    if (!(error instanceof UniqueConstraintError) && code !== 'SQLITE_CONSTRAINT' && code !== 'SQLITE_BUSY') throw error;
    const existing = await BuyerOrder.findOne({ where: { checkoutDraftId: draftId, buyerId } });
    if (existing) return serializePreparedOrder(existing);
    throw new CheckoutError('Order preparation conflicted; retry safely', 409, 'ORDER_PREPARATION_CONFLICT');
  }
}

module.exports = { reservationTtlMinutes, prepareMarketplaceOrderFromDraft, expireReservations, releaseReservation, releaseOrderReservations, commitOrderReservations, assertTotals, serializePreparedOrder };
