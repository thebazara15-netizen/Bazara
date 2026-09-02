const { Op } = require('sequelize');
const User = require('../../../models/user');
const Order = require('../../../models/Order');
const Product = require('../../../models/Product');
const RFQ = require('../../../models/RFQ');
const Quote = require('../../../models/Quote');
const logger = require('../../../utils/logger');
const { getDisplayPrice } = require('../../../utils/pricingEngine');

const safeUserAttributes = ['id', 'email', 'role', 'companyName', 'gstNumber', 'isVerified', 'firstName', 'lastName', 'phone', 'location', 'businessType', 'aboutCompany', 'responseRate', 'createdAt', 'updatedAt'];
const productAttributes = ['id', 'name', 'description', 'category', 'moq', 'stock', 'basePrice', 'margin', 'finalPrice', 'images', 'vendorId', 'createdAt', 'updatedAt'];
const serializeUser = (user) => Object.fromEntries(safeUserAttributes.map((attribute) => [attribute, user[attribute]]));
const validId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

exports.getUsers = () => User.findAll({ attributes: safeUserAttributes, order: [['createdAt', 'DESC']] });

exports.approveVendor = async (id) => {
  if (!validId(id)) throw new Error('Invalid vendor ID');
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');
  if (user.role !== 'VENDOR') throw new Error('Only vendor accounts can be approved');
  user.isVerified = true;
  await user.save();
  return serializeUser(user);
};

exports.getOrders = async () => {
  return Order.findAll({
    attributes: ['id', 'buyerId', 'totalAmount', 'status', 'createdAt'],
    include: [{
      model: User,
      as: 'buyer',
      attributes: ['id', 'firstName', 'lastName', 'companyName', 'email'],
      required: false
    }],
    order: [['createdAt', 'DESC']]
  });
};

exports.getSuppliers = async () => {
  const [vendors, products] = await Promise.all([
    User.findAll({ where: { role: 'VENDOR' }, attributes: safeUserAttributes, order: [['createdAt', 'DESC']] }),
    Product.findAll({ attributes: ['vendorId'], raw: true })
  ]);
  const counts = products.reduce((result, product) => result.set(Number(product.vendorId), (result.get(Number(product.vendorId)) || 0) + 1), new Map());
  return vendors.map((vendor) => ({ ...serializeUser(vendor), productCount: counts.get(Number(vendor.id)) || 0 }));
};

exports.getRfqs = async () => {
  const [rfqs, quotes] = await Promise.all([
    RFQ.findAll({ attributes: ['id', 'title', 'quantity', 'unit', 'budget', 'status', 'buyerId', 'createdAt'], order: [['createdAt', 'DESC']] }),
    Quote.findAll({ attributes: ['rfqId'], raw: true })
  ]);
  const buyerIds = [...new Set(rfqs.map((rfq) => rfq.buyerId).filter(Boolean))];
  const buyers = buyerIds.length ? await User.findAll({ where: { id: { [Op.in]: buyerIds } }, attributes: ['id', 'firstName', 'lastName', 'companyName'] }) : [];
  const buyerMap = new Map(buyers.map((buyer) => [Number(buyer.id), buyer.toJSON()]));
  const quoteCounts = quotes.reduce((result, quote) => result.set(Number(quote.rfqId), (result.get(Number(quote.rfqId)) || 0) + 1), new Map());
  return rfqs.map((rfq) => ({ ...rfq.toJSON(), buyer: buyerMap.get(Number(rfq.buyerId)) || null, quotationCount: quoteCounts.get(Number(rfq.id)) || 0 }));
};

exports.getProducts = async () => {
  const products = await Product.findAll({ attributes: productAttributes, order: [['createdAt', 'DESC']] });
  const vendorIds = [...new Set(products.map((product) => product.vendorId).filter(Boolean))];
  const vendors = vendorIds.length ? await User.findAll({ where: { id: { [Op.in]: vendorIds } }, attributes: ['id', 'companyName', 'firstName', 'lastName'] }) : [];
  const vendorMap = new Map(vendors.map((vendor) => [Number(vendor.id), vendor.toJSON()]));
  return products.map((product) => ({ ...product.toJSON(), finalPrice: getDisplayPrice(product), vendor: vendorMap.get(Number(product.vendorId)) || null }));
};

exports.updateMargin = async (id, margin) => {
  if (!validId(id)) throw new Error('Invalid product ID');
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');
  const parsedMargin = Number(margin);
  if (!Number.isFinite(parsedMargin) || parsedMargin < 0) throw new Error('Margin must be a non-negative number');
  product.margin = parsedMargin;
  product.finalPrice = getDisplayPrice({ ...product.toJSON(), margin: parsedMargin });
  await product.save();
  return { ...product.toJSON(), finalPrice: getDisplayPrice(product) };
};

exports.editProduct = async (id, data, files) => {
  if (!validId(id)) throw new Error('Invalid product ID');
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');
  const { name, description, category, moq, stock, basePrice, margin } = data;
  const values = { name: name === undefined ? undefined : String(name).trim(), description: description === undefined ? undefined : String(description).trim(), category: category === undefined ? undefined : String(category).trim(), moq: moq === undefined ? undefined : Number(moq), stock: stock === undefined ? undefined : Number(stock), basePrice: basePrice === undefined ? undefined : Number(basePrice), margin: margin === undefined ? undefined : Number(margin) };
  if (values.name !== undefined && (!values.name || values.name.length > 255)) throw new Error('Product name is required and must be 255 characters or fewer');
  if (values.moq !== undefined && (!Number.isInteger(values.moq) || values.moq <= 0)) throw new Error('MOQ must be a positive whole number');
  if (values.stock !== undefined && (!Number.isInteger(values.stock) || values.stock < 0)) throw new Error('Stock must be a non-negative whole number');
  if (values.basePrice !== undefined && (!Number.isFinite(values.basePrice) || values.basePrice <= 0)) throw new Error('Base price must be a positive number');
  if (values.margin !== undefined && (!Number.isFinite(values.margin) || values.margin < 0)) throw new Error('Margin must be a non-negative number');
  if (values.name !== undefined) product.name = values.name;
  if (values.description !== undefined) product.description = values.description || null;
  if (values.category !== undefined) product.category = values.category || null;
  if (values.moq !== undefined) product.moq = values.moq;
  if (values.stock !== undefined) product.stock = values.stock;
  if (values.basePrice !== undefined) product.basePrice = values.basePrice;
  if (values.margin !== undefined) product.margin = values.margin;
  if (files?.length) product.images = files.map((file) => file.filename);
  product.finalPrice = getDisplayPrice(product);
  await product.save();
  return { ...product.toJSON(), finalPrice: getDisplayPrice(product) };
};

exports.deleteProduct = async (id) => {
  try {
    if (!validId(id)) throw new Error('Invalid product ID');
    const product = await Product.findByPk(id);
    if (!product) throw new Error('Product not found');
    await product.destroy();
    return { message: 'Product deleted successfully' };
  } catch (error) {
    logger.error('Admin delete product error:', error);
    throw error;
  }
};
