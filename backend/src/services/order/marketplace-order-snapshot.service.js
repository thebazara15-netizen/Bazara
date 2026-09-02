'use strict';

const { rupeesToPaise, addPaise } = require('../../utils/money');

const ADDRESS_FIELDS = ['label', 'contactName', 'companyName', 'phoneCountryCode', 'phone', 'addressLine1', 'addressLine2', 'landmark', 'city', 'district', 'state', 'stateCode', 'postalCode', 'countryCode', 'gstin'];
const requiredString = (value, field) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`${field} is required for order snapshot`);
  return normalized;
};
const positiveInteger = (value, field) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${field} must be a positive integer`);
  return parsed;
};
const freeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
};

function addressSnapshot(address, buyerId, kind) {
  if (!address || Number(address.userId) !== buyerId) throw new Error(`${kind} address must belong to the buyer`);
  const snapshot = { addressIdReference: positiveInteger(address.id, `${kind} address ID`) };
  for (const field of ADDRESS_FIELDS) snapshot[field] = address[field] == null ? null : String(address[field]).trim();
  for (const field of ['contactName', 'companyName', 'phoneCountryCode', 'phone', 'addressLine1', 'city', 'state', 'stateCode', 'postalCode', 'countryCode']) {
    requiredString(snapshot[field], `${kind} address ${field}`);
  }
  return snapshot;
}

function sellerSnapshot(vendor) {
  const vendorId = positiveInteger(vendor?.id, 'vendor ID');
  if (vendor.role && vendor.role !== 'VENDOR') throw new Error(`User ${vendorId} is not a vendor`);
  const personalName = [vendor.firstName, vendor.lastName].filter(Boolean).join(' ').trim();
  return {
    vendorId,
    companyName: vendor.companyName ? String(vendor.companyName).trim() : null,
    displayName: vendor.companyName || personalName ? String(vendor.companyName || personalName).trim() : null,
    location: vendor.location ? String(vendor.location).trim() : null,
    gstin: vendor.gstNumber ? String(vendor.gstNumber).trim().toUpperCase() : null
  };
}

function buildMarketplaceOrderDraft({ buyer, shippingAddress, billingAddress, validatedCart, products, vendors }) {
  const buyerId = positiveInteger(buyer?.id, 'buyer ID');
  if (buyer.role && buyer.role !== 'CLIENT') throw new Error('Marketplace order buyer must be a CLIENT');
  if (!validatedCart || validatedCart.valid !== true || !Array.isArray(validatedCart.items) || !validatedCart.items.length) {
    throw new Error('A non-empty server-validated cart is required');
  }

  const productMap = new Map((products || []).map((product) => [positiveInteger(product.id, 'product ID'), product]));
  const vendorMap = new Map((vendors || []).map((vendor) => [positiveInteger(vendor.id, 'vendor ID'), vendor]));
  const groups = new Map();

  for (const cartItem of validatedCart.items) {
    if (cartItem.valid !== true) throw new Error(`Cart item ${cartItem.productId} is invalid`);
    const productId = positiveInteger(cartItem.productId, 'product ID');
    const product = productMap.get(productId);
    if (!product) throw new Error(`Authoritative product ${productId} is required`);
    const vendorId = positiveInteger(product.vendorId, `product ${productId} vendor ID`);
    const vendor = vendorMap.get(vendorId);
    if (!vendor) throw new Error(`Authoritative vendor ${vendorId} is required`);
    const quantity = positiveInteger(cartItem.quantity, `product ${productId} quantity`);
    const moqSnapshot = positiveInteger(product.moq, `product ${productId} MOQ`);
    if (quantity < moqSnapshot) throw new Error(`Product ${productId} quantity is below MOQ`);
    const unit = requiredString(cartItem.unit || product.unit, `product ${productId} unit`);
    const unitPricePaise = rupeesToPaise(cartItem.unitPrice);
    const lineSubtotalPaise = rupeesToPaise(cartItem.lineSubtotal);
    const images = Array.isArray(product.images) ? product.images : [];
    const item = {
      productId,
      vendorId,
      productName: requiredString(product.name, `product ${productId} name`),
      descriptionSnapshot: product.description ? String(product.description) : null,
      imageUrlSnapshot: images[0] ? String(images[0]) : product.image ? String(product.image) : null,
      quantity,
      unit,
      moqSnapshot,
      unitPricePaise,
      lineSubtotalPaise,
      discountPaise: 0,
      taxableValuePaise: lineSubtotalPaise,
      gstRateBasisPoints: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      taxTotalPaise: 0,
      lineTotalPaise: lineSubtotalPaise,
      hsnCode: product.hsnCode ? String(product.hsnCode).trim() : null,
      currency: 'INR'
    };
    if (!groups.has(vendorId)) groups.set(vendorId, { vendor, items: [] });
    groups.get(vendorId).items.push(item);
  }

  const sellerOrders = [...groups.entries()].map(([vendorId, group]) => {
    const subtotalPaise = addPaise(group.items.map((item) => item.lineSubtotalPaise), 'seller subtotal');
    return {
      vendorId,
      status: 'DRAFT',
      currency: 'INR',
      subtotalPaise,
      shippingPaise: 0,
      taxPaise: 0,
      discountPaise: 0,
      grandTotalPaise: subtotalPaise,
      sellerSnapshot: sellerSnapshot(group.vendor),
      freightMode: null,
      totalsStatus: { shipping: 'NOT_CALCULATED', tax: 'NOT_CALCULATED', discount: 'NOT_CALCULATED' },
      items: group.items
    };
  });
  const subtotalPaise = addPaise(sellerOrders.map((order) => order.subtotalPaise), 'buyer subtotal');
  return freeze({
    buyerOrder: {
      buyerId,
      status: 'DRAFT',
      currency: 'INR',
      subtotalPaise,
      shippingPaise: 0,
      taxPaise: 0,
      discountPaise: 0,
      grandTotalPaise: subtotalPaise,
      shippingAddressSnapshot: addressSnapshot(shippingAddress, buyerId, 'shipping'),
      billingAddressSnapshot: addressSnapshot(billingAddress, buyerId, 'billing'),
      checkoutReference: null,
      totalsStatus: { shipping: 'NOT_CALCULATED', tax: 'NOT_CALCULATED', discount: 'NOT_CALCULATED' }
    },
    sellerOrders
  });
}

module.exports = { ADDRESS_FIELDS, addressSnapshot, sellerSnapshot, buildMarketplaceOrderDraft };
