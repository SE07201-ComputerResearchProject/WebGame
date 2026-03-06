const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../db');
const { requireAuth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const pool = getPool();
    
    // Kiểm tra user đã tồn tại
    const checkResult = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .input('username', sql.NVarChar(100), username)
      .query(`
        SELECT id FROM dbo.users 
        WHERE email = @email OR username = @username
      `);

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert user
    const insertResult = await pool.request()
      .input('username', sql.NVarChar(100), username)
      .input('email', sql.NVarChar(255), email)
      .input('password', sql.NVarChar(255), hash)
      .query(`
        INSERT INTO dbo.users (username, email, password, created_at) 
        VALUES (@username, @email, @password, GETUTCDATE());
        SELECT @@IDENTITY as id;
      `);

    const userId = insertResult.recordset[0].id;

    // Create token
    const token = jwt.sign(
      { id: userId, email, username }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      ok: true, 
      user: { id: userId, username, email }, 
      token 
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const pool = getPool();

    // Find user by email
    const result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query(`SELECT id, username, password FROM dbo.users WHERE email = @email`);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.recordset[0];

    // Compare password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, email, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      ok: true, 
      user: { id: user.id, username: user.username, email }, 
      token 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

module.exports = router;
