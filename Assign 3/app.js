const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/ebayClone')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        let query = {};

        if (req.query.search) {
            query.name = { $regex: req.query.search, $options: 'i' };
        }

        if (req.query.category && req.query.category !== 'All Categories') {
            query.category = req.query.category;
        }

        if (req.query.minPrice || req.query.maxPrice) {
            query.price = {};
            if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
        }

        const products = await Product.find(query).skip(skip).limit(limit);
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('products', {
            products,
            currentPage: page,
            totalPages,
            searchQuery: req.query.search || '',
            selectedCategory: req.query.category || 'All Categories',
            minPrice: req.query.minPrice || '',
            maxPrice: req.query.maxPrice || ''
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server Error');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});