const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// Dynamic routing URLs for microservice cross-calls in serverless
app.use((req, res, next) => {
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const baseURL = `${protocol}://${host}/api`;
  
  process.env.USER_SERVICE_URL = `${baseURL}/users`;
  process.env.PRODUCT_SERVICE_URL = `${baseURL}/products`;
  process.env.ORDER_SERVICE_URL = `${baseURL}/orders`;
  process.env.PAYMENT_SERVICE_URL = `${baseURL}/payments`;
  
  next();
});

// Mount microservices as sub-apps
app.use('/api/users', require('../user-service/src/index.js'));
app.use('/api/products', require('../product-service/src/index.js'));
app.use('/api/orders', require('../order-service/src/index.js'));
app.use('/api/payments', require('../payment-service/server.js'));

// API Gateway Root / Health check
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    message: 'CEP Monolithic API Gateway is running.',
    services: {
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      payments: '/api/payments'
    }
  });
});

// Fallback for non-API routes
app.get('/', (req, res) => {
  res.send('CEP Monolithic Gateway Server is active.');
});

// Connect to database once at Gateway level if not already connected
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGODB_URI)
    .then((conn) => console.log(`🌱 MongoDB Connected (Gateway Monolith)! Database: ${conn.connection.name}`))
    .catch((err) => console.error('MongoDB connection error:', err));
}

// Listen locally if run directly
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Monolith Gateway running on port ${PORT}`);
  });
}

module.exports = app;
