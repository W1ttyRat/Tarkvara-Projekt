const pool = require("../config/db");

const getAllLocations = async () => {
    const result = await pool.query(`
        SELECT id, city, address
        FROM location
        ORDER BY city, address
    `);

    return result.rows;
};

module.exports = {
    getAllLocations
};