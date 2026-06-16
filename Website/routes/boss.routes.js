const bossController = require('../controllers/boss.controller');
const express = require('express');
const { requireAuth, requireBoss } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requireBoss); // All routes in this router require the user to be authenticated and have the 'boss' role

router.get('/', bossController.getBossPage);
router.get('/register-employee', bossController.getRegisterEmployeePage);
router.get("/schedule", bossController.getBossSchedulePage);
router.get("/employees", bossController.getEmployeesPage);
router.get(
    "/employees/:id/edit",
    bossController.getEditEmployeePage
);

router.post(
    "/employees/:id/edit",
    bossController.updateEmployee
);

router.post(
    "/employees/:id/toggle-password-change",
    bossController.toggleEmployeePasswordChange
);
router.post('/register-employee', bossController.registerEmployee);

router.patch(
    "/schedule/:id/status",
    bossController.updateShiftStatus
);
router.patch(
    "/schedule/:id",
    bossController.updateShift
);

//router.post('/register-employee', bossController.registerEmployee);

module.exports = router;