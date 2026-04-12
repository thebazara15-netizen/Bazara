const cartService = require('../services/cart.service');

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
const Product = require('../../../models/Product');

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findAll({
      where: { userId: req.user.id },
      include: {
        model: Product,
        as: "product"
      }
    });

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCart = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const item = await Cart.findByPk(id);

  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }

  item.quantity = quantity;
  await item.save();

  res.json({ message: "Updated" });
};

exports.removeFromCart = async (req, res) => {
  const { id } = req.params;

  await Cart.destroy({ where: { id } });

  res.json({ message: "Removed" });
};