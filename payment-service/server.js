const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then((conn) => {
    console.log(`=========================================`);
    console.log(`🌱 MongoDB Connected (Payment Service)!`);
    console.log(`🗄️  Active Database: ${conn.connection.name}`);
    console.log(`=========================================`);
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// PaymentLog Schema
const paymentLogSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'failed'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const PaymentLog = mongoose.model('PaymentLog', paymentLogSchema);

// Basic Route
app.get('/', (req, res) => {
  res.send('Payment Simulation Service is running...');
});

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5001';

// POST endpoint /payment/process
app.post('/payment/process', async (req, res) => {
  const { orderId, userId, amount } = req.body;

  // Validation
  if (!orderId || !userId || amount === undefined) {
    return res.status(400).json({ 
      error: 'Missing required fields: orderId, userId, amount' 
    });
  }

  // Simulate a realistic distributed delay using a 1.5-second setTimeout
  await new Promise(resolve => setTimeout(resolve, 1500));

  let success = false;
  let message = '';

  try {
    // Call user-service to check and deduct user's wallet balance
    const deductResponse = await fetch(`${USER_SERVICE_URL}/deduct-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: userId, amount })
    });

    const deductData = await deductResponse.json();

    if (deductResponse.ok) {
      success = true;
      message = 'Payment processed and wallet balance deducted successfully.';
    } else {
      success = false;
      message = deductData.message || 'Payment declined.';
    }
  } catch (error) {
    console.error('Error communicating with user-service:', error.message);
    success = false;
    message = 'Payment failed: User wallet service is offline.';
  }

  const status = success ? 'success' : 'failed';

  try {
    const paymentLog = new PaymentLog({
      orderId,
      userId,
      amount,
      status
    });

    const savedLog = await paymentLog.save();

    res.status(200).json({
      success,
      status,
      transactionId: success ? savedLog._id : undefined,
      paymentLog: savedLog,
      message
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Database transaction error during payment simulation' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Payment Service listening on port ${PORT}`);
  });
}

module.exports = app;
