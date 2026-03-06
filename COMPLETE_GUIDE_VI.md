# 🎮 COSY GAME ZONE - Hướng Dẫn Hoàn Chỉnh (SQL Server Edition)

## 🔄 Cập Nhật Mới Nhất

**Backend đã chuyển sang SQL Server!** 🎉

- ❌ Không còn dùng JSON file
- ✅ Kết nối trực tiếp SQL Server
- ✅ Dữ liệu lưu vĩnh viễn
- ✅ Hiệu năng tốt hơn

---

## 🚀 Bắt Đầu Nhanh

### Bước 1: Kiểm Tra SQL Server

```powershell
# Mở SQL Server Management Studio
# Kết nối tới: DESKTOP-4A49R3D
# Username: sa
# Password: 1234
```

### Bước 2: Tạo Bảng (nếu chưa có)

1. Mở `server/CREATE_TABLES.sql`
2. Copy toàn bộ nội dung
3. Paste vào SQL Server Management Studio
4. Chạy (Ctrl + E hoặc nút Execute)

### Bước 3: Cài Dependencies

```powershell
cd server
npm install
```

### Bước 4: Chạy Backend

```powershell
node index.js
```

**Thành công nếu thấy:**
```
✓ Connected to SQL Server successfully
  Database: cosy_game_zone
  Server: DESKTOP-4A49R3D
✓ All required tables verified
Server listening on http://localhost:4000
```

### Bước 5: Chạy Frontend (terminal mới)

```powershell
cd ..
bun run dev
```

### Bước 6: Mở Web

```
http://localhost:5173
```

---

## 📊 Cấu Trúc Database

```
DATABASE: cosy_game_zone
│
├─ dbo.users              (Người dùng)
│  ├─ id (int) ← Primary Key
│  ├─ username (nvarchar)
│  ├─ email (nvarchar)
│  ├─ password (nvarchar) ← Hashed
│  └─ created_at (datetime)
│
├─ dbo.games              (Trò chơi)
│  ├─ id (int) ← Primary Key
│  ├─ title (nvarchar)
│  ├─ category (nvarchar)
│  ├─ rating (float)
│  ├─ players (int)
│  ├─ image (nvarchar)
│  └─ created_at (datetime)
│
├─ dbo.leaderboard        (Bảng xếp hạng)
│  ├─ id (int) ← Primary Key
│  ├─ name (nvarchar)
│  ├─ score (int)
│  ├─ game_id (int)
│  ├─ user_id (int)
│  └─ created_at (datetime)
│
└─ dbo.friends            (Bạn bè)
   ├─ id (int) ← Primary Key
   ├─ user_id (int)
   ├─ name (nvarchar)
   ├─ avatar (nvarchar)
   ├─ status (nvarchar) ← 'online' / 'offline'
   └─ created_at (datetime)
```

---

## 🔗 API Endpoints

### Authentication (Không cần login)
```
POST   /api/auth/register          Đăng ký user mới
POST   /api/auth/login             Đăng nhập
GET    /api/auth/me                Lấy info user hiện tại
```

### Games (Public)
```
GET    /api/games                  Lấy danh sách game
GET    /api/games/:id              Lấy chi tiết game
```

### Leaderboard (Cần login)
```
GET    /api/leaderboard            Lấy bảng xếp hạng
POST   /api/leaderboard/submit     Gửi điểm
```

### Friends (Cần login)
```
GET    /api/friends                Lấy danh sách bạn bè
POST   /api/friends/add            Thêm bạn bè
PATCH  /api/friends/:id/status     Cập nhật trạng thái
```

---

## 🧪 Test API Bằng Postman/Insomnia

### 1. Đăng Ký

```
POST http://localhost:4000/api/auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "username": "player1",
    "email": "player1@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Đăng Nhập

```
POST http://localhost:4000/api/auth/login
Content-Type: application/json

{
  "email": "player1@example.com",
  "password": "password123"
}
```

### 3. Lấy Danh Sách Game

```
GET http://localhost:4000/api/games
```

### 4. Gửi Điểm (Cần token)

```
POST http://localhost:4000/api/leaderboard/submit
Content-Type: application/json
Authorization: Bearer {token_ở_trên}

{
  "name": "player1",
  "score": 1500,
  "gameId": 1
}
```

---

## 🐛 Troubleshooting

### ❌ "Cannot connect to server DESKTOP-4A49R3D"

**Nguyên nhân:** SQL Server không chạy hoặc tên server sai

**Giải pháp:**
1. Mở **Services** (Win + R → `services.msc`)
2. Tìm **SQL Server (MSSQLSERVER)**
3. Kiểm tra trạng thái: Running?
4. Nếu chưa chạy: Click chuột phải → Start

### ❌ "Login failed for user 'sa'"

**Nguyên nhân:** Username/password sai

**Giải pháp:**
1. Mở SQL Server Management Studio
2. Thử kết nối với: sa / 1234
3. Nếu sai, update `.env` với đúng thông tin

### ❌ "Cannot find module 'mssql'"

**Nguyên nhân:** Package chưa cài

**Giải pháp:**
```powershell
cd server
npm install mssql
```

### ❌ "⚠ Warning: Missing tables"

**Nguyên nhân:** Bảng chưa tạo

**Giải pháp:**
1. Mở `server/CREATE_TABLES.sql`
2. Chạy trong SQL Server Management Studio
3. Kiểm tra các bảng

### ❌ Frontend báo "API không kết nối"

**Nguyên nhân:** Backend không chạy

**Giải pháp:**
1. Kiểm tra backend có listening trên `http://localhost:4000` không
2. Nếu không, chạy: `node index.js` ở folder server

---

## 📁 Cấu Trúc Project

```
cosy-game-zone/
├── server/
│   ├── db.js                    ← Kết nối SQL Server (MỚI)
│   ├── app.js                   ← Express setup
│   ├── index.js                 ← Entry point
│   ├── .env                     ← Cấu hình SQL (MỚI)
│   ├── CREATE_TABLES.sql        ← Script tạo bảng (MỚI)
│   ├── routes/
│   │   ├── auth.js              ← Updated
│   │   ├── games.js             ← Updated
│   │   ├── leaderboard.js       ← Updated
│   │   └── friends.js           ← Updated
│   ├── middleware/
│   │   └── auth.js              ← Xác thực token
│   ├── package.json             ← mssql added
│   └── data/
│       └── db.json              ← ❌ Không còn dùng
│
├── src/
│   ├── App.tsx
│   ├── pages/
│   ├── components/
│   ├── lib/
│   │   ├── api.ts               ← Gọi backend API
│   │   └── auth.ts              ← Quản lý token
│   └── hooks/
│
├── package.json
├── .env
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🔐 Bảo Mật

### Password Hashing
- Mọi password được hash bằng bcrypt (10 rounds)
- Không lưu plain text password

### JWT Token
- Token hết hạn sau 7 ngày
- Lưu trong localStorage
- Gửi trong header: `Authorization: Bearer {token}`

### CORS Configuration
```javascript
// Chỉ cho phép từ frontend
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

---

## 💾 Backup & Restore Database

### Backup

```sql
BACKUP DATABASE [cosy_game_zone] 
TO DISK = 'C:\Backup\cosy_game_zone.bak'
```

### Restore

```sql
RESTORE DATABASE [cosy_game_zone] 
FROM DISK = 'C:\Backup\cosy_game_zone.bak'
```

---

## 📝 Các File Hướng Dẫn

- [SQL_SERVER_SETUP_GUIDE_VI.md](SQL_SERVER_SETUP_GUIDE_VI.md) - Chi tiết setup SQL Server
- [DATABASE_UPDATE_SUMMARY_VI.md](DATABASE_UPDATE_SUMMARY_VI.md) - Tóm tắt cập nhật
- [WEB_ARCHITECTURE_GUIDE_VI.md](WEB_ARCHITECTURE_GUIDE_VI.md) - Kiến trúc web app

---

## ✅ Checklist Trước Deploy

- [ ] SQL Server chạy ổn định
- [ ] Backup database định kỳ
- [ ] Frontend/Backend kết nối OK
- [ ] Test API endpoints
- [ ] Kiểm tra error logs
- [ ] Đổi JWT_SECRET thành random string
- [ ] Cấu hình CORS cho production

---

## 🆘 Cần Giúp?

Nếu gặp lỗi:
1. Kiểm tra console log (backend & frontend)
2. Xem file hướng dẫn liên quan
3. Test kết nối SQL Server bằng SSMS
4. Kiểm tra `.env` file

---

## 🎉 Chúc Mừng!

Web app của bạn giờ đã dùng SQL Server thực tế, sẵn sàng cho production! 🚀
