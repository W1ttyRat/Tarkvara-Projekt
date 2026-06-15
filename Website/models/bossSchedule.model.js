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
            ws.start_time,
            ws.end_time,
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

module.exports = {
    getAllShiftsForBossCalendar,
    updateShiftStatus,
    updateShift
};