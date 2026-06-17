const bcrypt = require('bcrypt');
const authService = require('../services/auth.service');
const User = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');
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
        const { accessToken, refreshToken, user } = await authService.loginUser(req.body);
        res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
        res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

        if (user.must_change_password) {
            return res.redirect('/auth/change-password');
        }

        if (user.role === 'boss') {
            return res.redirect('/boss');
        }
        res.redirect('/employee');
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



const getChangePasswordPage = async (req, res, next) => {
    try {
        res.render('auth/change-password', {
            title: 'Muuda parool',
            pageClass: 'change-password-page',
            csrfToken: req.csrfToken(),
            errorMessage: null
        });
    } catch (err) {
        next(err);
    }
};

const postChangePassword = async (req, res, next) => {
    try {
        const { password, confirm_password } = req.body;

        if (!password || !confirm_password) {
            return res.status(400).render('auth/change-password', {
                title: 'Muuda parool',
                pageClass: 'change-password-page',
                csrfToken: req.csrfToken(),
                errorMessage: 'Mõlemad parooliväljad on kohustuslikud.'
            });
        }

        if (password !== confirm_password) {
            return res.status(400).render('auth/change-password', {
                title: 'Muuda parool',
                pageClass: 'change-password-page',
                csrfToken: req.csrfToken(),
                errorMessage: 'Paroolid ei kattu.'
            });
        }

        if (password.length < 8) {
            return res.status(400).render('auth/change-password', {
                title: 'Muuda parool',
                pageClass: 'change-password-page',
                csrfToken: req.csrfToken(),
                errorMessage: 'Parool peab olema vähemalt 8 tähemärki pikk.'
            });
        }

        if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
            return res.status(400).render('auth/change-password', {
                title: 'Muuda parool',
                pageClass: 'change-password-page',
                csrfToken: req.csrfToken(),
                errorMessage: 'Parool peab sisaldama vähemalt ühte numbrit ja ühte tähte.'
            });
        }

        const userId = req.user.id;
        const passwordHash = await bcrypt.hash(password, 10);

        await User.updatePassword(userId, passwordHash);
        await User.setMustChangePassword(userId, false);
        await User.incrementSessionVersion(userId);
        await RefreshToken.revokeAllByUserId(userId);

        res.redirect(req.user.role === 'boss' ? '/boss' : '/employee');
    } catch (err) {
        next(err);
    }
};

const logout = async (req, res, _next) => {
    try {
        await authService.logoutSession(req.cookies?.refresh_token);
    } catch (err) {
        console.log('Error during logout:', err);
        // ignore token errors during logout, continue with clearing cookies and redirecting
    } finally {
        res.clearCookie('access_token', ACCESS_COOKIE_OPTIONS);
        res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS);
        res.redirect('/auth/login');
    }
};

module.exports = {
    getLoginPage,
    login,
    logout,
    refreshToken,
    getChangePasswordPage,
    postChangePassword
};