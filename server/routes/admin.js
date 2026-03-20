const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Lấy toàn bộ Log (Chỉ Admin mới gọi được API này)
router.get("/logs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
    // JOIN với bảng users để lấy username (nếu log đó do người dùng thực hiện)
    const result = await pool.request().query(`
      SELECT l.id, l.action, l.description, l.ip_address, l.created_at, u.username
      FROM dbo.activity_logs l
      LEFT JOIN dbo.users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `);
    
    res.json({ ok: true, logs: result.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;