const Product = require("../models/Product");

// ✅ CREATE PRODUCT (Vendor)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, moq, stock, basePrice } = req.body;

    // Default margin = 0
    const margin = 0;

    // Final price calculation
    const finalPrice = basePrice + margin;

    const product = await Product.create({
      name,
      description,
      category,
      moq,
      stock,
      basePrice,
      margin,
      finalPrice
    });

    res.status(201).json(product);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET ALL PRODUCTS (Client)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};