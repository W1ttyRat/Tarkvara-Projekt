const locationModel = require("../models/location.model");
const workerShiftModel = require("../models/workerShift.model");

const getEmployeePage = async (req, res, next) => {
    try {
        res.render("employee/dashboard", {
            title: "Töötaja töölaud",
            pageClass: "employee-page"
        });
    } catch (err) {
        next(err);
    }
};

const getSchedulePage = async (req, res, next) => {
    try {
        const locations = await locationModel.getAllLocations();

        res.render("employee/schedule", {
            title: "Töötaja kalendrivaade",
            pageClass: "employee-schedule-page",
            locations
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

        const workerId = 1; // hiljem tuleb sisseloginud kasutajast

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