# 📖 INDEX - Hướng Dẫn Kiến Trúc & Cấu Hình

## 🚀 Bắt Đầu Nhanh

👉 **[CHECKLIST_FINAL_VI.md](CHECKLIST_FINAL_VI.md)** - Tóm tắt công việc đã làm (3-5 phút đọc)

👉 **[COMPLETE_GUIDE_VI.md](COMPLETE_GUIDE_VI.md)** - Hướng dẫn chạy web từ A-Z (5-10 phút)

---

## 📚 Hướng Dẫn Chi Tiết

### 🔧 Cấu Hình & Setup

| Tài Liệu | Nội Dung | Mục Đích |
|---------|---------|---------|
| [SQL_SERVER_SETUP_GUIDE_VI.md](SQL_SERVER_SETUP_GUIDE_VI.md) | Chi tiết cấu hình SQL Server, troubleshooting | Dành cho người chưa setup SQL Server |
| [DATABASE_UPDATE_SUMMARY_VI.md](DATABASE_UPDATE_SUMMARY_VI.md) | Tóm tắt thay đổi, files đã sửa | Xem những file nào bị thay đổi |

### 🏗️ Kiến Trúc & Thiết Kế

| Tài Liệu | Nội Dung | Mục Đích |
|---------|---------|---------|
| [WEB_ARCHITECTURE_GUIDE_VI.md](WEB_ARCHITECTURE_GUIDE_VI.md) | Kiến trúc toàn bộ web, phân biệt HTML/CSS vs Full-Stack | Hiểu cách hoạt động của web app |
| [ARCHITECTURE_DIAGRAM_VI.md](ARCHITECTURE_DIAGRAM_VI.md) | Sơ đồ kết nối chi tiết, luồng dữ liệu | Visual learner |

### ✅ Checklist & Kiểm Tra

| Tài Liệu | Nội Dung | Mục Đích |
|---------|---------|---------|
| [CHECKLIST_FINAL_VI.md](CHECKLIST_FINAL_VI.md) | Kiểm tra công việc đã hoàn tất | Xác nhận tất cả đã sửa |

---

## 🎯 Nên Đọc Theo Thứ Tự

### 👨‍💼 Cho quản lý/leader nhóm
1. [DATABASE_UPDATE_SUMMARY_VI.md](DATABASE_UPDATE_SUMMARY_VI.md) - Hiểu thay đổi gì
2. [CHECKLIST_FINAL_VI.md](CHECKLIST_FINAL_VI.md) - Xác nhận hoàn tất

### 👨‍💻 Cho developer chưa quen
1. [WEB_ARCHITECTURE_GUIDE_VI.md](WEB_ARCHITECTURE_GUIDE_VI.md) - Hiểu cấu trúc
2. [COMPLETE_GUIDE_VI.md](COMPLETE_GUIDE_VI.md) - Chạy web
3. [ARCHITECTURE_DIAGRAM_VI.md](ARCHITECTURE_DIAGRAM_VI.md) - Hiểu sâu luồng dữ liệu

### 👨‍🔧 Cho DevOps/Database admin
1. [SQL_SERVER_SETUP_GUIDE_VI.md](SQL_SERVER_SETUP_GUIDE_VI.md) - Setup SQL Server
2. [server/CREATE_TABLES.sql](server/CREATE_TABLES.sql) - Tạo bảng
3. [COMPLETE_GUIDE_VI.md](COMPLETE_GUIDE_VI.md) - Chạy backend

### 🐛 Có lỗi?
1. [SQL_SERVER_SETUP_GUIDE_VI.md](SQL_SERVER_SETUP_GUIDE_VI.md) - Mục "Troubleshooting"
2. [COMPLETE_GUIDE_VI.md](COMPLETE_GUIDE_VI.md) - Mục "Troubleshooting"

---

## 📋 Bảng Tóm Tắt

### Cấu Trúc Project

```
cosy-game-zone/
├── 📄 Hướng Dẫn (mọi người đều nên đọc)
│   ├── CHECKLIST_FINAL_VI.md           ← START HERE
│   ├── COMPLETE_GUIDE_VI.md            ← Chạy web
│   ├── WEB_ARCHITECTURE_GUIDE_VI.md    ← Hiểu cấu trúc
│   ├── SQL_SERVER_SETUP_GUIDE_VI.md    ← Setup database
│   ├── ARCHITECTURE_DIAGRAM_VI.md      ← Sơ đồ chi tiết
│   └── DATABASE_UPDATE_SUMMARY_VI.md   ← Thay đổi gì
│
├── server/                             ← BACKEND
│   ├── db.js                           ✅ Updated (SQL Server)
│   ├── app.js                          ✅ Updated
│   ├── .env                            ✅ Updated
│   ├── CREATE_TABLES.sql               ✅ Mới (tạo bảng)
│   ├── routes/
│   │   ├── auth.js                     ✅ Updated
│   │   ├── games.js                    ✅ Updated
│   │   ├── leaderboard.js              ✅ Updated
│   │   └── friends.js                  ✅ Updated
│   └── package.json                    ✅ mssql added
│
├── src/                                ← FRONTEND
│   ├── App.tsx
│   ├── components/
│   ├── lib/
│   │   └── api.ts                      (không thay đổi)
│   └── ...
│
└── ... (các file khác)
```

---

## 🔌 Backend API Endpoints

### Authentication
```
POST   /api/auth/register      Đăng ký (không cần token)
POST   /api/auth/login         Đăng nhập (không cần token)
GET    /api/auth/me            Lấy info user (cần token)
```

### Games
```
GET    /api/games              Lấy danh sách game
GET    /api/games/:id          Lấy chi tiết game
```

### Leaderboard
```
GET    /api/leaderboard        Lấy bảng xếp hạng
POST   /api/leaderboard/submit Gửi điểm (cần token)
```

### Friends
```
GET    /api/friends            Lấy bạn bè (cần token)
POST   /api/friends/add        Thêm bạn (cần token)
PATCH  /api/friends/:id/status Cập nhật trạng thái (cần token)
```

---

## 🗄️ Database Schema

### dbo.users
```sql
id (PRIMARY KEY)
username (UNIQUE)
email (UNIQUE)
password (hashed)
created_at
```

### dbo.games
```sql
id (PRIMARY KEY)
title
category
rating
players
image
created_at
```

### dbo.leaderboard
```sql
id (PRIMARY KEY)
name
score
game_id
user_id
created_at
```

### dbo.friends
```sql
id (PRIMARY KEY)
user_id
name
avatar
status (online/offline)
created_at
```

---

## 🚀 Lệnh Chạy Nhanh

```powershell
# Terminal 1 - Backend
cd server
node index.js

# Terminal 2 - Frontend
bun run dev

# Mở browser
http://localhost:5173
```

---

## 🔐 Environment Variables

File: `server/.env`

```env
DB_SERVER=DESKTOP-4A49R3D       # Tên server
DB_USER=sa                       # Username
DB_PASSWORD=1234                 # Password
DB_NAME=cosy_game_zone          # Database name
DB_PORT=1433                     # Port mặc định
DB_ENCRYPT=false                 # Không encrypt (local dev)
DB_TRUST_SERVER_CERTIFICATE=true # Trust certificate (local dev)
```

---

## 📊 So Sánh Trước - Sau

| | JSON (Cũ) | SQL Server (Mới) |
|---|-----------|------------------|
| File | `server/data/db.json` | Database `cosy_game_zone` |
| Kết nối | Đọc/ghi file | Query SQL |
| Dữ liệu sau restart | Mất | Lưu vĩnh viễn |
| Tốc độ | Chậm | Nhanh |
| Concurrent | Yếu | Mạnh |
| Admin | Sửa JSON | SSMS |

---

## 💡 Ghi Chú Quan Trọng

1. **SQL Server phải chạy** trước khi start backend
2. **Tạo bảng** bằng `CREATE_TABLES.sql` (chỉ 1 lần)
3. **Token JWT** hết hạn sau 7 ngày
4. **Password** đều được hash bằng bcrypt
5. **CORS** cấu hình cho frontend localhost:5173

---

## 🆘 Khi Có Vấn Đề

1. **Xem console log** (backend & frontend)
2. **Mở DevTools** (F12 trên browser) - tab Network/Console
3. **Kiểm tra SQL Server** - SSMS kết nối được không?
4. **Kiểm tra .env** - DB config đúng không?
5. **Xem hướng dẫn** - Mục Troubleshooting

---

## 📞 Liên Hệ

Nếu cần giúp:
1. Kiểm tra file hướng dẫn liên quan
2. Xem lỗi trong console
3. Báo lỗi cụ thể (code, message, screenshot)

---

## ✅ Điều Kiện Thành Công

- [ ] SQL Server đang chạy
- [ ] 4 bảng đã tạo
- [ ] Backend kết nối SQL Server (output: ✓ Connected)
- [ ] Frontend chạy trên port 5173
- [ ] Có thể đăng ký, đăng nhập
- [ ] Dữ liệu lưu trong database

**Nếu tất cả ✓ = Hoàn tất!** 🎉

---

🚀 **Ready to go!** Hãy bắt đầu với [CHECKLIST_FINAL_VI.md](CHECKLIST_FINAL_VI.md)
