require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
const session = require('express-session');
const MongoStore = require('connect-mongo').MongoStore;
const flash = require('connect-flash');
const { isLoggedIn, isAdmin } = require('./middlewares/authMiddleware');
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session and Flash Setup
app.use(session({
    secret: 'secret_key_123',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/ebayClone' }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

app.use(flash());

// Global Variables Middleware
app.use(async (req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.currentUser = null;
    if (req.session && req.session.userId) {
        try {
            res.locals.currentUser = await User.findById(req.session.userId);
        } catch (err) {
            console.error(err);
        }
    }
    next();
});

// --- Auth Routes ---
app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (password.length < 6) {
            req.flash('error_msg', 'Password must be at least 6 characters long');
            return res.redirect('/register');
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error_msg', 'Email is already registered');
            return res.redirect('/register');
        }
        const newUser = new User({ name, email, password });
        await newUser.save();
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error during registration');
        res.redirect('/register');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'Invalid email or password');
            return res.redirect('/login');
        }
        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            req.flash('error_msg', 'Invalid email or password');
            return res.redirect('/login');
        }
        req.session.userId = user._id;
        req.flash('success_msg', `Welcome back, ${user.name}!`);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error during login');
        res.redirect('/login');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// --- Checkout Route ---
app.get('/checkout', isLoggedIn, (req, res) => {
    res.send('<div style="padding: 20px;"><h2>Secure Checkout</h2><p>You have successfully reached the secure checkout page.</p><a href="/">Back to Home</a></div>');
});

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
app.use('/admin', isAdmin);

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

// --- Sales Dashboard Routes ---
app.get('/sales', isAdmin, async (req, res) => {
    try {
        const totalRevenueResult = await Order.aggregate([
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;
        const totalOrders = await Order.countDocuments();
        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('user');

        res.render('admin/sales', { 
            layout: 'admin-layout', 
            totalRevenue, 
            totalOrders, 
            recentOrders 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/api/sales-data', isAdmin, async (req, res) => {
    try {
        const totalRevenueResult = await Order.aggregate([
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;
        const totalOrders = await Order.countDocuments();
        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('user');

        res.json({
            totalRevenue,
            totalOrders,
            recentOrders
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// --- API Routes ---
const apiRoutes = require('./routes/apiRoutes');
app.use('/api/v1', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});