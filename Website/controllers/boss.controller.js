const authService = require('../services/auth.service');

const getBossPage = async (req, res, next) => {
    try {
        res.render('boss/boss', {
            title: 'Boss',
            pageClass: 'boss-page',
        });
    } catch (err) {
        next(err);
    }
};

const getRegisterEmployeePage = async (req, res, next) => {
    try {
        res.render('boss/register-employee', {
            title: 'Register Employee',
            pageClass: 'register-employee-page',
        });
    } catch (err) {
        next(err);
    }
}

const registerEmployee = async (req, res, next) => {
    try {
        await authService.registerUser({
            ...req.body,
            role: 'employee'
        });

        res.redirect('/boss');
    } catch (err) {
        if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
            return res.status(err.statusCode).render('boss/register-employee', {
                title: 'Register Employee',
                pageClass: 'register-employee-page',
                errorMessage: err.message,
            });
        }
        next(err);
    }
}

module.exports = {
    getBossPage,
    getRegisterEmployeePage,
    registerEmployee
};