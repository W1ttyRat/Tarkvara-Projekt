const employeeController = require('../controllers/employee.controller');

const express = require('express');
const router = express.Router();

router.get('/', employeeController.getEmployeePage);

router.get(
    '/schedule',
    employeeController.getSchedulePage
);

router.post("/schedule", employeeController.createSchedule);

router.get("/schedule/day", employeeController.getScheduleForDay);

module.exports = router;