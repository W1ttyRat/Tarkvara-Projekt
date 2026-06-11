const authService = require('../services/auth.service');

const getLoginPage = async (req, res, next) => {
    try {
        res.render('auth/login', {
            title: 'Login',
            pageClass: 'login-page',
        });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const user = await authService.loginUser(req.body);
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role,
        }; // store user info in session
        res.redirect('/boss');
    } catch (err) {
        if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
            return res.status(err.statusCode).render('auth/login', {
                title: 'Login',
                pageClass: 'login-page',
                errorMessage: err.message,
            });
        }
        next(err);
    }
};

const register = async (req, res, next) => {
    try {
        await authService.registerUser(req.body);
        res.redirect('/auth/login');
    } catch (err) {
        if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
            return res.status(err.statusCode).render('auth/register', {
                title: 'Register',
                pageClass: 'register-page',
                errorMessage: err.message,
            });
        }
        next(err);
    }
}

module.exports = {
    getLoginPage,
    login,
    register
};