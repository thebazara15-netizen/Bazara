const express = require("express");
const router = express.Router();

const { createProduct, getProducts } = require("../controllers/product.controller");

// Routes
router.post("/", createProduct);
router.get("/", getProducts);

// ✅ VERY IMPORTANT
module.exports = router;