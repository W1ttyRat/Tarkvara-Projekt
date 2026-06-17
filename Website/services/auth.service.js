const bcrypt = require('bcrypt');
const User = require('../models/User.model');
const Worker = require('../models/worker.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken.model');
const emailService = require('./email.service');

const JWT_SECRET = process.env.JWT_SECRET;
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

    async registerUser({ first_name, last_name, username, email, phone, password, confirm_password, role, licence_category_ids = [] }) {
        if (!first_name || !last_name || !username || !role) {
            const err = new Error('All required fields must be filled');
            err.statusCode = 400;
            throw err;
        }

        if (role === 'employee' && !email) {
            const err = new Error('Employee email is required');
            err.statusCode = 400;
            throw err;
        }

        let tempPassword = null;
        if (!password && !confirm_password) {
            tempPassword = crypto.randomBytes(8).toString('base64').slice(0, 12);
            password = tempPassword;
            confirm_password = tempPassword;
        }

        if (!password || !confirm_password) {
            const err = new Error('Password and confirm password are required unless a temporary password is generated');
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
        const user = await User.createUser(first_name, last_name, username, passwordHash, role);

        let worker = null;
        if (role === 'employee') {
            worker = await Worker.createWorker({
                name: `${first_name} ${last_name}`,
                email,
                phone,
                user_id: user.id
            });
        }

        if (Array.isArray(licence_category_ids) && licence_category_ids.length && worker) {
            await User.updateWorkerLicenceCategories(worker.id, licence_category_ids);
        }

        if (tempPassword) {
            await User.setMustChangePassword(user.id, true);
            if (email) {
                console.log(`Sending temporary password to ${email}`);
                await emailService.sendTemporaryPassword(email, tempPassword);
                console.log(`Temporary password sent to ${email}`);
            }
        }
        return user;
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

        // check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const err = new Error('Account is temporarily locked. Please try again later.');
            err.statusCode = 429;
            throw err;
        }

        // verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            // increment failed attemps on wrong password
            const attempts = await User.incrementFailedAttempts(user.id);

            if (attempts >= 5) {
                //lock account aftter 5 failed attempts
                await User.lockAccount(user.id, 15); // lock for 15 minutes
            }

            const err = new Error('Invalid username or password');
            err.statusCode = 401;
            throw err;
        }

        // successful login, reset failed attempts and create tokens
        await User.resetFailedAttempts(user.id);

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
                role: user.role,
                must_change_password: user.must_change_password
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
        await RefreshToken.createToken({
            userId: user.id,
            jti: newPayload.jti,
            tokenHash: this.hashToken(refreshToken),
            expiresAt: new Date(newPayload.exp * 1000)
        });

        return { accessToken, refreshToken };
    }

    async logoutSession(incomingRefreshToken) {
        if (!incomingRefreshToken) {
            return; // No token, just return
        }
        try {
            const payload = jwt.verify(incomingRefreshToken, JWT_SECRET);

            if (payload.typ !== 'refresh') {
                return; // Not a refresh token, ignore
            }

            await RefreshToken.revokeByJti(payload.jti);
            await User.incrementSessionVersion(payload.sub); // Invalidate all existing tokens for the user
            await RefreshToken.revokeAllByUserId(payload.sub); // Revoke all refresh tokens for the user

        } catch (_) {
            // Ignore token errors during logout, continue global invalidation
        }
    }

}

module.exports = new AuthService();