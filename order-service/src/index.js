const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5003;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004';

// MongoDB Order Schema & Model
const orderSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'payment_unknown'], 
    default: 'pending' 
  },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Order Service is running...');
});

// Get All Orders (Order History Ledger)
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error.message || error.code);
    res.status(500).json({ message: 'Failed to retrieve orders from database.' });
  }
});

// Create Order (Resilient Inter-service call)
app.post('/orders', async (req, res) => {
  const { productId, quantity, userId } = req.body;

  if (!productId || !quantity || !userId) {
    return res.status(400).json({ message: 'Missing required fields: productId, quantity, userId (Authentication required)' });
  }

  let product;
  // Step 1: Product Validation (Catalog check)
  try {
    const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${productId}`, { timeout: 3000 });
    product = productResponse.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: `Product not found in Product Service: ${productId}` });
    } else {
      console.error('Error calling Product Service:', error.message || error.code);
      return res.status(503).json({ 
        message: 'Catalog service is offline. Please try again later.' 
      });
    }
  }

  // Stock check
  if (product.stock < quantity) {
    return res.status(400).json({ message: `Insufficient product stock. Only ${product.stock} left in inventory.` });
  }

  const totalPrice = product.price * quantity;

  // Step 2: Order Creation (default to 'pending')
  let savedOrder;
  try {
    const order = new Order({
      productId,
      productName: product.name,
      quantity,
      totalPrice,
      status: 'pending',
      userId: userId
    });
    savedOrder = await order.save();
  } catch (error) {
    console.error('Error saving order to MongoDB:', error.message);
    return res.status(500).json({ message: 'Failed to save order to database.' });
  }

  // Step 3: Payment Call (to Payment Simulation Service)
  try {
    const paymentResponse = await axios.post(`${PAYMENT_SERVICE_URL}/payment/process`, {
      orderId: savedOrder._id,
      userId: savedOrder.userId,
      amount: savedOrder.totalPrice
    }, { timeout: 4000 }); // 4-second timeout to handle simulated 1.5s delay safely

    const paymentData = paymentResponse.data;

    // Step 4: Status Update (completed or failed)
    if (paymentData.success) {
      savedOrder.status = 'completed';
      // Deduct stock in Product Service
      try {
        await axios.post(`${PRODUCT_SERVICE_URL}/products/${productId}/reduce-stock`, { quantity }, { timeout: 3000 });
      } catch (err) {
        console.error(`Failed to deduct stock in product-service for product ${productId}:`, err.message);
      }
    } else {
      savedOrder.status = 'failed';
    }
    await savedOrder.save();

    return res.status(201).json({
      message: paymentData.success 
        ? 'Order placed and paid successfully.' 
        : (paymentData.message || 'Order placed, but payment was declined.'),
      order: savedOrder,
      payment: {
        success: paymentData.success,
        status: paymentData.status,
        transactionId: paymentData.transactionId
      }
    });

  } catch (paymentError) {
    // Handle payment network call failure or timeout
    console.error('Payment Service call failed/timed out:', paymentError.message || paymentError.code);
    
    savedOrder.status = 'payment_unknown';
    await savedOrder.save();

    return res.status(200).json({
      message: 'Order created, but payment service connection failed. Payment status is unknown.',
      order: savedOrder,
      error: paymentError.message || paymentError.code
    });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then((conn) => {
    console.log(`=========================================`);
    console.log(`🌱 MongoDB Connected (Order Service)!`);
    console.log(`🗄️  Active Database: ${conn.connection.name}`);
    console.log(`=========================================`);
  })
  .catch((err) => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Order Service listening on port ${PORT}`);
});
