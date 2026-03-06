# ✅ Tóm Tắt Cập Nhật Database - SQL Server Integration

## 🎯 Mục Đích

Chuyển đổi backend từ **JSON file** sang **SQL Server database** thực tế

---

## 📝 Các Thay Đổi Đã Thực Hiện

### 1. **Cài Đặt Driver SQL Server** ✅
```
npm install mssql
```
- Thêm package `mssql` để kết nối SQL Server
- File: `server/package.json`

### 2. **Cập Nhật File `.env`** ✅
```env
DB_SERVER=DESKTOP-4A49R3D
DB_USER=sa
DB_PASSWORD=1234
DB_NAME=cosy_game_zone
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```
- Thêm thông tin kết nối SQL Server

### 3. **Viết Lại `server/db.js`** ✅
**Cũ:** Dùng lowdb (JSON file)
**Mới:** Dùng mssql (SQL Server)

Các hàm chính:
- `init()` - Khởi tạo connection pool
- `getPool()` - Lấy pool để query
- `close()` - Đóng connection
- Tự động kiểm tra bảng khi start

### 4. **Cập Nhật `server/app.js`** ✅
- Thêm `parseCorsOrigin()` để parse CORS từ `.env`
- Cập nhật frontend URL thành `http://localhost:5173`

### 5. **Cập Nhật Routes** ✅

#### **`server/routes/auth.js`**
```javascript
// Cũ: db.read(), db.data.users.find()
// Mới: pool.request().query()

POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

#### **`server/routes/games.js`**
```javascript
GET /api/games          → SELECT từ dbo.games
GET /api/games/:id      → SELECT với WHERE id
```

#### **`server/routes/leaderboard.js`**
```javascript
GET /api/leaderboard           → SELECT từ dbo.leaderboard
POST /api/leaderboard/submit   → INSERT score vào dbo.leaderboard
```

#### **`server/routes/friends.js`**
```javascript
GET /api/friends               → SELECT từ dbo.friends
POST /api/friends/add          → INSERT vào dbo.friends
PATCH /api/friends/:id/status  → UPDATE status
```

---

## 📊 Bảng Dữ Liệu Cần Có

| Bảng | Công Dụng | Cột Chính |
|------|----------|----------|
| `dbo.users` | Quản lý người dùng | id, username, email, password |
| `dbo.games` | Danh sách trò chơi | id, title, category, rating |
| `dbo.leaderboard` | Bảng xếp hạng | id, name, score, user_id |
| `dbo.friends` | Danh sách bạn bè | id, user_id, name, status |

**File SQL tạo bảng:** [CREATE_TABLES.sql](CREATE_TABLES.sql)

---

## 🚀 Cách Sử Dụng

### 1. **Kiểm Tra SQL Server**
```powershell
# Mở SQL Server Management Studio
# Kết nối tới: DESKTOP-4A49R3D
# Username: sa
# Password: 1234
```

### 2. **Tạo Bảng (nếu chưa có)**
```sql
-- Chạy file CREATE_TABLES.sql trong SSMS
-- File nằm ở: server/CREATE_TABLES.sql
```

### 3. **Chạy Backend**
```powershell
cd server
node index.js
```

**Output mong đợi:**
```
✓ Connected to SQL Server successfully
  Database: cosy_game_zone
  Server: DESKTOP-4A49R3D
✓ All required tables verified
Server listening on http://localhost:4000
```

### 4. **Chạy Frontend (terminal mới)**
```powershell
bun run dev
```

---

## 🔄 So Sánh JSON vs SQL Server

### JSON File (Cũ)
```
✗ Dữ liệu mất khi sửa code
✗ Chậm khi có nhiều dữ liệu
✗ Khó quản lý
✗ Không thích hợp production
```

### SQL Server (Mới)
```
✓ Dữ liệu lưu vĩnh viễn
✓ Nhanh và hiệu quả
✓ Dễ quản lý trong SSMS
✓ Thích hợp production
```

---

## 📋 Checklist Trước Khi Chạy

- [ ] SQL Server đã cài
- [ ] Database `cosy_game_zone` tồn tại
- [ ] 4 bảng đã tạo (users, games, leaderboard, friends)
- [ ] File `.env` cấu hình đúng
- [ ] `npm install` ở server folder
- [ ] Kiểm tra kết nối SQL Server bằng SSMS

---

## 🐛 Nếu Có Lỗi

### Lỗi kết nối
```
Connection failed 'DESKTOP-4A49R3D'
```
→ Kiểm tra SQL Server đang chạy, tên server, user/password

### Lỗi bảng không tìm thấy
```
⚠ Warning: Missing tables
```
→ Chạy file `CREATE_TABLES.sql` để tạo bảng

### Lỗi npm package
```
Cannot find module 'mssql'
```
→ Chạy `npm install` lại

---

## 📁 File Liên Quan

| File | Mục Đích |
|------|---------|
| [server/db.js](../db.js) | Kết nối SQL Server |
| [server/.env](../.env) | Cấu hình connection |
| [server/routes/auth.js](routes/auth.js) | Authentication |
| [server/routes/games.js](routes/games.js) | Games API |
| [server/routes/leaderboard.js](routes/leaderboard.js) | Leaderboard API |
| [server/routes/friends.js](routes/friends.js) | Friends API |
| [server/CREATE_TABLES.sql](CREATE_TABLES.sql) | SQL script tạo bảng |

---

## ✨ Lợi Ích

✅ **Dữ liệu Persistent** - Lưu vĩnh viễn
✅ **Khả Năng Truy Vấn Mạnh** - Dùng SQL
✅ **Quản Lý Dễ** - Dùng SSMS
✅ **Scalable** - Có thể mở rộng
✅ **Production Ready** - Sẵn sàng deploy

---

Hãy báo tôi nếu bạn gặp vấn đề gì! 🎉
