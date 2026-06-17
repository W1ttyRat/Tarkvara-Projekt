const pool = require("../config/db");

const getAllShiftsForBossCalendar = async (filters = {}) => {
    const values = [];
    const where = [];

    if (filters.location_id) {
        values.push(filters.location_id);
        where.push(`ws.location_id = $${values.length}`);
    }

    if (filters.worker) {
        values.push(`%${filters.worker}%`);
        where.push(`LOWER(w.name) LIKE LOWER($${values.length})`);
    }

    if (filters.status) {
        values.push(filters.status);
        where.push(`ws.status = $${values.length}`);
    }

    const query = `
        SELECT
            ws.id,
            TO_CHAR(ws.start_time, 'YYYY-MM-DD HH24:MI:SS') AS start_time,
            TO_CHAR(ws.end_time, 'YYYY-MM-DD HH24:MI:SS') AS end_time,
            ws.status,
            w.name AS worker_name,
            l.city AS location_city,
            l.address AS location_address
        FROM worker_shift ws
        JOIN worker w ON ws.worker_id = w.id
        JOIN location l ON ws.location_id = l.id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY ws.start_time
    `;

    const result = await pool.query(query, values);
    return result.rows;
};

const updateShiftStatus = async (shiftId, status) => {
    const result = await pool.query(
        `
        UPDATE worker_shift
        SET status = $1
        WHERE id = $2
        RETURNING *
        `,
        [status, shiftId]
    );

    return result.rows[0];
};

const updateShift = async (
    shiftId,
    locationId,
    startTime,
    endTime
) => {

    const result = await pool.query(
        `
        UPDATE worker_shift
        SET
            location_id = $1,
            start_time = $2,
            end_time = $3,
            status = 'approved'
        WHERE id = $4
        RETURNING *
        `,
        [
            locationId,
            startTime,
            endTime,
            shiftId
        ]
    );

    return result.rows[0];
};

const getBossDashboardStats = async () => {
    const pendingResult = await pool.query(`
        SELECT COUNT(*) AS count
        FROM worker_shift
        WHERE status = 'pending'
    `);

    const emptyDaysResult = await pool.query(`
        WITH days AS (
            SELECT generate_series(
                date_trunc('month', CURRENT_DATE),
                date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day',
                INTERVAL '1 day'
            )::date AS day
        )
        SELECT COUNT(*) AS count
        FROM days d
        WHERE NOT EXISTS (
            SELECT 1
            FROM worker_shift ws
            WHERE ws.start_time::date = d.day
        )
    `);

    return {
        pendingRequests: Number(pendingResult.rows[0].count),
        emptyDaysThisMonth: Number(emptyDaysResult.rows[0].count)
    };
};

module.exports = {
    getAllShiftsForBossCalendar,
    updateShiftStatus,
    updateShift,
    getBossDashboardStats
};