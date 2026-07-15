const express    = require('express');
const router     = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { getWarnings } = require('../controllers/warningsController');

router.get('/', authenticate, authorizeRoles('sponsor', 'coordinator', 'admin'), getWarnings);

module.exports = router;
