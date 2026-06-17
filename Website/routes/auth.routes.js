const authController = require('../controllers/auth.controller');
const { loginLimiter, loginBruteForceLimiter } = require('../middleware/rateLimiter.middleware');
const { requireAuth } = require('../middleware/auth.middleware');

const express = require('express');
const router = express.Router();

router.get('/login', authController.getLoginPage);

router.post('/login', loginBruteForceLimiter, loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

router.get('/change-password', requireAuth, authController.getChangePasswordPage);
router.post('/change-password', requireAuth, authController.postChangePassword);

module.exports = router;