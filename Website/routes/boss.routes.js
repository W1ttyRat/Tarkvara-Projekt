const bossController = require('../controllers/boss.controller');

const express = require('express');
const router = express.Router();

router.get('/', bossController.getBossPage);

module.exports = router;