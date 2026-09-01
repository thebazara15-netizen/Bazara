const RFQ = require('../../../models/RFQ');
const Quote = require('../../../models/Quote');
const User = require('../../../models/user');
const { Op } = require('sequelize');

const parsePositiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const parsePositiveInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

const serializeQuote = async (quote) => {
  const data = quote.toJSON();
  const vendor = await User.findByPk(data.vendorId, {
    attributes: ['id', 'companyName', 'firstName', 'lastName', 'isVerified', 'location']
  });
  return {
    ...data,
    vendor: vendor ? vendor.toJSON() : null
  };
};

const serializeRfq = async (rfq, includeQuotes = false) => {
  const data = rfq.toJSON();
  const buyer = await User.findByPk(data.buyerId, {
    attributes: ['id', 'companyName', 'firstName', 'lastName', 'location']
  });
  const quotes = includeQuotes
    ? await Promise.all((await Quote.findAll({ where: { rfqId: data.id }, order: [['createdAt', 'DESC']] })).map(serializeQuote))
    : undefined;

  return {
    ...data,
    buyer: buyer ? buyer.toJSON() : null,
    ...(quotes ? { quotes } : {})
  };
};

exports.getRfqs = async (req, res) => {
  try {
    const rfqs = await RFQ.findAll({ where: { status: { [Op.in]: ['OPEN', 'QUOTED'] } }, order: [['createdAt', 'DESC']] });
    res.json(await Promise.all(rfqs.map((rfq) => serializeRfq(rfq))));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyRfqs = async (req, res) => {
  try {
    const rfqs = await RFQ.findAll({ where: { buyerId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json(await Promise.all(rfqs.map((rfq) => serializeRfq(rfq, true))));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRfq = async (req, res) => {
  try {
    const { title, description, category, quantity, unit, budget, deliveryLocation } = req.body;
    const normalizedTitle = String(title || '').trim();
    const normalizedQuantity = parsePositiveInteger(quantity);
    const normalizedBudget = budget === '' || budget == null ? null : parsePositiveNumber(budget);

    if (!normalizedTitle || !normalizedQuantity) {
      return res.status(400).json({ message: 'Title and quantity are required' });
    }
    if (normalizedTitle.length > 255) {
      return res.status(400).json({ message: 'Title must be 255 characters or fewer' });
    }
    if (budget !== '' && budget != null && !normalizedBudget) {
      return res.status(400).json({ message: 'Budget must be a positive number' });
    }

    const rfq = await RFQ.create({
      title: normalizedTitle,
      description: String(description || '').trim() || null,
      category: String(category || '').trim() || null,
      quantity: normalizedQuantity,
      unit: String(unit || '').trim() || 'units',
      budget: normalizedBudget,
      deliveryLocation: String(deliveryLocation || '').trim() || null,
      buyerId: req.user.id
    });

    res.status(201).json(await serializeRfq(rfq, true));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createQuote = async (req, res) => {
  try {
    const rfqId = parsePositiveInteger(req.params.id);
    if (!rfqId) return res.status(400).json({ message: 'Invalid RFQ ID' });

    const rfq = await RFQ.findByPk(rfqId);
    if (!rfq) return res.status(404).json({ message: 'RFQ not found' });
    if (!['OPEN', 'QUOTED'].includes(rfq.status)) {
      return res.status(409).json({ message: 'This RFQ is no longer accepting quotations' });
    }

    const { price, deliveryDays, message, validUntil } = req.body;
    const normalizedPrice = parsePositiveNumber(price);
    const normalizedDeliveryDays = deliveryDays === '' || deliveryDays == null
      ? 14
      : parsePositiveInteger(deliveryDays);
    if (!normalizedPrice) return res.status(400).json({ message: 'Quote price must be a positive number' });
    if (!normalizedDeliveryDays) return res.status(400).json({ message: 'Delivery days must be a positive whole number' });

    const existingQuote = await Quote.findOne({ where: { rfqId: rfq.id, vendorId: req.user.id } });
    if (existingQuote) {
      return res.status(409).json({ message: 'You have already submitted a quotation for this RFQ' });
    }

    const quote = await Quote.create({
      rfqId: rfq.id,
      vendorId: req.user.id,
      price: normalizedPrice,
      deliveryDays: normalizedDeliveryDays,
      message: String(message || '').trim() || null,
      validUntil: validUntil || null
    });

    await rfq.update({ status: 'QUOTED' });
    res.status(201).json(await serializeQuote(quote));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVendorQuotes = async (req, res) => {
  try {
    const quotes = await Quote.findAll({ where: { vendorId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json(await Promise.all(quotes.map(async (quote) => {
      const data = quote.toJSON();
      const rfq = await RFQ.findByPk(data.rfqId);
      return { ...data, rfq: rfq ? rfq.toJSON() : null };
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateQuoteStatus = async (req, res) => {
  try {
    const quoteId = parsePositiveInteger(req.params.id);
    if (!quoteId) return res.status(400).json({ message: 'Invalid quote ID' });

    const quote = await Quote.findByPk(quoteId);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const rfq = await RFQ.findByPk(quote.rfqId);
    if (!rfq || Number(rfq.buyerId) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const status = String(req.body.status || '').toUpperCase();
    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be ACCEPTED or REJECTED' });
    }
    if (rfq.status === 'CLOSED') {
      return res.status(409).json({ message: 'This RFQ is already closed' });
    }

    await quote.update({ status });
    if (status === 'ACCEPTED') {
      await rfq.update({ status: 'CLOSED' });
    }

    res.json(await serializeQuote(quote));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
