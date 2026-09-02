'use strict';

const crypto = require('crypto');
const { rupeesToPaise } = require('../../utils/money');

function cartFingerprint(cart, productMap) {
  const lines = cart.items.map((item) => {
    const product = productMap.get(Number(item.productId));
    if (!product) throw new Error(`Authoritative product ${item.productId} is required`);
    return {
      productId: Number(product.id),
      vendorId: Number(product.vendorId),
      quantity: Number(item.quantity),
      unitPricePaise: rupeesToPaise(item.unitPrice),
      lineSubtotalPaise: rupeesToPaise(item.lineSubtotal),
      moq: Number(product.moq),
      stock: Number(product.stock),
      available: Number(product.stock) >= Number(item.quantity),
      productUpdatedAt: new Date(product.updatedAt).toISOString()
    };
  }).sort((a, b) => a.productId - b.productId);
  return crypto.createHash('sha256').update(JSON.stringify(lines)).digest('hex');
}

module.exports = { cartFingerprint };
