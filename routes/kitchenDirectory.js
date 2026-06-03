// routes/kitchenDirectory.js
const express    = require('express');
const router     = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const ctrl       = require('../controllers/kitchenDirectoryController');

// All routes require authentication
router.use(authenticate);

// Browse approved kitchens — all roles can view
router.get('/', ctrl.listKitchens);

// Connection management
router.get('/connections',     ctrl.listConnections);
router.post('/connections',    authorizeRoles('site'), ctrl.requestConnection);
router.patch('/connections/:id', authorizeRoles('coordinator', 'sponsor'), ctrl.reviewConnection);

module.exports = router;
