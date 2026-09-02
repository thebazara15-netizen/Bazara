'use strict';

const { Op } = require('sequelize');
const { sequelize, Address } = require('../../models');
const { AddressError, EDITABLE_FIELDS, assertNoReservedFields, normalizeAddress } = require('./address.validation');

const SAFE_FIELDS = ['id', 'label', 'contactName', 'companyName', 'phoneCountryCode', 'phone', 'addressLine1', 'addressLine2', 'landmark', 'city', 'district', 'state', 'stateCode', 'postalCode', 'countryCode', 'gstin', 'isDefaultShipping', 'isDefaultBilling', 'createdAt', 'updatedAt'];

const serialize = (address) => Object.fromEntries(SAFE_FIELDS.map((field) => [field, address[field] ?? null]));

async function unsetOtherDefaults(userId, addressId, values, transaction) {
  const where = { userId };
  if (addressId) where.id = { [Op.ne]: addressId };
  if (values.isDefaultShipping) await Address.update({ isDefaultShipping: false }, { where, transaction });
  if (values.isDefaultBilling) await Address.update({ isDefaultBilling: false }, { where, transaction });
}

async function list(userId) {
  const addresses = await Address.findAll({
    where: { userId },
    attributes: SAFE_FIELDS,
    order: [['isDefaultShipping', 'DESC'], ['isDefaultBilling', 'DESC'], ['updatedAt', 'DESC'], ['id', 'DESC']]
  });
  return addresses.map(serialize);
}

async function create(userId, body) {
  assertNoReservedFields(body);
  const values = normalizeAddress(body);
  return sequelize.transaction(async (transaction) => {
    if (await Address.count({ where: { userId }, transaction }) === 0) {
      values.isDefaultShipping = true;
      values.isDefaultBilling = true;
    }
    await unsetOtherDefaults(userId, null, values, transaction);
    return serialize(await Address.create({ ...values, userId }, { transaction }));
  });
}

async function update(userId, rawId, body) {
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) throw new AddressError('Address ID must be a positive integer', 400, 'INVALID_ADDRESS_ID');
  assertNoReservedFields(body);
  return sequelize.transaction(async (transaction) => {
    const address = await Address.findOne({ where: { id, userId }, transaction });
    if (!address) throw new AddressError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    const supplied = Object.fromEntries(EDITABLE_FIELDS.filter((field) => body?.[field] !== undefined).map((field) => [field, body[field]]));
    if (!Object.keys(supplied).length) throw new AddressError('No editable address fields provided', 400, 'NO_ADDRESS_FIELDS');
    const values = normalizeAddress({ ...address.toJSON(), ...supplied });
    await unsetOtherDefaults(userId, id, values, transaction);
    await address.update(values, { transaction, fields: EDITABLE_FIELDS });
    return serialize(address);
  });
}

async function replaceDefault(userId, field, transaction) {
  const replacement = await Address.findOne({ where: { userId }, order: [['updatedAt', 'DESC'], ['id', 'DESC']], transaction });
  if (replacement) await replacement.update({ [field]: true }, { transaction, fields: [field] });
}

async function remove(userId, rawId) {
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) throw new AddressError('Address ID must be a positive integer', 400, 'INVALID_ADDRESS_ID');
  return sequelize.transaction(async (transaction) => {
    const address = await Address.findOne({ where: { id, userId }, transaction });
    if (!address) throw new AddressError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    const shipping = address.isDefaultShipping;
    const billing = address.isDefaultBilling;
    await address.destroy({ transaction });
    if (shipping) await replaceDefault(userId, 'isDefaultShipping', transaction);
    if (billing) await replaceDefault(userId, 'isDefaultBilling', transaction);
  });
}

module.exports = { list, create, update, remove };
