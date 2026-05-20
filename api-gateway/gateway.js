import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable global CORS handling at the gateway level
app.use(cors());

// Environment variables
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:5003';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004';

// Simple request logging middleware
app.use((req, res, next) => {
  console.log(`[Gateway] Received ${req.method} ${req.originalUrl}`);
  next();
});

// Proxy routes matching the required path prefixes
app.use('/api/users', proxy(USER_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    // e.g. POST /api/users/login -> /login
    // e.g. POST /api/users/register -> /register
    console.log(`[Gateway] Routing to User Service: ${USER_SERVICE_URL}${req.url}`);
    return req.url;
  }
}));

app.use('/api/products', proxy(PRODUCT_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    // e.g. GET /api/products -> /products
    // e.g. GET /api/products/1 -> /products/1
    let targetPath = req.url;
    if (req.url === '/' || req.url === '') {
      targetPath = '/products';
    } else if (req.url.startsWith('/')) {
      targetPath = `/products${req.url}`;
    } else {
      targetPath = `/products/${req.url}`;
    }
    console.log(`[Gateway] Routing to Product Service: ${PRODUCT_SERVICE_URL}${targetPath}`);
    return targetPath;
  }
}));

app.use('/api/orders', proxy(ORDER_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    // e.g. POST /api/orders -> /orders
    // e.g. GET /api/orders -> /orders
    let targetPath = req.url;
    if (req.url === '/' || req.url === '') {
      targetPath = '/orders';
    } else if (req.url.startsWith('/')) {
      targetPath = `/orders${req.url}`;
    } else {
      targetPath = `/orders/${req.url}`;
    }
    console.log(`[Gateway] Routing to Order Service: ${ORDER_SERVICE_URL}${targetPath}`);
    return targetPath;
  }
}));

app.use('/api/payments', proxy(PAYMENT_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    // e.g. POST /api/payments/payment/process -> /payment/process
    console.log(`[Gateway] Routing to Payment Service: ${PAYMENT_SERVICE_URL}${req.url}`);
    return req.url;
  }
}));

// Fallback Route
app.use('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'API Gateway is running. Ready to route requests.',
    diagnostics: {
      has_mongodb_uri: !!process.env.MONGODB_URI,
      mongodb_uri_preview: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'undefined',
      USER_SERVICE_URL,
      PRODUCT_SERVICE_URL,
      ORDER_SERVICE_URL,
      PAYMENT_SERVICE_URL
    }
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway is listening on port ${PORT}`);
  console.log(`- User Service Proxy: /api/users/* -> ${USER_SERVICE_URL}`);
  console.log(`- Product Service Proxy: /api/products/* -> ${PRODUCT_SERVICE_URL}`);
  console.log(`- Order Service Proxy: /api/orders/* -> ${ORDER_SERVICE_URL}`);
  console.log(`- Payment Service Proxy: /api/payments/* -> ${PAYMENT_SERVICE_URL}`);
});
