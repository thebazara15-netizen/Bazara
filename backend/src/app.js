const express = require('express');
const cors = require('cors');

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

// 🔍 DEBUG ROUTES ONE BY ONE

try {
  const authRoutes = require('./services/auth/routes/auth.routes');
  app.use('/api/auth', authRoutes);
} catch (e) {
  console.log("❌ authRoutes error:", e.message);
}

try {
  const productRoutes = require('./services/product/routes/product.routes');
  app.use('/api/products', productRoutes);
} catch (e) {
  console.log("❌ productRoutes error:", e.message);
}

try {
  const cartRoutes = require('./services/cart/routes/cart.routes');
  app.use('/api/cart', cartRoutes);
} catch (e) {
  console.log("❌ cartRoutes error:", e.message);
}

try {
  const orderRoutes = require('./services/order/routes/order.routes');
  app.use('/api/orders', orderRoutes);
} catch (e) {
  console.log("❌ orderRoutes error:", e.message);
}

try {
  const adminRoutes = require('./services/admin/routes/admin.routes');
  app.use('/api/admin', adminRoutes);
} catch (e) {
  console.log("❌ adminRoutes error:", e.message);
}

app.get('/', (req, res) => {
  res.send('API is running...');
});

module.exports = app;
