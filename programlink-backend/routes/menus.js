// routes/menus.js — CACFP weekly menu builder
const express = require('express');
const router  = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  listMenus, getMenu, createMenu, updateMenu, deleteMenu, upsertItem, deleteItem,
} = require('../controllers/menusController');

const canWrite = authorizeRoles('sponsor', 'coordinator', 'kitchen', 'admin');

router.get('/',                   authenticate, listMenus);
router.get('/:id',                authenticate, getMenu);
router.post('/',                  authenticate, canWrite, createMenu);
router.put('/:id',                authenticate, canWrite, updateMenu);
router.delete('/:id',             authenticate, canWrite, deleteMenu);
router.post('/:id/items',         authenticate, canWrite, upsertItem);
router.delete('/items/:item_id',  authenticate, canWrite, deleteItem);

module.exports = router;
