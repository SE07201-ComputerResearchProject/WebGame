# 📊 Sơ Đồ Kết Nối Backend - SQL Server

## Luồng Kết Nối Hoàn Chỉnh

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            BROWSER (User)                               │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                  Frontend (React + TypeScript)                    │  │
│  │  URL: http://localhost:5173                                      │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │ Components:                                                 │ │  │
│  │  │ - AuthModal: Đăng ký/Đăng nhập                            │ │  │
│  │  │ - GameGrid: Danh sách game                                 │ │  │
│  │  │ - Leaderboard: Bảng xếp hạng                              │ │  │
│  │  │ - FriendsSidebar: Danh sách bạn bè                        │ │  │
│  │  │ - ChatWindow: Chat real-time                              │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │ src/lib/api.ts (API Layer)                                  │ │  │
│  │  │ - register()          gọi POST /api/auth/register          │ │  │
│  │  │ - login()             gọi POST /api/auth/login             │ │  │
│  │  │ - getGames()          gọi GET /api/games                   │ │  │
│  │  │ - getLeaderboard()    gọi GET /api/leaderboard            │ │  │
│  │  │ - submitScore()       gọi POST /api/leaderboard/submit    │ │  │
│  │  │ - getFriends()        gọi GET /api/friends                │ │  │
│  │  │ - addFriend()         gọi POST /api/friends/add           │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────────────────┘
                              │
                ╔════════════════════════════╗
                ║   HTTP/HTTPS + WebSocket   ║
                ║  (REST API + Socket.IO)    ║
                ╚════════════════════════════╝
                              │
┌─────────────────────────────▼──────────────────────────────────────────┐
│                  Backend Server (Node.js + Express)                    │
│  URL: http://localhost:4000                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ server/app.js (Express Setup)                                    │  │
│  │  - CORS: cho phép http://localhost:5173                         │  │
│  │  - Body Parser: JSON                                            │  │
│  │  - Socket.IO: Real-time chat                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ server/routes/auth.js      Xác thực người dùng                  │  │
│  │ ├─ POST /api/auth/register                                      │  │
│  │ │   → Hash password (bcrypt)                                    │  │
│  │ │   → INSERT vào dbo.users                                      │  │
│  │ │   → Trả token JWT                                             │  │
│  │ ├─ POST /api/auth/login                                         │  │
│  │ │   → SELECT từ dbo.users                                       │  │
│  │ │   → So sánh password (bcrypt)                                 │  │
│  │ │   → Trả token JWT                                             │  │
│  │ └─ GET /api/auth/me (cần token)                                 │  │
│  │     → Trả info user hiện tại                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ server/routes/games.js     Quản lý trò chơi                     │  │
│  │ ├─ GET /api/games                                               │  │
│  │ │   → SELECT * FROM dbo.games                                   │  │
│  │ │   → Trả JSON array                                            │  │
│  │ └─ GET /api/games/:id                                           │  │
│  │     → SELECT * FROM dbo.games WHERE id = :id                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ server/routes/leaderboard.js   Bảng xếp hạng                    │  │
│  │ ├─ GET /api/leaderboard                                         │  │
│  │ │   → SELECT * FROM dbo.leaderboard ORDER BY score DESC         │  │
│  │ │   → Thêm rank theo thứ tự                                     │  │
│  │ └─ POST /api/leaderboard/submit (cần token)                    │  │
│  │     → INSERT vào dbo.leaderboard                                │  │
│  │     → Trả bảng xếp hạng updated                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ server/routes/friends.js    Quản lý bạn bè                      │  │
│  │ ├─ GET /api/friends (cần token)                                │  │
│  │ │   → SELECT * FROM dbo.friends WHERE user_id = :userId        │  │
│  │ ├─ POST /api/friends/add (cần token)                           │  │
│  │ │   → INSERT vào dbo.friends                                    │  │
│  │ └─ PATCH /api/friends/:id/status (cần token)                   │  │
│  │     → UPDATE dbo.friends SET status = :status                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ server/db.js (Database Layer - MỚI)                             │  │
│  │  - Khởi tạo connection pool SQL Server                          │  │
│  │  - Cung cấp getPool() để các routes query                       │  │
│  │  - Kiểm tra bảng khi start                                      │  │
│  │  - Xử lý error kết nối                                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ server/middleware/auth.js   Xác thực Token                      │  │
│  │  - Kiểm tra Authorization header                                │  │
│  │  - Verify JWT token                                             │  │
│  │  - Lưu user info vào req.user                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────────────────┘
                              │
            ╔═════════════════════════════════╗
            ║  SQL Queries (Connection Pool)  ║
            ╚═════════════════════════════════╝
                              │
┌─────────────────────────────▼──────────────────────────────────────────┐
│                      SQL Server Database                               │
│  Server: DESKTOP-4A49R3D                                               │
│  Database: cosy_game_zone                                              │
│  Port: 1433                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ dbo.users                                                         │  │
│  │ ┌──────────┬─────────────┬──────────────┬──────────┬────────┐    │  │
│  │ │ id (PK)  │ username    │ email        │ password │ created│    │  │
│  │ ├──────────┼─────────────┼──────────────┼──────────┼────────┤    │  │
│  │ │ 1        │ player1     │ p1@email.com │ hashed.. │ 2024.. │    │  │
│  │ │ 2        │ player2     │ p2@email.com │ hashed.. │ 2024.. │    │  │
│  │ └──────────┴─────────────┴──────────────┴──────────┴────────┘    │  │
│  │                                                                    │  │
│  │ dbo.games                                                         │  │
│  │ ┌──────────┬───────────────┬──────────┬────────┬─────────┐       │  │
│  │ │ id (PK)  │ title         │ category │ rating │ players │       │  │
│  │ ├──────────┼───────────────┼──────────┼────────┼─────────┤       │  │
│  │ │ 1        │ Cyber Racers  │ Racing   │ 4.8    │ 12500   │       │  │
│  │ │ 2        │ Space Warriors│ Shooter  │ 4.5    │ 8900    │       │  │
│  │ └──────────┴───────────────┴──────────┴────────┴─────────┘       │  │
│  │                                                                    │  │
│  │ dbo.leaderboard                                                   │  │
│  │ ┌──────────┬──────────┬────────┬─────────┬──────────┐            │  │
│  │ │ id (PK)  │ name     │ score  │ game_id │ user_id  │            │  │
│  │ ├──────────┼──────────┼────────┼─────────┼──────────┤            │  │
│  │ │ 1        │ player1  │ 5000   │ 1       │ 1        │            │  │
│  │ │ 2        │ player2  │ 4500   │ 1       │ 2        │            │  │
│  │ └──────────┴──────────┴────────┴─────────┴──────────┘            │  │
│  │                                                                    │  │
│  │ dbo.friends                                                       │  │
│  │ ┌──────────┬──────────┬────────────┬──────────┬────────┐         │  │
│  │ │ id (PK)  │ user_id  │ name       │ avatar   │ status │         │  │
│  │ ├──────────┼──────────┼────────────┼──────────┼────────┤         │  │
│  │ │ 1        │ 1        │ player2    │ url...   │ online │         │  │
│  │ │ 2        │ 2        │ player1    │ url...   │offline │         │  │
│  │ └──────────┴──────────┴────────────┴──────────┴────────┘         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Ví Dụ Luồng: Người Dùng Đăng Ký

```
1. USER CLICK (Browser)
   ┌─────────────────────┐
   │ AuthModal           │
   │ - Input: username   │
   │ - Input: email      │
   │ - Input: password   │
   │ - Click: "Register" │
   └────────────┬────────┘
                │
   2. FRONTEND CALL API
                │
                ▼
   ┌──────────────────────────────────────────┐
   │ src/lib/api.ts                           │
   │ register({                               │
   │   username: "player1",                   │
   │   email: "player1@email.com",            │
   │   password: "secret123"                  │
   │ })                                       │
   └────────────┬─────────────────────────────┘
                │
   3. HTTP REQUEST
                │
                ▼
   ╔═══════════════════════════════════════════╗
   ║ POST http://localhost:4000/api/auth/register
   ║ Header: Content-Type: application/json    ║
   ║ Body: { username, email, password }      ║
   ╚═════════════┬═════════════════════════════╝
                │
   4. BACKEND RECEIVE
                │
                ▼
   ┌──────────────────────────────────────┐
   │ server/routes/auth.js                │
   │ router.post("/register", async ...)  │
   │ - Kiểm tra: email/username tồn tại?  │
   │ - Hash password (bcrypt)             │
   │ - Chuẩn bị data: {username, email... │
   └────────────┬─────────────────────────┘
                │
   5. DATABASE QUERY
                │
                ▼
   ┌──────────────────────────────────────┐
   │ server/db.js (getPool())             │
   │ pool.request()                       │
   │   .input('username', sql.Nvarchar)   │
   │   .input('email', sql.Nvarchar)      │
   │   .input('password', sql.Nvarchar)   │
   │   .query(INSERT INTO dbo.users ...)  │
   └────────────┬─────────────────────────┘
                │
   6. SQL SERVER
                │
                ▼
   ┌──────────────────────────────────────┐
   │ INSERT INTO dbo.users                │
   │ (username, email, password,...)      │
   │ VALUES ('player1', 'email...', ...)  │
   │                                      │
   │ ✅ Row inserted successfully         │
   └────────────┬─────────────────────────┘
                │
   7. BACKEND RESPONSE
                │
                ▼
   ┌──────────────────────────────────────┐
   │ Tạo JWT token:                       │
   │ jwt.sign({id, email, username}, ...) │
   │                                      │
   │ Return response JSON:                │
   │ { ok: true, user, token }            │
   └────────────┬─────────────────────────┘
                │
   8. HTTP RESPONSE
                │
                ▼
   ╔═══════════════════════════════════════════╗
   ║ 200 OK                                    ║
   ║ {                                         ║
   ║   "ok": true,                             ║
   ║   "user": {                               ║
   ║     "id": 1,                              ║
   ║     "username": "player1",                ║
   ║     "email": "player1@email.com"          ║
   ║   },                                      ║
   ║   "token": "eyJhbGc..."                   ║
   ║ }                                         ║
   ╚═════════════┬═════════════════════════════╝
                │
   9. FRONTEND HANDLE
                │
                ▼
   ┌──────────────────────────────────────┐
   │ src/lib/auth.ts                      │
   │ - Lưu token vào localStorage         │
   │ - Lưu user info vào state            │
   │ - Hiển thị "Đăng ký thành công"      │
   │ - Redirect tới trang chính           │
   └──────────────────────────────────────┘
```

---

## 🔐 Flow: Yêu Cầu Cần Authorization (Ví dụ: Get Friends)

```
FRONTEND (Người dùng đã login)
│
├─ localStorage.token: "eyJhbGc..."
│
▼
GET http://localhost:4000/api/friends
Header: {
  Authorization: "Bearer eyJhbGc...",
  Content-Type: "application/json"
}
│
▼
BACKEND (server/routes/friends.js)
│
├─ Kiểm tra route: GET /api/friends
├─ Middleware: requireAuth (server/middleware/auth.js)
│   ├─ Lấy token từ header
│   ├─ jwt.verify(token, JWT_SECRET)
│   ├─ Lưu user info vào req.user
│   └─ Cho phép tiếp tục
│
▼
SELECT FROM dbo.friends WHERE user_id = req.user.id
│
▼
Return: [{ id, name, avatar, status }, ...]
│
▼
FRONTEND nhận dữ liệu → render <FriendsSidebar />
```

---

## 📡 Socket.IO Real-time Chat

```
FRONTEND (ChatWindow)
│
├─ createSocket() → io(http://localhost:4000)
├─ Auth: { token: "eyJhbGc..." }
│
▼
BACKEND (server/app.js)
│
├─ io.use() → Verify token
├─ io.on('connection') → User connected
│
▼
User 1: socket.emit('message', { room, text })
│
▼
BACKEND io.to(room).emit('message', payload)
│
▼
User 2: socket.on('message') → nhận tin
│
▼
FRONTEND render tin nhắn mới
```

---

## 📝 Kết Luận

```
Frontend (UI) → API Layer → Backend (Logic) → Database (Storage)
└─ React       └─ Fetch    └─ Express    └─ SQL Server
   TypeScript     HTTP/WS    Node.js        Tables
   Components     REST       Routes         Data
   State          Socket.IO  Middleware     Persistent
```

Tất cả các phần đã được kết nối đúng cách! 🎉
