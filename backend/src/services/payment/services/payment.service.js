const crypto = require('crypto');
const https = require('https');

const Cart = require('../../../models/Cart');
const CartItem = require('../../../models/CartItem');
const Product = require('../../../models/Product');
const orderService = require('../../order/services/order.service');
const { calculatePrice } = require('../../../utils/pricingEngine');

const getRazorpayCredentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured');
  }

  return { keyId, keySecret };
};

const requestRazorpay = ({ method, path, body }) => {
  const { keyId, keySecret } = getRazorpayCredentials();
  const payload = body ? JSON.stringify(body) : '';

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.razorpay.com',
        path,
        method,
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const parsed = data ? JSON.parse(data) : {};

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
            return;
          }

          reject(new Error(parsed.error?.description || parsed.message || 'Razorpay request failed'));
        });
      }
    );

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
};

const calculateCheckoutTotal = async (userId) => {
  const cart = await Cart.findOne({ where: { userId } });
  if (!cart) throw new Error('Cart is empty');

  const items = await CartItem.findAll({ where: { cartId: cart.id } });
  if (!items.length) throw new Error('No items in cart');

  let itemSubtotal = 0;
  let totalQuantity = 0;

  for (const item of items) {
    const product = await Product.findByPk(item.productId);
    if (!product) throw new Error('Product not found');

    item.price = calculatePrice(product, item.quantity);
    await item.save();

    itemSubtotal += Number(item.price || 0);
    totalQuantity += Number(item.quantity || 0);
  }

  const shippingFee = Math.max(250, itemSubtotal * 0.03);
  const processingFee = (itemSubtotal + shippingFee) * 0.018;
  const payTotal = itemSubtotal + shippingFee + processingFee;

  return {
    itemSubtotal,
    shippingFee,
    processingFee,
    payTotal,
    totalQuantity
  };
};

exports.createCheckoutOrder = async (userId, address) => {
  const { keyId } = getRazorpayCredentials();
  const totals = await calculateCheckoutTotal(userId);
  const amount = Math.round(totals.payTotal * 100);

  const razorpayOrder = await requestRazorpay({
    method: 'POST',
    path: '/v1/orders',
    body: {
      amount,
      currency: 'INR',
      receipt: `cart_${userId}_${Date.now()}`.slice(0, 40),
      notes: {
        userId: String(userId),
        totalQuantity: String(totals.totalQuantity),
        city: String(address?.city || ''),
        postalCode: String(address?.postalCode || '')
      }
    }
  });

  return {
    keyId,
    order: razorpayOrder,
    totals
  };
};

exports.verifyAndPlaceOrder = async (userId, payment) => {
  const { keySecret } = getRazorpayCredentials();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payment || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new Error('Payment verification details are missing');
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new Error('Payment verification failed');
  }

  const order = await orderService.placeOrder(userId);

  return {
    order,
    paymentId: razorpay_payment_id,
    razorpayOrderId: razorpay_order_id
  };
};
