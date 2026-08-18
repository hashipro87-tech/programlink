// tasksController.js — Org-wide task system
const pool = require('../config/database');
const { createNotification } = require('../services/notificationService');
const { logActivity, TYPES } = require('../services/activityService');

// ── GET /tasks ────────────────────────────────────────────────────────────────
async function listTasks(req, res) {
  try {
    const { organizationId, id: userId, role } = req.user;
    const scopeId = (role === 'coordinator') ? req.user.sponsorId : organizationId;
    const { status, priority, category, assigned_to, limit = 100, offset = 0 } = req.query;

    // Sponsors/coordinators see all tasks for their program
    // Sites/kitchens see only tasks assigned to them or created for their org
    let where = `WHERE t.org_id = $1`;
    const params = [scopeId];
    let idx = 2;

    if (role === 'site' || role === 'kitchen') {
      where += ` AND (t.assigned_to = $${idx} OR t.created_by = $${idx})`;
      params.push(userId);
      idx++;
    }
    if (status)      { where += ` AND t.status = $${idx++}`;      params.push(status); }
    if (priority)    { where += ` AND t.priority = $${idx++}`;    params.push(priority); }
    if (category)    { where += ` AND t.category = $${idx++}`;    params.push(category); }
    if (assigned_to) { where += ` AND t.assigned_to = $${idx++}`; params.push(assigned_to); }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM tasks t ${where}`, params
    );

    const { rows } = await pool.query(
      `SELECT t.*,
         cb.first_name || ' ' || cb.last_name AS created_by_name,
         au.first_name || ' ' || au.last_name AS assigned_to_name,
         au.email AS assigned_to_email
       FROM tasks t
       JOIN users cb ON cb.id = t.created_by
       LEFT JOIN users au ON au.id = t.assigned_to
       ${where}
       ORDER BY
         CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         t.due_date ASC NULLS LAST,
         t.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, Number(limit), Number(offset)]
    );

    res.json({ tasks: rows, total: Number(countRes.rows[0].count) });
  } catch (err) {
    console.error('listTasks error:', err);
    res.status(500).json({ error: 'Failed to load tasks' });
  }
}

// ── POST /tasks ───────────────────────────────────────────────────────────────
async function createTask(req, res) {
  try {
    const { organizationId, id: userId, role } = req.user;
    const scopeId = (role === 'coordinator') ? req.user.sponsorId : organizationId;
    const { title, description, due_date, priority = 'medium', status = 'pending', category, assigned_to } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const { rows } = await pool.query(
      `INSERT INTO tasks (org_id, created_by, assigned_to, title, description, due_date, priority, status, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [scopeId, userId, assigned_to || null, title, description || null,
       due_date || null, priority, status, category || null]
    );

    // Notify assigned user if different from creator
    if (assigned_to && assigned_to !== userId) {
      await createNotification({
        user_id: assigned_to,
        type: 'general',
        title: 'New task assigned to you',
        message: title,
        link: '/dashboard/tasks',
      });
    }

    // Log activity
    const actor = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [userId]);
    const actorName = actor.rows[0] ? `${actor.rows[0].first_name} ${actor.rows[0].last_name}` : null;
    await logActivity({
      org_id: organizationId, actor_id: userId, actor_name: actorName,
      type: TYPES.TASK_CREATED, title: `Task created: ${title}`,
      link: '/dashboard/sponsor/tasks',
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
}

// ── PUT /tasks/:id ────────────────────────────────────────────────────────────
async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;
    const { title, description, due_date, priority, status, category, assigned_to } = req.body;

    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1 AND org_id = $2', [id, organizationId]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Task not found' });

    const { rows } = await pool.query(
      `UPDATE tasks SET
         title       = COALESCE($1, title),
         description = COALESCE($2, description),
         due_date    = COALESCE($3, due_date),
         priority    = COALESCE($4, priority),
         status      = COALESCE($5, status),
         category    = COALESCE($6, category),
         assigned_to = COALESCE($7, assigned_to),
         updated_at  = NOW()
       WHERE id = $8 AND org_id = $9
       RETURNING *`,
      [title, description, due_date, priority, status, category, assigned_to, id, organizationId]
    );

    // Log completion
    if (status === 'completed') {
      await logActivity({
        org_id: organizationId, actor_id: req.user?.id,
        type: TYPES.TASK_COMPLETED, title: `Task completed: ${rows[0].title}`,
        link: '/dashboard/sponsor/tasks',
      });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('updateTask error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
}

// ── DELETE /tasks/:id ─────────────────────────────────────────────────────────
async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;
    await pool.query('DELETE FROM tasks WHERE id = $1 AND org_id = $2', [id, organizationId]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteTask error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
}

module.exports = { listTasks, createTask, updateTask, deleteTask };
