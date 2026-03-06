const express = require('express');
const cors = require('cors');
const db = require('./db');

// 1. Nhập (Import) toàn bộ các file routes đã có sẵn
const authRouter = require('./routes/auth');
const gamesRouter = require('./routes/games');
const leaderboardRouter = require('./routes/leaderboard');
const friendsRouter = require('./routes/friends');

const app = express();
const PORT = process.env.PORT || 4000;

// Cấu hình Middleware
app.use(cors());
app.use(express.json());

// Khởi tạo Database và kết nối API
db.init()
  .then(() => {
    // 2. Gắn các routes vào đúng đường dẫn (Endpoints)
    app.use('/api/auth', authRouter);
    app.use('/api/games', gamesRouter);
    app.use('/api/leaderboard', leaderboardRouter);
    app.use('/api/friends', friendsRouter);

    // Route kiểm tra sức khỏe của Server
    app.get('/', (req, res) => {
      res.json({ ok: true, message: 'Cosy Game Zone API is running smoothly!' });
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server Backend đang chạy tại: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('✗ Không thể khởi động server vì Database chưa kết nối:', err.message);
  });