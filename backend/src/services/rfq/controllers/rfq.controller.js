const RFQ = require('../../../models/RFQ');
const Quote = require('../../../models/Quote');
const User = require('../../../models/user');

const serializeQuote = async (quote) => {
  const data = quote.toJSON();
  const vendor = await User.findByPk(data.vendorId, {
    attributes: ['id', 'companyName', 'firstName', 'lastName', 'isVerified', 'location', 'responseRate']
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
    const rfqs = await RFQ.findAll({ where: { status: 'OPEN' }, order: [['createdAt', 'DESC']] });
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
    if (!title || !quantity) {
      return res.status(400).json({ message: 'Title and quantity are required' });
    }

    const rfq = await RFQ.create({
      title,
      description,
      category,
      quantity: Number(quantity),
      unit,
      budget: budget ? Number(budget) : null,
      deliveryLocation,
      buyerId: req.user.id
    });

    res.status(201).json(await serializeRfq(rfq, true));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createQuote = async (req, res) => {
  try {
    const rfq = await RFQ.findByPk(req.params.id);
    if (!rfq) return res.status(404).json({ message: 'RFQ not found' });

    const { price, deliveryDays, message, validUntil } = req.body;
    if (!price) return res.status(400).json({ message: 'Quote price is required' });

    const quote = await Quote.create({
      rfqId: rfq.id,
      vendorId: req.user.id,
      price: Number(price),
      deliveryDays: deliveryDays ? Number(deliveryDays) : 14,
      message,
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
    const quote = await Quote.findByPk(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const rfq = await RFQ.findByPk(quote.rfqId);
    if (!rfq || Number(rfq.buyerId) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const status = String(req.body.status || '').toUpperCase();
    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be ACCEPTED or REJECTED' });
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
