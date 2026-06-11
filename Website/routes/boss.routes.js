const bossController = require('../controllers/boss.controller');

const express = require('express');
const router = express.Router();

router.get('/', bossController.getBossPage);
router.get('/register-employee', bossController.getRegisterEmployeePage);

//router.post('/register-employee', bossController.registerEmployee);

module.exports = router;