const { UniqueConstraintError } = require('sequelize');
const { Product, WishlistItem } = require('../../../models');
const { getDisplayPrice } = require('../../../utils/pricingEngine');

const productAttributes = [
  'id', 'name', 'description', 'category', 'moq', 'stock', 'basePrice',
  'margin', 'finalPrice', 'pricingTiers', 'images', 'vendorId', 'createdAt', 'updatedAt'
];

const parseProductId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const serializeItem = (req, item) => {
  const data = item.toJSON();
  const product = data.product;
  return {
    id: data.id,
    productId: data.productId,
    createdAt: data.createdAt,
    product: product ? {
      ...product,
      finalPrice: getDisplayPrice(product),
      images: Array.isArray(product.images)
        ? product.images.map((image) => `${req.protocol}://${req.get('host')}/uploads/${image}`)
        : []
    } : null
  };
};

const findItem = (id, userId) => WishlistItem.findOne({
  where: { id, userId },
  include: [{ model: Product, as: 'product', attributes: productAttributes }]
});

exports.getWishlist = async (req, res) => {
  try {
    const items = await WishlistItem.findAll({
      where: { userId: req.user.id },
      include: [{ model: Product, as: 'product', attributes: productAttributes }],
      order: [['createdAt', 'DESC']]
    });
    return res.json(items.map((item) => serializeItem(req, item)));
  } catch {
    return res.status(500).json({ message: 'Unable to load wishlist' });
  }
};

exports.addWishlistItem = async (req, res) => {
  const productId = parseProductId(req.params.productId);
  if (!productId) return res.status(400).json({ message: 'Invalid product ID' });

  try {
    const product = await Product.findByPk(productId, { attributes: ['id'] });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let item;
    let created = false;
    try {
      [item, created] = await WishlistItem.findOrCreate({
        where: { userId: req.user.id, productId },
        defaults: { userId: req.user.id, productId }
      });
    } catch (error) {
      if (!(error instanceof UniqueConstraintError)) throw error;
      item = await WishlistItem.findOne({ where: { userId: req.user.id, productId } });
    }

    const savedItem = await findItem(item.id, req.user.id);
    return res.status(created ? 201 : 200).json({
      message: created ? 'Product saved' : 'Product already saved',
      item: serializeItem(req, savedItem)
    });
  } catch {
    return res.status(500).json({ message: 'Unable to save product' });
  }
};

exports.removeWishlistItem = async (req, res) => {
  const productId = parseProductId(req.params.productId);
  if (!productId) return res.status(400).json({ message: 'Invalid product ID' });

  try {
    const removed = await WishlistItem.destroy({ where: { userId: req.user.id, productId } });
    return res.json({ message: removed ? 'Product removed from wishlist' : 'Product was not saved' });
  } catch {
    return res.status(500).json({ message: 'Unable to remove product' });
  }
};
