const jwt = require('jsonwebtoken');

const Product = require('../../../models/Product');
const { getDisplayPrice } = require('../../../utils/pricingEngine');

const getViewerRole = (req) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role;
  } catch {
    return null;
  }
};

// Create Product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, moq, stock, basePrice } = req.body || {};

    const image = req.file ? req.file.filename : null;

    const product = await Product.create({
      name,
      description,
      category,
      moq,
      stock,
      basePrice,
      image, // ✅ store only filename
      margin: 0,
      finalPrice: getDisplayPrice({ basePrice, moq, pricingTiers: [], margin: 0 })
    });

    res.json(product);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    const viewerRole = getViewerRole(req);
    const canViewClientPrice = viewerRole === 'CLIENT' || viewerRole === 'ADMIN';

    const updatedProducts = products.map(p => ({
      ...p.toJSON(),
      finalPrice: canViewClientPrice ? getDisplayPrice(p) : null,
      image: p.image
        ? `${req.protocol}://${req.get('host')}/uploads/${p.image}`
        : null
    }));

    res.json(updatedProducts);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
