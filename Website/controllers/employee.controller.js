const locationModel = require("../models/location.model");
const workerShiftModel = require("../models/workerShift.model");
const workerModel = require("../models/worker.model");

const getWorkerIdForCurrentUser = async (userId) => {
    const worker = await workerModel.getWorkerByUserId(userId);

    if (!worker) {
        const err = new Error("Worker not found for current user");
        err.statusCode = 404;
        throw err;
    }

    return worker.id;
}

const getEmployeePage = async (req, res, next) => {
    try {
        res.render("employee/dashboard", {
            title: "Töötaja töölaud",
            pageClass: "employee-page",
            bookings: [],
            shifts: [],
            categories: []
        });
    } catch (err) {
        next(err);
    }
};

const getSchedulePage = async (req, res, next) => {
    try {
        const workerId = await getWorkerIdForCurrentUser(req.user.id);

        const locations = await locationModel.getAllLocations();
        const shifts = await workerShiftModel.getWorkerShifts(workerId);

        res.render("employee/schedule", {
            title: "Töötaja kalendrivaade",
            pageClass: "employee-schedule-page",
            locations,
            shifts
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

        const workerId = await getWorkerIdForCurrentUser(req.user.id);

        for (const date of dates) {
            const startTimestamp =
                `${date} ${start_time}:00`;

            const endTimestamp =
                `${date} ${end_time}:00`;

            await workerShiftModel.createWorkerShift(
                workerId,
                location_id,
                startTimestamp,
                endTimestamp
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

        const schedule =
            await workerShiftModel.getScheduleForDay(date);

        res.json(schedule);

    } catch (err) {
        next(err);
    }
};

module.exports = {
    getEmployeePage,
    getSchedulePage,
    createSchedule,
    getScheduleForDay
};