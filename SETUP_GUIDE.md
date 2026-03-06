# 🎮 Cosy Game Zone - Setup & Run Guide

## 📋 Yêu Cầu

- **Node.js** v18+ (hoặc sử dụng Bun)
- **npm** hoặc **yarn**
- **Windows PowerShell** (để chạy script `run-dev.ps1`)

## 📦 Cấu Trúc Dự Án

```
cosy-game-zone/
├── server/              # Backend (Express + Socket.IO)
│   ├── .env            # Cấu hình backend (PORT, JWT_SECRET)
│   ├── app.js          # Ứng dụng Express
│   ├── db.js           # Cơ sở dữ liệu (lowdb)
│   ├── routes/         # API routes
│   └── package.json    
├── src/                # Frontend (React + Vite)
│   ├── App.tsx
│   ├── lib/
│   │   ├── api.ts      # API client
│   │   └── auth.ts     # Auth logic
│   └── components/
├── .env.local          # Cấu hình frontend (VITE_API_BASE)
└── package.json
```

## 🚀 Bắt Đầu

### 1. Cài Đặt Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

### 2. Cấu Hình Environment

**Frontend (`.env.local` - đã tạo sẵn):**
```env
VITE_API_BASE=http://localhost:4000
```

**Backend (`server/.env` - đã tạo sẵn):**
```env
PORT=4000
JWT_SECRET=your-very-secret-value
CORS_ORIGIN=http://localhost:8080,http://localhost:3000,http://127.0.0.1:8080
```

### 3. Chạy Backend & Frontend

#### Option A: Sử dụng PowerShell Script (Windows)
```powershell
.\run-dev.ps1
```
Lệnh này sẽ mở 2 terminal riêng:
- Terminal 1: Backend chạy trên `http://localhost:4000`
- Terminal 2: Frontend chạy trên `http://localhost:8080`

#### Option B: Chạy Thủ Công (Cmd/PowerShell)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
✅ Backend chạy trên: `http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
✅ Frontend chạy trên: `http://localhost:8080`

### 4. Truy Cập Ứng Dụng

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:4000
- **Socket.IO**: ws://localhost:4000

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user

### Games
- `GET /api/games` - Lấy danh sách trò chơi

### Leaderboard
- `GET /api/leaderboard` - Xem bảng xếp hạng
- `POST /api/leaderboard/submit` - Gửi điểm

### Friends
- `GET /api/friends` - Lấy danh sách bạn
- `POST /api/friends/add` - Thêm bạn

### WebSocket Events (Socket.IO)
- `joinRoom` - Tham gia phòng chat
- `message` - Gửi tin nhắn
- `disconnect` - Ngắt kết nối

## 🧪 Chạy Test

**Backend Tests:**
```bash
cd server
npm test
```

## 📝 Cấu Hình CORS

Backend được cấu hình để cho phép requests từ:
- `http://localhost:8080` (Frontend dev)
- `http://localhost:3000` (Alternative port)
- `http://127.0.0.1:8080`

Để thêm origins khác, sửa `CORS_ORIGIN` trong `server/.env`:
```env
CORS_ORIGIN=http://localhost:8080,http://localhost:3000,http://your-domain.com
```

## 🔐 Security Notes

⚠️ **Không commit `.env` files vào Git!**
- `.env` được thêm vào `.gitignore`
- Sử dụng `.env.example` để chia sẻ template

## 🐛 Troubleshooting

### Frontend không kết nối backend
1. Kiểm tra Backend chạy trên port 4000: `http://localhost:4000`
2. Kiểm tra `VITE_API_BASE` trong `.env.local` = `http://localhost:4000`
3. Kiểm tra CORS trong `server/.env` chứa frontend URL

### Port 4000/8080 đã được sử dụng
```bash
# Tìm process sử dụng port 4000
netstat -ano | findstr :4000

# Kill process (Windows)
taskkill /PID <PID> /F
```

### Socket.IO connection failed
1. Kiểm tra Server chạy: `http://localhost:4000`
2. Kiểm tra Socket.IO CORS cấu hình trong `server/app.js`
3. Kiểm tra `api.ts` - `BASE` URL đúng

## 📚 Các Thư Viện Chính

### Backend
- `express` - Web framework
- `socket.io` - Real-time communication
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `lowdb` - Lightweight database

### Frontend
- `react` - UI library
- `react-router-dom` - Routing
- `socket.io-client` - Socket.IO client
- `axios` - HTTP client
- `@tanstack/react-query` - Data fetching
- `tailwindcss` - CSS framework
- `shadcn/ui` - UI components

## 📖 Tài Liệu Thêm

- [Express Docs](https://expressjs.com/)
- [Socket.IO Docs](https://socket.io/docs/)
- [React Router](https://reactrouter.com/)
- [Vite Docs](https://vitejs.dev/)

## 👥 Liên Hệ & Hỗ Trợ

Nếu gặp lỗi, vui lòng kiểm tra:
1. Tất cả dependencies đã cài: `npm install` & `cd server && npm install`
2. Environment variables đã set đúng
3. Ports 4000 và 8080 khả dụng
4. Node.js version >= 18

---

**Happy Coding! 🚀**
