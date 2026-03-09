const express = require('express');
const router = express.Router();
const db = require('../db'); // Trỏ đúng đường dẫn file db.js của bạn

// API: Lấy 50 tin nhắn mới nhất của Kênh Thế Giới
router.get('/global', async (req, res) => {
  try {
    const pool = typeof db.getPool === 'function' ? db.getPool() : db.pool; 
    
    // Lấy 50 tin nhắn có receiver_id là NULL (Tin nhắn chung)
    // Sắp xếp giảm dần (DESC) để lấy cái mới nhất
    const result = await pool.request().query(`
      SELECT TOP 50 m.id, m.content, m.created_at, u.username, u.id as sender_id
      FROM dbo.messages m
      JOIN dbo.users u ON m.sender_id = u.id
      WHERE m.receiver_id IS NULL
      ORDER BY m.created_at DESC
    `);

    // Đảo ngược mảng lại để khi hiển thị, tin nhắn cũ nằm trên, tin nhắn mới nằm dưới
    const messages = result.recordset.reverse();
    
    res.json({ ok: true, messages });
  } catch (error) {
    console.error("Lỗi lấy lịch sử chat:", error);
    res.status(500).json({ error: "Lỗi kết nối CSDL" });
  }
});

// API: Lấy lịch sử Chat Cá Nhân (1-1) giữa User đang đăng nhập và một người bạn
router.get('/private/:friendId', async (req, res) => {
  try {
    const friendId = req.params.friendId;
    
    // Chú ý: Cần lấy ID của người đang đăng nhập. (Trong thực tế nên lấy từ Token Middleware)
    // Để Demo nhanh, tôi giả sử Frontend gửi userId qua query params: /api/messages/private/2?userId=1
    const myUserId = req.query.userId; 

    if (!myUserId || !friendId) {
      return res.status(400).json({ error: "Thiếu ID người dùng" });
    }

    const pool = typeof db.getPool === 'function' ? db.getPool() : db.pool; 
    
    // Câu SQL ma thuật: Lấy tin do MÌNH gửi BẠN, hoặc BẠN gửi MÌNH
    const result = await pool.request()
      .input('me', db.sql.Int, myUserId)
      .input('friend', db.sql.Int, friendId)
      .query(`
        SELECT TOP 50 m.id, m.content, m.created_at, u.username, m.sender_id, m.receiver_id
        FROM dbo.messages m
        JOIN dbo.users u ON m.sender_id = u.id
        WHERE (m.sender_id = @me AND m.receiver_id = @friend)
           OR (m.sender_id = @friend AND m.receiver_id = @me)
        ORDER BY m.created_at DESC
      `);

    const messages = result.recordset.reverse(); // Đảo ngược để tin cũ lên trên
    res.json({ ok: true, messages });
  } catch (error) {
    console.error("Lỗi lấy lịch sử chat 1-1:", error);
    res.status(500).json({ error: "Lỗi kết nối CSDL" });
  }
});

module.exports = router;