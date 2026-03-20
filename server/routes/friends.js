const express = require("express");
const router = express.Router();
const { getPool, sql } = require('../db');
const { requireAuth } = require('../middleware/auth');

// 1. Lấy danh sách bạn bè ĐÃ KẾT BẠN (status = 'accepted')
router.get("/", requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    // Lấy danh sách những người mình gửi yêu cầu (đã accept) HOẶC gửi yêu cầu cho mình (đã accept)
    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query(`
        SELECT u.id, u.username as name, f.status, f.created_at
        FROM dbo.friends f
        JOIN dbo.users u ON (f.friend_id = u.id AND f.user_id = @userId) OR (f.user_id = u.id AND f.friend_id = @userId)
        WHERE f.status = 'accepted'
      `);
    res.json({ ok: true, friends: result.recordset });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Lấy danh sách LỜI MỜI CHƯA DUYỆT (Gửi đến mình)
router.get("/requests", requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('myId', sql.Int, req.user.id)
      .query(`
        SELECT f.id as request_id, u.id as user_id, u.username as name, f.created_at
        FROM dbo.friends f
        JOIN dbo.users u ON f.user_id = u.id
        WHERE f.friend_id = @myId AND f.status = 'pending'
      `);
    res.json({ ok: true, requests: result.recordset });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. GỬI lời mời kết bạn
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId || friendId === req.user.id) return res.status(400).json({ error: 'ID không hợp lệ' });

    const pool = getPool();
    // Kiểm tra xem đã kết bạn chưa
    const check = await pool.request()
      .input('u1', sql.Int, req.user.id).input('u2', sql.Int, friendId)
      .query(`SELECT id FROM dbo.friends WHERE (user_id = @u1 AND friend_id = @u2) OR (user_id = @u2 AND friend_id = @u1)`);
    if (check.recordset.length > 0) return res.status(400).json({ error: 'Đã gửi lời mời hoặc đã là bạn bè' });

    await pool.request()
      .input('userId', sql.Int, req.user.id)
      .input('friendId', sql.Int, friendId)
      .input('status', sql.NVarChar(20), 'pending')
      .query(`INSERT INTO dbo.friends (user_id, friend_id, status, created_at) VALUES (@userId, @friendId, @status, GETUTCDATE());`);
    await logActivity(req.user.id, 'ADD_FRIEND', `Đã gửi lời mời kết bạn đến User ID: ${friendId}`);
    res.json({ ok: true, message: 'Đã gửi lời mời kết bạn!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. CHẤP NHẬN lời mời kết bạn
router.post('/accept', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.body;
    const pool = getPool();
    await pool.request()
      .input('reqId', sql.Int, requestId)
      .input('myId', sql.Int, req.user.id)
      .query(`UPDATE dbo.friends SET status = 'accepted' WHERE id = @reqId AND friend_id = @myId`);
    
    res.json({ ok: true, message: 'Đã chấp nhận kết bạn!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;