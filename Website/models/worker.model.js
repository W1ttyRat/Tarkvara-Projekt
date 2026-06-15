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

const getWorkerCategories = async (workerId) => {
    const query = `
    SELECT lc.id, lc.name, lc.code
    FROM worker_licence_category wlc
    JOIN licence_category lc ON wlc.licence_category_id = lc.id
    WHERE wlc.worker_id = $1
    ORDER BY lc.name
    `;
    const { rows } = await pool.query(query, [workerId]);
    return rows;
}

const getAllLicenceCategories = async () => {
    const query = `
        SELECT id, code, name
        FROM licence_category
        ORDER BY name
    `;
    const { rows } = await pool.query(query);
    return rows;
};

module.exports = {
    getWorkerByUserId,
    createWorker,
    getWorkerCategories,
    getAllLicenceCategories
};