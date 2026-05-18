const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const { verifyToken } = require('../middlewares/jwtMiddleware');

// --- Public Endpoints ---

// GET /api/v1/products: Returns a list of all products (with pagination/filtering)
router.get('/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
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

        res.json({
            success: true,
            data: products,
            pagination: {
                total: totalProducts,
                page,
                pages: Math.ceil(totalProducts / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// GET /api/v1/products/:id: Returns details for a single product
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// --- Auth Endpoints ---

// POST /api/v1/auth/login
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Generate JWT
        const payload = {
            user_id: user._id,
            role: user.role
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_for_dev', { expiresIn: '1h' });

        res.json({
            success: true,
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// --- Protected Endpoints ---

// POST /api/v1/orders
router.post('/orders', verifyToken, async (req, res) => {
    try {
        // Assume req.body contains products array and totalPrice
        const { products, totalPrice } = req.body;
        
        const newOrder = new Order({
            user: req.user.user_id,
            products: products || [],
            totalPrice: totalPrice || 0
        });

        await newOrder.save();
        res.status(201).json({ success: true, data: newOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// GET /api/v1/user/profile
router.get('/user/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.user_id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
