'use strict';

const { UniqueConstraintError } = require('sequelize');
const { sequelize, Cart, CartItem, Product } = require('../../../models');
const { calculatePrice, getUnitPrice } = require('../../../utils/pricingEngine');
const { CartError, positiveInteger, productRules, validateQuantityForProduct, lineValidation } = require('../cart.validation');

const PRODUCT_ATTRIBUTES = ['id', 'name', 'description', 'category', 'moq', 'stock', 'basePrice', 'margin', 'finalPrice', 'pricingTiers', 'images', 'vendorId'];

function currentPricing(product, quantity) {
  const unitPrice = getUnitPrice(product, quantity);
  const lineSubtotal = calculatePrice(product, quantity);
  if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(lineSubtotal) || lineSubtotal < 0) {
    throw new CartError('Product pricing is unavailable or invalid', 409, 'INVALID_PRODUCT_PRICE');
  }
  return { unitPrice, lineSubtotal };
}

function imageUrl(req, image) {
  if (!image) return null;
  if (/^https?:\/\//i.test(String(image)) || String(image).startsWith('/')) return image;
  return `${req.protocol}://${req.get('host')}/uploads/${image}`;
}

function serializeLine(req, item) {
  const raw = item.toJSON();
  const product = raw.product || null;
  const validation = lineValidation(raw.quantity, product);
  let pricing = { unitPrice: null, lineSubtotal: null };

  if (product && validation.reason !== 'PRODUCT_CONFIGURATION_INVALID') {
    try {
      pricing = currentPricing(product, raw.quantity);
    } catch {
      if (validation.valid) {
        validation.valid = false;
        validation.reason = 'PRODUCT_CONFIGURATION_INVALID';
      }
    }
  }

  const images = Array.isArray(product?.images) ? product.images.map((image) => imageUrl(req, image)) : [];
  return {
    id: raw.id,
    cartItemId: raw.id,
    productId: raw.productId,
    quantity: raw.quantity,
    price: pricing.lineSubtotal,
    unitPrice: pricing.unitPrice,
    lineSubtotal: pricing.lineSubtotal,
    moq: product ? Number(product.moq) : null,
    availableStock: product ? Number(product.stock) : null,
    valid: validation.valid,
    reason: validation.reason,
    product: product ? {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      moq: Number(product.moq),
      stock: Number(product.stock),
      finalPrice: pricing.unitPrice,
      images,
      image: images[0] || null,
      vendorId: product.vendorId
    } : null
  };
}

async function getCart(userId, req) {
  const cart = await Cart.findOne({ where: { userId } });
  if (!cart) return { cartId: null, items: [], subtotal: 0, valid: true };

  const records = await CartItem.findAll({
    where: { cartId: cart.id },
    include: { model: Product, as: 'product', attributes: PRODUCT_ATTRIBUTES, required: false },
    order: [['id', 'ASC']]
  });
  const items = records.map((item) => serializeLine(req, item));
  const subtotal = items.reduce((sum, item) => sum + (Number(item.lineSubtotal) || 0), 0);
  return { cartId: cart.id, items, subtotal: Number(subtotal.toFixed(2)), valid: items.every((item) => item.valid) };
}

async function addAttempt(userId, productId, requestedQuantity) {
  return sequelize.transaction(async (transaction) => {
    const product = await Product.findByPk(productId, { transaction });
    if (!product) throw new CartError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    productRules(product);

    const [cart] = await Cart.findOrCreate({ where: { userId }, defaults: { userId }, transaction });
    const existingItem = await CartItem.findOne({ where: { cartId: cart.id, productId }, transaction });
    const nextQuantity = existingItem ? Number(existingItem.quantity) + requestedQuantity : requestedQuantity;
    validateQuantityForProduct(nextQuantity, product);
    const { lineSubtotal } = currentPricing(product, nextQuantity);

    if (existingItem) {
      await existingItem.update({ quantity: nextQuantity, price: lineSubtotal }, { transaction });
      return existingItem;
    }
    return CartItem.create({ cartId: cart.id, productId, quantity: nextQuantity, price: lineSubtotal }, { transaction });
  });
}

function isConcurrencyError(error) {
  const code = error?.parent?.code || error?.original?.code;
  return error instanceof UniqueConstraintError || code === 'SQLITE_BUSY' || error?.name === 'SequelizeTimeoutError';
}

async function addToCart(userId, rawProductId, rawQuantity) {
  const productId = positiveInteger(rawProductId, 'productId');
  const quantity = positiveInteger(rawQuantity, 'quantity');
  try {
    return await addAttempt(userId, productId, quantity);
  } catch (error) {
    if (!isConcurrencyError(error)) throw error;
    try {
      return await addAttempt(userId, productId, quantity);
    } catch (retryError) {
      if (isConcurrencyError(retryError)) {
        throw new CartError('Cart changed concurrently; please retry', 409, 'CART_CONFLICT');
      }
      throw retryError;
    }
  }
}

async function updateCartItem(userId, rawItemId, rawQuantity) {
  const itemId = positiveInteger(rawItemId, 'id');
  const quantity = positiveInteger(rawQuantity, 'quantity');
  return sequelize.transaction(async (transaction) => {
    const cart = await Cart.findOne({ where: { userId }, transaction });
    if (!cart) throw new CartError('Cart not found', 404, 'CART_NOT_FOUND');
    const item = await CartItem.findOne({ where: { id: itemId, cartId: cart.id }, transaction });
    if (!item) throw new CartError('Item not found', 404, 'CART_ITEM_NOT_FOUND');
    const product = await Product.findByPk(item.productId, { transaction });
    if (!product) throw new CartError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    validateQuantityForProduct(quantity, product);
    const { lineSubtotal } = currentPricing(product, quantity);
    await item.update({ quantity, price: lineSubtotal }, { transaction });
    return item;
  });
}

async function removeCartItem(userId, rawItemId) {
  const itemId = positiveInteger(rawItemId, 'id');
  const cart = await Cart.findOne({ where: { userId } });
  if (!cart) throw new CartError('Cart not found', 404, 'CART_NOT_FOUND');
  const removed = await CartItem.destroy({ where: { id: itemId, cartId: cart.id } });
  if (!removed) throw new CartError('Item not found', 404, 'CART_ITEM_NOT_FOUND');
}

module.exports = { addToCart, getCart, updateCartItem, removeCartItem };
