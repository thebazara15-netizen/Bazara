const Product = require("../models/Product");

// ✅ Update margin
exports.updateMargin = async (req, res) => {
  try {
    const { id } = req.params;
    const { margin } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.margin = margin;
    product.finalPrice = product.basePrice + margin;

    await product.save();

    res.json({
      message: "Margin updated successfully",
      product
    });

    res.json({ message: "API working" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};