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
    const token = req.headers.authorization?.split(' ')[1];

    // ✅ Extract vendor ID from token
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const vendorId = decoded.id;

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
      vendorId, // ✅ Save vendor ID
      margin: 0,
      finalPrice: getDisplayPrice({ basePrice, moq, pricingTiers: [], margin: 0 })
    });

    res.json(product);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Products (all products for clients/public)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();

    const updatedProducts = products.map(p => ({
      ...p.toJSON(),
      // ✅ UPDATED: Show price to everyone (client pricing only)
      finalPrice: getDisplayPrice(p),
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

// ✅ NEW: Get only vendor's own products
exports.getVendorProducts = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const vendorId = decoded.id;

    const products = await Product.findAll({
      where: { vendorId }
    });

    const updatedProducts = products.map(p => ({
      ...p.toJSON(),
      finalPrice: getDisplayPrice(p),
      images: Array.isArray(p.images) && p.images.length > 0
        ? p.images.map(img => `${req.protocol}://${req.get('host')}/uploads/${img}`)
        : [`${req.protocol}://${req.get('host')}/industrial.jpg`]
    }));

    res.json(updatedProducts);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Delete vendor's own product (vendors cannot modify, only delete)
exports.deleteVendorProduct = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const vendorId = Number(decoded.id); // ✅ Ensure it's a number

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
    console.error('Delete product error:', error);
    res.status(500).json({ message: error.message });
  }
};