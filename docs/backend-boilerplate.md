# Backend Boilerplate - Node.js + Express + Socket.io + MySQL

## 1. Cấu trúc Project

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # MySQL connection
│   ├── middlewares/
│   │   └── socketAuth.js     # Socket.io auth middleware
│   ├── services/
│   │   └── chatService.js    # Chat business logic
│   ├── socket/
│   │   └── handlers.js       # Socket event handlers
│   └── index.js              # Entry point
├── package.json
└── .env
```

## 2. Dependencies

```bash
npm install express socket.io mysql2 jsonwebtoken bcrypt cors dotenv winston morgan
```

## 3. Entry Point (src/index.js)

```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const { socketAuthMiddleware } = require('./middlewares/socketAuth');
const { setupSocketHandlers } = require('./socket/handlers');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

const app = express();
const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Express middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Apply authentication middleware to Socket.io
io.use(socketAuthMiddleware);

// Setup socket event handlers
setupSocketHandlers(io, logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
```

## 4. Socket Authentication Middleware (src/middlewares/socketAuth.js)

```javascript
const jwt = require('jsonwebtoken');

/**
 * ⚠️ SECURITY: Middleware xác thực cho Socket.io connections
 * Trong production cần:
 * - Verify JWT với secret key an toàn
 * - Kiểm tra token expiration
 * - Rate limiting để chống brute force
 */
const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // ⚠️ DEMO: Sử dụng secret key từ environment variable
    // Trong production: Sử dụng key mạnh và rotate định kỳ
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret-key');
    
    // Attach user info to socket
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = { socketAuthMiddleware };
```

## 5. Socket Event Handlers (src/socket/handlers.js)

```javascript
/**
 * Lưu trữ mapping userId -> socketId
 * ⚠️ PRODUCTION: Nên sử dụng Redis cho multi-server deployment
 */
const onlineUsers = new Map();

const setupSocketHandlers = (io, logger) => {
  io.on('connection', (socket) => {
    const { userId, username } = socket;
    
    logger.info(`User connected: ${username} (${userId}) - Socket: ${socket.id}`);
    
    // ================================
    // EVENT: User Online
    // ================================
    onlineUsers.set(userId, {
      socketId: socket.id,
      username: username,
      status: 'online',
      connectedAt: new Date()
    });
    
    // Broadcast to friends that user is online
    socket.broadcast.emit('user_online', { userId, username });
    
    // ================================
    // EVENT: Send Private Message
    // ================================
    socket.on('send_private_message', async (data) => {
      const { receiverId, content } = data;
      
      /**
       * ⚠️ CRITICAL SECURITY - INPUT VALIDATION & SANITIZATION
       * 
       * 1. XSS Prevention:
       *    - Escape HTML entities: < > " ' & 
       *    - Use library như: escape-html, DOMPurify (client-side)
       *    - Ví dụ: const sanitizedContent = escapeHtml(content);
       * 
       * 2. SQL Injection Prevention:
       *    - LUÔN sử dụng Prepared Statements / Parameterized Queries
       *    - KHÔNG BAO GIỜ concatenate user input vào SQL string
       *    - Ví dụ đúng:
       *      await db.execute('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)', [senderId, receiverId, sanitizedContent]);
       *    - Ví dụ SAI (vulnerable):
       *      await db.query(`INSERT INTO messages VALUES ('${senderId}', '${receiverId}', '${content}')`);
       * 
       * 3. Rate Limiting:
       *    - Giới hạn số tin nhắn/phút để chống spam
       *    - Sử dụng redis hoặc in-memory counter
       * 
       * 4. Content Validation:
       *    - Kiểm tra độ dài tối đa (e.g., 1000 characters)
       *    - Validate receiverId tồn tại trong database
       *    - Kiểm tra quan hệ bạn bè trước khi cho phép chat
       */
      
      // TODO: Implement input sanitization
      // const sanitizedContent = sanitizeInput(content);
      
      // TODO: Validate receiver exists and is friend
      // const isFriend = await validateFriendship(userId, receiverId);
      
      // TODO: Save message to database with prepared statement
      // const messageId = await saveMessage(userId, receiverId, sanitizedContent);
      
      const receiverSocket = onlineUsers.get(receiverId);
      
      const messageData = {
        id: Date.now(), // TODO: Use actual DB-generated ID
        senderId: userId,
        senderName: username,
        content: content, // TODO: Use sanitizedContent
        timestamp: new Date().toISOString()
      };
      
      // Send to receiver if online
      if (receiverSocket) {
        io.to(receiverSocket.socketId).emit('receive_private_message', messageData);
      }
      
      // Acknowledge to sender
      socket.emit('message_sent', { success: true, messageId: messageData.id });
      
      logger.info(`Message from ${userId} to ${receiverId}: ${content.substring(0, 50)}...`);
    });
    
    // ================================
    // EVENT: Typing Indicator
    // ================================
    socket.on('typing', (data) => {
      const { receiverId, isTyping } = data;
      const receiverSocket = onlineUsers.get(receiverId);
      
      if (receiverSocket) {
        io.to(receiverSocket.socketId).emit('user_typing', {
          userId,
          username,
          isTyping
        });
      }
    });
    
    // ================================
    // EVENT: Friend Request
    // ================================
    socket.on('send_friend_request', async (data) => {
      const { targetUserId } = data;
      
      // TODO: Validate và sanitize targetUserId
      // TODO: Check if request already exists
      // TODO: Save to database
      
      const targetSocket = onlineUsers.get(targetUserId);
      if (targetSocket) {
        io.to(targetSocket.socketId).emit('friend_request_received', {
          fromUserId: userId,
          fromUsername: username
        });
      }
    });
    
    // ================================
    // EVENT: Update Status
    // ================================
    socket.on('update_status', (data) => {
      const { status, currentGame } = data;
      
      if (onlineUsers.has(userId)) {
        onlineUsers.set(userId, {
          ...onlineUsers.get(userId),
          status,
          currentGame
        });
        
        // Broadcast status change
        socket.broadcast.emit('user_status_changed', {
          userId,
          status,
          currentGame
        });
      }
    });
    
    // ================================
    // EVENT: Disconnect
    // ================================
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${username} (${userId}) - Reason: ${reason}`);
      
      // Remove from online users
      onlineUsers.delete(userId);
      
      // Broadcast offline status
      socket.broadcast.emit('user_offline', { userId, username });
      
      // TODO: Update last_seen in database
      // await updateUserLastSeen(userId);
    });
  });
};

module.exports = { setupSocketHandlers, onlineUsers };
```

## 6. Database Schema (MySQL)

```sql
-- ================================
-- Users Table (cơ bản)
-- ================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- ⚠️ Dùng bcrypt/argon2 để hash
    avatar_url VARCHAR(500),
    balance DECIMAL(15, 2) DEFAULT 0.00,  -- Số dư tài khoản
    status ENUM('online', 'offline', 'playing') DEFAULT 'offline',
    current_game VARCHAR(100),
    last_seen DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- ================================
-- Friends Table (quan hệ bạn bè)
-- ================================
CREATE TABLE friends (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Đảm bảo không có duplicate friendship
    UNIQUE KEY unique_friendship (user_id, friend_id),
    
    INDEX idx_user_id (user_id),
    INDEX idx_friend_id (friend_id),
    INDEX idx_status (status)
);

-- ================================
-- Messages Table (lịch sử chat)
-- ================================
CREATE TABLE messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,  -- ⚠️ Content phải được sanitize trước khi lưu
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_conversation (sender_id, receiver_id, created_at),
    INDEX idx_unread (receiver_id, is_read)
);

-- ================================
-- Transactions Table (lịch sử nạp tiền)
-- ================================
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('deposit', 'purchase', 'refund') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50),  -- momo, zalopay, stripe, etc.
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    external_transaction_id VARCHAR(255),  -- ID từ payment gateway
    metadata JSON,  -- Thông tin bổ sung
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- ================================
-- Game Purchases Table (game đã mua)
-- ================================
CREATE TABLE game_purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_purchase (user_id, game_id),
    INDEX idx_user_id (user_id)
);
```

## 7. Utility Functions (src/utils/security.js)

```javascript
const escapeHtml = require('escape-html');
const validator = require('validator');

/**
 * Sanitize user input to prevent XSS
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  // Trim và escape HTML entities
  return escapeHtml(input.trim());
};

/**
 * Validate message content
 */
const validateMessage = (content) => {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message content is required' };
  }
  
  const trimmed = content.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (trimmed.length > 1000) {
    return { valid: false, error: 'Message too long (max 1000 characters)' };
  }
  
  return { valid: true, content: trimmed };
};

/**
 * Validate integer ID
 */
const validateId = (id) => {
  const numId = parseInt(id, 10);
  return !isNaN(numId) && numId > 0 ? numId : null;
};

module.exports = { sanitizeInput, validateMessage, validateId };
```

## 8. Environment Variables (.env.example)

```env
# Server
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=game_portal

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Stripe (Sandbox)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

## 9. Frontend Integration (React)

```typescript
// src/hooks/useSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (token: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  const sendMessage = (receiverId: number, content: string) => {
    socketRef.current?.emit('send_private_message', { receiverId, content });
  };

  return { socket: socketRef.current, isConnected, sendMessage };
};
```

---

## ⚠️ Security Checklist

- [ ] JWT secret key đủ mạnh (>= 256 bits)
- [ ] HTTPS enabled trong production
- [ ] Rate limiting cho API và Socket events
- [ ] Input validation và sanitization
- [ ] Prepared statements cho tất cả SQL queries
- [ ] Password hashing với bcrypt/argon2 (cost factor >= 10)
- [ ] CORS configured properly
- [ ] Error messages không leak sensitive info
- [ ] Logging không chứa sensitive data (passwords, tokens)
