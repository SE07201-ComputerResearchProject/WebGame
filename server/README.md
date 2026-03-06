# Cosy Game Zone — Backend (dev scaffold)

This folder contains a minimal Express + Socket.IO backend scaffold for local development and prototyping.

Quick start:

1. cd server
2. npm install
3. npm run dev   # uses nodemon

The server runs on port 4000 by default.

Tests
- Run tests (the test suite now starts the server automatically on a random free port):

```bash
cd server
npm test
```

Socket.IO:
- Connect to the same host/port and emit `joinRoom` and `message` events. The server will broadcast messages to the room.

Notes: This is a demo scaffold. Replace with a production-ready DB and add security-hardening for production.

Persistent storage & auth
- The server uses a file-based JSON DB at `server/data/db.json` (powered by `lowdb`).
- Authentication uses JWTs (`jsonwebtoken`) and passwords are hashed with `bcrypt`.
- When you register or login you receive a token; include it in `Authorization: Bearer <token>` for protected routes and Socket.IO auth.

