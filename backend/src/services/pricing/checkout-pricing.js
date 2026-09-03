'use strict';

const { addPaise } = require('../../utils/money');
const { calculateShipping } = require('./shipping-calculator');
const { calculateGst } = require('./gst-calculator');

function issue(code, vendorId, productId = null) { return { code, vendorId, productId }; }

function priceCheckoutSnapshot({ orderSnapshot, products, taxProfiles, shippingPolicies, placeOfSupplyStateCode }) {
  const snapshot = JSON.parse(JSON.stringify(orderSnapshot));
  const productMap = new Map(products.map((item) => [Number(item.id), item]));
  const taxMap = new Map(taxProfiles.map((item) => [Number(item.vendorId), item]));
  const shippingMap = new Map(shippingPolicies.map((item) => [Number(item.vendorId), item]));
  const missingRequirements = [];
  let freightRequired = false;

  for (const seller of snapshot.sellerOrders) {
    const vendorId = Number(seller.vendorId);
    const profile = taxMap.get(vendorId);
    const policy = shippingMap.get(vendorId);
    let shipping;
    try { shipping = calculateShipping(Number(seller.subtotalPaise), policy); }
    catch { missingRequirements.push(issue('SELLER_SHIPPING_POLICY_REQUIRED', vendorId)); shipping = { shippingPaise: null, shippingStatus: 'NOT_CONFIGURED', policySnapshot: null }; }
    if (shipping.shippingStatus === 'QUOTE_REQUIRED') freightRequired = true;
    seller.shippingPaise = shipping.shippingPaise;
    seller.shippingStatus = shipping.shippingStatus;
    seller.shippingPolicySnapshot = shipping.policySnapshot;

    const profileValid = profile && /^\d{2}$/.test(String(profile.stateCode || '')) && (!profile.isGstRegistered || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(String(profile.gstin || '')));
    if (!profileValid) missingRequirements.push(issue('SELLER_TAX_PROFILE_REQUIRED', vendorId));
    let sellerTaxKnown = Boolean(profileValid);
    let sellerTaxPaise = 0;
    for (const item of seller.items) {
      const product = productMap.get(Number(item.productId));
      const configured = product && /^\d{4,20}$/.test(String(product.hsnCode || '')) && product.gstRateBasisPoints != null && Number.isInteger(Number(product.gstRateBasisPoints)) && Number(product.gstRateBasisPoints) >= 0 && Number(product.gstRateBasisPoints) <= 10000 && String(product.unit || '').trim() && product.taxInclusive === false;
      if (!configured) {
        missingRequirements.push(issue(product?.taxInclusive ? 'TAX_INCLUSIVE_PRODUCT_UNSUPPORTED' : 'PRODUCT_TAX_CONFIGURATION_REQUIRED', vendorId, Number(item.productId)));
        sellerTaxKnown = false;
        Object.assign(item, { hsnCode: product?.hsnCode || null, gstRateBasisPoints: product?.gstRateBasisPoints ?? null, taxableValuePaise: Number(item.lineSubtotalPaise), cgstPaise: null, sgstPaise: null, igstPaise: null, taxTotalPaise: null, lineTotalPaise: null });
        continue;
      }
      item.unit = String(product.unit).trim();
      item.hsnCode = String(product.hsnCode).trim();
      if (!profileValid) {
        Object.assign(item, { gstRateBasisPoints: Number(product.gstRateBasisPoints), taxableValuePaise: Number(item.lineSubtotalPaise), cgstPaise: null, sgstPaise: null, igstPaise: null, taxTotalPaise: null, lineTotalPaise: null });
        continue;
      }
      const gst = profile.isGstRegistered ? calculateGst({ taxableValuePaise: Number(item.lineSubtotalPaise), gstRateBasisPoints: Number(product.gstRateBasisPoints), sellerStateCode: profile.stateCode, placeOfSupplyStateCode }) : calculateGst({ taxableValuePaise: Number(item.lineSubtotalPaise), gstRateBasisPoints: 0, sellerStateCode: profile.stateCode, placeOfSupplyStateCode });
      Object.assign(item, gst, { lineTotalPaise: Number(item.lineSubtotalPaise) + gst.taxTotalPaise });
      sellerTaxPaise += gst.taxTotalPaise;
    }
    seller.taxPaise = sellerTaxKnown ? sellerTaxPaise : null;
    seller.discountPaise = 0;
    seller.grandTotalPaise = sellerTaxKnown && shipping.shippingPaise != null ? Number(seller.subtotalPaise) + shipping.shippingPaise + sellerTaxPaise : null;
    seller.taxProfileSnapshot = profileValid ? { profileId: profile.id || null, legalName: profile.legalName, gstin: profile.gstin || null, state: profile.state, stateCode: String(profile.stateCode), isGstRegistered: Boolean(profile.isGstRegistered) } : null;
  }

  const pricingStatus = freightRequired ? 'FREIGHT_QUOTE_REQUIRED' : missingRequirements.length ? 'PARTIAL' : 'READY';
  const shippingKnown = snapshot.sellerOrders.every((seller) => seller.shippingPaise != null);
  const taxKnown = snapshot.sellerOrders.every((seller) => seller.taxPaise != null);
  const subtotalPaise = addPaise(snapshot.sellerOrders.map((seller) => Number(seller.subtotalPaise)), 'checkout subtotal');
  const shippingPaise = shippingKnown ? addPaise(snapshot.sellerOrders.map((seller) => seller.shippingPaise), 'checkout shipping') : null;
  const taxPaise = taxKnown ? addPaise(snapshot.sellerOrders.map((seller) => seller.taxPaise), 'checkout tax') : null;
  const discountPaise = 0;
  const grandTotalPaise = pricingStatus === 'READY' ? subtotalPaise + shippingPaise + taxPaise - discountPaise : null;
  snapshot.buyerOrder = { ...snapshot.buyerOrder, subtotalPaise, shippingPaise, taxPaise, discountPaise, grandTotalPaise };
  snapshot.pricing = { pricingStatus, missingRequirements, placeOfSupplyStateCode, shippingTaxTreatment: 'EXCLUDED_PENDING_PROFESSIONAL_TAX_REVIEW' };
  return { orderSnapshot: snapshot, pricingStatus, missingRequirements, subtotalPaise, shippingPaise, taxPaise, discountPaise, grandTotalPaise };
}

module.exports = { priceCheckoutSnapshot };
