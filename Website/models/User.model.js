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
        const query = `SELECT id, first_name, last_name, username, password_hash, role, session_version, failed_attempts, locked_until, must_change_password FROM users WHERE username = $1 LIMIT 1`;
        const { rows } = await pool.query(query, [username]);
        return rows[0] || null;
    }

    async getUserById(id) {
        const query = 'SELECT id, first_name, last_name, username, password_hash, role, session_version, failed_attempts, locked_until, must_change_password FROM users WHERE id = $1 LIMIT 1';
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

    async incrementSessionVersion(userId) {
        const query = 'UPDATE users SET session_version = session_version + 1 WHERE id = $1 RETURNING session_version';
        const { rows } = await pool.query(query, [userId]);
        return rows[0]?.session_version;
    }

    async getAllEmployees() {
        const query = `
            SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.username,
                u.role,
                COALESCE(
                    STRING_AGG(lc.code, ', ' ORDER BY lc.code),
                    ''
                ) AS licence_categories
            FROM users u
            LEFT JOIN worker w
                ON w.user_id = u.id
            LEFT JOIN worker_licence_category wlc
                ON wlc.worker_id = w.id
            LEFT JOIN licence_category lc
                ON lc.id = wlc.licence_category_id
            WHERE u.role = 'employee'
            GROUP BY
                u.id,
                u.first_name,
                u.last_name,
                u.username,
                u.role
            ORDER BY
                u.first_name,
                u.last_name
        `;

        const { rows } = await pool.query(query);

        return rows;
    }

    async getEmployeeForEdit(userId) {
        const query = `
            SELECT
                u.id AS user_id,
                u.first_name,
                u.last_name,
                u.username,
                u.role,
                w.id AS worker_id,
                w.name,
                w.email,
                w.phone
            FROM users u
            LEFT JOIN worker w ON w.user_id = u.id
            WHERE u.id = $1
              AND u.role = 'employee'
            LIMIT 1
        `;

        const { rows } = await pool.query(query, [userId]);
        return rows[0] || null;
    }

    async updateEmployee(userId, firstName, lastName, username, name, email, phone) {
        await pool.query(
            `
            UPDATE users
            SET first_name = $1,
                last_name = $2,
                username = $3
            WHERE id = $4
            `,
            [firstName, lastName, username, userId]
        );

        await pool.query(
            `
            UPDATE worker
            SET name = $1,
                email = $2,
                phone = $3
            WHERE user_id = $4
            `,
            [name, email, phone, userId]
        );
    }

    async getAllLicenceCategories() {
        const query = `
            SELECT id, code, name
            FROM licence_category
            ORDER BY code
        `;

        const { rows } = await pool.query(query);
        return rows;
    }

    async getWorkerLicenceCategoryIds(workerId) {
        const query = `
            SELECT licence_category_id
            FROM worker_licence_category
            WHERE worker_id = $1
        `;

        const { rows } = await pool.query(query, [workerId]);
        return rows.map(row => row.licence_category_id);
    }

    async updateWorkerLicenceCategories(workerId, categoryIds) {
        await pool.query(
            `
            DELETE FROM worker_licence_category
            WHERE worker_id = $1
            `,
            [workerId]
        );

        for (const categoryId of categoryIds) {
            await pool.query(
                `
                INSERT INTO worker_licence_category
                (worker_id, licence_category_id)
                VALUES ($1, $2)
                `,
                [workerId, categoryId]
            );
        }
    }

    async getBossNameById(userId) {
        const query = `
            SELECT CONCAT(u.first_name, ' ', u.last_name) AS boss_name
            FROM users u
            WHERE u.id = $1 AND u.role = 'boss'
            LIMIT 1
        `;

        const { rows } = await pool.query(query, [userId]);
        return rows[0]?.boss_name || null;
    }

    async updatePassword(userId, passwordHash) {
        await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId]);
    }

    async setMustChangePassword(userId, flag = true) {
        await pool.query(`UPDATE users SET must_change_password = $1 WHERE id = $2`, [flag, userId]);
    }
}




module.exports = new UserModel();