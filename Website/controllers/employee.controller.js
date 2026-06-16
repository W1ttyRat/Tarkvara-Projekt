const Booking = require("../models/booking.model");
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
        const workerId = await getWorkerIdForCurrentUser(req.user.id);
        const today = new Date().toISOString().slice(0, 10);
        const { city, address, category_id } = req.query;

        const bookings = await Booking.getBookingsForDashboard({
            date: today,
            city: city || null,
            address: address || null,
            categoryId: category_id || null
        });

        const locations = await locationModel.getAllLocations();

        // Build city -> addresses mapping from DB rows
        const cityToAddresses = locations.reduce((acc, loc) => {
            if (!loc.city || !loc.address) return acc;
            if (!acc[loc.city]) acc[loc.city] = [];
            if (!acc[loc.city].includes(loc.address)) acc[loc.city].push(loc.address);
            return acc;
        }, {});

        const cities = Object.keys(cityToAddresses);

        // Keep only valid city/address pair
        let safeCity = city || "";
        let safeAddress = address || "";

        if (safeCity && safeAddress) {
            const allowedAddresses = cityToAddresses[safeCity] || [];
            if (!allowedAddresses.includes(safeAddress)) {
                safeAddress = "";
            }
        }

        // Addresses shown on initial render depend on selected city
        const addresses = safeCity ? (cityToAddresses[safeCity] || []) : [];

        const categories = await workerModel.getAllLicenceCategories();
        const workerCategories = await workerModel.getWorkerCategories(workerId);

        res.render("employee/dashboard", {
            title: "Töötaja töölaud",
            pageClass: "employee-page",
            bookings: bookings || [],
            categories: categories || [],
            workerCategories: workerCategories || [],
            cities,
            addresses,
            locations,
            selectedFilters: {
                city: safeCity,
                address: safeAddress,
                category_id: category_id || ""
            }
        });
    } catch (err) {
        return next(err);
    }
};

const getSchedulePage = async (req, res, next) => {
    try {
        const workerId = await getWorkerIdForCurrentUser(req.user.id);

        const locations = await locationModel.getAllLocations();
        const shifts = await workerShiftModel.getWorkerShifts(workerId);

        const formattedShifts = shifts.map(shift => ({
            ...shift,
            start_time: typeof shift.start_time === "string"
                ? shift.start_time
                : shift.start_time.toLocaleString("sv-SE").replace(" ", "T").slice(0, 16),
            end_time: typeof shift.end_time === "string"
                ? shift.end_time
                : shift.end_time.toLocaleString("sv-SE").replace(" ", "T").slice(0, 16)
        }));

        res.render("employee/schedule", {
            title: "Töötaja kalendrivaade",
            pageClass: "employee-schedule-page",
            locations,
            shifts: formattedShifts
        });
    } catch (err) {
        return next(err);
    }
};

const createSchedule = async (req, res, next) => {
    try {
        const { location_id, dates, start_time, end_time } = req.body;

        if (!Array.isArray(dates) || dates.length === 0) {
            return res.status(400).json({ message: "Vali vähemalt üks kuupäev" });
        }

        if (!location_id || !start_time || !end_time) {
            return res.status(400).json({ message: "Puuduvad kohustuslikud väljad" });
        }

        const workerId = await getWorkerIdForCurrentUser(req.user.id);

        for (const date of dates) {
            const alreadyHasShift = await workerShiftModel.hasWorkerShiftOnDate(workerId, date);

            if (alreadyHasShift) {
                return res.status(400).json({
                    message: `Sul on kuupäeval ${date} juba tööaeg olemas`
                });
            }

            const startTimestamp = `${date} ${start_time}:00`;
            const endTimestamp = `${date} ${end_time}:00`;

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
        return next(err);
    }
};

const getScheduleForDay = async (req, res, next) => {
    try {
        const workerId = await getWorkerIdForCurrentUser(req.user.id);

        if (!workerId) {
            return res.status(404).json({ message: "Töötajat ei leitud" });
        }

        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: "Puudub kuupäev" });
        }

        if (isNaN(Date.parse(date))) {
            return res.status(400).json({ message: "Vigane kuupäev" });
        }

        const schedule = await workerShiftModel.getWorkerScheduleForDay(workerId, date);
        res.json(schedule);
    } catch (err) {
        return next(err);
    }
};

const deleteSchedule = async (req, res, next) => {
    try {
        const workerId = await getWorkerIdForCurrentUser(req.user.id);
        const shiftId = req.params.id;

        if (isNaN(Number(shiftId))) {
            return res.status(400).json({ message: "Vigane tööaja ID" });
        }

        const shift = await workerShiftModel.getWorkerShiftById(shiftId);

        if (!shift) {
            return res.status(404).json({ message: "Tööaega ei leitud" });
        }

        if (shift.worker_id !== workerId) {
            return res.status(403).json({ message: "Saad kustutada ainult enda tööaegu" });
        }

        if (!["pending", "rejected"].includes(shift.status)) {
            return res.status(403).json({
                message: "Kinnitatud tööaega ei saa kustutada"
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

        res.json({ message: "Tööaeg kustutatud" });
    } catch (err) {
        return next(err);
    }
};

const updateSchedule = async (req, res, next) => {
    try {
        const workerId = await getWorkerIdForCurrentUser(req.user.id);

        if (!workerId) {
            return res.status(404).json({ message: "Töötajat ei leitud" });
        }

        const shiftId = req.params.id;

        if (!Number.isInteger(shiftId)) {
            return res.status(400).json({ message: "Vigane tööaja ID" });
        }

        const { location_id, start_time, end_time } = req.body;

        if (!location_id || !start_time || !end_time) {
            return res.status(400).json({ message: "Puuduvad kohustuslikud väljad" });
        }

        const shift = await workerShiftModel.getWorkerShiftById(shiftId);

        if (!shift) {
            return res.status(404).json({ message: "Tööaega ei leitud" });
        }

        if (shift.worker_id !== workerId) {
            return res.status(403).json({ message: "Saad muuta ainult enda tööaegu" });
        }

        if (shift.status === "approved") {
            return res.status(403).json({
                message: "Kinnitatud tööaega ei saa muuta"
            });
        }

        const shiftDateStr = new Date(shift.start_time)
            .toLocaleDateString("sv-SE");

        const startTimestamp = `${shiftDateStr} ${start_time}:00`;
        const endTimestamp = `${shiftDateStr} ${end_time}:00`;

        await workerShiftModel.updateWorkerShift(
            shiftId,
            location_id,
            startTimestamp,
            endTimestamp
        );

        res.json({ message: "Tööaeg uuendatud" });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getEmployeePage,
    getSchedulePage,
    createSchedule,
    getScheduleForDay,
    deleteSchedule,
    updateSchedule
};