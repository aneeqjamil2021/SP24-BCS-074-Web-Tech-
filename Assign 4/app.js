const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const expressLayouts = require('express-ejs-layouts');
const multer = require('multer');

// Multer Setup
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, 'public/uploads'));
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/ebayClone')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); // Set default layout
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

// --- Admin Routes ---

// Dashboard
app.get('/admin', async (req, res) => {
    try {
        const products = await Product.find().sort({ _id: -1 });
        res.render('admin/dashboard', { layout: 'admin-layout', products });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Create form
app.get('/admin/products/new', (req, res) => {
    res.render('admin/create', { layout: 'admin-layout' });
});

// Create submit
app.post('/admin/products', upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, stock } = req.body;
        let image = '/img/promo/gaminglaptop.webp'; // fallback
        if (req.file) {
            image = '/uploads/' + req.file.filename;
        }
        await Product.create({ name, price, category, stock, image });
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Edit form
app.get('/admin/products/:id/edit', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Product not found');
        res.render('admin/edit', { layout: 'admin-layout', product });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Edit submit
app.post('/admin/products/:id/edit', upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, stock } = req.body;
        let updateData = { name, price, category, stock };
        if (req.file) {
            updateData.image = '/uploads/' + req.file.filename;
        }
        await Product.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete submit
app.post('/admin/products/:id/delete', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});