require('dotenv').config();
const sql = require('mssql'); 

// 1. IN RA MÀN HÌNH ĐỂ DEBUG KHOẢNG TRẮNG ẨN
console.log("=== KIỂM TRA BIẾN MÔI TRƯỜNG ===");
console.log(`DB_SERVER:   [${process.env.DB_SERVER}]`);
console.log(`DB_USER:     [${process.env.DB_USER}]`);
console.log(`DB_PASSWORD: [${process.env.DB_PASSWORD}]`);
console.log(`DB_NAME:     [${process.env.DB_NAME}]`);
console.log("================================");

// 2. DÙNG .trim() ĐỂ CẮT BỎ MỌI KHOẢNG TRẮNG THỪA HOẶC KÝ TỰ ẨN
const config = {
  user: (process.env.DB_USER || '').trim(),
  password: (process.env.DB_PASSWORD || '').trim(),
  server: (process.env.DB_SERVER || '').trim(),
  database: (process.env.DB_NAME || '').trim(),
  port: parseInt(process.env.DB_PORT || 1433),
  options: {
    encrypt: false, 
    trustServerCertificate: true, 
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

let pool = null;

async function init() {
  try {
    if (pool) return pool;

    console.log(`⏳ Đang kết nối vào database ${config.database} bằng tài khoản ${config.user}...`);
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✓ Kết nối SQL Server thành công mĩ mãn!');
    await verifyTables();
    
    return pool;
  } catch (err) {
    console.error('✗ Kết nối thất bại:', err.message);
    throw err;
  }
}

async function verifyTables() {
  try {
    const request = new sql.Request(pool);
    const requiredTables = ['dbo.users', 'dbo.games', 'dbo.leaderboard', 'dbo.friends'];
    const result = await request.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo'`);
    const existingTables = result.recordset.map(r => `dbo.${r.TABLE_NAME}`);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    if (missingTables.length > 0) {
      console.warn(`⚠ Cảnh báo: Thiếu các bảng - ${missingTables.join(', ')}`);
    } else {
      console.log('✓ Đã tìm thấy đầy đủ các bảng cần thiết');
    }
  } catch (err) {
    console.warn('⚠ Không thể kiểm tra bảng:', err.message);
  }
}

async function close() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('✓ Đã đóng kết nối Database');
  }
}

function getPool() {
  if (!pool) throw new Error('Database chưa được khởi tạo.');
  return pool;
}

if (require.main === module) {
  init()
    .then(() => console.log('✅ Test kết nối thành công! Nhấn Ctrl + C để thoát.'))
    .catch((err) => console.log('❌ Lỗi:', err.message));
}

module.exports = { init, getPool, close, sql };