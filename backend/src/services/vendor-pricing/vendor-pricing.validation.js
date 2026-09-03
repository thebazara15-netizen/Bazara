'use strict';

const { MODES } = require('../pricing/shipping-calculator');
class VendorPricingError extends Error { constructor(message, status = 400, code = 'VENDOR_PRICING_INVALID') { super(message); this.status = status; this.code = code; } }
const text = (value, field, max, required = true) => { const normalized = String(value ?? '').trim(); if ((required && !normalized) || normalized.length > max) throw new VendorPricingError(`${field} is invalid`); return normalized || null; };
const money = (value, field, required) => { if (!required && (value == null || value === '')) return null; const parsed = Number(value); if (!Number.isSafeInteger(parsed) || parsed < 0) throw new VendorPricingError(`${field} must be non-negative integer paise`); return parsed; };

function normalizeTaxProfile(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new VendorPricingError('taxProfile is required');
  const isGstRegistered = value.isGstRegistered === true;
  const gstin = text(value.gstin, 'GSTIN', 15, isGstRegistered)?.toUpperCase() || null;
  if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(gstin)) throw new VendorPricingError('GSTIN format is invalid');
  const stateCode = text(value.stateCode, 'stateCode', 2);
  if (!/^\d{2}$/.test(stateCode)) throw new VendorPricingError('stateCode must be exactly two digits');
  return { legalName: text(value.legalName, 'legalName', 200), gstin, state: text(value.state, 'state', 100), stateCode, isGstRegistered };
}
function normalizeShippingPolicy(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !MODES.includes(value.mode)) throw new VendorPricingError('A supported shipping mode is required');
  const needsFlat = ['FLAT', 'FREE_ABOVE_THRESHOLD'].includes(value.mode);
  const needsThreshold = value.mode === 'FREE_ABOVE_THRESHOLD';
  if (!needsFlat && value.flatChargePaise != null && value.flatChargePaise !== '') throw new VendorPricingError('flatChargePaise is not allowed for this shipping mode');
  if (!needsThreshold && value.freeAbovePaise != null && value.freeAbovePaise !== '') throw new VendorPricingError('freeAbovePaise is not allowed for this shipping mode');
  const flatChargePaise = money(value.flatChargePaise, 'flatChargePaise', needsFlat);
  const freeAbovePaise = money(value.freeAbovePaise, 'freeAbovePaise', needsThreshold);
  if (needsThreshold && freeAbovePaise <= 0) throw new VendorPricingError('freeAbovePaise must be greater than zero');
  return { mode: value.mode, flatChargePaise, freeAbovePaise, isActive: true };
}
module.exports = { VendorPricingError, normalizeTaxProfile, normalizeShippingPolicy };
