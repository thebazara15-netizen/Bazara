const { Op } = require('sequelize');
const User = require('../../../models/user');
const Product = require('../../../models/Product');

const publicSupplierAttributes = [
  'id',
  'companyName',
  'isVerified',
  'firstName',
  'lastName',
  'location',
  'businessType',
  'aboutCompany',
  'createdAt'
];

const serializeSupplier = (supplier, productSummary = {}) => ({
  id: supplier.id,
  companyName: supplier.companyName,
  isVerified: supplier.isVerified === true,
  firstName: supplier.firstName,
  lastName: supplier.lastName,
  location: supplier.location,
  businessType: supplier.businessType,
  aboutCompany: supplier.aboutCompany,
  createdAt: supplier.createdAt,
  productCount: productSummary.productCount || 0,
  categories: productSummary.categories || []
});

const summarizeProductsByVendor = (products) => {
  const summaries = new Map();
  products.forEach((product) => {
    const vendorId = Number(product.vendorId);
    const current = summaries.get(vendorId) || { productCount: 0, categories: new Set() };
    current.productCount += 1;
    if (product.category) current.categories.add(product.category);
    summaries.set(vendorId, current);
  });

  return new Map(Array.from(summaries, ([vendorId, summary]) => [vendorId, {
    productCount: summary.productCount,
    categories: Array.from(summary.categories).sort().slice(0, 8)
  }]));
};

exports.getSuppliers = async (req, res) => {
  try {
    const searchTerm = String(req.query.q || '').trim();
    const searchOperator = User.sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
    const where = { role: 'VENDOR' };

    if (searchTerm) {
      where[Op.or] = [
        { companyName: { [searchOperator]: `%${searchTerm}%` } },
        { firstName: { [searchOperator]: `%${searchTerm}%` } },
        { lastName: { [searchOperator]: `%${searchTerm}%` } },
        { location: { [searchOperator]: `%${searchTerm}%` } }
      ];
    }

    const [suppliers, products] = await Promise.all([
      User.findAll({ where, attributes: publicSupplierAttributes, order: [['isVerified', 'DESC'], ['createdAt', 'DESC']] }),
      Product.findAll({ attributes: ['vendorId', 'category'], raw: true })
    ]);
    const summaries = summarizeProductsByVendor(products);

    res.json(suppliers.map((supplier) => serializeSupplier(supplier, summaries.get(Number(supplier.id)))));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load suppliers' });
  }
};

exports.getSupplier = async (req, res) => {
  try {
    if (!/^\d+$/.test(String(req.params.id)) || Number(req.params.id) <= 0) {
      return res.status(400).json({ message: 'Invalid supplier ID' });
    }

    const supplierId = Number(req.params.id);
    const [supplier, products] = await Promise.all([
      User.findOne({ where: { id: supplierId, role: 'VENDOR' }, attributes: publicSupplierAttributes }),
      Product.findAll({ where: { vendorId: supplierId }, attributes: ['vendorId', 'category'], raw: true })
    ]);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    const summary = summarizeProductsByVendor(products).get(supplierId);
    res.json(serializeSupplier(supplier, summary));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load supplier' });
  }
};
