const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
};

const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.access_token;
        if (!token) return res.redirect('/auth/login');

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.getUserById(payload.sub);

        if (!user || user.session_version !== payload.sv) {
            res.clearCookie('access_token', cookieOptions);
            return res.redirect('/auth/login');
        }

        req.user = user;
        if (user.must_change_password && !req.originalUrl.startsWith('/auth/change-password')) {
            return res.redirect('/auth/change-password');
        }
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
            const dbUser = await User.getUserById(payload.sub);
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

const requireBoss = (req, res, next) => {
    if (req.user?.role !== 'boss') {
        return res.status(403).send('Forbidden');
    }
    next();
};

const requireEmployee = (req, res, next) => {
    if (!['employee', 'boss'].includes(req.user?.role)) {
        return res.status(403).send('Forbidden');
    }
    next();
};

module.exports = {
    requireAuth,
    setCurrentUser,
    requireBoss,
    requireEmployee
};
