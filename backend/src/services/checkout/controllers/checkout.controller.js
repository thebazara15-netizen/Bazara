'use strict';

const service = require('../checkout.service');
const reservationService = require('../../order/inventory-reservation.service');
const { CheckoutError } = require('../checkout.validation');

function sendError(res, error) {
  if (error instanceof CheckoutError) return res.status(error.status).json({ message: error.message, code: error.code });
  return res.status(500).json({ message: 'Unable to process checkout draft', code: 'CHECKOUT_SERVER_ERROR' });
}

exports.createDraft = async (req, res) => {
  try {
    const draft = await service.createDraft(req.user.id, req.body, req);
    return res.status(draft.idempotentReplay ? 200 : 201).json(draft);
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getDraft = async (req, res) => {
  try {
    return res.json(await service.getDraft(req.user.id, req.params.id, req));
  } catch (error) {
    return sendError(res, error);
  }
};

exports.prepareOrder = async (req, res) => {
  try {
    return res.status(201).json(await reservationService.prepareMarketplaceOrderFromDraft(req.user.id, req.params.id, req.body, req));
  } catch (error) {
    return sendError(res, error);
  }
};
