const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { getPool, sql } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

// Hàm kiểm tra Captcha Google
async function verifyCaptcha(token) {
  if (!token || !RECAPTCHA_SECRET_KEY) return false;
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    return false;
  }
}

// ==========================================
// CÁC API ĐĂNG KÝ / ĐĂNG NHẬP
// ==========================================

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, captchaToken } = req.body;
    if (!username || !email || !password || !captchaToken) return res.status(400).json({ error: "Vui lòng điền đủ thông tin và xác nhận CAPTCHA" });

    const isHuman = await verifyCaptcha(captchaToken);
    if (!isHuman) return res.status(400).json({ error: "Xác thực người máy thất bại" });

    const pool = getPool();
    const checkResult = await pool.request().input('email', sql.NVarChar(255), email).input('username', sql.NVarChar(100), username).query(`SELECT id FROM dbo.users WHERE email = @email OR username = @username`);
    if (checkResult.recordset.length > 0) return res.status(409).json({ error: "Email hoặc Username đã tồn tại" });

    const hash = await bcrypt.hash(password, 10);
    const insertResult = await pool.request().input('username', sql.NVarChar(100), username).input('email', sql.NVarChar(255), email).input('password', sql.NVarChar(255), hash).query(`
        INSERT INTO dbo.users (username, email, password, created_at) VALUES (@username, @email, @password, GETUTCDATE()); SELECT @@IDENTITY as id;
      `);

    const user = { id: insertResult.recordset[0].id, username, email };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, user, token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;
    if (!email || !password || !captchaToken) return res.status(400).json({ error: "Vui lòng điền đủ thông tin và CAPTCHA" });

    const isHuman = await verifyCaptcha(captchaToken);
    if (!isHuman) return res.status(400).json({ error: "Xác thực người máy thất bại" });

    const pool = getPool();
    const result = await pool.request().input('email', sql.NVarChar(255), email).query(`SELECT id, username, password, mfa_enabled, mfa_type, phone FROM dbo.users WHERE email = @email`);
    if (result.recordset.length === 0) return res.status(401).json({ error: "Sai email hoặc mật khẩu" });

    const user = result.recordset[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Sai email hoặc mật khẩu" });

    if (user.mfa_enabled) {
      if (user.mfa_type === 'sms') {
        // Giao việc gửi OTP cho Firebase ở Frontend, Backend chỉ trả về phone để Frontend biết đường gửi
        const tempToken = jwt.sign({ id: user.id, email, username: user.username, mfaPending: true, mfaType: 'sms', phone: user.phone }, JWT_SECRET, { expiresIn: '10m' });
        return res.json({ ok: true, mfaRequired: true, mfaType: 'sms', phoneMask: user.phone.slice(-4), phone: user.phone, tempToken, message: "Đang kết nối Firebase..." });
      } else {
        const tempToken = jwt.sign({ id: user.id, email, username: user.username, mfaPending: true, mfaType: 'app' }, JWT_SECRET, { expiresIn: '5m' });
        return res.json({ ok: true, mfaRequired: true, mfaType: 'app', tempToken, message: "Vui lòng nhập mã Google Authenticator" });
      }
    }

    const token = jwt.sign({ id: user.id, email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, user: { id: user.id, username: user.username, email }, token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// API: Xử lý Đăng nhập bằng Google
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "Thiếu thông tin Google" });

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name } = payload;
    const pool = getPool();

    let result = await pool.request().input('email', sql.NVarChar(255), email).query(`SELECT id, username, mfa_enabled, mfa_type, phone FROM dbo.users WHERE email = @email`);
    let user;

    if (result.recordset.length === 0) {
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const hash = await bcrypt.hash(randomPassword, 10);
      const baseUsername = name.replace(/\s+/g, '').toLowerCase();
      
      const insertResult = await pool.request()
        .input('username', sql.NVarChar(100), baseUsername)
        .input('email', sql.NVarChar(255), email)
        .input('password', sql.NVarChar(255), hash)
        .query(`INSERT INTO dbo.users (username, email, password, created_at) VALUES (@username, @email, @password, GETUTCDATE()); SELECT @@IDENTITY as id;`);
      user = { id: insertResult.recordset[0].id, username: baseUsername, email, mfa_enabled: false };
    } else { user = result.recordset[0]; }

    if (user.mfa_enabled) {
      if (user.mfa_type === 'sms') {
        const tempToken = jwt.sign({ id: user.id, email, username: user.username, mfaPending: true, mfaType: 'sms', phone: user.phone }, JWT_SECRET, { expiresIn: '10m' });
        return res.json({ ok: true, mfaRequired: true, mfaType: 'sms', phoneMask: user.phone.slice(-4), phone: user.phone, tempToken, message: "Đang kết nối Firebase..." });
      } else {
        const tempToken = jwt.sign({ id: user.id, email, username: user.username, mfaPending: true, mfaType: 'app' }, JWT_SECRET, { expiresIn: '5m' });
        return res.json({ ok: true, mfaRequired: true, mfaType: 'app', tempToken, message: "Vui lòng nhập mã Google Authenticator" });
      }
    }

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, user: { id: user.id, username: user.username, email: user.email }, token });
  } catch (err) { res.status(500).json({ error: "Lỗi xác thực với Google" }); }
});

// ==========================================
// XÁC THỰC MFA ĐĂNG NHẬP (CHUNG CHO SMS & APP)
// ==========================================
router.post("/login/mfa", async (req, res) => {
  try {
    const { tempToken, code } = req.body; 
    if (!tempToken) return res.status(400).json({ error: "Thiếu thông tin xác thực" });
    const decoded = jwt.verify(tempToken, JWT_SECRET);
    if (!decoded.mfaPending) return res.status(400).json({ error: "Token không hợp lệ" });

    const pool = getPool();
    
    if (decoded.mfaType === 'sms') {
      // Firebase đã check mã OTP. Frontend gửi "firebase_ok" để xác nhận
      if (code !== "firebase_ok") return res.status(401).json({ error: "Lỗi xác thực Firebase!" });
    } else {
      const result = await pool.request().input('id', sql.Int, decoded.id).query(`SELECT mfa_secret FROM dbo.users WHERE id = @id`);
      const verified = speakeasy.totp.verify({ secret: result.recordset[0].mfa_secret, encoding: 'base32', token: code, window: 1 });
      if (!verified) return res.status(401).json({ error: "Mã xác thực không chính xác" });
    }

    const realToken = jwt.sign({ id: decoded.id, email: decoded.email, username: decoded.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, user: { id: decoded.id, username: decoded.username, email: decoded.email }, token: realToken });
  } catch (err) { res.status(401).json({ error: "Phiên đăng nhập hết hạn" }); }
});

// ==========================================
// CÁC HÀM CÀI ĐẶT MFA
// ==========================================

router.post("/mfa/setup-sms", requireAuth, async (req, res) => {
  // Frontend gọi Firebase, Backend chỉ cần trả về OK
  res.json({ ok: true, message: "Firebase is handling SMS" });
});

router.post("/mfa/enable-sms", requireAuth, async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (code !== "firebase_ok") return res.status(400).json({ error: "Xác thực Firebase thất bại" });
    
    const pool = getPool();
    await pool.request().input('id', sql.Int, req.user.id).input('phone', sql.NVarChar(20), phone).query(`UPDATE dbo.users SET mfa_enabled = 1, mfa_type = 'sms', phone = @phone, mfa_secret = NULL WHERE id = @id`);
    res.json({ ok: true, message: "Đã bật bảo mật SMS thành công!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/mfa/request-disable", requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().input('id', sql.Int, req.user.id).query(`SELECT phone FROM dbo.users WHERE id = @id`);
    // Trả về số điện thoại để Frontend gọi Firebase
    res.json({ ok: true, phone: result.recordset[0].phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/mfa/setup", requireAuth, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `NexusGames (${req.user.email})` });
    const pool = getPool();
    await pool.request().input('id', sql.Int, req.user.id).input('secret', sql.NVarChar(100), secret.base32).query(`UPDATE dbo.users SET mfa_secret = @secret WHERE id = @id`);
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ ok: true, qrCodeUrl, secret: secret.base32 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/mfa/enable", requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    const pool = getPool();
    const result = await pool.request().input('id', sql.Int, req.user.id).query(`SELECT mfa_secret FROM dbo.users WHERE id = @id`);
    const verified = speakeasy.totp.verify({ secret: result.recordset[0].mfa_secret, encoding: 'base32', token: code, window: 1 });
    if (!verified) return res.status(400).json({ error: "Mã xác nhận không đúng" });
    
    await pool.request().input('id', sql.Int, req.user.id).query(`UPDATE dbo.users SET mfa_enabled = 1, mfa_type = 'app' WHERE id = @id`);
    res.json({ ok: true, message: "Đã bật bảo mật 2 lớp thành công!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/mfa/status", requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().input('id', sql.Int, req.user.id).query(`SELECT mfa_enabled, mfa_type, phone FROM dbo.users WHERE id = @id`);
    res.json({ ok: true, enabled: result.recordset[0].mfa_enabled, type: result.recordset[0].mfa_type, phone: result.recordset[0].phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/mfa/disable", requireAuth, async (req, res) => {
  try {
    const { code } = req.body; 
    if (!code) return res.status(400).json({ error: "Vui lòng nhập mã xác nhận" });
    const pool = getPool();
    const result = await pool.request().input('id', sql.Int, req.user.id).query(`SELECT mfa_secret, mfa_type FROM dbo.users WHERE id = @id`);
    const user = result.recordset[0];

    if (user.mfa_type === 'app') {
      const verified = speakeasy.totp.verify({ secret: user.mfa_secret, encoding: 'base32', token: code, window: 1 });
      if (!verified) return res.status(400).json({ error: "Mã xác nhận không đúng" });
    } else if (user.mfa_type === 'sms') {
      if (code !== "firebase_ok") return res.status(400).json({ error: "Mã xác thực Firebase thất bại" });
    }

    await pool.request().input('id', sql.Int, req.user.id).query(`UPDATE dbo.users SET mfa_enabled = 0, mfa_type = NULL, mfa_secret = NULL, phone = NULL WHERE id = @id`);
    res.json({ ok: true, message: "Đã tắt và xóa MFA thành công" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', requireAuth, (req, res) => res.json({ ok: true, user: req.user }));
module.exports = router;