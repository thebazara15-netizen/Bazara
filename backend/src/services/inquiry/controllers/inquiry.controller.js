const Inquiry = require('../../../models/Inquiry');
const Product = require('../../../models/Product');
const User = require('../../../models/user');

const serializeInquiry = async (inquiry) => {
  const data = inquiry.toJSON();
  const [product, buyer, vendor] = await Promise.all([
    Product.findByPk(data.productId),
    User.findByPk(data.buyerId, { attributes: ['id', 'email', 'firstName', 'lastName', 'companyName', 'phone'] }),
    User.findByPk(data.vendorId, { attributes: ['id', 'companyName', 'firstName', 'lastName', 'isVerified'] })
  ]);

  return {
    ...data,
    product: product ? product.toJSON() : null,
    buyer: buyer ? buyer.toJSON() : null,
    vendor: vendor ? vendor.toJSON() : null
  };
};

exports.createInquiry = async (req, res) => {
  try {
    const { productId, quantity, message } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!product.vendorId) return res.status(400).json({ message: 'Product has no vendor assigned' });

    const inquiry = await Inquiry.create({
      productId: product.id,
      vendorId: product.vendorId,
      buyerId: req.user.id,
      quantity: quantity ? Number(quantity) : Number(product.moq || 1),
      message
    });

    res.status(201).json(await serializeInquiry(inquiry));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVendorInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.findAll({ where: { vendorId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json(await Promise.all(inquiries.map(serializeInquiry)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.findAll({ where: { buyerId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json(await Promise.all(inquiries.map(serializeInquiry)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateInquiryStatus = async (req, res) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    if (Number(inquiry.vendorId) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const status = String(req.body.status || '').toUpperCase();
    if (!['NEW', 'CONTACTED', 'QUOTED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid inquiry status' });
    }

    await inquiry.update({ status });
    res.json(await serializeInquiry(inquiry));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
