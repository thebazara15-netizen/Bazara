'use strict';

const { Op, UniqueConstraintError } = require('sequelize');
const { sequelize, CheckoutDraft, Address, Product, User } = require('../../models');
const cartService = require('../cart/services/cart.service');
const { addressSnapshot, buildMarketplaceOrderDraft } = require('../order/marketplace-order-snapshot.service');
const { cartFingerprint } = require('./cart-fingerprint');
const { CheckoutError, positiveId, createInput } = require('./checkout.validation');

const PRODUCT_ATTRIBUTES = ['id', 'name', 'description', 'images', 'vendorId', 'moq', 'stock', 'updatedAt'];
const VENDOR_ATTRIBUTES = ['id', 'role', 'companyName', 'firstName', 'lastName', 'location', 'gstNumber'];
const IMMUTABLE_UNIT = 'piece'; // Current catalogue and cart pricing are explicitly per piece.

function ttlMinutes() {
  const parsed = Number.parseInt(process.env.CHECKOUT_DRAFT_TTL_MINUTES, 10);
  return Number.isInteger(parsed) && parsed >= 5 && parsed <= 60 ? parsed : 15;
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function contextForBuyer(buyerId, req) {
  const buyer = await User.findOne({ where: { id: buyerId, role: 'CLIENT' }, attributes: ['id', 'role'] });
  if (!buyer) throw new CheckoutError('Client account not found', 404, 'CLIENT_NOT_FOUND');
  const cart = await cartService.getCart(buyerId, req);
  if (!cart.items.length) throw new CheckoutError('Cart is empty', 409, 'CART_EMPTY');
  if (!cart.valid || cart.items.some((item) => !item.valid)) throw new CheckoutError('Cart must be corrected before checkout', 409, 'CART_INVALID');
  const productIds = cart.items.map((item) => Number(item.productId));
  const products = await Product.findAll({ where: { id: { [Op.in]: productIds } }, attributes: PRODUCT_ATTRIBUTES });
  if (products.length !== productIds.length) throw new CheckoutError('A cart product is no longer available', 409, 'CART_PRODUCT_UNAVAILABLE');
  const productMap = new Map(products.map((product) => [Number(product.id), product]));
  const vendorIds = [...new Set(products.map((product) => Number(product.vendorId)))];
  const vendors = await User.findAll({ where: { id: { [Op.in]: vendorIds }, role: 'VENDOR' }, attributes: VENDOR_ATTRIBUTES });
  if (vendors.length !== vendorIds.length) throw new CheckoutError('A cart seller is unavailable', 409, 'CART_VENDOR_UNAVAILABLE');
  return { buyer, cart, products, vendors, productMap, fingerprint: cartFingerprint(cart, productMap) };
}

async function ownedAddresses(buyerId, shippingAddressId, billingAddressId) {
  const addresses = await Address.findAll({ where: { id: { [Op.in]: [shippingAddressId, billingAddressId] }, userId: buyerId } });
  const map = new Map(addresses.map((address) => [Number(address.id), address]));
  const shipping = map.get(shippingAddressId);
  const billing = map.get(billingAddressId);
  if (!shipping || !billing) throw new CheckoutError('Address not found', 404, 'ADDRESS_NOT_FOUND');
  return { shipping, billing };
}

function serialize(draft, overrides = {}) {
  const raw = draft.toJSON ? draft.toJSON() : draft;
  const snapshot = raw.orderSnapshot;
  return {
    draftId: raw.id,
    status: raw.status,
    pricingStatus: raw.pricingStatus,
    currency: raw.currency,
    expiresAt: raw.expiresAt,
    cartFingerprint: raw.cartFingerprint,
    shippingAddressSnapshot: raw.shippingAddressSnapshot,
    billingAddressSnapshot: raw.billingAddressSnapshot,
    sellerGroups: snapshot?.sellerOrders || [],
    items: (snapshot?.sellerOrders || []).flatMap((group) => group.items || []),
    subtotalPaise: Number(raw.subtotalPaise),
    shippingPaise: raw.shippingPaise == null ? null : Number(raw.shippingPaise),
    taxPaise: raw.taxPaise == null ? null : Number(raw.taxPaise),
    discountPaise: raw.discountPaise == null ? null : Number(raw.discountPaise),
    grandTotalPaise: raw.grandTotalPaise == null ? null : Number(raw.grandTotalPaise),
    paymentReady: false,
    stale: false,
    ...overrides
  };
}

async function createDraft(buyerId, body, req) {
  const input = createInput(body);
  const [{ shipping, billing }, context] = await Promise.all([
    ownedAddresses(buyerId, input.shippingAddressId, input.billingAddressId),
    contextForBuyer(buyerId, req)
  ]);
  const shippingSnapshot = addressSnapshot(shipping, buyerId, 'shipping');
  const billingSnapshot = addressSnapshot(billing, buyerId, 'billing');
  const compatible = (draft) => Number(draft.shippingAddressId) === input.shippingAddressId &&
    Number(draft.billingAddressId) === input.billingAddressId && draft.cartFingerprint === context.fingerprint &&
    sameJson(draft.shippingAddressSnapshot, shippingSnapshot) && sameJson(draft.billingAddressSnapshot, billingSnapshot) &&
    draft.status === 'ACTIVE' && new Date(draft.expiresAt) > new Date();
  const existing = await CheckoutDraft.findOne({ where: { buyerId, idempotencyKey: input.idempotencyKey } });
  if (existing) {
    if (compatible(existing)) return serialize(existing, { idempotentReplay: true });
    throw new CheckoutError('Idempotency key was already used for different or expired checkout inputs', 409, 'IDEMPOTENCY_CONFLICT');
  }
  const validatedCart = { ...context.cart, items: context.cart.items.map((item) => ({ ...item, unit: IMMUTABLE_UNIT })) };
  const orderSnapshot = buildMarketplaceOrderDraft({ buyer: context.buyer, shippingAddress: shipping, billingAddress: billing, validatedCart, products: context.products, vendors: context.vendors });
  const values = {
    buyerId,
    idempotencyKey: input.idempotencyKey,
    cartFingerprint: context.fingerprint,
    shippingAddressId: input.shippingAddressId,
    billingAddressId: input.billingAddressId,
    shippingAddressSnapshot: shippingSnapshot,
    billingAddressSnapshot: billingSnapshot,
    orderSnapshot,
    subtotalPaise: orderSnapshot.buyerOrder.subtotalPaise,
    shippingPaise: null,
    taxPaise: null,
    discountPaise: null,
    grandTotalPaise: null,
    pricingStatus: 'PARTIAL',
    expiresAt: new Date(Date.now() + ttlMinutes() * 60 * 1000)
  };
  try {
    const draft = await sequelize.transaction((transaction) => CheckoutDraft.create(values, { transaction }));
    return serialize(draft, { idempotentReplay: false });
  } catch (error) {
    if (!(error instanceof UniqueConstraintError)) throw error;
    const raced = await CheckoutDraft.findOne({ where: { buyerId, idempotencyKey: input.idempotencyKey } });
    if (raced && compatible(raced)) return serialize(raced, { idempotentReplay: true });
    throw new CheckoutError('Idempotency key conflict', 409, 'IDEMPOTENCY_CONFLICT');
  }
}

async function getDraft(buyerId, rawId, req) {
  const id = positiveId(rawId, 'draft id');
  const draft = await CheckoutDraft.findOne({ where: { id, buyerId } });
  if (!draft) throw new CheckoutError('Checkout draft not found', 404, 'DRAFT_NOT_FOUND');
  if (draft.status !== 'ACTIVE') return serialize(draft, { stale: true, staleReason: `DRAFT_${draft.status}` });
  if (new Date(draft.expiresAt) <= new Date()) return serialize(draft, { status: 'EXPIRED', stale: true, staleReason: 'DRAFT_EXPIRED' });
  try {
    const [{ shipping, billing }, context] = await Promise.all([
      ownedAddresses(buyerId, Number(draft.shippingAddressId), Number(draft.billingAddressId)),
      contextForBuyer(buyerId, req)
    ]);
    if (context.fingerprint !== draft.cartFingerprint) return serialize(draft, { stale: true, staleReason: 'CART_CHANGED' });
    if (!sameJson(addressSnapshot(shipping, buyerId, 'shipping'), draft.shippingAddressSnapshot) ||
        !sameJson(addressSnapshot(billing, buyerId, 'billing'), draft.billingAddressSnapshot)) {
      return serialize(draft, { stale: true, staleReason: 'ADDRESS_CHANGED' });
    }
    return serialize(draft);
  } catch (error) {
    if (error instanceof CheckoutError) return serialize(draft, { stale: true, staleReason: error.code });
    throw error;
  }
}

module.exports = { createDraft, getDraft, ttlMinutes, serialize };
