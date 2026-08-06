// routes/menus.js — CACFP weekly menu builder
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
const {
  listMenus, getMenu, createMenu, updateMenu, deleteMenu,
  upsertItem, deleteItem, clearMenuItems,
  getEstimateRates, listTemplates, saveTemplate, deleteTemplate,
  generateMenu, listComments, addComment, deleteComment, extractMenuFromFile,
} = require('../controllers/menusController');

const canWrite = authorizeRoles('sponsor', 'coordinator', 'kitchen', 'admin');

// ── Specific routes BEFORE /:id ────────────────────────────────────────────────
router.get('/rates',             authenticate, getEstimateRates);
router.get('/templates',         authenticate, listTemplates);
router.post('/templates',        authenticate, canWrite, saveTemplate);
router.delete('/templates/:id',  authenticate, canWrite, deleteTemplate);

// ── AI Menu Import ─────────────────────────────────────────────────────────────
router.post('/import/extract', authenticate, canWrite, upload.single('file'), extractMenuFromFile);

// ── Core CRUD ─────────────────────────────────────────────────────────────────
router.get('/',                  authenticate, listMenus);
router.get('/:id',               authenticate, getMenu);
router.post('/',                 authenticate, canWrite, createMenu);
router.put('/:id',               authenticate, canWrite, updateMenu);
router.delete('/:id',            authenticate, canWrite, deleteMenu);

// ── Items ─────────────────────────────────────────────────────────────────────
router.post('/:id/items',         authenticate, canWrite, upsertItem);
router.delete('/:id/items/all',   authenticate, canWrite, clearMenuItems);
router.delete('/items/:item_id',  authenticate, canWrite, deleteItem);

// ── AI Generate ───────────────────────────────────────────────────────────────
router.post('/:id/generate',     authenticate, canWrite, generateMenu);

// ── Comments ──────────────────────────────────────────────────────────────────
router.get('/:id/comments',              authenticate, listComments);
router.post('/:id/comments',             authenticate, addComment);
router.delete('/:id/comments/:commentId', authenticate, canWrite, deleteComment);

module.exports = router;
