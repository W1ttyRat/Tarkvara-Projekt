const authController = require('../controllers/auth.controller');

const express = require('express');
const router = express.Router();

router.get('/login', authController.getLoginPage);

router.post('/login', authController.login);

module.exports = router;