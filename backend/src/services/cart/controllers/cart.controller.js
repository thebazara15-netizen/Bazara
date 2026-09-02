'use strict';

const cartService = require('../services/cart.service');
const { CartError } = require('../cart.validation');

function sendError(res, error) {
  if (error instanceof CartError) {
    return res.status(error.status).json({ message: error.message, code: error.code });
  }
  return res.status(500).json({ message: 'Unable to process cart request', code: 'CART_SERVER_ERROR' });
}

exports.addToCart = async (req, res) => {
  try {
    const item = await cartService.addToCart(req.user.id, req.body.productId, req.body.quantity);
    return res.status(200).json({ cartItemId: item.id, productId: item.productId, quantity: item.quantity });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getCart = async (req, res) => {
  try {
    return res.json(await cartService.getCart(req.user.id, req));
  } catch (error) {
    return sendError(res, error);
  }
};

exports.updateCart = async (req, res) => {
  try {
    const item = await cartService.updateCartItem(req.user.id, req.params.id, req.body.quantity);
    return res.json({ message: 'Updated', cartItemId: item.id, quantity: item.quantity });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    await cartService.removeCartItem(req.user.id, req.params.id);
    return res.json({ message: 'Removed' });
  } catch (error) {
    return sendError(res, error);
  }
};
