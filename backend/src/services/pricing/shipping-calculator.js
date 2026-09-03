'use strict';

const MODES = ['FLAT', 'FREE', 'FREE_ABOVE_THRESHOLD', 'MANUAL_FREIGHT_QUOTE'];
const paise = (value, field, nullable = false) => {
  if (nullable && value == null) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new TypeError(`${field} must be non-negative integer paise`);
  return parsed;
};

function calculateShipping(sellerSubtotalPaise, policy) {
  const subtotal = paise(sellerSubtotalPaise, 'sellerSubtotalPaise');
  if (!policy || policy.isActive !== true || !MODES.includes(policy.mode)) throw new TypeError('An active supported shipping policy is required');
  const snapshot = { policyId: policy.id || null, mode: policy.mode, flatChargePaise: null, freeAbovePaise: null };
  if (policy.mode === 'FREE') return { shippingPaise: 0, shippingStatus: 'CALCULATED', policySnapshot: snapshot };
  if (policy.mode === 'MANUAL_FREIGHT_QUOTE') return { shippingPaise: null, shippingStatus: 'QUOTE_REQUIRED', policySnapshot: snapshot };
  snapshot.flatChargePaise = paise(policy.flatChargePaise, 'flatChargePaise');
  if (policy.mode === 'FLAT') return { shippingPaise: snapshot.flatChargePaise, shippingStatus: 'CALCULATED', policySnapshot: snapshot };
  snapshot.freeAbovePaise = paise(policy.freeAbovePaise, 'freeAbovePaise');
  if (snapshot.freeAbovePaise <= 0) throw new TypeError('freeAbovePaise must be greater than zero');
  return { shippingPaise: subtotal >= snapshot.freeAbovePaise ? 0 : snapshot.flatChargePaise, shippingStatus: 'CALCULATED', policySnapshot: snapshot };
}

module.exports = { MODES, calculateShipping };
