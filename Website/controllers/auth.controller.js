const authService = require('../services/auth.service');
const { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } = require('../utils/constants');

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
        const { accessToken, refreshToken } = await authService.loginUser(req.body);

        res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
        res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

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

const refreshToken = async (req, res, next) => {
    try {
        const { accessToken, refreshToken: newFreshToken } =
            await authService.refreshSession(req.cookies?.refresh_token);

        res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
        res.cookie('refresh_token', newFreshToken, REFRESH_COOKIE_OPTIONS);

        return res.status(200).json({ message: 'Token refreshed' });
    } catch (err) {
        res.clearCookie('access_token', ACCESS_COOKIE_OPTIONS);
        res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS);
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
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