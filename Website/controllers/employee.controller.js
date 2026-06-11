// add employee service
const pool = require("../config/db");

const getEmployeePage = async (req, res, next) => {
    try {
        res.render('employee/dashboard', {
            title: 'Töötaja töölaud',
            pageClass: 'employee-page',

            bookings: [
                {
                    time: '10:00',
                    client: 'Mari Maasikas',
                    vehicle: '123ABC',
                    service: 'B-kategooria ülevaatus',
                    status: 'confirmed'
                }
            ],

            shifts: [
                {
                    date: '2026-06-10',
                    location: 'Tallinn',
                    start: '09:00',
                    end: '17:00'
                }
            ],

            categories: ['B', 'BE', 'CE']
        });
    } catch (err) {
        next(err);
    }
};

const getSchedulePage = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT id, city, address
            FROM location
            ORDER BY city, address
        `);

    res.render("employee/schedule", {
        title: "Töötaja kalendrivaade",
        pageClass: "employee-schedule-page",
        locations: result.rows
    });

    } catch (err) {
        next(err);
    }
};

const createSchedule = async (req, res, next) => {
    try {

        const {
            location_id,
            dates,
            start_time,
            end_time
        } = req.body;

        for (const date of dates) {

            const startTimestamp =
                `${date} ${start_time}:00`;

            const endTimestamp =
                `${date} ${end_time}:00`;

            console.log({
                worker_id: 1,
                location_id,
                startTimestamp,
                endTimestamp
            });

            await pool.query(
                `
                INSERT INTO worker_shift
                (
                    worker_id,
                    location_id,
                    start_time,
                    end_time
                )
                VALUES ($1, $2, $3, $4)
                `,
                [
                    1, // ajutiselt worker id
                    location_id,
                    startTimestamp,
                    endTimestamp
                ]
            );
        }

        res.status(201).json({
            message: "Salvestatud"
        });

    } catch (err) {
        next(err);
    }
};

const getScheduleForDay = async (req, res, next) => {
    try {
        const { date } = req.query;

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

        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};
//test
const testDb = async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT NOW()"
        );

        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};


module.exports = {
    getEmployeePage,
    getSchedulePage,
    createSchedule,
    getScheduleForDay,
    testDb
};