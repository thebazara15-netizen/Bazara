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

    // ✅ UPDATED: Handle multiple images
    const images = req.files ? req.files.map(file => file.filename) : [];

    const product = await Product.create({
      name,
      description,
      category,
      moq,
      stock,
      basePrice,
      images, // ✅ store array of filenames
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
      // ✅ UPDATED: Handle multiple images array
      images: Array.isArray(p.images) && p.images.length > 0
        ? p.images.map(img => `${req.protocol}://${req.get('host')}/uploads/${img}`)
        : [`${req.protocol}://${req.get('host')}/industrial.jpg`] // fallback image
    }));

    res.json(updatedProducts);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
