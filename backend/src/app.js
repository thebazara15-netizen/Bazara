const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./utils/logger');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://bazara-pi.vercel.app"
].filter(Boolean);

app.use(helmet({
  // The separate Next.js frontend requires a tested CSP rollout later.
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  ...(isProduction ? {} : { strictTransportSecurity: false })
}));
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
// Razorpay signs the exact bytes; isolate raw parsing to this endpoint.
app.post('/api/payments/webhook/razorpay', express.raw({ type: 'application/json', limit: '256kb' }), require('./services/payment/controllers/payment.controller').razorpayWebhook);
app.use(express.json());
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use(logger.requestMiddleware);

// 🔍 DEBUG ROUTES ONE BY ONE

try {
  const authRoutes = require('./services/auth/routes/auth.routes');
  app.use('/api/auth', authRoutes);
} catch (e) {
  logger.error('authRoutes error', e);
}

try {
  const productRoutes = require('./services/product/routes/product.routes');
  app.use('/api/products', productRoutes);
} catch (e) {
  logger.error('productRoutes error', e);
}

try {
  const cartRoutes = require('./services/cart/routes/cart.routes');
  app.use('/api/cart', cartRoutes);
} catch (e) {
  logger.error('cartRoutes error', e);
}

try {
  const orderRoutes = require('./services/order/routes/order.routes');
  app.use('/api/orders', orderRoutes);
} catch (e) {
  logger.error('orderRoutes error', e);
}

try {
  const paymentRoutes = require('./services/payment/routes/payment.routes');
  app.use('/api/payments', paymentRoutes);
} catch (e) {
  logger.error('paymentRoutes error', e);
}

try {
  const checkoutRoutes = require('./services/checkout/routes/checkout.routes');
  app.use('/api/checkout', checkoutRoutes);
} catch (e) {
  logger.error('checkoutRoutes error', e);
}

try {
  const adminRoutes = require('./services/admin/routes/admin.routes');
  app.use('/api/admin', adminRoutes);
} catch (e) {
  logger.error('adminRoutes error', e);
}

try {
  const rfqRoutes = require('./services/rfq/routes/rfq.routes');
  app.use('/api/rfqs', rfqRoutes);
} catch (e) {
  logger.error('rfqRoutes error', e);
}

try {
  const inquiryRoutes = require('./services/inquiry/routes/inquiry.routes');
  app.use('/api/inquiries', inquiryRoutes);
} catch (e) {
  logger.error('inquiryRoutes error', e);
}

try {
  const wishlistRoutes = require('./services/wishlist/routes/wishlist.routes');
  app.use('/api/wishlist', wishlistRoutes);
} catch (e) {
  logger.error('wishlistRoutes error', e);
}

try {
  const accountRoutes = require('./services/account/routes/account.routes');
  app.use('/api/account', accountRoutes);
} catch (e) {
  logger.error('accountRoutes error', e);
}

try {
  const supplierRoutes = require('./services/supplier/routes/supplier.routes');
  app.use('/api/suppliers', supplierRoutes);
} catch (e) {
  logger.error('supplierRoutes error', e);
}

try {
  const vendorPricingRoutes = require('./services/vendor-pricing/routes/vendor-pricing.routes');
  app.use('/api/vendor/pricing-config', vendorPricingRoutes);
} catch (e) {
  logger.error('vendorPricingRoutes error', e);
}

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(logger.errorMiddleware);

module.exports = app;
