'use strict';

class CartError extends Error {
  constructor(message, status = 400, code = 'CART_VALIDATION_ERROR') {
    super(message);
    this.name = 'CartError';
    this.status = status;
    this.code = code;
  }
}

function positiveInteger(value, field) {
  const isSafeString = typeof value === 'string' && /^\d+$/.test(value.trim());
  const parsed = typeof value === 'number' || isSafeString ? Number(value) : NaN;
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new CartError(`${field} must be a positive integer`, 400, `INVALID_${field.toUpperCase()}`);
  }
  return parsed;
}

function productRules(product) {
  const moq = Number(product?.moq);
  const stock = Number(product?.stock);
  if (!Number.isSafeInteger(moq) || moq <= 0) {
    throw new CartError('Product MOQ is unavailable or invalid', 409, 'INVALID_PRODUCT_MOQ');
  }
  if (!Number.isSafeInteger(stock) || stock < 0) {
    throw new CartError('Product stock is unavailable or invalid', 409, 'INVALID_PRODUCT_STOCK');
  }
  return { moq, stock };
}

function validateQuantityForProduct(quantity, product) {
  const parsedQuantity = positiveInteger(quantity, 'quantity');
  const { moq, stock } = productRules(product);
  if (parsedQuantity < moq) throw new CartError(`Minimum order quantity is ${moq}`, 400, 'BELOW_MOQ');
  if (parsedQuantity > stock) throw new CartError(`Only ${stock} units are currently available`, 409, 'ABOVE_STOCK');
  return parsedQuantity;
}

function lineValidation(quantity, product) {
  if (!product) return { valid: false, reason: 'PRODUCT_UNAVAILABLE' };
  try {
    validateQuantityForProduct(quantity, product);
    return { valid: true, reason: null };
  } catch (error) {
    const reasons = {
      BELOW_MOQ: 'MOQ_CHANGED',
      ABOVE_STOCK: Number(product.stock) === 0 ? 'OUT_OF_STOCK' : 'INSUFFICIENT_STOCK',
      INVALID_PRODUCT_MOQ: 'PRODUCT_CONFIGURATION_INVALID',
      INVALID_PRODUCT_STOCK: 'PRODUCT_CONFIGURATION_INVALID',
      INVALID_QUANTITY: 'INVALID_QUANTITY'
    };
    return { valid: false, reason: reasons[error.code] || 'PRODUCT_CONFIGURATION_INVALID' };
  }
}

module.exports = { CartError, positiveInteger, productRules, validateQuantityForProduct, lineValidation };
