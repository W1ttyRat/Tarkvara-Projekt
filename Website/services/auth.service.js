const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const { token } = require('morgan');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_goes_to_env';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

class AuthService {
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    generateAccessToken(user) {
        return jwt.sign(
            {
                sub: user.id,
                role: user.role,
                sv: user.session_version
            },
            JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
        );
    }

    generateRefreshToken(user) {
        return jwt.sign(
            {
                sub: user.id,
                sv: user.session_version,
                jti: crypto.randomUUID(), // unique identifier for the token
                typ: 'refresh'
            },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );
    }

    async registerUser({ first_name, last_name, username, password, confirm_password, role }) {
        if (!first_name || !last_name || !username || !password || !confirm_password || !role) {
            const err = new Error('All fields are required');
            err.statusCode = 400;
            throw err;
        }

        if (password !== confirm_password) {
            const err = new Error('Passwords do not match');
            err.statusCode = 400;
            throw err;
        }

        if (password.length < 8) {
            const err = new Error('Password must be at least 8 characters long');
            err.statusCode = 400;
            throw err;
        }

        if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
            const err = new Error('Password must contain at least one digit and one letter');
            err.statusCode = 400;
            throw err;
        }

        const existingUser = await User.getUserByUsername(username);
        if (existingUser) {
            const err = new Error('Username already exists');
            err.statusCode = 400;
            throw err;
        }

        if (['boss', 'employee'].indexOf(role) === -1) {
            const err = new Error('Invalid role');
            err.statusCode = 400;
            throw err;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        return User.createUser(first_name, last_name, username, passwordHash, role);
    }

    async loginUser({ username, password }) {
        if (!username || !password) {
            const err = new Error('Username and password are required');
            err.statusCode = 400;
            throw err;
        }

        const user = await User.getUserByUsername(username);
        if (!user) {
            const err = new Error('Invalid username or password');
            err.statusCode = 401;
            throw err;
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            const err = new Error('Invalid username or password');
            err.statusCode = 401;
            throw err;
        }

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        const refreshPayload = jwt.verify(refreshToken, JWT_SECRET);

        await RefreshToken.createToken({
            userId: user.id,
            jti: refreshPayload.jti,
            tokenHash: this.hashToken(refreshToken),
            expiresAt: new Date(refreshPayload.exp * 1000) // convert to milliseconds
        });

        return {
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username,
                role: user.role
            },
            accessToken,
            refreshToken
        };
    }

    async refreshSession(incomingRefreshToken) {
        if (!incomingRefreshToken) {
            const err = new Error('Missing refresh token');
            err.statusCode = 401;
            throw err;
        }

        const payload = jwt.verify(incomingRefreshToken, JWT_SECRET);

        if (payload.typ !== 'refresh') {
            const err = new Error('Invalid token type');
            err.statusCode = 400;
            throw err;
        }

        const user = await User.getUserById(payload.sub);
        if (!user || user.session_version !== payload.sv) {
            const err = new Error('Session invalidated');
            err.statusCode = 401;
            throw err;
        }

        const existing = await RefreshToken.findValidByHash(this.hashToken(incomingRefreshToken));
        if (!existing || existing.jti !== payload.jti || existing.user_id !== user.id) {
            const err = new Error('Refresh token revoked or expired');
            err.statusCode = 401;
            throw err;
        }

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        const newPayload = jwt.verify(refreshToken, JWT_SECRET);

        await RefreshToken.revokeByJti(existing.jti, newPayload.jti);
        await RefreshToken.create({
            userId: user.id,
            jti: newPayload.jti,
            tokenHash: this.hashToken(refreshToken),
            expiresAt: new Date(newPayload.exp * 1000)
        });

        return { accessToken, refreshToken };
    }

    async logoutSession({ userId, incomingRefreshToken }) {
        if (!userId) {
            const err = new Error('Missing user id');
            err.statusCode = 400;
            throw err;
        }

        if (incomingRefreshToken) {
            try {
                const payload = jwt.verify(incomingRefreshToken, JWT_SECRET);
                if (payload.typ === 'refresh' && payload.sub === userId) {
                    await RefreshToken.revokeByJti(payload.jti);
                }
            } catch (_) {
                // Ignore token errors during logout, continue global invalidation
            }
        }

        await User.incrementSessionVersion(userId);
        await RefreshToken.revokeAllByUserId(userId);
    }
}

module.exports = new AuthService();