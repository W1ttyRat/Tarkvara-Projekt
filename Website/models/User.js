const pool = require("../config/db");

class UserModel {
    async createUser(firstName, lastName, username, passwordHash, role) {
        const query = `INSERT INTO users (first_name, last_name, username, password_hash, role)
                       VALUES ($1, $2, $3, $4, $5) RETURNING id`;
        const values = [firstName, lastName, username, passwordHash, role];

        const { rows } = await pool.query(query, values);
        return rows[0] || null;
    }

    async getUserByUsername(username) {
        const query = `SELECT id, first_name, last_name, username, password_hash, role, session_version FROM users WHERE username = $1 LIMIT 1`;
        const { rows } = await pool.query(query, [username]);
        return rows[0] || null;
    }

    async getUserById(id) {
        const query = 'SELECT id, first_name, last_name,username, role, session_version FROM users WHERE id = $1 LIMIT 1';
        const { rows } = await pool.query(query, [id]);
        return rows[0] || null;
    }
}

module.exports = new UserModel();