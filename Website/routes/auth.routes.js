const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const express = require('express');
const router = express.Router();

router.get('/login', authController.getLoginPage);

router.post('/login', authController.login);
router.post('/logout', requireAuth, authController.logout);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;