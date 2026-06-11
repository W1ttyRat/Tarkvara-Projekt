// add boss service

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

module.exports = {
    getBossPage,
    getRegisterEmployeePage,
};