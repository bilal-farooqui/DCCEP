const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Mock/Default Product Data for Seeding
const defaultProducts = [
  { 
    id: '1', 
    name: 'CEP Book Pro 16', 
    price: 1499, 
    category: 'Laptops', 
    description: 'Enterprise grade 16-inch workhorse. Intel i9, 32GB RAM, 1TB SSD, Liquid Retina display.',
    rating: 4.9,
    stock: 12
  },
  { 
    id: '2', 
    name: 'CEP Phone Ultra 5G', 
    price: 999, 
    category: 'Phones', 
    description: 'Flagship smartphone with 200MP zoom camera, Snapdragon Gen 3, and all-day adaptive battery.',
    rating: 4.8,
    stock: 25
  },
  { 
    id: '3', 
    name: 'CEP SoundCancel H1', 
    price: 299, 
    category: 'Accessories', 
    description: 'Over-ear hybrid active noise cancelling headphones with high-fidelity spatial audio.',
    rating: 4.7,
    stock: 45
  },
  { 
    id: '4', 
    name: 'CEP Watch Active 4', 
    price: 199, 
    category: 'Accessories', 
    description: 'Track health, fitness metrics, and notification widgets in a rugged and stylish aluminum casing.',
    rating: 4.5,
    stock: 18
  },
  { 
    id: '5', 
    name: 'CEP Pad Air 11', 
    price: 699, 
    category: 'Tablets', 
    description: 'Ultra-thin 11-inch tablet optimized for sketching, media consumption, and keyboard integrations.',
    rating: 4.6,
    stock: 9
  }
];

// Product Schema
const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  rating: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 0 }
});

const Product = mongoose.model('Product', productSchema);

// Basic Route
app.get('/', (req, res) => {
  res.send('Product Service is running...');
});

// Get All Products
app.get('/products', async (req, res) => {
  try {
    const dbProducts = await Product.find({});
    res.json(dbProducts);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ message: 'Error retrieving products' });
  }
});

// Get Product by ID
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('Error fetching product by ID:', error.message);
    res.status(500).json({ message: 'Error retrieving product details' });
  }
});

// POST /products/:id/reduce-stock - Reduce stock of a product
app.post('/products/:id/reduce-stock', async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid quantity' });
  }

  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient product stock' });
    }

    product.stock -= quantity;
    await product.save();

    res.status(200).json({
      message: 'Stock updated successfully',
      product
    });
  } catch (error) {
    console.error('Reduce stock error:', error.message);
    res.status(500).json({ message: 'Failed to update product stock' });
  }
});

// Seeding function
const seedProducts = async () => {
  try {
    const count = await Product.countDocuments({});
    if (count === 0) {
      console.log('Seeding default products to MongoDB...');
      await Product.insertMany(defaultProducts);
      console.log('Default products seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding default products:', err.message);
  }
};

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async (conn) => {
    console.log(`=========================================`);
    console.log(`🌱 MongoDB Connected (Product Service)!`);
    console.log(`🗄️  Active Database: ${conn.connection.name}`);
    console.log(`=========================================`);
    await seedProducts();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Product Service listening on port ${PORT}`);
});
