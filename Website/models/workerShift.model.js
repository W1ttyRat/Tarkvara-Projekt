const pool = require("../config/db");

const getWorkerShifts = async (workerId) => {
    const result = await pool.query(
        `
        SELECT
            ws.id,
            ws.start_time,
            ws.end_time,
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

const getScheduleForDay = async (date) => {
    const result = await pool.query(
        `
        SELECT 
            ws.id,
            TO_CHAR(ws.start_time, 'HH24:MI') AS start_time,
            TO_CHAR(ws.end_time, 'HH24:MI') AS end_time,
            w.name AS worker_name,
            l.city AS location_city,
            l.address AS location_address
        FROM worker_shift ws
        JOIN worker w ON ws.worker_id = w.id
        JOIN location l ON ws.location_id = l.id
        WHERE ws.start_time >= $1::date
          AND ws.start_time < ($1::date + INTERVAL '1 day')
        ORDER BY ws.start_time
        `,
        [date]
    );

    return result.rows;
};

module.exports = {
    getWorkerShifts,
    createWorkerShift,
    getScheduleForDay
};