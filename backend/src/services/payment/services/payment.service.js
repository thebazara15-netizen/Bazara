'use strict';
const crypto = require('crypto');
const https = require('https');
const { Transaction } = require('sequelize');
const { sequelize, BuyerOrder, CheckoutDraft, BuyerOrderItem, SellerOrder, InventoryReservation, PaymentAttempt } = require('../../../models');

class PaymentError extends Error { constructor(message, status = 400, code = 'PAYMENT_ERROR') { super(message); this.status = status; this.code = code; } }
const credentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID; const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new PaymentError('Payment provider is unavailable', 503, 'PAYMENT_PROVIDER_UNAVAILABLE');
  return { keyId, keySecret };
};
const providerRequest = ({ body }) => new Promise((resolve, reject) => {
  const { keyId, keySecret } = credentials(); const payload = JSON.stringify(body);
  const req = https.request({ hostname: 'api.razorpay.com', path: '/v1/orders', method: 'POST', headers: {
    Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload)
  } }, (res) => { let data = ''; res.on('data', (c) => { data += c; }); res.on('end', () => {
    let parsed = {}; try { parsed = data ? JSON.parse(data) : {}; } catch { return reject(new PaymentError('Invalid provider response', 502, 'PROVIDER_RESPONSE_INVALID')); }
    if (res.statusCode >= 200 && res.statusCode < 300) return resolve(parsed);
    reject(new PaymentError(parsed.error?.description || 'Payment provider rejected the request', 502, 'PROVIDER_ORDER_FAILED'));
  }); }); req.on('error', () => reject(new PaymentError('Payment provider is unavailable', 503, 'PAYMENT_PROVIDER_UNAVAILABLE'))); req.write(payload); req.end();
});
const positiveId = (v, label = 'id') => { const n = Number(v); if (!Number.isSafeInteger(n) || n < 1) throw new PaymentError(`Invalid ${label}`, 400, 'INVALID_ID'); return n; };
const cleanKey = (v) => { if (typeof v !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(v)) throw new PaymentError('Invalid idempotency key', 400, 'INVALID_IDEMPOTENCY_KEY'); return v; };
const serialize = (a, expiry) => ({ paymentAttemptId: a.id, buyerOrderId: a.buyerOrderId, provider: a.provider, providerOrderId: a.providerOrderId, status: a.status, amountPaise: Number(a.amountPaise), currency: a.currency, razorpayKeyId: credentials().keyId, reservationExpiresAt: expiry });

async function validateOrder(buyerId, orderId, transaction) {
  const order = await BuyerOrder.findOne({ where: { id: orderId, buyerId }, include: [
    { model: CheckoutDraft, as: 'checkoutDraft' },
    { model: SellerOrder, as: 'sellerOrders', include: [{ model: BuyerOrderItem, as: 'items' }] }
  ], transaction });
  if (!order) throw new PaymentError('Buyer order not found', 404, 'ORDER_NOT_FOUND');
  if (order.status !== 'PENDING_PAYMENT' || !order.checkoutDraftId) throw new PaymentError('Order is not awaiting payment', 409, 'ORDER_NOT_PENDING_PAYMENT');
  const draft = order.checkoutDraft;
  if (!draft || draft.status !== 'ACTIVE' || draft.pricingStatus !== 'READY') throw new PaymentError('Checkout draft is not ready', 409, 'DRAFT_NOT_READY');
  if (new Date(draft.expiresAt) <= new Date()) throw new PaymentError('Checkout draft has expired', 409, 'DRAFT_EXPIRED');
  const expected = order.sellerOrders.reduce((n, seller) => n + seller.items.length, 0);
  const reservations = await InventoryReservation.findAll({ where: { buyerOrderId: order.id }, transaction });
  const now = new Date();
  if (!expected || reservations.length !== expected || reservations.some((r) => r.status !== 'RESERVED' || new Date(r.expiresAt) <= now)) throw new PaymentError('Inventory reservation expired', 409, 'RESERVATION_EXPIRED');
  const amountPaise = Number(order.grandTotalPaise);
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0 || order.currency !== 'INR') throw new PaymentError('Order payment amount is invalid', 409, 'ORDER_AMOUNT_INVALID');
  return { order, amountPaise, reservationExpiresAt: reservations.map((r) => r.expiresAt).sort()[0] };
}

async function initiatePaymentAttempt(buyerId, body, adapter = { createOrder: providerRequest }) {
  const allowed = ['buyerOrderId', 'idempotencyKey'];
  if (!body || Object.keys(body).some((field) => !allowed.includes(field))) throw new PaymentError('Only buyerOrderId and idempotencyKey are accepted', 400, 'PAYMENT_BODY_INVALID');
  const buyerOrderId = positiveId(body.buyerOrderId, 'buyer order id'); const idempotencyKey = cleanKey(body.idempotencyKey);
  const type = sequelize.getDialect() === 'sqlite' ? Transaction.TYPES.IMMEDIATE : Transaction.TYPES.DEFERRED;
  let claimed = false; let reservationExpiresAt;
  let attempt;
  try { attempt = await sequelize.transaction({ type }, async (transaction) => {
    const valid = await validateOrder(Number(buyerId), buyerOrderId, transaction); reservationExpiresAt = valid.reservationExpiresAt;
    let found = await PaymentAttempt.findOne({ where: { buyerOrderId, idempotencyKey }, transaction });
    if (found && (Number(found.amountPaise) !== valid.amountPaise || found.currency !== valid.order.currency || found.buyerId !== Number(buyerId))) throw new PaymentError('Idempotency key conflicts with current order', 409, 'IDEMPOTENCY_CONFLICT');
    if (!found) found = await PaymentAttempt.create({ buyerOrderId, buyerId, idempotencyKey, amountPaise: valid.amountPaise, currency: valid.order.currency }, { transaction });
    if (found.providerOrderId) return found;
    if (found.status !== 'CREATED') throw new PaymentError('Payment attempt requires recovery or a new idempotency key', 409, 'PAYMENT_ATTEMPT_RECOVERY_REQUIRED');
    const [changed] = await PaymentAttempt.update({ status: 'PROVIDER_ORDER_CREATING' }, { where: { id: found.id, status: 'CREATED' }, transaction });
    if (changed !== 1) throw new PaymentError('Payment attempt is already being processed', 409, 'PAYMENT_ATTEMPT_IN_PROGRESS');
    found.status = 'PROVIDER_ORDER_CREATING'; claimed = true; return found;
  }); } catch (error) {
    const databaseConflict = error?.name === 'SequelizeUniqueConstraintError' || error?.parent?.code === 'SQLITE_BUSY' || error?.original?.code === 'SQLITE_BUSY';
    if (!databaseConflict) throw error;
    const existing = await PaymentAttempt.findOne({ where: { buyerOrderId, idempotencyKey } });
    if (existing?.providerOrderId) return serialize(existing, reservationExpiresAt);
    throw new PaymentError('Payment attempt is already being processed', 409, 'PAYMENT_ATTEMPT_IN_PROGRESS');
  }
  if (!claimed) return serialize(attempt, reservationExpiresAt);
  let providerOrder;
  try {
    providerOrder = await adapter.createOrder({ body: { amount: Number(attempt.amountPaise), currency: attempt.currency, receipt: `bz_attempt_${attempt.id}`, notes: { buyerOrderId: String(buyerOrderId), paymentAttemptId: String(attempt.id) } } });
    if (!providerOrder?.id) throw new PaymentError('Invalid provider response', 502, 'PROVIDER_RESPONSE_INVALID');
  } catch (error) {
    await PaymentAttempt.update({ status: 'FAILED', failureCode: error.code || 'PROVIDER_ORDER_FAILED', failureMessage: String(error.message || 'Provider error').slice(0, 255) }, { where: { id: attempt.id, status: 'PROVIDER_ORDER_CREATING' } });
    throw error;
  }
  try { await attempt.update({ providerOrderId: providerOrder.id, status: 'PROVIDER_ORDER_CREATED', failureCode: null, failureMessage: null }); }
  catch { throw new PaymentError('Provider order created but persistence needs recovery', 503, 'PAYMENT_ATTEMPT_RECOVERY_REQUIRED'); }
  return serialize(attempt, reservationExpiresAt);
}

async function verifyClientSignature(buyerId, attemptId, body) {
  const fields = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'];
  if (!body || Object.keys(body).some((field) => !fields.includes(field)) || fields.some((field) => typeof body[field] !== 'string' || !body[field])) throw new PaymentError('Invalid verification payload', 400, 'VERIFICATION_BODY_INVALID');
  const attempt = await PaymentAttempt.findOne({ where: { id: positiveId(attemptId, 'payment attempt id'), buyerId }, include: [{ model: BuyerOrder, as: 'buyerOrder' }] });
  if (!attempt) throw new PaymentError('Payment attempt not found', 404, 'PAYMENT_ATTEMPT_NOT_FOUND');
  if (attempt.providerOrderId !== body.razorpay_order_id) throw new PaymentError('Provider order does not match', 409, 'PROVIDER_ORDER_MISMATCH');
  if (attempt.status === 'AUTHORIZED' && attempt.providerPaymentId === body.razorpay_payment_id) return { paymentAttemptId: attempt.id, status: attempt.status, confirmationPending: true };
  if (attempt.status !== 'PROVIDER_ORDER_CREATED') throw new PaymentError('Payment attempt cannot be verified', 409, 'INVALID_PAYMENT_TRANSITION');
  const expected = crypto.createHmac('sha256', credentials().keySecret).update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`).digest();
  const supplied = /^[a-f0-9]{64}$/i.test(body.razorpay_signature) ? Buffer.from(body.razorpay_signature, 'hex') : Buffer.alloc(0);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) throw new PaymentError('Payment signature is invalid', 400, 'SIGNATURE_INVALID');
  await attempt.update({ providerPaymentId: body.razorpay_payment_id, status: 'AUTHORIZED' });
  return { paymentAttemptId: attempt.id, status: 'AUTHORIZED', confirmationPending: true };
}

module.exports = { PaymentError, initiatePaymentAttempt, verifyClientSignature, validateOrder };
