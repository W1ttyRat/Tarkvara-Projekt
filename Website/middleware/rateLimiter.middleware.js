const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts, please try again later.'
});

const bookingLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many booking attempts, please try again later.'
});

module.exports = {
    loginLimiter,
    bookingLimiter
};