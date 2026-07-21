// routes/tasks.js — Task system CRUD
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const { listTasks, createTask, updateTask, deleteTask } = require('../controllers/tasksController');

router.get('/',       authenticate, listTasks);
router.post('/',      authenticate, createTask);
router.put('/:id',    authenticate, updateTask);
router.delete('/:id', authenticate, deleteTask);

module.exports = router;
