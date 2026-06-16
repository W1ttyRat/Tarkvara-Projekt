const pool = require("../config/db");

const getWorkerShifts = async (workerId) => {
    const result = await pool.query(
        `
        SELECT
            ws.id,
            TO_CHAR(ws.start_time, 'YYYY-MM-DD HH24:MI') AS start_time,
            TO_CHAR(ws.end_time, 'YYYY-MM-DD HH24:MI') AS end_time,
            ws.status,
            l.city,
            l.address
        FROM worker_shift ws
        JOIN location l
            ON ws.location_id = l.id
        WHERE ws.worker_id = $1
        `,
        [workerId]
    );

    return result.rows;
};

const createWorkerShift = async (workerId, locationId, startTime, endTime) => {
    await pool.query(
        `
        INSERT INTO worker_shift
        (worker_id, location_id, start_time, end_time)
        VALUES ($1, $2, $3, $4)
        `,
        [workerId, locationId, startTime, endTime]
    );
};

const getWorkerScheduleForDay = async (workerId, date) => {
    const result = await pool.query(
        `
        SELECT
            ws.id,
            TO_CHAR(ws.start_time, 'HH24:MI') AS start_time,
            TO_CHAR(ws.end_time, 'HH24:MI') AS end_time,
            ws.status,
            w.name AS worker_name,
            l.city AS location_city,
            l.address AS location_address
        FROM worker_shift ws
        JOIN worker w ON ws.worker_id = w.id
        JOIN location l ON ws.location_id = l.id
        WHERE ws.worker_id = $1
          AND ws.start_time >= $2::date
          AND ws.start_time < ($2::date + INTERVAL '1 day')
        ORDER BY ws.start_time
        `,
        [workerId, date]
    );

    return result.rows;
};

const getWorkerShiftById = async (shiftId) => {
    const result = await pool.query(
        `
        SELECT id, worker_id, location_id, start_time, end_time, status
        FROM worker_shift
        WHERE id = $1
        `,
        [shiftId]
    );

    return result.rows[0];
};

const deleteWorkerShift = async (shiftId) => {
    await pool.query(
        `
        DELETE FROM worker_shift
        WHERE id = $1
        `,
        [shiftId]
    );
};

const hasWorkerShiftOnDate = async (workerId, date) => {
    const result = await pool.query(
        `
        SELECT id
        FROM worker_shift
        WHERE worker_id = $1
          AND start_time >= $2::date
          AND start_time < ($2::date + INTERVAL '1 day')
        LIMIT 1
        `,
        [workerId, date]
    );

    return result.rows.length > 0;
};

const updateWorkerShift = async (shiftId, locationId, startTime, endTime) => {
    await pool.query(
        `
        UPDATE worker_shift
        SET location_id = $1, start_time = $2, end_time = $3
        WHERE id = $4
        `,
        [locationId, startTime, endTime, shiftId]
    );
};

module.exports = {
    getWorkerShifts,
    createWorkerShift,
    getWorkerScheduleForDay,
    getWorkerShiftById,
    deleteWorkerShift,
    hasWorkerShiftOnDate,
    updateWorkerShift
};