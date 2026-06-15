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

        const cities = [...new Set(locations.map(location => location.city))];

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
        next(err);
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
        next(err);
    }
};

const createSchedule = async (req, res, next) => {
    try {
        const { location_id, dates, start_time, end_time } = req.body;
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
        next(err);
    }
};

const getScheduleForDay = async (req, res, next) => {
    try {
        const workerId = await getWorkerIdForCurrentUser(req.user.id);
        const { date } = req.query;

        const schedule = await workerShiftModel.getWorkerScheduleForDay(workerId, date);
        res.json(schedule);
    } catch (err) {
        next(err);
    }
};

const deleteSchedule = async (req, res, next) => {
    try {
        const workerId = await getWorkerIdForCurrentUser(req.user.id);
        const shiftId = req.params.id;

        const shift = await workerShiftModel.getWorkerShiftById(shiftId);

        if (!shift) {
            return res.status(404).json({ message: "Tööaega ei leitud" });
        }

        if (shift.worker_id !== workerId) {
            return res.status(403).json({ message: "Saad kustutada ainult enda tööaegu" });
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
        next(err);
    }
};

const updateSchedule = async (req, res, next) => {
    try {
        const workerId = await getWorkerIdForCurrentUser(req.user.id);
        const shiftId = req.params.id;
        const { location_id, start_time, end_time } = req.body;

        const shift = await workerShiftModel.getWorkerShiftById(shiftId);

        if (!shift) {
            return res.status(404).json({ message: "Tööaega ei leitud" });
        }

        if (shift.worker_id !== workerId) {
            return res.status(403).json({ message: "Saad muuta ainult enda tööaegu" });
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
        next(err);
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