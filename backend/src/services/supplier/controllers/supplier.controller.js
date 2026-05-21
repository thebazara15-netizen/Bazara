const User = require('../../../models/user');
const Product = require('../../../models/Product');
const { getDisplayPrice } = require('../../../utils/pricingEngine');

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

const serializeProduct = (req, product) => ({
  ...product.toJSON(),
  finalPrice: getDisplayPrice(product),
  images: Array.isArray(product.images) && product.images.length > 0
    ? product.images.map((img) => `${req.protocol}://${req.get('host')}/uploads/${img}`)
    : [`${frontendUrl}/industrial.jpg`]
});

const supplierAttributes = [
  'id',
  'email',
  'companyName',
  'gstNumber',
  'isVerified',
  'firstName',
  'lastName',
  'phone',
  'location',
  'businessType',
  'aboutCompany',
  'responseRate',
  'createdAt'
];

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await User.findAll({
      where: { role: 'VENDOR' },
      attributes: supplierAttributes,
      order: [['isVerified', 'DESC'], ['createdAt', 'DESC']]
    });

    const response = await Promise.all(suppliers.map(async (supplier) => {
      const products = await Product.findAll({ where: { vendorId: supplier.id } });
      return {
        ...supplier.toJSON(),
        productCount: products.length,
        categories: Array.from(new Set(products.map((product) => product.category).filter(Boolean))).slice(0, 5)
      };
    }));

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSupplier = async (req, res) => {
  try {
    const supplier = await User.findOne({
      where: { id: req.params.id, role: 'VENDOR' },
      attributes: supplierAttributes
    });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    const products = await Product.findAll({ where: { vendorId: supplier.id }, order: [['createdAt', 'DESC']] });
    res.json({
      ...supplier.toJSON(),
      productCount: products.length,
      categories: Array.from(new Set(products.map((product) => product.category).filter(Boolean))),
      products: products.map((product) => serializeProduct(req, product))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
