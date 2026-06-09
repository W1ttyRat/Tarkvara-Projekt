/* const User = require('../models/User');
const Product = require('../models/Product');

class adminService {
    async getDashboardData() {
        const totalUsers = await User.countAll();
        const productCount = await Product.countAll();
        return { totalUsers, productCount };
    }

    async getSettings() {
        // Placeholder for fetching settings data
        return 0;
    }
}

module.exports = new adminService(); */