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

const getEmployeeProfile = async (req, res, next) => {
    try {
        const User = require('../models/User.model');
        const worker = await workerModel.getWorkerByUserId(req.user.id);
        const user = await User.getUserById(req.user.id);

        res.render('employee/profile', {
            title: 'Minu profiil',
            pageClass: 'employee-profile-page',
            employee: {
                ...user,
                email: worker?.email,
                phone: worker?.phone,
                worker_id: worker?.id
            }
        });
    } catch (err) {
        return next(err);
    }
};

const getChangePasswordPage = async (req, res, next) => {
    try {
        res.render('employee/change-password', {
            title: 'Muuda parooli',
            pageClass: 'employee-change-password-page',
            csrfToken: req.csrfToken(),
            errorMessage: null
        });
    } catch (err) {
        return next(err);
    }
};

const postChangePassword = async (req, res, next) => {
    try {
        const bcrypt = require('bcrypt');
        const User = require('../models/User.model');
        const RefreshToken = require('../models/RefreshToken.model');

        const { current_password, new_password, confirm_password } = req.body;
        const userId = req.user.id;

        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).render('employee/change-password', {
                title: 'Muuda parooli',
                pageClass: 'employee-change-password-page',
                csrfToken: req.csrfToken(),
                errorMessage: 'Kõik väljad on kohustuslikud.'
            });
        }

        if (new_password !== confirm_password) {
            return res.status(400).render('employee/change-password', {
                title: 'Muuda parooli',
                pageClass: 'employee-change-password-page',
                csrfToken: req.csrfToken(),
                errorMessage: 'Uued paroolid ei kattu.'
            });
        }

        if (new_password.length < 8) {
            return res.status(400).render('employee/change-password', {
                title: 'Muuda parooli',
                pageClass: 'employee-change-password-page',
                csrfToken: req.csrfToken(),
                errorMessage: 'Parool peab olema vähemalt 8 tähemärki pikk.'
            });
        }

        if (!/\d/.test(new_password) || !/[a-zA-Z]/.test(new_password)) {
            return res.status(400).render('employee/change-password', {
                title: 'Muuda parooli',
                pageClass: 'employee-change-password-page',
                csrfToken: req.csrfToken(),
                errorMessage: 'Parool peab sisaldama vähemalt ühte numbrit ja ühte tähte.'
            });
        }

        // Verify current password
        const user = await User.getUserById(userId);
        const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).render('employee/change-password', {
                title: 'Muuda parooli',
                pageClass: 'employee-change-password-page',
                csrfToken: req.csrfToken(),
                errorMessage: 'Praegune parool on vale.'
            });
        }

        // Update password
        const newPasswordHash = await bcrypt.hash(new_password, 10);
        await User.updatePassword(userId, newPasswordHash);
        await User.incrementSessionVersion(userId);
        await RefreshToken.revokeAllByUserId(userId);

        res.redirect('/employee/profile');
    } catch (err) {
        return next(err);
    }
};

const getEditProfilePage = async (req, res, next) => {
    try {
        const User = require('../models/User.model');
        const worker = await workerModel.getWorkerByUserId(req.user.id);
        const user = await User.getUserById(req.user.id);

        res.render('employee/edit-profile', {
            title: 'Muuda profiili',
            pageClass: 'employee-edit-profile-page',
            csrfToken: req.csrfToken(),
            errorMessage: null,
            employee: {
                ...user,
                email: worker?.email,
                phone: worker?.phone
            }
        });
    } catch (err) {
        return next(err);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const User = require('../models/User.model');
        const { first_name, last_name, username, email, phone } = req.body;
        const userId = req.user.id;

        if (!first_name || !last_name || !username || !email) {
            const worker = await workerModel.getWorkerByUserId(userId);
            const user = await User.getUserById(userId);
            return res.status(400).render('employee/edit-profile', {
                title: 'Muuda profiili',
                pageClass: 'employee-edit-profile-page',
                csrfToken: req.csrfToken(),
                errorMessage: 'Kõik kohustuslikud väljad peavad olema täidetud.',
                employee: {
                    ...user,
                    email: worker?.email,
                    phone: worker?.phone
                }
            });
        }

        // Check if username is already taken by another user
        const existingUser = await User.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
            const worker = await workerModel.getWorkerByUserId(userId);
            const user = await User.getUserById(userId);
            return res.status(400).render('employee/edit-profile', {
                title: 'Muuda profiili',
                pageClass: 'employee-edit-profile-page',
                csrfToken: req.csrfToken(),
                errorMessage: 'Kasutajanimi on juba võetud.',
                employee: {
                    ...user,
                    email: worker?.email,
                    phone: worker?.phone
                }
            });
        }

        await User.updateEmployee(
            userId,
            first_name,
            last_name,
            username,
            `${first_name} ${last_name}`,
            email,
            phone
        );

        res.redirect('/employee/profile');
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
    updateSchedule,
    getEmployeeProfile,
    getChangePasswordPage,
    postChangePassword,
    getEditProfilePage,
    updateProfile
};
