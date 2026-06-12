const pool = require("../config/db");

class UserModel {
    async createUser(first_name, last_name, username, passwordHash, role) {
        const query = `INSERT INTO users (first_name, last_name, username, password_hash, role)
                       VALUES ($1, $2, $3, $4, $5) RETURNING id`;
        const values = [first_name, last_name, username, passwordHash, role];

        const { rows } = await pool.query(query, values);
        return rows[0] || null;
    }

    async getUserByUsername(username) {
        const query = `SELECT id, first_name, last_name, username, password_hash, role, session_version, failed_attempts, locked_until FROM users WHERE username = $1 LIMIT 1`;
        const { rows } = await pool.query(query, [username]);
        return rows[0] || null;
    }

    async getUserById(id) {
        const query = 'SELECT id, first_name, last_name, username, password_hash, role, session_version, failed_attempts, locked_until FROM users WHERE id = $1 LIMIT 1';
        const { rows } = await pool.query(query, [id]);
        return rows[0] || null;
    }

    async incrementFailedAttempts(userId) {
        const query = `UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = $1 RETURNING failed_attempts`;
        const { rows } = await pool.query(query, [userId]);
        return rows[0]?.failed_attempts || 0;
    }

    async lockAccount(userId, lockDurationMinutes = 15) {
        const query = `UPDATE users SET locked_until = NOW() + INTERVAL '${lockDurationMinutes} minutes' WHERE id = $1`;
        await pool.query(query, [userId]);
    }

    async resetFailedAttempts(userId) {
        const query = `UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1`;
        await pool.query(query, [userId]);
    }
}

module.exports = new UserModel();