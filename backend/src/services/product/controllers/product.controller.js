const Product = require('../../../models/Product');

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
      finalPrice: basePrice
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

    const updatedProducts = products.map(p => ({
      ...p.toJSON(),
      image: p.image
        ? `${req.protocol}://${req.get('host')}/uploads/${p.image}`
        : null
    }));

    res.json(updatedProducts);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};