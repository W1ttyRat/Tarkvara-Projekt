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
        const test = await authService.loginUser(req.body);
        console.log(test);

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

module.exports = {
    getLoginPage,
    login
};