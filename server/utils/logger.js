const { getPool, sql } = require('../db');

/**
 * Hàm ghi log hệ thống
 * @param {number} userId - ID của user (null nếu không có)
 * @param {string} action - Mã hành động (viết hoa, VD: 'LOGIN_SUCCESS')
 * @param {string} description - Mô tả chi tiết bằng tiếng Việt
 * @param {string} ipAddress - Địa chỉ IP của người dùng
 */
async function logActivity(userId, action, description, ipAddress = null) {
  try {
    const pool = getPool();
    await pool.request()
      .input('userId', sql.Int, userId || null)
      .input('action', sql.VarChar(50), action)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('ipAddress', sql.VarChar(50), ipAddress)
      .query(`
        INSERT INTO dbo.activity_logs (user_id, action, description, ip_address, created_at)
        VALUES (@userId, @action, @description, @ipAddress, GETUTCDATE())
      `);
    console.log(`[LOG] ${action}: ${description}`);
  } catch (error) {
    // Không ném lỗi ra ngoài để tránh làm sập luồng chính nếu DB log bị nghẽn
    console.error(`[LOG ERROR] Không thể ghi log cho hành động ${action}:`, error.message);
  }
}

module.exports = { logActivity };