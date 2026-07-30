// routes/mealCounts.js
const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listMealCounts,
  submitMealCount,
  verifyMealCount,
  getMonthlySummary,
  getTrend,
} = require('../controllers/mealCountsController');
const { scanMealSlip } = require('../controllers/mealScanController');

// multer: store image in memory (no disk needed — we base64 it and store in DB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

router.use(authenticate);

router.get('/',         listMealCounts);
router.get('/summary',  getMonthlySummary);
router.get('/trend',    getTrend);

// POST /api/meal-counts/scan — upload a slip photo, get back extracted counts
// Kitchen and site staff can both use this
router.post('/scan', authorizeRoles('kitchen', 'site', 'admin'), upload.single('image'), scanMealSlip);

// Kitchen users can now submit counts (previously only 'site')
// Kitchen submits counts for the meals they produce; sites submit for meals served
router.post('/', authorizeRoles('site', 'kitchen', 'sponsor', 'admin'), submitMealCount);

// Only coordinators and sponsors verify
router.patch('/:id/verify', authorizeRoles('coordinator', 'sponsor', 'admin'), verifyMealCount);

module.exports = router;
