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
        const workerId = 1;

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

        const workerId = 1; // hiljem tuleb sisseloginud kasutajast

        for (const date of dates) {
            const alreadyHasShift =
                await workerShiftModel.hasWorkerShiftOnDate(workerId, date);

            if (alreadyHasShift) {
                return res.status(400).json({
                    message: `Sul on kuupäeval ${date} juba tööaeg olemas`
                });
            }

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

const deleteSchedule = async (req, res, next) => {
    try {
        const workerId = 1; // hiljem tuleb sisseloginud kasutajast
        const shiftId = req.params.id;

        const shift = await workerShiftModel.getWorkerShiftById(shiftId);

        if (!shift) {
            return res.status(404).json({
                message: "Tööaega ei leitud"
            });
        }

        if (shift.worker_id !== workerId) {
            return res.status(403).json({
                message: "Saad kustutada ainult enda tööaegu"
            });
        }

        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        const shiftStart = new Date(shift.start_time);

        if (shiftStart <= sevenDaysFromNow) {
            return res.status(403).json({
                message: "Alla 7 päeva enne tööpäeva ei saa tööaega kustutada"
            });
        }

        await workerShiftModel.deleteWorkerShift(shiftId);

        res.json({
            message: "Tööaeg kustutatud"
        });

    } catch (err) {
        next(err);
    }
};

module.exports = {
    getEmployeePage,
    getSchedulePage,
    createSchedule,
    getScheduleForDay,
    deleteSchedule
};