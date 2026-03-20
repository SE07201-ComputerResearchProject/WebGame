require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const sql = require('mssql'); // Thêm thư viện mssql để định dạng kiểu dữ liệu cho Socket

// 1. Nhập thư viện Socket.io và HTTP
const http = require('http');
const { Server } = require('socket.io');

// Nhập (Import) toàn bộ các file routes đã có sẵn
const authRouter = require('./routes/auth');
const gamesRouter = require('./routes/games');
const leaderboardRouter = require('./routes/leaderboard');
const friendsRouter = require('./routes/friends');
const messagesRouter = require('./routes/messages');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

// Cấu hình Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080', // Chỉnh URL này trùng với Frontend
  credentials: true
}));
app.use(express.json());

// 2. Bọc app Express bằng máy chủ HTTP để chạy được WebSockets
const server = http.createServer(app);

// 3. Khởi tạo "Trạm phát sóng" Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 4. Lắng nghe các sự kiện chat theo thời gian thực
io.on('connection', (socket) => {
  console.log(`[Socket] 🟢 Kết nối mới: ${socket.id}`);

  // ==========================================
  // A. ĐĂNG KÝ PHÒNG RIÊNG KHI USER ONLINE
  // ==========================================
  socket.on('register_user', (user) => {
    // Ép user vào một căn phòng mang mã ID của chính họ (VD: phòng 'user_1')
    socket.join(`user_${user.id}`);
    console.log(`[Socket] 👤 User ${user.username} (ID: ${user.id}) đã vào phòng cá nhân.`);
    
    // Nếu có làm Chat Nhóm: Lấy danh sách group_id từ DB và cho join thêm vào các phòng `group_1`, `group_2`...
  });

// ==========================================
  // B. XỬ LÝ CHAT THẾ GIỚI
  // ==========================================
  socket.on('send_global_message', async (data) => {
    console.log(`[Socket] 📩 Đang xử lý tin nhắn Thế Giới từ User ${data.userId}: ${data.content}`);
    try {
      const sql = require('mssql');
      // Ép lấy kết nối CSDL kiểu mạnh tay nhất
      const pool = typeof db.getPool === 'function' ? db.getPool() : (db.pool || sql); 
      
      if (!pool || !pool.request) {
        console.log("[Socket] 🔴 LỖI NẶNG: Không lấy được quyền kết nối Database (pool)!");
        return;
      }

      const result = await pool.request()
        .input('sender_id', sql.Int, data.userId)
        .input('content', sql.NVarChar(sql.MAX), data.content)
        .query(`
          INSERT INTO dbo.messages (sender_id, content, created_at) 
          VALUES (@sender_id, @content, GETUTCDATE());
          
          SELECT m.id, m.content, m.created_at, u.username, u.id as sender_id
          FROM dbo.messages m JOIN dbo.users u ON m.sender_id = u.id
          WHERE m.id = @@IDENTITY;
        `);

      console.log(`[Socket] ✅ Lưu tin nhắn thành công, đang phát cho mọi người...`);
      io.emit('receive_global_message', result.recordset[0]); 
    } catch (error) {
      console.error("[Socket] 🔴 Lỗi SQL khi lưu tin nhắn Thế Giới:", error);
    }
  });

  // ==========================================
  // C. XỬ LÝ CHAT CÁ NHÂN (1-1)
  // ==========================================
  socket.on('send_private_message', async (data) => {
    console.log(`[Socket] 🕵️ Đang xử lý tin nhắn 1-1 từ ${data.senderId} gửi ${data.receiverId}`);
    try {
      const sql = require('mssql');
      const pool = typeof db.getPool === 'function' ? db.getPool() : (db.pool || sql); 
      
      if (!pool || !pool.request) {
         console.log("[Socket] 🔴 LỖI NẶNG: Không lấy được quyền kết nối Database (pool)!");
         return;
      }

      const result = await pool.request()
        .input('sender_id', sql.Int, data.senderId)
        .input('receiver_id', sql.Int, data.receiverId)
        .input('content', sql.NVarChar(sql.MAX), data.content)
        .query(`
          INSERT INTO dbo.messages (sender_id, receiver_id, content, created_at) 
          VALUES (@sender_id, @receiver_id, @content, GETUTCDATE());
          
          SELECT m.id, m.content, m.created_at, u.username, m.sender_id, m.receiver_id
          FROM dbo.messages m JOIN dbo.users u ON m.sender_id = u.id
          WHERE m.id = @@IDENTITY;
        `);

      const savedMessage = result.recordset[0];
      console.log(`[Socket] ✅ Lưu tin nhắn 1-1 thành công, đang gửi vào phòng riêng...`);
      
      io.to(`user_${data.receiverId}`).emit('receive_private_message', savedMessage);
      io.to(`user_${data.senderId}`).emit('receive_private_message', savedMessage);
    } catch (error) {
      console.error("[Socket] 🔴 Lỗi SQL khi lưu tin nhắn 1-1:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] 🔴 Ngắt kết nối: ${socket.id}`);
  });
});

// Khởi tạo Database và kết nối API
db.init()
  .then(() => {
    // Gắn các routes vào đúng đường dẫn (Endpoints)
    app.use('/api/auth', authRouter);
    app.use('/api/games', gamesRouter);
    app.use('/api/leaderboard', leaderboardRouter);
    app.use('/api/friends', friendsRouter);
    app.use('/api/messages', messagesRouter);
    app.use('/api/admin', adminRouter);
    // Route kiểm tra sức khỏe của Server
    app.get('/', (req, res) => {
      res.json({ ok: true, message: 'Cosy Game Zone API is running smoothly!' });
    });

    // 5. Thay đổi app.listen thành server.listen
    server.listen(PORT, () => {
      console.log(`🚀 Server Backend đang chạy tại: http://localhost:${PORT}`);
      console.log(`📡 Trạm phát sóng Socket.io đã sẵn sàng hoạt động!`);
    });
  })
  .catch((err) => {
    console.error('✗ Không thể khởi động server vì Database chưa kết nối:', err.message);
  });