const express = require('express');
const router = express.Router();
const employeeController = require('../Controllers/Employee');

router.post('/', employeeController.createEmployee);
router.get('/', employeeController.listEmployees);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);
router.get('/:id', employeeController.getEmployee);

module.exports = router;