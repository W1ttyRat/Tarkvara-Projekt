const rateLimit = require('express-rate-limit');
const pool = require('../config/db');

class PostgresStore {
    constructor(prefix) {
        this.prefix = prefix;
    }

    // Called by express-rate-limit to initialize the store
    init(options) {
        this.windowMs = options.windowMs;
    }

    async increment(key) {
        // Create a unique key for this specific limiter (e.g., "login:127.0.0.1")
        const fullKey = `${this.prefix}:${key}`;

        const query = `
            INSERT INTO rate_limits (key, hits, reset_at)
            VALUES ($1, 1, NOW() + make_interval(secs => $2 / 1000))
            ON CONFLICT (key) DO UPDATE
            SET hits = CASE 
                WHEN rate_limits.reset_at < NOW() THEN 1 
                ELSE rate_limits.hits + 1 
            END,
            reset_at = CASE 
                WHEN rate_limits.reset_at < NOW() THEN NOW() + make_interval(secs => $2 / 1000)
                ELSE rate_limits.reset_at
            END
            RETURNING hits, reset_at;
        `;

        try {
            const res = await pool.query(query, [fullKey, this.windowMs]);
            const row = res.rows[0];

            return {
                totalHits: row.hits,
                resetTime: new Date(row.reset_at)
            };
        } catch (err) {
            console.error("Rate limit store error:", err);
            return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
        }
    }

    async decrement(key) {
        const fullKey = `${this.prefix}:${key}`;
        await pool.query('UPDATE rate_limits SET hits = GREATEST(0, hits - 1) WHERE key = $1', [fullKey]);
    }

    async resetKey(key) {
        const fullKey = `${this.prefix}:${key}`;
        await pool.query('DELETE FROM rate_limits WHERE key = $1', [fullKey]);
    }
}

// 1. global limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    store: new PostgresStore('global'),
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    store: new PostgresStore('login'),
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts, please try again later.',
});

const loginBruteForceLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 500,
    store: new PostgresStore('login_brute'),
    message: 'Daily login attempt limit reached. Please try again tomorrow.',
});

const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    store: new PostgresStore('booking'),
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many booking attempts, please try again later.',
});

module.exports = {
    loginLimiter,
    bookingLimiter,
    loginBruteForceLimiter,
    globalLimiter
};
