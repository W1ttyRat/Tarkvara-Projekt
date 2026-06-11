const bcrypt = require('bcrypt');
const User = require('../models/User');

class AuthService {
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

        return user;
    }
}

module.exports = new AuthService();