// const User = require('../models/User');

class AuthService {
    async loginUser({ username, password }) {
        if (!username || !password) {
            const err = new Error('Username and password are required');
            err.statusCode = 400;
            throw err;
        }

        if (username === 'boss') {
            return { role: 'boss' };
        } else if (username === 'employee') {
            return { role: 'employee' };
        } else {
            const err = new Error('Invalid username or password');
            err.statusCode = 401;
            throw err;
        }
    }
}

module.exports = new AuthService();