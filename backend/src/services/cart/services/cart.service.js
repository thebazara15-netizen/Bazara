const Cart = require('../../../models/Cart');
const CartItem = require('../../../models/CartItem');
const Product = require('../../../models/Product');
const { calculatePrice } = require('../../../utils/pricingEngine');

exports.addToCart = async (userId, productId, quantity) => {

  let cart = await Cart.findOne({ where: { userId } });

  if (!cart) {
    cart = await Cart.create({ userId });
  }

  const product = await Product.findByPk(productId);

  const totalPrice = calculatePrice(product, quantity);

  const item = await CartItem.create({
    cartId: cart.id,
    productId,
    quantity,
    price: totalPrice
  });

  return item;
};