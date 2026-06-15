const pool = require('../config/db');

const getWorkerByUserId = async (userId) => {
    const query = `SELECT id FROM worker WHERE user_id = $1 LIMIT 1`;
    const values = [userId];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
}

const createWorker = async ({ name, email = null, phone = null, user_id }) => {
    const query = `INSERT INTO worker (name, email, phone, user_id) VALUES ($1, $2, $3, $4) RETURNING id`;
    const values = [name, email, phone, user_id];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
}

module.exports = {
    getWorkerByUserId,
    createWorker
};