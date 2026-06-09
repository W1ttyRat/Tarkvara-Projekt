/* const pool = require("../config/db");

class UserModel {
    async create({ first_name, last_name, email, passwordHash }) {
        const query = ``;
        const values = [first_name, last_name, email, passwordHash];

        try {
            const { rows } = await pool.query(query, values);
            return rows[0];
        } catch (err) {
            console.error(err);
            throw new Error("Failed to create user", err);
        }
    }
} */