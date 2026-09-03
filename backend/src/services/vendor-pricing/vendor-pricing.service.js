'use strict';
const { sequelize, SellerTaxProfile, SellerShippingPolicy } = require('../../models');
const { normalizeTaxProfile, normalizeShippingPolicy } = require('./vendor-pricing.validation');

const serialize = (profile, policy) => ({
  taxProfile: profile ? { legalName: profile.legalName, gstin: profile.gstin, state: profile.state, stateCode: profile.stateCode, isGstRegistered: profile.isGstRegistered } : null,
  shippingPolicy: policy ? { mode: policy.mode, flatChargePaise: policy.flatChargePaise == null ? null : Number(policy.flatChargePaise), freeAbovePaise: policy.freeAbovePaise == null ? null : Number(policy.freeAbovePaise), isActive: policy.isActive } : null
});
async function get(vendorId) {
  const [profile, policy] = await Promise.all([SellerTaxProfile.findOne({ where: { vendorId } }), SellerShippingPolicy.findOne({ where: { vendorId } })]);
  return serialize(profile, policy);
}
async function save(vendorId, body) {
  const keys = Object.keys(body || {});
  if (!keys.length || keys.some((key) => !['taxProfile', 'shippingPolicy'].includes(key))) throw new (require('./vendor-pricing.validation').VendorPricingError)('Only taxProfile and shippingPolicy may be configured');
  const tax = body.taxProfile === undefined ? null : normalizeTaxProfile(body.taxProfile);
  const shipping = body.shippingPolicy === undefined ? null : normalizeShippingPolicy(body.shippingPolicy);
  await sequelize.transaction(async (transaction) => {
    if (tax) {
      const [profile] = await SellerTaxProfile.findOrCreate({ where: { vendorId }, defaults: { vendorId, ...tax }, transaction });
      if (!profile.isNewRecord) await profile.update(tax, { transaction });
    }
    if (shipping) {
      const [policy] = await SellerShippingPolicy.findOrCreate({ where: { vendorId }, defaults: { vendorId, ...shipping }, transaction });
      if (!policy.isNewRecord) await policy.update(shipping, { transaction });
    }
  });
  return get(vendorId);
}
module.exports = { get, save };
