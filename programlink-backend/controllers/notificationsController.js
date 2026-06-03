const pool = require('../config/database');

exports.listNotifications = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ notifications: rows });
  } catch (err) {
    console.error('listNotifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Notification not found.' });
    res.json({ notification: rows[0] });
  } catch (err) {
    console.error('markRead error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('markAllRead error:', err);
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
};
