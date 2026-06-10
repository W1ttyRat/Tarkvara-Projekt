const pool = require("../config/db");

class RefreshTokenModel {
    async create({ userId, jti, tokenHash, expiresAt }) {
        const query = `
        INSERT INTO refresh_tokens (user_id, jti, token_hash, expires_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, jti, token_hash, expires_at, revoked_at, replaced_by_jti, created_at, last_used_at
        `;

        const values = [userId, jti, tokenHash, expiresAt];
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    async findValidByHash(tokenHash) {
        const query = `
        SELECT id, user_id, jti, token_hash, expires_at, revoked_at, replaced_by_jti, created_at, last_used_at
        FROM refresh_tokens
        WHERE token_hash = $1
            AND revoked_at IS NULL
            AND expires_at > NOW()
        LIMIT 1
        `;

        const { rows } = await pool.query(query, [tokenHash]);
        return rows[0] || null;
    }

    async revokeByJti(jti, replacedByJti = null) {
        const query = `
        UPDATE refresh_tokens
        SET revoked_at = NOW(), replaced_by_jti = COALESCE($2, replaced_by_jti)
        WHERE jti = $1 AND revoked_at IS NULL
        RETURNING id, user_id, jti
        `;

        const { rows } = await pool.query(query, [jti, replacedByJti]);
        return rows[0] || null;
    }

    async revokeAllByUserId(userId) {
        const query = `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE user_id = $1 AND revoked_at IS NULL
        RETURNING id
        `;

        const { rows } = await pool.query(query, [userId]);
        return rows.length; // return number of tokens revoked
    }

    async touchLastUsed(jti) {
        const query = `
        UPDATE refresh_tokens
        SET last_used_at = NOW()
        WHERE jti = $1
        RETURNING id
        `;

        const { rows } = await pool.query(query, [jti]);
        return rows[0] || null;
    }
}

module.exports = new RefreshTokenModel();