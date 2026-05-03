const Cart = require('../../../models/Cart');
const CartItem = require('../../../models/CartItem');
const Product = require('../../../models/Product');
const { calculatePrice } = require('../../../utils/pricingEngine');

exports.addToCart = async (userId, productId, quantity) => {
  const parsedQuantity = Number(quantity);

  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    throw new Error('Valid quantity is required');
  }

  let cart = await Cart.findOne({ where: { userId } });

  if (!cart) {
    cart = await Cart.create({ userId });
  }

  const product = await Product.findByPk(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const existingItem = await CartItem.findOne({
    where: {
      cartId: cart.id,
      productId
    }
  });

  const nextQuantity = existingItem
    ? existingItem.quantity + parsedQuantity
    : parsedQuantity;

  const totalPrice = calculatePrice(product, nextQuantity);

  if (existingItem) {
    existingItem.quantity = nextQuantity;
    existingItem.price = totalPrice;
    await existingItem.save();
    return existingItem;
  }

  const item = await CartItem.create({
    cartId: cart.id,
    productId,
    quantity: parsedQuantity,
    price: totalPrice
  });

  return item;
};
