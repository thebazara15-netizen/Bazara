const adminService = require('../services/admin.service');

// ✅ GET USERS
exports.getUsers = async (req, res) => {
  try {
    const users = await adminService.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ APPROVE VENDOR
exports.approveVendor = async (req, res) => {
  try {
    const user = await adminService.approveVendor(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ GET ORDERS
exports.getOrders = async (req, res) => {
  try {
    const orders = await adminService.getOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await adminService.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE MARGIN (YOUR ORIGINAL LOGIC — UNCHANGED)
exports.updateMargin = async (req, res) => {
  try {
    const product = await adminService.updateMargin(req.params.id, req.body.margin);

    res.json({
      message: "Margin updated successfully",
      product
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ NEW: Admin can edit any vendor's product (all fields)
exports.editProduct = async (req, res) => {
  try {
    const product = await adminService.editProduct(req.params.id, req.body, req.files);
    
    res.json({
      message: "Product updated successfully",
      product
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ NEW: Admin can delete any product
exports.deleteProduct = async (req, res) => {
  try {
    await adminService.deleteProduct(req.params.id);
    
    res.json({
      message: "Product deleted successfully"
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
