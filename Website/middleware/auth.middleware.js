const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.access_token;
        if (!token) return res.redirect('/auth/login');

        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const dbUser = await User.findById(payload.sub);
        if (!dbUser || dbUser.session_version !== payload.sv) {
            res.clearCookie('access_token', cookieOptions);
            return res.redirect('/auth/login');
        }

        req.user = payload; // attach user info to request object
        next();

    } catch (err) {
        res.clearCookie('access_token', cookieOptions);
        return res.redirect('/auth/login');
    }
};

const setCurrentUser = async (req, res, next) => {
    try {
        const token = req.cookies?.access_token;
        if (token) {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            const dbUser = await User.findById(payload.sub);
            if (dbUser && dbUser.session_version === payload.sv) {
                res.locals.user = payload;
                req.user = payload;
            } else {
                res.clearCookie('access_token', cookieOptions);
                res.locals.user = null;
                req.user = null;
            }
        } else {
            res.locals.user = null;
            req.user = null;
        }
    } catch (err) {
        res.locals.user = null;
        req.user = null;
    }
    next();
};

module.exports = {
    requireAuth,
    setCurrentUser
};