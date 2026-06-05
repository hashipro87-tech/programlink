const pool = require('../config/database');
const { createNotification } = require('../services/notificationService');

exports.listThreads = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, m.body AS last_message, m.created_at AS last_message_at
       FROM message_threads t
       LEFT JOIN messages m ON m.id = (
         SELECT id FROM messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1
       )
       WHERE t.created_by = $1
          OR EXISTS (SELECT 1 FROM message_recipients mr JOIN messages msg ON msg.id = mr.message_id WHERE msg.thread_id = t.id AND mr.recipient_id = $1)
       ORDER BY COALESCE(m.created_at, t.created_at) DESC`,
      [req.user.id]
    );
    res.json({ threads: rows });
  } catch (err) {
    console.error('listThreads error:', err);
    res.status(500).json({ error: 'Failed to fetch threads.' });
  }
};

exports.getThread = async (req, res) => {
  try {
    const thread = await pool.query('SELECT * FROM message_threads WHERE id = $1', [req.params.threadId]);
    if (!thread.rows.length) return res.status(404).json({ error: 'Thread not found.' });
    const messages = await pool.query(
      `SELECT m.*, u.name AS sender_name FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.thread_id = $1 ORDER BY m.created_at ASC`,
      [req.params.threadId]
    );
    // Mark as read
    await pool.query(
      `UPDATE message_recipients SET read_at = NOW()
       WHERE recipient_id = $1 AND message_id IN (SELECT id FROM messages WHERE thread_id = $2) AND read_at IS NULL`,
      [req.user.id, req.params.threadId]
    );
    res.json({ thread: thread.rows[0], messages: messages.rows });
  } catch (err) {
    console.error('getThread error:', err);
    res.status(500).json({ error: 'Failed to fetch thread.' });
  }
};

exports.createThread = async (req, res) => {
  try {
    const { subject, body, recipient_ids, related_org_id } = req.body;
    const thread = await pool.query(
      `INSERT INTO message_threads (subject, related_org_id, created_by) VALUES ($1,$2,$3) RETURNING *`,
      [subject, related_org_id || null, req.user.id]
    );
    const message = await pool.query(
      `INSERT INTO messages (thread_id, sender_id, body) VALUES ($1,$2,$3) RETURNING *`,
      [thread.rows[0].id, req.user.id, body]
    );
    if (recipient_ids?.length) {
      for (const rid of recipient_ids) {
        await pool.query(
          'INSERT INTO message_recipients (message_id, recipient_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [message.rows[0].id, rid]
        );
      }
      // Notify recipients
      createNotification(recipient_ids.map((rid) => ({
        userId:    rid,
        type:      'new_message',
        title:     'New message',
        body:      subject ? `Re: ${subject}` : 'You have a new message.',
        actionUrl: `/dashboard/messages`,
      }))).catch(() => {});
    }
    res.status(201).json({ thread: thread.rows[0], message: message.rows[0] });
  } catch (err) {
    console.error('createThread error:', err);
    res.status(500).json({ error: 'Failed to create thread.' });
  }
};

exports.replyToThread = async (req, res) => {
  try {
    const { body, recipient_ids } = req.body;
    const message = await pool.query(
      `INSERT INTO messages (thread_id, sender_id, body) VALUES ($1,$2,$3) RETURNING *`,
      [req.params.threadId, req.user.id, body]
    );

    // Notify everyone else in the thread
    const threadParticipants = await pool.query(
      `SELECT DISTINCT sender_id AS user_id FROM messages WHERE thread_id = $1
       UNION
       SELECT DISTINCT recipient_id AS user_id FROM message_recipients mr
       JOIN messages m ON m.id = mr.message_id WHERE m.thread_id = $1`,
      [req.params.threadId]
    );
    const toNotify = threadParticipants.rows
      .map((r) => r.user_id)
      .filter((id) => id !== req.user.id);

    if (toNotify.length) {
      createNotification(toNotify.map((uid) => ({
        userId:    uid,
        type:      'new_message',
        title:     'New reply in your conversation',
        body:      body.length > 80 ? body.slice(0, 80) + '…' : body,
        actionUrl: `/dashboard/messages`,
      }))).catch(() => {});
    }

    if (recipient_ids?.length) {
      for (const rid of recipient_ids) {
        await pool.query(
          'INSERT INTO message_recipients (message_id, recipient_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [message.rows[0].id, rid]
        );
      }
    }
    res.status(201).json({ message: message.rows[0] });
  } catch (err) {
    console.error('replyToThread error:', err);
    res.status(500).json({ error: 'Failed to send reply.' });
  }
};
