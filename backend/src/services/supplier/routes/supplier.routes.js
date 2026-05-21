const express = require('express');
const router = express.Router();

const controller = require('../controllers/supplier.controller');

router.get('/', controller.getSuppliers);
router.get('/:id', controller.getSupplier);

module.exports = router;
