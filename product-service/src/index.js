const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Mock Product Data
const products = [
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

// Basic Route
app.get('/', (req, res) => {
  res.send('Product Service is running...');
});

// Get All Products
app.get('/products', (req, res) => {
  res.json(products);
});

// Get Product by ID
app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB (Product Service)'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Product Service listening on port ${PORT}`);
});
