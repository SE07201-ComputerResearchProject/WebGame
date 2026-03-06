# 🔗 Hướng Dẫn Kết Nối SQL Server - Cosy Game Zone

## 📊 Trạng Thái Kết Nối Hiện Tại

✅ **Backend đã được cập nhật để kết nối SQL Server**

Thay vì JSON file (`server/data/db.json`), ứng dụng giờ đã kết nối trực tiếp tới SQL Server database của bạn:
- **Database**: cosy_game_zone
- **Server**: DESKTOP-4A49R3D
- **User**: sa

---

## ⚙️ Cấu Hình Kết Nối

Các thông tin kết nối đã được cấu hình trong file `.env`:

```env
# SQL Server Configuration
DB_SERVER=DESKTOP-4A49R3D
DB_USER=sa
DB_PASSWORD=1234
DB_NAME=cosy_game_zone
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

**⚠️ Lưu ý:** Nếu thông tin kết nối khác, hãy cập nhật file `.env` để phù hợp.

---

## 📋 Bảng Dữ Liệu Cần Có

Từ hình ảnh SQL Server Management Studio, ứng dụng cần các bảng sau. **Kiểm tra xem bảng có đúng structure không:**

### 1. **dbo.users** (Quản lý người dùng)
```sql
CREATE TABLE dbo.users (
    id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(100) NOT NULL UNIQUE,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETUTCDATE()
);
```

### 2. **dbo.games** (Danh sách trò chơi)
```sql
CREATE TABLE dbo.games (
    id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255) NOT NULL,
    category NVARCHAR(50),
    rating FLOAT,
    players INT,
    image NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETUTCDATE()
);
```

### 3. **dbo.leaderboard** (Bảng xếp hạng)
```sql
CREATE TABLE dbo.leaderboard (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL,
    score INT NOT NULL,
    game_id INT,
    user_id INT,
    created_at DATETIME DEFAULT GETUTCDATE()
);
```

### 4. **dbo.friends** (Danh sách bạn bè)
```sql
CREATE TABLE dbo.friends (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    name NVARCHAR(100) NOT NULL,
    avatar NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'offline',
    created_at DATETIME DEFAULT GETUTCDATE()
);
```

---

## 🧪 Kiểm Tra Kết Nối SQL Server

Trước khi chạy backend, kiểm tra xem SQL Server có chạy không:

### Windows:
1. Mở **SQL Server Management Studio** (SSMS)
2. Kết nối tới `DESKTOP-4A49R3D` với username `sa`
3. Kiểm tra database `cosy_game_zone` có tồn tại
4. Kiểm tra các bảng: `dbo.users`, `dbo.games`, `dbo.leaderboard`, `dbo.friends`

---

## 🚀 Chạy Backend Với SQL Server

### 1. Cài Đặt Dependencies (nếu chưa)

```powershell
cd "c:\Users\Dell\OneDrive\Documents\GitHub\cosy-game-zone\server"
npm install
# hoặc dùng bun
bun install
```

### 2. Chạy Backend

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

Nếu thấy lỗi kết nối, kiểm tra:
- ✓ SQL Server có chạy không? (Services → SQL Server)
- ✓ Thông tin DB_SERVER, DB_USER, DB_PASSWORD có đúng không?
- ✓ Database `cosy_game_zone` có tồn tại không?

---

## 📞 API Endpoints Hiện Tại

Tất cả endpoints giờ đã kết nối SQL Server:

### Authentication
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Games
- `GET /api/games` - Lấy danh sách game
- `GET /api/games/:id` - Lấy chi tiết game

### Leaderboard
- `GET /api/leaderboard` - Lấy bảng xếp hạng
- `POST /api/leaderboard/submit` - Gửi điểm

### Friends
- `GET /api/friends` - Lấy danh sách bạn bè
- `POST /api/friends/add` - Thêm bạn bè
- `PATCH /api/friends/:id/status` - Cập nhật trạng thái bạn

---

## 🧬 So Sánh: JSON vs SQL Server

| Yếu Tố | JSON (Cũ) | SQL Server (Mới) |
|--------|-----------|------------------|
| **Lưu Trữ** | File `db.json` | Database thật |
| **Tốc Độ** | Chậm (file I/O) | Nhanh (query) |
| **Khả Năng** | Giới hạn | Mạnh mẽ |
| **Năng Suất** | Phù hợp demo | Phù hợp production |
| **Concurrent** | Yếu | Mạnh |

---

## 🐛 Troubleshooting

### Lỗi: "Cannot connect to server"
```
Error: Connection failed 'DESKTOP-4A49R3D'
```
**Giải pháp:**
- Kiểm tra tên server có chính xác không
- Mở SQL Server Configuration Manager
- Bật Named Pipes + TCP/IP
- Restart SQL Server Service

### Lỗi: "Tables don't exist"
```
⚠ Warning: Missing tables - dbo.users, dbo.games, ...
```
**Giải pháp:**
- Sử dụng SQL script trên để tạo bảng
- Hoặc import backup từ file `.sql`

### Lỗi: "Login failed for user 'sa'"
```
Error: Incorrect password
```
**Giải pháp:**
- Kiểm tra DB_PASSWORD trong `.env`
- Kiểm tra user `sa` có được enable không
- Reset password trong SQL Server

---

## ✅ Checklist Trước Khi Chạy

- [ ] SQL Server đang chạy
- [ ] Database `cosy_game_zone` tồn tại
- [ ] 4 bảng (`users`, `games`, `leaderboard`, `friends`) tồn tại
- [ ] File `.env` có cấu hình đúng
- [ ] `mssql` package đã cài (`npm install mssql`)
- [ ] Backend có thể kết nối SQL Server

---

## 📌 Bước Tiếp Theo

Khi backend kết nối SQL Server thành công:

1. **Chạy Frontend**: `bun run dev` (terminal mới)
2. **Mở browser**: `http://localhost:5173`
3. **Thử đăng ký/đăng nhập** - dữ liệu sẽ lưu vào SQL Server
4. **Xem dữ liệu** - kiểm tra trong SSMS

---

## 💡 Ghi Chú

- Backend giờ dùng **SQL Server** thay vì JSON
- Mọi dữ liệu sẽ **persist** trong database (không mất khi restart)
- Có thể quản lý dữ liệu trực tiếp bằng **SSMS**
- Cần **admin** mới có thể tạo backup/restore database

Hãy báo cho tôi nếu gặp lỗi gì! 🚀
