const authService = require('../services/auth.service');
const bossScheduleModel = require("../models/bossSchedule.model");
const locationModel = require("../models/location.model");
const User = require("../models/User.model");

const getBossPage = async (req, res, next) => {
    try {
        const boss = await User.getUserById(req.user.id);
        const bossFirstName = boss?.first_name || 'Boss';
        res.render('boss/boss', {
            title: 'Boss',
            pageClass: 'boss-page',
            bossName: bossFirstName || 'Boss'
        });
    } catch (err) {
        next(err);
    }
};

const getRegisterEmployeePage = async (req, res, next) => {
    try {
        res.render('boss/register-employee', {
            title: 'Register Employee',
            pageClass: 'register-employee-page',
        });
    } catch (err) {
        next(err);
    }
}

const registerEmployee = async (req, res, next) => {
    try {
        await authService.registerUser({
            ...req.body,
            role: 'employee'
        });

        res.redirect('/boss');
    } catch (err) {
        if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
            return res.status(err.statusCode).render('boss/register-employee', {
                title: 'Register Employee',
                pageClass: 'register-employee-page',
                errorMessage: err.message,
            });
        }
        next(err);
    }
}

const getBossSchedulePage = async (req, res, next) => {
    try {

        const filters = {
            location_id: req.query.location_id || "",
            worker: req.query.worker || "",
            status: req.query.status || ""
        };

        const shifts =
            await bossScheduleModel.getAllShiftsForBossCalendar(filters);

        const locations =
            await locationModel.getAllLocations();

        res.render("boss/schedule", {
            title: "Boss Schedule",
            pageClass: "boss-schedule-page",
            shifts,
            locations,
            filters
        });

    } catch (err) {
        next(err);
    }
};

const updateShiftStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Vale status"
            });
        }

        const shift =
            await bossScheduleModel.updateShiftStatus(
                id,
                status
            );

        res.json({
            message: "Status uuendatud",
            shift
        });

    } catch (err) {
        next(err);
    }
};

const updateShift = async (req, res, next) => {
    try {

        const shiftId = req.params.id;

        const {
            location_id,
            start_time,
            end_time
        } = req.body;

        const shift =
            await bossScheduleModel.updateShift(
                shiftId,
                location_id,
                start_time,
                end_time
            );

        res.json({
            message: "Vahetus uuendatud",
            shift
        });

    } catch (err) {
        next(err);
    }
};

const getEmployeesPage = async (req, res, next) => {
    try {
        const employees = await User.getAllEmployees();

        res.render("boss/employees", {
            title: "Töötajad",
            pageClass: "employees-page",
            employees
        });

    } catch (err) {
        next(err);
    }
};

const getEditEmployeePage = async (req, res, next) => {
    try {
        const userId = req.params.id;

        const employee = await User.getEmployeeForEdit(userId);

        if (!employee) {
            return res.status(404).send("Töötajat ei leitud");
        }

        const licenceCategories = await User.getAllLicenceCategories();

        const selectedLicenceIds =
            employee.worker_id
                ? await User.getWorkerLicenceCategoryIds(employee.worker_id)
                : [];

        res.render("boss/edit-employee", {
            title: "Muuda töötajat",
            pageClass: "edit-employee-page",
            employee,
            licenceCategories,
            selectedLicenceIds
        });

    } catch (err) {
        next(err);
    }
};

const updateEmployee = async (req, res, next) => {
    try {
        const userId = req.params.id;

        const {
            first_name,
            last_name,
            username,
            name,
            email,
            phone
        } = req.body;

        let licence_category_ids = req.body.licence_category_ids || [];

        if (!Array.isArray(licence_category_ids)) {
            licence_category_ids = [licence_category_ids];
        }

        const employee = await User.getEmployeeForEdit(userId);

        if (!employee) {
            return res.status(404).send("Töötajat ei leitud");
        }

        await User.updateEmployee(
            userId,
            first_name,
            last_name,
            username,
            name,
            email,
            phone
        );

        if (employee.worker_id) {
            await User.updateWorkerLicenceCategories(
                employee.worker_id,
                licence_category_ids
            );
        }

        res.redirect("/boss/employees");

    } catch (err) {
        next(err);
    }
};

module.exports = {
    getBossPage,
    getRegisterEmployeePage,
    registerEmployee,
    getBossSchedulePage,
    updateShiftStatus,
    updateShift,
    getEmployeesPage,
    getEditEmployeePage,
    updateEmployee
};