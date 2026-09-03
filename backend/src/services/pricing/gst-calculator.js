'use strict';

function integer(value, field, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > maximum) throw new TypeError(`${field} is invalid`);
  return parsed;
}
function stateCode(value, field) {
  const normalized = String(value ?? '').trim();
  if (!/^\d{2}$/.test(normalized)) throw new TypeError(`${field} must be a two-digit code`);
  return normalized;
}
function roundedRatio(value, numerator, denominator) {
  const product = BigInt(value) * BigInt(numerator);
  const divisor = BigInt(denominator);
  const rounded = (product + divisor / 2n) / divisor;
  const result = Number(rounded);
  if (!Number.isSafeInteger(result)) throw new RangeError('Calculated GST exceeds safe integer range');
  return result;
}

function calculateGst({ taxableValuePaise, gstRateBasisPoints, sellerStateCode, placeOfSupplyStateCode }) {
  const taxable = integer(taxableValuePaise, 'taxableValuePaise');
  const rate = integer(gstRateBasisPoints, 'gstRateBasisPoints', 10000);
  const sellerState = stateCode(sellerStateCode, 'sellerStateCode');
  const placeState = stateCode(placeOfSupplyStateCode, 'placeOfSupplyStateCode');
  const taxTotalPaise = roundedRatio(taxable, rate, 10000);
  if (sellerState !== placeState) return { taxableValuePaise: taxable, gstRateBasisPoints: rate, cgstPaise: 0, sgstPaise: 0, igstPaise: taxTotalPaise, taxTotalPaise };
  const cgstPaise = Math.floor(taxTotalPaise / 2);
  const sgstPaise = taxTotalPaise - cgstPaise;
  return { taxableValuePaise: taxable, gstRateBasisPoints: rate, cgstPaise, sgstPaise, igstPaise: 0, taxTotalPaise };
}

module.exports = { calculateGst, roundedRatio };
