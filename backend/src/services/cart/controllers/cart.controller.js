const cartService = require('../services/cart.service');
const { calculatePrice, getDisplayPrice } = require('../../../utils/pricingEngine');

exports.addToCart = async (req, res) => {
  try {
    const item = await cartService.addToCart(
      req.user.id,
      req.body.productId,
      req.body.quantity
    );

    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const Cart = require('../../../models/Cart');
const CartItem = require('../../../models/CartItem');
const Product = require('../../../models/Product');

const buildImageUrl = (req, image) => {
  if (!image) {
    return null;
  }

  return `${req.protocol}://${req.get('host')}/uploads/${image}`;
};

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.id }
    });

    if (!cart) {
      return res.json([]);
    }

    const items = await CartItem.findAll({
      where: { cartId: cart.id },
      include: {
        model: Product,
        as: 'product'
      }
    });

    const formattedItems = await Promise.all(items.map(async (item) => {
      const cartItem = item.toJSON();

      if (cartItem.product) {
        const updatedPrice = calculatePrice(cartItem.product, cartItem.quantity);

        if (cartItem.price !== updatedPrice) {
          item.price = updatedPrice;
          await item.save();
          cartItem.price = updatedPrice;
        }

        cartItem.product.finalPrice = getDisplayPrice(cartItem.product);
        cartItem.product.image = buildImageUrl(req, cartItem.product.image);
      }

      return cartItem;
    }));

    res.json(formattedItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCart = async (req, res) => {
  const { id } = req.params;
  const quantity = Number(req.body.quantity);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'Valid quantity is required' });
  }

  const cart = await Cart.findOne({ where: { userId: req.user.id } });

  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const item = await CartItem.findOne({
    where: {
      id,
      cartId: cart.id
    }
  });

  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }

  const product = await Product.findByPk(item.productId);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  item.quantity = quantity;
  item.price = calculatePrice(product, quantity);
  await item.save();

  res.json({ message: 'Updated' });
};

exports.removeFromCart = async (req, res) => {
  const { id } = req.params;
  const cart = await Cart.findOne({ where: { userId: req.user.id } });

  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const removed = await CartItem.destroy({
    where: {
      id,
      cartId: cart.id
    }
  });

  if (!removed) {
    return res.status(404).json({ message: 'Item not found' });
  }

  res.json({ message: 'Removed' });
};
