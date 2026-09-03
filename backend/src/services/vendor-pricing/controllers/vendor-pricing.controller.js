'use strict';
const service = require('../vendor-pricing.service');
const { VendorPricingError } = require('../vendor-pricing.validation');
const fail = (res, error) => error instanceof VendorPricingError ? res.status(error.status).json({ message: error.message, code: error.code }) : res.status(500).json({ message: 'Unable to manage seller pricing configuration' });
exports.get = async (req, res) => { try { return res.json(await service.get(req.user.id)); } catch (error) { return fail(res, error); } };
exports.save = async (req, res) => { try { return res.json(await service.save(req.user.id, req.body)); } catch (error) { return fail(res, error); } };
