const employeeController = require('../controllers/employee.controller');

const express = require('express');
const router = express.Router();

router.get('/', employeeController.getEmployeePage);

module.exports = router;