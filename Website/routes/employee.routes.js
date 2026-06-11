const employeeController = require('../controllers/employee.controller');

const express = require('express');
const router = express.Router();

router.get('/', employeeController.getEmployeePage);

router.get(
    '/schedule',
    employeeController.getSchedulePage
);

router.post("/schedule", employeeController.createSchedule);
//test
router.get("/test-db", employeeController.testDb);

router.get("/schedule/day", employeeController.getScheduleForDay);

module.exports = router;