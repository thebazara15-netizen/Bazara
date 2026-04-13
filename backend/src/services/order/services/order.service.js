const Cart = require('../../../models/Cart');
const CartItem = require('../../../models/CartItem');
const Order = require('../../../models/Order');
const OrderItem = require('../../../models/OrderItem');
const Product = require('../../../models/Product');
const { calculatePrice } = require('../../../utils/pricingEngine');

exports.placeOrder = async (userId) => {

  const cart = await Cart.findOne({ where: { userId } });
  if (!cart) throw new Error('Cart is empty');

  const items = await CartItem.findAll({ where: { cartId: cart.id } });

  if (!items.length) throw new Error('No items in cart');

  let totalAmount = 0;

  for (const item of items) {
    const product = await Product.findByPk(item.productId);

    if (!product) {
      throw new Error('Product not found');
    }

    item.price = calculatePrice(product, item.quantity);
    await item.save();
    totalAmount += item.price;
  }

  const order = await Order.create({
    userId,
    totalAmount
  });

  for (const item of items) {
    await OrderItem.create({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price
    });
  }

  // Clear cart
  await CartItem.destroy({ where: { cartId: cart.id } });

  return order;
};
