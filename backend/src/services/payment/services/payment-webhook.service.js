'use strict';
const crypto = require('crypto');
const { Op, Transaction, UniqueConstraintError } = require('sequelize');
const { sequelize, PaymentEvent, PaymentAttempt, BuyerOrder, SellerOrder, BuyerOrderItem, InventoryReservation, Product, Cart, CartItem } = require('../../../models');
const { PaymentError } = require('./payment.service');

function verifySignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new PaymentError('Webhook is not configured', 503, 'WEBHOOK_NOT_CONFIGURED');
  if (!Buffer.isBuffer(rawBody) || !signature) throw new PaymentError('Webhook signature is missing', 400, 'WEBHOOK_SIGNATURE_MISSING');
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  const supplied = /^[a-f0-9]{64}$/i.test(signature) ? Buffer.from(signature, 'hex') : Buffer.alloc(0);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) throw new PaymentError('Invalid webhook signature', 400, 'WEBHOOK_SIGNATURE_INVALID');
}
const hash = (raw) => crypto.createHash('sha256').update(raw).digest('hex');
const eventKey = (payload, payment, payloadHash) => {
  if (typeof payload.id === 'string' && payload.id) return payload.id;
  if (payment?.id) return `razorpay:${payload.event}:${payment.id}:${payload.created_at || payment.created_at || 'na'}`;
  return `razorpay:${payload.event || 'unknown'}:${payloadHash}`;
};
const fail = async (event, code, message) => {
  await event.update({ status: 'FAILED', failureCode: code, failureMessage: message.slice(0, 255), processedAt: new Date() });
  return { accepted: true, status: 'FAILED', reconciliationRequired: true };
};

async function finalizeCapture(event, payment) {
  const type = sequelize.getDialect() === 'sqlite' ? Transaction.TYPES.IMMEDIATE : Transaction.TYPES.DEFERRED;
  return sequelize.transaction({ type }, async (transaction) => {
    const lockedEvent = await PaymentEvent.findByPk(event.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (lockedEvent.status === 'PROCESSED') return { accepted: true, duplicate: true, status: 'PROCESSED' };
    const attempt = await PaymentAttempt.findOne({ where: { providerOrderId: payment.order_id, provider: 'RAZORPAY' }, transaction, lock: transaction.LOCK.UPDATE });
    if (!attempt) throw new PaymentError('Provider order is not bound', 409, 'PROVIDER_ORDER_UNKNOWN');
    const conflicting = await PaymentAttempt.findOne({ where: { providerPaymentId: payment.id, id: { [Op.ne]: attempt.id } }, transaction });
    if (conflicting) throw new PaymentError('Provider payment is already bound', 409, 'PROVIDER_PAYMENT_CONFLICT');
    const order = await BuyerOrder.findByPk(attempt.buyerOrderId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!order) throw new PaymentError('Buyer order is missing', 409, 'BUYER_ORDER_MISSING');
    const providerAmount = Number(payment.amount);
    if (!Number.isSafeInteger(providerAmount) || providerAmount !== Number(attempt.amountPaise) || providerAmount !== Number(order.grandTotalPaise)) throw new PaymentError('Captured amount mismatch', 409, 'CAPTURE_AMOUNT_MISMATCH');
    if (payment.currency !== attempt.currency || payment.currency !== order.currency) throw new PaymentError('Captured currency mismatch', 409, 'CAPTURE_CURRENCY_MISMATCH');
    if (payment.status !== 'captured' && payment.captured !== true) throw new PaymentError('Payment is not captured', 409, 'PAYMENT_NOT_CAPTURED');
    if (attempt.status === 'CAPTURED') {
      if (attempt.providerPaymentId !== payment.id) throw new PaymentError('Captured payment binding mismatch', 409, 'PROVIDER_PAYMENT_CONFLICT');
      await lockedEvent.update({ paymentAttemptId: attempt.id, status: 'PROCESSED', processedAt: new Date() }, { transaction });
      return { accepted: true, duplicate: true, status: 'PROCESSED' };
    }
    if (!['PROVIDER_ORDER_CREATED', 'AUTHORIZED'].includes(attempt.status) || order.status !== 'PENDING_PAYMENT') throw new PaymentError('Payment state requires reconciliation', 409, 'RECONCILIATION_REQUIRED');
    const sellers = await SellerOrder.findAll({ where: { buyerOrderId: order.id }, transaction, lock: transaction.LOCK.UPDATE });
    const sellerIds = sellers.map((seller) => seller.id);
    const items = await BuyerOrderItem.findAll({ where: { sellerOrderId: { [Op.in]: sellerIds } }, transaction });
    const reservations = await InventoryReservation.findAll({ where: { buyerOrderId: order.id }, transaction, lock: transaction.LOCK.UPDATE });
    if (!items.length || reservations.length !== items.length || reservations.some((r) => r.status !== 'RESERVED' || new Date(r.expiresAt) <= new Date())) throw new PaymentError('Captured payment requires inventory reconciliation', 409, 'RECONCILIATION_REQUIRED');
    const purchased = new Map(); const reserved = new Map();
    for (const item of items) { const id = Number(item.productId); const qty = Number(item.quantity); if (!id || !Number.isInteger(qty) || qty < 1) throw new PaymentError('Invalid order item quantity', 409, 'RECONCILIATION_REQUIRED'); purchased.set(id, (purchased.get(id) || 0) + qty); }
    for (const row of reservations) reserved.set(Number(row.productId), (reserved.get(Number(row.productId)) || 0) + Number(row.quantity));
    if ([...purchased].some(([id, qty]) => reserved.get(id) !== qty) || purchased.size !== reserved.size) throw new PaymentError('Reservation quantity mismatch', 409, 'RECONCILIATION_REQUIRED');
    const productIds = [...purchased.keys()].sort((a, b) => a - b);
    const products = await Product.findAll({ where: { id: { [Op.in]: productIds } }, order: [['id', 'ASC']], transaction, lock: transaction.LOCK.UPDATE });
    if (products.length !== productIds.length) throw new PaymentError('Purchased product is missing', 409, 'RECONCILIATION_REQUIRED');
    for (const product of products) {
      const quantity = purchased.get(Number(product.id));
      const [changed] = await Product.update({ stock: sequelize.literal(`stock - ${quantity}`) }, { where: { id: product.id, stock: { [Op.gte]: quantity } }, transaction });
      if (changed !== 1) throw new PaymentError('Insufficient stock after capture', 409, 'RECONCILIATION_REQUIRED');
    }
    const now = new Date();
    await attempt.update({ status: 'CAPTURED', providerPaymentId: payment.id, failureCode: null, failureMessage: null }, { transaction });
    await order.update({ status: 'PLACED' }, { transaction });
    await SellerOrder.update({ status: 'PLACED' }, { where: { buyerOrderId: order.id, status: 'PENDING_PAYMENT' }, transaction });
    await InventoryReservation.update({ status: 'COMMITTED', committedAt: now }, { where: { buyerOrderId: order.id, status: 'RESERVED' }, transaction });
    const cart = await Cart.findOne({ where: { userId: order.buyerId }, transaction });
    if (cart) for (const [productId, quantity] of purchased) await CartItem.destroy({ where: { cartId: cart.id, productId, quantity }, transaction });
    await lockedEvent.update({ paymentAttemptId: attempt.id, providerPaymentId: payment.id, status: 'PROCESSED', processedAt: now, failureCode: null, failureMessage: null }, { transaction });
    return { accepted: true, status: 'PROCESSED', paymentAttemptId: attempt.id };
  });
}

async function processWebhook(rawBody, signature) {
  verifySignature(rawBody, signature);
  let payload; try { payload = JSON.parse(rawBody.toString('utf8')); } catch { throw new PaymentError('Malformed webhook body', 400, 'WEBHOOK_BODY_INVALID'); }
  if (!payload || typeof payload.event !== 'string') throw new PaymentError('Malformed webhook body', 400, 'WEBHOOK_BODY_INVALID');
  const payment = payload.payload?.payment?.entity; const payloadHash = hash(rawBody); const providerEventId = eventKey(payload, payment, payloadHash);
  let event;
  try { event = await PaymentEvent.create({ provider: 'RAZORPAY', providerEventId, eventType: payload.event, providerOrderId: payment?.order_id || null, providerPaymentId: payment?.id || null, payloadHash, receivedAt: new Date() }); }
  catch (error) {
    if (!(error instanceof UniqueConstraintError)) throw error;
    event = await PaymentEvent.findOne({ where: { providerEventId } });
    if (event.payloadHash !== payloadHash) throw new PaymentError('Provider event ID payload conflict', 409, 'EVENT_PAYLOAD_CONFLICT');
    if (event.status !== 'FAILED' || event.failureCode !== 'PROCESSING_RETRY_REQUIRED') return { accepted: true, duplicate: true, status: event.status };
  }
  if (payload.event !== 'payment.captured') {
    await event.update({ status: 'IGNORED', processedAt: new Date() });
    return { accepted: true, status: 'IGNORED' };
  }
  if (!payment?.id || !payment.order_id) return fail(event, 'RECONCILIATION_REQUIRED', 'Captured event is missing payment binding');
  try { return await finalizeCapture(event, payment); }
  catch (error) {
    const reconciliation = ['CAPTURE_AMOUNT_MISMATCH', 'CAPTURE_CURRENCY_MISMATCH', 'PROVIDER_ORDER_UNKNOWN', 'PROVIDER_PAYMENT_CONFLICT', 'RECONCILIATION_REQUIRED'].includes(error.code);
    if (reconciliation) return fail(event, 'RECONCILIATION_REQUIRED', error.message);
    await event.update({ status: 'FAILED', failureCode: 'PROCESSING_RETRY_REQUIRED', failureMessage: 'Temporary processing failure', processedAt: new Date() });
    throw new PaymentError('Webhook processing failed', 503, 'WEBHOOK_PROCESSING_FAILED');
  }
}
module.exports = { processWebhook, verifySignature, finalizeCapture };
