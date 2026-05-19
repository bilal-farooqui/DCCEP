import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

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

  // 70% success rate and 30% failure rate
  const success = Math.random() < 0.7;
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
      transactionId: savedLog._id,
      paymentLog: savedLog
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Database transaction error during payment simulation' });
  }
});

app.listen(PORT, () => {
  console.log(`Payment Service listening on port ${PORT}`);
});
