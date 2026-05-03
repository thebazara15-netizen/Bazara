const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://bazara-pi.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
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
  const adminRoutes = require('./services/admin/routes/admin.routes');
  app.use('/api/admin', adminRoutes);
} catch (e) {
  logger.error('adminRoutes error', e);
}

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(logger.errorMiddleware);

module.exports = app;
