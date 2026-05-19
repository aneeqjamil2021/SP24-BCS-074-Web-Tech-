const User = require('../models/User');

const isLoggedIn = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/login');
};

const isAdmin = async (req, res, next) => {
    try {
        if (!req.session || !req.session.userId) {
            req.flash('error_msg', 'Please log in to view that resource');
            return res.redirect('/login');
        }
        
        const user = await User.findById(req.session.userId);
        if (user && user.role === 'admin') {
            return next();
        }
        
        req.flash('error_msg', 'Access Denied: You do not have permission to view this page');
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    isLoggedIn,
    isAdmin
};
