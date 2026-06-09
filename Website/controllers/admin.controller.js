/* const adminService = require('../services/admin.service');

const getDashboard = async (req, res, next) => {
    try {
        const dashboardData = await adminService.getDashboardData();
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            pageClass: 'admin-dashboard-page',
            data: dashboardData
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getDashboard
}; */