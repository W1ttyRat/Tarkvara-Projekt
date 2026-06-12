const employeeController = require('../controllers/employee.controller');
const { requireAuth, requireEmployee } = require('../middleware/auth.middleware');

const express = require('express');
const router = express.Router();

router.use(requireAuth);
router.use(requireEmployee); // All routes in this router require the user to be authenticated and have the 'employee' role

router.get('/', employeeController.getEmployeePage);

router.get(
    '/schedule',
    employeeController.getSchedulePage
);

router.post("/schedule", employeeController.createSchedule);

router.delete("/schedule/:id", employeeController.deleteSchedule);

router.get("/schedule/day", employeeController.getScheduleForDay);

module.exports = router;