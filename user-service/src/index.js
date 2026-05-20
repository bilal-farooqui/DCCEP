const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// User Schema & Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // plain text for simplicity in this project
  name: { type: String, required: true },
  email: { type: String, required: true },
  balance: { type: Number, default: 1000.00 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Basic Route
app.get('/', (req, res) => {
  res.send('User Service is running...');
});

// Register Endpoint
app.post('/register', async (req, res) => {
  const { username, password, name, email } = req.body;

  if (!username || !password || !name || !email) {
    return res.status(400).json({ message: 'Missing required fields: username, password, name, email' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const newUser = new User({ username, password, name, email });
    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: { username: newUser.username, name: newUser.name, email: newUser.email, balance: newUser.balance }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Registration failed due to server error' });
  }
});

// Login Endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Missing username or password' });
  }

  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.status(200).json({
      message: 'Login successful',
      token: `mock_jwt_token_for_${user.username}`,
      user: { username: user.username, name: user.name, email: user.email, balance: user.balance }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Login failed due to server error' });
  }
});

// GET /:username - Get user profile details (including balance)
app.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      username: user.username,
      name: user.name,
      email: user.email,
      balance: user.balance
    });
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    res.status(500).json({ message: 'Error retrieving user details' });
  }
});

// POST /deduct-balance - Deduct from user's wallet
app.post('/deduct-balance', async (req, res) => {
  const { username, amount } = req.body;
  if (!username || amount === undefined) {
    return res.status(400).json({ message: 'Missing username or amount' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance.' });
    }

    user.balance -= amount;
    await user.save();

    res.status(200).json({
      message: 'Balance deducted successfully',
      balance: user.balance
    });
  } catch (error) {
    console.error('Deduct balance error:', error.message);
    res.status(500).json({ message: 'Failed to process wallet deduction.' });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then((conn) => {
    console.log(`=========================================`);
    console.log(`🌱 MongoDB Connected (User Service)!`);
    console.log(`🗄️  Active Database: ${conn.connection.name}`);
    console.log(`=========================================`);
  })
  .catch((err) => console.error('MongoDB connection error:', err));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`User Service listening on port ${PORT}`);
  });
}

module.exports = app;
