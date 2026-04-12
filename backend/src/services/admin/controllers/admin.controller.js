const Product = require('../../../models/Product');

// ✅ GET USERS
exports.getUsers = async (req, res) => {
  res.json({ message: "Users API working" });
};

// ✅ APPROVE VENDOR
exports.approveVendor = async (req, res) => {
  res.json({ message: "Vendor approved" });
};

// ✅ GET ORDERS
exports.getOrders = async (req, res) => {
  res.json({ message: "Orders fetched" });
};

// ✅ UPDATE MARGIN (YOUR ORIGINAL LOGIC — UNCHANGED)
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

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};