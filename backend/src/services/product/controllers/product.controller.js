const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const logger = require('../../../utils/logger');

const Product = require('../../../models/Product');
const { getDisplayPrice } = require('../../../utils/pricingEngine');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const UPLOAD_DIRECTORY = path.resolve(__dirname, '../../../../uploads');

const serializeProduct = (req, product) => ({
  ...product.toJSON(),
  finalPrice: getDisplayPrice(product),
  images: Array.isArray(product.images) && product.images.length > 0
    ? product.images.map(img => `${req.protocol}://${req.get('host')}/uploads/${img}`)
    : [`${FRONTEND_URL}/industrial.jpg`]
});

const parseOptionalNonNegativeNumber = (value) => {
  if (value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
};

async function cleanupRequestUploads(files) {
  await Promise.all((files || []).map(async (file) => {
    const candidatePath = path.resolve(file.path || path.join(UPLOAD_DIRECTORY, file.filename || ''));

    if (path.dirname(candidatePath) !== UPLOAD_DIRECTORY) {
      logger.warn('Skipped unsafe upload cleanup path', { filename: file.filename });
      return;
    }

    try {
      await fs.promises.unlink(candidatePath);
    } catch (error) {
      logger.warn('Unable to clean up failed product upload', {
        filename: file.filename,
        code: error.code
      });
    }
  }));
}

// Create Product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, moq, stock, basePrice } = req.body || {};
    const vendorId = req.user.id;

    const parsedStock = stock === undefined || stock === '' ? 0 : Number(stock);
    if (!name || !Number.isFinite(Number(moq)) || Number(moq) <= 0 ||
        !Number.isFinite(Number(basePrice)) || Number(basePrice) < 0 ||
        !Number.isFinite(parsedStock) || parsedStock < 0) {
      await cleanupRequestUploads(req.files);
      return res.status(400).json({ message: 'Valid name, MOQ, stock, and base price are required' });
    }

    // ✅ UPDATED: Handle multiple images
    const images = req.files ? req.files.map(file => file.filename) : [];

    const product = await Product.create({
      name,
      description,
      category,
      moq: Number(moq),
      stock: parsedStock,
      basePrice: Number(basePrice),
      images, // ✅ store array of filenames
      vendorId, // ✅ Save vendor ID
      margin: 0,
      finalPrice: getDisplayPrice({ basePrice, moq, pricingTiers: [], margin: 0 })
    });

    res.status(201).json(product);

  } catch (error) {
    await cleanupRequestUploads(req.files);
    logger.error('Create product error', error);
    res.status(500).json({ message: 'Unable to create product' });
  }
};

// Get Products (all products for clients/public)
exports.getProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 12));
    const searchTerm = String(req.query.search || req.query.q || '').trim().toLowerCase();
    const category = String(req.query.category || '').trim();
    const minPrice = parseOptionalNonNegativeNumber(req.query.minPrice);
    const maxPrice = parseOptionalNonNegativeNumber(req.query.maxPrice);
    const maxMoq = parseOptionalNonNegativeNumber(req.query.maxMoq);
    const vendorId = parseOptionalNonNegativeNumber(req.query.vendorId);
    const sort = String(req.query.sort || 'newest').trim().toLowerCase();
    const sortOptions = {
      newest: [['createdAt', 'DESC']],
      price_asc: [['finalPrice', 'ASC'], ['createdAt', 'DESC']],
      price_desc: [['finalPrice', 'DESC'], ['createdAt', 'DESC']],
      moq_asc: [['moq', 'ASC'], ['createdAt', 'DESC']]
    };

    if ([minPrice, maxPrice, maxMoq, vendorId].some(Number.isNaN) ||
        (minPrice !== null && maxPrice !== null && minPrice > maxPrice) ||
        (maxMoq !== null && maxMoq <= 0) || !sortOptions[sort]) {
      return res.status(400).json({ message: 'Invalid product filter parameters' });
    }
    if (vendorId !== null && (!Number.isInteger(vendorId) || vendorId <= 0)) {
      return res.status(400).json({ message: 'Invalid vendor ID' });
    }

    const where = {};
    const searchOperator = Product.sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
    if (searchTerm) {
      where[Op.or] = [
        { name: { [searchOperator]: `%${searchTerm}%` } },
        { category: { [searchOperator]: `%${searchTerm}%` } },
        { description: { [searchOperator]: `%${searchTerm}%` } }
      ];
    }
    if (category) where.category = { [searchOperator]: category };
    if (minPrice !== null || maxPrice !== null) {
      where.finalPrice = {};
      if (minPrice !== null) where.finalPrice[Op.gte] = minPrice;
      if (maxPrice !== null) where.finalPrice[Op.lte] = maxPrice;
    }
    if (maxMoq !== null) where.moq = { [Op.lte]: maxMoq };
    if (vendorId !== null) where.vendorId = vendorId;

    if (req.query.page || req.query.limit || searchTerm || category || minPrice !== null || maxPrice !== null || maxMoq !== null || vendorId !== null || req.query.sort) {
      const { count, rows } = await Product.findAndCountAll({
        where,
        limit,
        offset: (page - 1) * limit,
        order: sortOptions[sort]
      });

      const updatedProducts = rows.map(p => serializeProduct(req, p));

      return res.json({
        products: updatedProducts,
        total: count,
        page,
        limit
      });
    }

    const products = await Product.findAll({ order: [['createdAt', 'DESC']] });

    const updatedProducts = products.map(p => serializeProduct(req, p));

    res.json(updatedProducts);

  } catch (error) {
    logger.error('Get products error', error);
    res.status(500).json({ message: 'Unable to load products' });
  }
};

// ✅ NEW: Get only vendor's own products
exports.getVendorProducts = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const products = await Product.findAll({
      where: { vendorId }
    });

    const updatedProducts = products.map(p => serializeProduct(req, p));

    res.json(updatedProducts);

  } catch (error) {
    logger.error('Get vendor products error', error);
    res.status(500).json({ message: 'Unable to load vendor products' });
  }
};

// ✅ NEW: Delete vendor's own product (vendors cannot modify, only delete)
exports.deleteVendorProduct = async (req, res) => {
  try {
    const vendorId = Number(req.user.id);

    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // ✅ Only allow vendor to delete their own products (with type conversion)
    if (Number(product.vendorId) !== vendorId) {
      return res.status(403).json({ message: 'You can only delete your own products' });
    }

    await product.destroy();

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({ message: 'Unable to delete product' });
  }
};

exports.getProductCategories = async (req, res) => {
  try {
    const rows = await Product.findAll({
      attributes: ['category'],
      where: { [Op.and]: [{ category: { [Op.ne]: null } }, { category: { [Op.ne]: '' } }] },
      group: ['category'],
      order: [['category', 'ASC']],
      raw: true
    });

    res.json(rows.map(row => row.category).filter(Boolean));
  } catch (error) {
    logger.error('Get product categories error', error);
    res.status(500).json({ message: 'Unable to load product categories' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    if (!/^\d+$/.test(String(req.params.id)) || Number(req.params.id) <= 0) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findByPk(Number(req.params.id));
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json(serializeProduct(req, product));
  } catch (error) {
    logger.error('Get product by ID error', error);
    res.status(500).json({ message: 'Unable to load product' });
  }
};
