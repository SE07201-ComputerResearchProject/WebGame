const express = require("express");
const router = express.Router();
const { getPool, sql } = require('../db');
const { requireAuth } = require('../middleware/auth');

// Get friends
router.get("/", requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query(`
        SELECT id, name, avatar, status, created_at
        FROM dbo.friends 
        WHERE user_id = @userId
        ORDER BY id
      `);
    
    res.json({ ok: true, friends: result.recordset });
  } catch (err) {
    console.error('Get friends error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add friend
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const pool = getPool();

    // Insert friend
    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .input('name', sql.NVarChar(100), name)
      .input('avatar', sql.NVarChar(sql.MAX), avatar || `https://i.pravatar.cc/100?u=${name}`)
      .input('status', sql.NVarChar(20), 'offline')
      .query(`
        INSERT INTO dbo.friends (user_id, name, avatar, status, created_at)
        VALUES (@userId, @name, @avatar, @status, GETUTCDATE());
        SELECT @@IDENTITY as id;
      `);

    const friendId = result.recordset[0].id;

    res.json({ 
      ok: true, 
      friend: { 
        id: friendId, 
        name, 
        avatar: avatar || `https://i.pravatar.cc/100?u=${name}`, 
        status: 'offline' 
      } 
    });
  } catch (err) {
    console.error('Add friend error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update friend status
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const pool = getPool();

    // Update status
    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar(20), status)
      .query(`
        UPDATE dbo.friends 
        SET status = @status 
        WHERE id = @id
      `);

    // Get updated friend
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT * FROM dbo.friends WHERE id = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({ ok: true, friend: result.recordset[0] });
  } catch (err) {
    console.error('Update friend status error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
