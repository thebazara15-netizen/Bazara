'use strict';

const FIELD_LIMITS = {
  label: 50,
  contactName: 120,
  companyName: 200,
  phoneCountryCode: 5,
  phone: 20,
  addressLine1: 255,
  addressLine2: 255,
  landmark: 150,
  city: 100,
  district: 100,
  state: 100,
  stateCode: 2,
  postalCode: 10,
  countryCode: 2,
  gstin: 15
};
const REQUIRED = ['contactName', 'companyName', 'phone', 'addressLine1', 'city', 'state', 'stateCode', 'postalCode', 'countryCode'];
const OPTIONAL = new Set(['label', 'addressLine2', 'landmark', 'district', 'gstin']);
const EDITABLE_FIELDS = [...Object.keys(FIELD_LIMITS), 'isDefaultShipping', 'isDefaultBilling'];
const RESERVED_FIELDS = ['id', 'userId', 'createdAt', 'updatedAt'];

class AddressError extends Error {
  constructor(message, status = 400, code = 'ADDRESS_VALIDATION_ERROR') {
    super(message);
    this.name = 'AddressError';
    this.status = status;
    this.code = code;
  }
}

function assertNoReservedFields(body) {
  const forbidden = RESERVED_FIELDS.find((field) => Object.prototype.hasOwnProperty.call(body || {}, field));
  if (forbidden) throw new AddressError(`${forbidden} cannot be set`, 400, 'RESERVED_FIELD');
}

function normalizeAddress(input) {
  const normalized = {};
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    const fallback = field === 'phoneCountryCode' ? '+91' : field === 'countryCode' ? 'IN' : '';
    const value = String(input?.[field] ?? fallback).trim();
    if (value.length > limit) throw new AddressError(`${field} is too long`, 400, 'FIELD_TOO_LONG');
    normalized[field] = OPTIONAL.has(field) && !value ? null : value;
  }

  for (const field of REQUIRED) {
    if (!normalized[field]) throw new AddressError(`${field} is required`, 400, 'REQUIRED_FIELD');
  }
  for (const field of ['isDefaultShipping', 'isDefaultBilling']) {
    const value = input?.[field] ?? false;
    if (typeof value !== 'boolean') throw new AddressError(`${field} must be boolean`, 400, 'INVALID_DEFAULT_FLAG');
    normalized[field] = value;
  }

  normalized.countryCode = normalized.countryCode.toUpperCase();
  if (normalized.countryCode !== 'IN') throw new AddressError('Only Indian addresses are currently supported', 400, 'UNSUPPORTED_COUNTRY');
  if (!/^\d{6}$/.test(normalized.postalCode)) throw new AddressError('PIN code must be exactly 6 digits', 400, 'INVALID_POSTAL_CODE');
  if (!/^\d{2}$/.test(normalized.stateCode)) throw new AddressError('State code must be exactly 2 digits', 400, 'INVALID_STATE_CODE');
  if (!/^\+\d{1,4}$/.test(normalized.phoneCountryCode)) throw new AddressError('Enter a valid phone country code', 400, 'INVALID_PHONE_COUNTRY_CODE');
  if (normalized.phoneCountryCode !== '+91') throw new AddressError('Only +91 phone numbers are currently supported', 400, 'UNSUPPORTED_PHONE_COUNTRY_CODE');
  normalized.phone = normalized.phone.replace(/[\s-]/g, '');
  if (!/^[6-9]\d{9}$/.test(normalized.phone)) throw new AddressError('Enter a valid 10-digit Indian contact number', 400, 'INVALID_PHONE');

  if (normalized.gstin) {
    normalized.gstin = normalized.gstin.toUpperCase();
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(normalized.gstin)) {
      throw new AddressError('Enter a valid 15-character GSTIN format', 400, 'INVALID_GSTIN');
    }
  }
  return normalized;
}

module.exports = { AddressError, EDITABLE_FIELDS, assertNoReservedFields, normalizeAddress };
