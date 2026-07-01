// routes/users.js — Team/user management for sponsors
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { listUsers, getUser, updateUserStatus, removeUser } = require('../controllers/usersController');

// All routes require authentication
router.use(authenticate);

// List all users under the sponsor's program (sponsors + coordinators can view)
router.get('/', authorizeRoles('sponsor', 'coordinator', 'admin'), listUsers);

// Get a single user
router.get('/:id', authorizeRoles('sponsor', 'coordinator', 'admin'), getUser);

// Activate / deactivate a user — sponsor only
router.patch('/:id/status', authorizeRoles('sponsor', 'admin'), updateUserStatus);

// Permanently remove a user — sponsor only
router.delete('/:id', authorizeRoles('sponsor', 'admin'), removeUser);

module.exports = router;
