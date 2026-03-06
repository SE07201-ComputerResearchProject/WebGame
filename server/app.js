const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const authRouter = require('./routes/auth');
const gamesRouter = require('./routes/games');
const leaderboardRouter = require('./routes/leaderboard');
const friendsRouter = require('./routes/friends');
const { init } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Parse CORS_ORIGIN from environment
function parseCorsOrigin() {
  const origin = process.env.CORS_ORIGIN;
  if (!origin) {
    return ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
  }
  return origin.split(',').map(s => s.trim());
}

function createApp() {
  const app = express();
  
  // Configure CORS - allow frontend
  const corsOrigins = parseCorsOrigin();
  const corsOptions = {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
  app.use(cors(corsOptions));
  app.use(express.json());

  app.use('/api/auth', authRouter);
  app.use('/api/games', gamesRouter);
  app.use('/api/leaderboard', leaderboardRouter);
  app.use('/api/friends', friendsRouter);

  app.get('/', (req, res) => res.json({ ok: true, message: 'Cosy Game Zone API' }));

  return app;
}

async function start(port = 0) {
  await init();
  const app = createApp();
  const server = http.createServer(app);
  
  // Configure Socket.IO CORS to match Express CORS
  const corsOrigins = parseCorsOrigin();
  const socketIoCorsOptions = {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  };
  const io = new Server(server, { cors: socketIoCorsOptions });

  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next();
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      socket.user = payload;
    } catch (e) {
      console.log('socket auth failed', e.message);
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log('socket connected:', socket.id, socket.user ? socket.user.id : 'guest');

    socket.on('joinRoom', (room) => {
      socket.join(room);
      socket.to(room).emit('system', `${socket.user?.username || socket.id} joined ${room}`);
    });

    socket.on('message', ({ room, message, sender }) => {
      const payload = { id: Date.now(), message, sender, time: new Date().toISOString(), user: socket.user };
      io.to(room).emit('message', payload);
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected:', socket.id);
    });
  });

  await new Promise((resolve, reject) => {
    server.listen(port, () => resolve());
    server.on('error', reject);
  });

  return { server, io, app };
}

async function stop(serverObj) {
  if (!serverObj || !serverObj.server) return;
  await new Promise((resolve) => serverObj.server.close(() => resolve()));
}

module.exports = { createApp, start, stop };
