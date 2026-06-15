const pool = require("../config/db");

const getAllServices = async () => {
    const result = await pool.query(`
        SELECT id, name
        FROM service
        ORDER BY id
    `);

    return result.rows;
};

module.exports = {
    getAllServices
};