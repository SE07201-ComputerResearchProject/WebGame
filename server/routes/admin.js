const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// 1. [GET] Lấy toàn bộ Log
router.get("/logs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
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

// 2. [GET] Lấy danh sách Người dùng (Users)
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
     SELECT id, username, email, role, balance, created_at, status 
      FROM dbo.users
      ORDER BY id DESC
    `);
    res.json({ ok: true, users: result.recordset });
  } catch (err) {
    console.error("Lỗi lấy users Admin:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. [GET] Lấy danh sách Giao dịch (Transactions)
router.get("/transactions", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT t.id, t.vnp_txn_ref as transaction_code, u.username, t.amount, 
             'Nạp VNPay' as type, t.status, t.created_at
      FROM dbo.transactions t
      LEFT JOIN dbo.users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    res.json({ ok: true, transactions: result.recordset });
  } catch (err) {
    console.error("Lỗi lấy transactions Admin:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. [GET] Lấy danh sách Game cho Admin
router.get('/games', requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT id, title, ISNULL(price, 0) as price, ISNULL(ad_duration, 0) as ad_duration, ISNULL(is_active, 1) as is_active, created_at 
      FROM dbo.games
      ORDER BY id DESC
    `);
    res.json({ ok: true, games: result.recordset });
  } catch (error) {
    console.error("Lỗi lấy danh sách game Admin:", error);
    res.status(500).json({ ok: false, message: 'Lỗi server' });
  }
});

// 5. [PUT] Cập nhật cấu hình kinh doanh của Game (Giá, Quảng cáo)
router.put('/games/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { price, ad_duration, is_active } = req.body;
  
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('price', sql.Int, price)
      .input('ad_duration', sql.Int, ad_duration)
      .input('is_active', sql.Bit, is_active ? 1 : 0)
      .query(`
        UPDATE dbo.games 
        SET price = @price, ad_duration = @ad_duration, is_active = @is_active
        WHERE id = @id
      `);
    res.json({ ok: true, message: 'Cập nhật cấu hình game thành công!' });
  } catch (error) {
    console.error("Lỗi cập nhật game:", error);
    res.status(500).json({ ok: false, message: 'Lỗi server' });
  }
});

// 1. [PUT] Cộng/Trừ tiền User
router.put('/users/:id/balance', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { amountChange } = req.body; // Số âm là trừ, số dương là cộng
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('amountChange', sql.Int, amountChange)
      .query(`UPDATE dbo.users SET balance = balance + @amountChange WHERE id = @id`);
    res.json({ ok: true, message: 'Cập nhật số dư thành công!' });
  } catch (error) {
    console.error("Lỗi cập nhật số dư:", error);
    res.status(500).json({ ok: false, message: 'Lỗi server' });
  }
});

// 2. [PUT] Thay đổi quyền (Role)
router.put('/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // 'admin' hoặc 'user'
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('role', sql.VarChar, role)
      .query(`UPDATE dbo.users SET role = @role WHERE id = @id`);
    res.json({ ok: true, message: 'Cập nhật quyền thành công!' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Lỗi server' });
  }
});

// 3. [PUT] Khóa/Mở khóa tài khoản (Status)
router.put('/users/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' hoặc 'banned'
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.VarChar, status)
      .query(`UPDATE dbo.users SET status = @status WHERE id = @id`);
    res.json({ ok: true, message: 'Cập nhật trạng thái thành công!' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Lỗi server' });
  }
});

module.exports = router;