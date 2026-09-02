'use strict';

function rupeesToPaise(value) {
  const rupees = typeof value === 'string' && value.trim() ? Number(value) : value;
  if (typeof rupees !== 'number' || !Number.isFinite(rupees) || rupees < 0) throw new TypeError('Rupee amount must be a finite non-negative number');
  const paise = Math.round((rupees + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(paise)) throw new RangeError('Paise amount exceeds safe integer range');
  return paise;
}

function assertPaise(value, field = 'amount') {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${field} must be a non-negative safe integer in paise`);
  return value;
}

function addPaise(values, field = 'total') {
  const total = values.reduce((sum, value) => sum + assertPaise(value, field), 0);
  return assertPaise(total, field);
}

function formatPaise(value) {
  return `INR ${(assertPaise(value) / 100).toFixed(2)}`;
}

module.exports = { rupeesToPaise, assertPaise, addPaise, formatPaise };
