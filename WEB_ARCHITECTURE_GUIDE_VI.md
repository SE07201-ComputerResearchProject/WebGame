# 🎮 Hướng Dẫn Kiến Trúc Web App - Cosy Game Zone

## Phần 1: Cơ Bản - Web Này Khác Gì Với HTML/CSS Thôi?

### Web HTML/CSS Thôi:
```
┌─────────────────────────┐
│   index.html            │
│   - Tiêu đề             │
│   - Nội dung tĩnh       │
│   - Style CSS           │
└─────────────────────────┘
```
- **Tĩnh**: Nội dung không thay đổi
- **Không lưu trữ**: Không có cơ sở dữ liệu
- **Không tương tác**: Chỉ hiển thị, không xử lý logic

### Web App Này (Modern Full-Stack):
```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│         - Giao diện động (UI tương tác)                  │
│         - Xử lý logic phía client                         │
│         - Kết nối với Backend qua API                    │
└────────────────┬─────────────────────────────────────────┘
                 │ (HTTP/HTTPS Requests)
                 │ (WebSocket - real-time chat)
┌────────────────▼─────────────────────────────────────────┐
│                   BACKEND (Node.js)                      │
│      - Xử lý yêu cầu từ Frontend                         │
│      - Quản lý cơ sở dữ liệu (Database)                  │
│      - Xác thực người dùng (Authentication)              │
│      - Tính toán điểm, xếp hạng, bạn bè                 │
└────────────────┬─────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────┐
│                  DATABASE (JSON)                         │
│      - Lưu trữ dữ liệu người dùng                        │
│      - Lưu trữ thông tin game                            │
│      - Lưu trữ bảng xếp hạng                             │
└──────────────────────────────────────────────────────────┘
```

---

## Phần 2: Luồng Xử Lý (Processing Flow)

### Ví dụ 1: Người Dùng Đăng Ký

```
1. FRONTEND (src/App.tsx → AuthModal)
   ┌─────────────────────────────────┐
   │ Người dùng nhập:                │
   │ - Username: "JohnGamer"         │
   │ - Email: "john@example.com"     │
   │ - Password: "123456"            │
   │ Rồi bấm nút "Register"          │
   └──────────────┬──────────────────┘
                  │
                  ▼
2. FRONTEND gọi API (src/lib/api.ts)
   ┌──────────────────────────────────┐
   │ register({                       │
   │   username: "JohnGamer",         │
   │   email: "john@example.com",     │
   │   password: "123456"             │
   │ })                               │
   └──────────────┬───────────────────┘
                  │
    ═════════════════════════════════════
    HTTP POST Request gửi đến Backend
    ═════════════════════════════════════
                  │
                  ▼
3. BACKEND nhận yêu cầu (server/routes/auth.js)
   ┌───────────────────────────────────┐
   │ Kiểm tra:                         │
   │ ✓ Email chưa tồn tại?            │
   │ ✓ Password đủ mạnh?              │
   │ ✓ Username hợp lệ?               │
   └──────────────┬────────────────────┘
                  │
                  ▼
4. BACKEND lưu vào Database (server/data/db.json)
   ┌────────────────────────────────────┐
   │ {                                  │
   │   "users": [                       │
   │     {                              │
   │       "id": 1,                     │
   │       "username": "JohnGamer",     │
   │       "email": "john@example.com", │
   │       "password": "hashed_xxx"     │
   │     }                              │
   │   ]                                │
   │ }                                  │
   └──────────────┬─────────────────────┘
                  │
    ═════════════════════════════════════
    HTTP Response trả về Frontend
    Response: { success: true, message: "Đăng ký thành công" }
    ═════════════════════════════════════
                  │
                  ▼
5. FRONTEND nhận phản hồi (src/App.tsx → AuthModal)
   ┌───────────────────────────────────┐
   │ Nếu thành công:                  │
   │ - Hiển thị "Đăng ký thành công"  │
   │ - Lưu token vào localStorage     │
   │ - Chuyển hướng đến trang chính   │
   │                                   │
   │ Nếu lỗi:                          │
   │ - Hiển thị thông báo lỗi          │
   └───────────────────────────────────┘
```

### Ví dụ 2: Xem Danh Sách Game

```
FRONTEND (Components/GameGrid.tsx)
  │
  ├─→ Khi component load, gọi: getGames()
  │
  ▼
API Layer (src/lib/api.ts)
  │
  ├─→ Fetch từ: http://localhost:4000/api/games
  ├─→ Kèm theo: Authorization header (token)
  │
  ▼
BACKEND (server/routes/games.js)
  │
  ├─→ Kiểm tra token xác thực
  ├─→ Lấy danh sách game từ Database
  ├─→ Trả về JSON: [{ id, name, description }, ...]
  │
  ▼
FRONTEND nhận dữ liệu
  │
  ├─→ Render components GameCard
  ├─→ Hiển thị: tên game, mô tả, hình ảnh
```

### Ví dụ 3: Real-time Chat (WebSocket)

```
FRONTEND (Components/ChatWindow.tsx)
  │
  ├─→ Kết nối: createSocket()
  ├─→ Gửi tin: socket.emit('message', { text: "Hi!" })
  │
  ▼
WebSocket Connection
  (Socket.IO - kết nối real-time, không phải HTTP)
  
  ▼
BACKEND (server/app.js)
  │
  ├─→ Nhận: socket.on('message')
  ├─→ Broadcast tới những user khác
  │
  ▼
FRONTEND (Người dùng khác)
  │
  ├─→ Nhận tin nhắn ngay lập tức
  ├─→ Hiển thị trong ChatWindow
```

---

## Phần 3: Cấu Trúc File & Vai Trò

### 📁 FRONTEND (src/)

#### `src/App.tsx` - **Entry Point chính**
- Định nghĩa các route (tuyến đường)
- Setup React Query, Router, Providers
- Giống như "bảng điều khiển chính" của web

#### `src/pages/` - **Các trang chính**
- `Index.tsx` - Trang chủ
- `NotFound.tsx` - Trang 404

#### `src/components/` - **Các phần giao diện**
- `AuthModal.tsx` - Modal đăng nhập/đăng ký
- `GameGrid.tsx` - Lưới hiển thị game
- `Leaderboard.tsx` - Bảng xếp hạng
- `FriendsSidebar.tsx` - Thanh bạn bè
- `ChatWindow.tsx` - Cửa sổ chat

#### `src/lib/`
- **`api.ts`** - 🔑 **QUAN TRỌNG: Kết nối Frontend → Backend**
  ```typescript
  // Định nghĩa các hàm để gọi API Backend
  export async function getGames() { ... }
  export async function login(payload) { ... }
  export async function submitScore(payload) { ... }
  ```

- **`auth.ts`** - Quản lý token người dùng
- **`config.ts`** - Cấu hình chung
- **`utils.ts`** - Các hàm tiện ích

#### `src/hooks/` - **Custom Hooks (Logic tái sử dụng)**
- `use-toast.ts` - Hiển thị thông báo
- `use-mobile.tsx` - Phát hiện thiết bị mobile

---

### 📁 BACKEND (server/)

#### `server/app.js` - **Entry Point Backend**
```javascript
// Cấu hình Express server
// Cấu hình CORS (cho phép Frontend kết nối)
// Cấu hình Socket.IO (chat real-time)
// Mount các route
```

#### `server/routes/` - **Xử lý các yêu cầu API**
- **`auth.js`** - POST /api/auth/register, /api/auth/login
- **`games.js`** - GET /api/games
- **`leaderboard.js`** - GET /api/leaderboard, POST /api/leaderboard/submit
- **`friends.js`** - GET /api/friends, POST /api/friends/add

#### `server/middleware/` - **Xử lý trung gian**
- `auth.js` - Kiểm tra token xác thực trước khi xử lý request

#### `server/db.js` - **Kết nối Database**
- Quản lý tệp JSON (server/data/db.json)
- Lưu/đọc dữ liệu người dùng, game, điểm số

---

## Phần 4: Làm Cách Nào Để Web Hoạt Động?

### Bước 1: Chuẩn Bị Môi Trường

**Cần cài đặt:**
- ✅ **Node.js** (đã có?)
  ```powershell
  node --version  # Nên là v18+ trở lên
  npm --version
  ```

- ✅ **Bun** (thay thế npm/yarn, nhanh hơn)
  ```powershell
  bun --version
  ```

- ✅ **IDE**: VS Code (đã dùng rồi)

### Bước 2: Cài Đặt Dependencies

#### Frontend:
```powershell
cd c:\Users\Dell\OneDrive\Documents\GitHub\cosy-game-zone
bun install
# hoặc
npm install
```

#### Backend:
```powershell
cd server
bun install
# hoặc
npm install
```

### Bước 3: Chạy Backend Trước (quan trọng!)

```powershell
cd server
node index.js
# Output: Server running on port 4000
```
- Backend nghe ở port **4000**
- Cơ sở dữ liệu sẽ ở `server/data/db.json`

### Bước 4: Chạy Frontend (terminal mới)

```powershell
cd c:\Users\Dell\OneDrive\Documents\GitHub\cosy-game-zone
bun run dev
# hoặc
npm run dev
```
- Frontend sẽ chạy ở port **5173** (hoặc tương tự)
- Mở browser: `http://localhost:5173`

---

## Phần 5: Kết Nối Backend ↔️ Frontend (Qua API)

### 🔗 Cơ Chế Kết Nối

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (http://localhost:5173)                           │
│                                                              │
│  src/components/GameGrid.tsx                                │
│  ┌──────────────────────────────────┐                       │
│  │ useEffect(() => {                │                       │
│  │   getGames(); // Gọi hàm API     │                       │
│  │ }, [])                           │                       │
│  └──────────────┬───────────────────┘                       │
└─────────────────┼──────────────────────────────────────────┘
                  │
      ▼▼▼ HTTP GET Request ▼▼▼
      http://localhost:4000/api/games
      Headers: {
        Authorization: "Bearer token_123...",
        Content-Type: "application/json"
      }
      ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
                  │
┌─────────────────▼──────────────────────────────────────────┐
│  Backend (http://localhost:4000)                           │
│                                                              │
│  server/routes/games.js                                    │
│  ┌──────────────────────────────────┐                       │
│  │ app.get('/api/games', (req, res) │                       │
│  │   // Kiểm tra token              │                       │
│  │   // Lấy dữ liệu từ database     │                       │
│  │   // Trả về JSON                 │                       │
│  │ })                               │                       │
│  └──────────────┬───────────────────┘                       │
└─────────────────┼──────────────────────────────────────────┘
                  │
      ▼▼▼ HTTP Response ▼▼▼
      {
        "success": true,
        "games": [
          { "id": 1, "name": "Chess", "description": "..." },
          { "id": 2, "name": "Tic Tac Toe", "description": "..." }
        ]
      }
      ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
                  │
┌─────────────────▼──────────────────────────────────────────┐
│  Frontend - Xử Lý Dữ Liệu                                  │
│                                                              │
│  setState(games) // Lưu vào React state                    │
│  render() // Vẽ lại components với dữ liệu mới             │
└─────────────────────────────────────────────────────────────┘
```

### 📄 File Quan Trọng: `src/lib/api.ts`

Đây là **"cầu nối"** giữa Frontend và Backend:

```typescript
// 1. Định nghĩa URL Backend
const BASE = "http://localhost:4000"

// 2. Tạo header với token (xác thực)
function authHeaders() {
  const token = getToken(); // Lấy token từ localStorage
  return { 
    Authorization: `Bearer ${token}`, 
    "Content-Type": "application/json" 
  };
}

// 3. Hàm gọi API (giống "gửi yêu cầu")
async function postJSON(path: string, body: any) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

// 4. Các hàm cụ thể (người dùng gọi trực tiếp)
export async function register(payload) {
  return postJSON("/api/auth/register", payload);
}

export async function login(payload) {
  return postJSON("/api/auth/login", payload);
}

export async function getGames() {
  const res = await fetch(`${BASE}/api/games`, { 
    headers: authHeaders() 
  });
  return res.json();
}
```

---

## Phần 6: Thiếu Gì Không?

### ✅ Đã Có:

| Component | File | Trạng Thái |
|-----------|------|----------|
| **Frontend** | `src/`, `package.json` | ✅ Hoàn chỉnh |
| **Backend** | `server/app.js`, `routes/` | ✅ Hoàn chỉnh |
| **Database** | `server/data/db.json` | ✅ Có |
| **UI Library** | shadcn/ui, Radix UI | ✅ Cài đủ |
| **State Management** | React Query | ✅ Có |
| **Real-time Chat** | Socket.IO | ✅ Cấu hình rồi |

### ⚠️ Cần Chú Ý:

1. **Environment Variables** (.env)
   ```
   Nên tạo file .env ở root project:
   VITE_API_BASE=http://localhost:4000
   ```

2. **Port Mặc Định**:
   - Backend: `http://localhost:4000`
   - Frontend: `http://localhost:5173`
   - Nếu Backend khác port, sửa trong `src/lib/api.ts`

3. **CORS đã cấu hình** ở `server/app.js`
   ```javascript
   const corsOptions = {
     origin: ['http://localhost:8080', 'http://localhost:3000', ...]
   };
   ```

---

## Phần 7: Sơ Đồ Luồng Dữ Liệu Tổng Quan

```
┌──────────────────────────────────────────────────────────────┐
│                     BROWSER                                  │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  React App (src/App.tsx)                                 ││
│  │  │                                                        ││
│  │  ├─ Navbar.tsx (điều hướng)                              ││
│  │  ├─ AuthModal.tsx (đăng nhập)                            ││
│  │  ├─ GameGrid.tsx (danh sách game)                        ││
│  │  ├─ Leaderboard.tsx (bảng xếp hạng)                      ││
│  │  ├─ FriendsSidebar.tsx (danh sách bạn)                   ││
│  │  └─ ChatWindow.tsx (chat real-time)                      ││
│  └──────────────────────────────────────────────────────────┘│
│  └─ src/lib/api.ts (các hàm gọi API)                         │
└───────────────────────────┬──────────────────────────────────┘
                            │
                 HTTP / WebSocket Requests
                            │
┌───────────────────────────▼──────────────────────────────────┐
│              NODE.js Server (port 4000)                      │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Express.js (server/app.js)                              ││
│  │  │                                                        ││
│  │  ├─ server/routes/auth.js (/api/auth/*)                 ││
│  │  ├─ server/routes/games.js (/api/games)                 ││
│  │  ├─ server/routes/leaderboard.js (/api/leaderboard)     ││
│  │  ├─ server/routes/friends.js (/api/friends)             ││
│  │  └─ server/middleware/auth.js (xác thực)                ││
│  └──────────────────────────────────────────────────────────┘│
│  └─ server/db.js (quản lý database)                         │
└───────────────────────────┬──────────────────────────────────┘
                            │
              Read/Write JSON File
                            │
┌───────────────────────────▼──────────────────────────────────┐
│            Database (server/data/db.json)                    │
│  {                                                            │
│    "users": [...],                                            │
│    "games": [...],                                            │
│    "leaderboard": [...],                                      │
│    "friends": [...]                                           │
│  }                                                            │
└───────────────────────────────────────────────────────────────┘
```

---

## Phần 8: Hành Động Tiếp Theo

### 🎯 Để Chạy Web Thành Công:

1. **Kiểm tra môi trường:**
   ```powershell
   node --version
   npm --version
   bun --version
   ```

2. **Cài dependencies:**
   ```powershell
   bun install
   cd server && bun install && cd ..
   ```

3. **Chạy Backend:**
   ```powershell
   cd server
   node index.js
   ```

4. **Chạy Frontend (terminal mới):**
   ```powershell
   bun run dev
   ```

5. **Mở browser:**
   ```
   http://localhost:5173
   ```

---

## 📝 Tóm Tắt Khác Biệt: Web Thường vs Web App Này

| Yếu Tố | Web HTML/CSS Thôi | Web App Này |
|--------|-------------------|------------|
| **Tính Động** | Tĩnh | Động, tương tác |
| **Lưu Trữ Dữ Liệu** | Không | Có (database) |
| **Người Dùng** | Tất cả là một | Riêng biệt (account) |
| **Tính Toán** | Browser | Server + Browser |
| **Real-time** | Không | Có (chat, Socket.IO) |
| **Xác Thực** | Không | Có (login/token) |
| **Cơ Sở Dữ Liệu** | Không | JSON Database |
| **API** | Không | Có (REST + WebSocket) |
| **Số File** | Ít (1-10) | Nhiều (100+) |
| **Phức Tạp** | Đơn Giản | Phức Tạp |

---

## 💡 Kết Luận

Web app này là một **Full-Stack Application** (Frontend + Backend):

- **Frontend** chịu trách nhiệm **hiển thị giao diện** và **tương tác người dùng**
- **Backend** chịu trách nhiệm **xử lý logic** và **lưu trữ dữ liệu**
- **Database** lưu trữ mọi thông tin (người dùng, game, điểm số)
- **API** là "cầu nối" giữa Frontend và Backend

Nó **không phải chỉ HTML/CSS** vì nó có:
✅ Đăng nhập/đăng ký (xác thực)
✅ Bảng xếp hạng động
✅ Danh sách bạn bè
✅ Chat real-time
✅ Lưu trữ dữ liệu
✅ Xử lý logic phía server

Hãy bắt đầu với bước 1 ở trên! 🚀
