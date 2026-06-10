// add employee service

const getEmployeePage = async (req, res, next) => {
    try {
        res.render('employee/employee', {
            title: 'Employee',
            pageClass: 'employee-page',
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getEmployeePage
};