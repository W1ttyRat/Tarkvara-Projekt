const authController = require('../controllers/auth.controller');
const { loginLimiter } = require('../middleware/rateLimiter.middleware');
//const { requireAuth } = require('../middleware/auth.middleware');

const express = require('express');
const router = express.Router();

router.get('/login', authController.getLoginPage);

router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;