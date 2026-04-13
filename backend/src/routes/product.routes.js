const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const { createProduct, getProducts } = require("../controllers/product.controller");

// Routes
// router.post("/", createProduct);
// router.get("/", getProducts);

router.get("/", getProducts); // PUBLIC

router.post(
  "/",
  verifyToken,
  authorize(["VENDOR"]),
  createProduct
);

// ✅ VERY IMPORTANT
module.exports = router;