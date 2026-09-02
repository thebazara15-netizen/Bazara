'use strict';

class CheckoutError extends Error {
  constructor(message, status = 400, code = 'CHECKOUT_INVALID') {
    super(message);
    this.name = 'CheckoutError';
    this.status = status;
    this.code = code;
  }
}

function positiveId(value, field) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new CheckoutError(`${field} must be a positive integer`, 400, 'INVALID_ID');
  return parsed;
}

function createInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new CheckoutError('Request body is required');
  const allowed = new Set(['shippingAddressId', 'billingAddressId', 'idempotencyKey']);
  const forbidden = Object.keys(body).filter((key) => !allowed.has(key));
  if (forbidden.length) throw new CheckoutError(`Unsupported checkout fields: ${forbidden.join(', ')}`, 400, 'UNTRUSTED_CHECKOUT_INPUT');
  const idempotencyKey = String(body.idempotencyKey ?? '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,99}$/.test(idempotencyKey)) {
    throw new CheckoutError('idempotencyKey must be 8-100 safe characters', 400, 'INVALID_IDEMPOTENCY_KEY');
  }
  return {
    shippingAddressId: positiveId(body.shippingAddressId, 'shippingAddressId'),
    billingAddressId: positiveId(body.billingAddressId, 'billingAddressId'),
    idempotencyKey
  };
}

module.exports = { CheckoutError, positiveId, createInput };
