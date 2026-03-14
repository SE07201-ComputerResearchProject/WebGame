const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { getPool, sql } = require('../db');
const { requireAuth } = require('../middleware/auth');

// ==========================================
// KHỞI TẠO FIREBASE ADMIN (THAY THẾ TWILIO)
// ==========================================
const admin = require("firebase-admin");
const serviceAccount = require("../firebase-admin.json"); // Đọc file JSON bạn vừa tải về

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Thêm thư viện Google
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

// Hàm kiểm tra Captcha
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
    console.error('Lỗi xác thực CAPTCHA:', error);
    return false;
  }
}

// ==========================================
// CÁC API ROUTER
// ==========================================

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, captchaToken } = req.body;
    if (!username || !email || !password || !captchaToken) return res.status(400).json({ error: "Vui lòng điền đủ thông tin và xác nhận CAPTCHA" });

    const isHuman = await verifyCaptcha(captchaToken);
    if (!isHuman) return res.status(400).json({ error: "Xác thực người máy thất bại" });

    const pool = getPool();
    const checkResult = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .input('username', sql.NVarChar(100), username)
      .query(`SELECT id FROM dbo.users WHERE email = @email OR username = @username`);

    if (checkResult.recordset.length > 0) return res.status(409).json({ error: "Email hoặc Username đã tồn tại" });

    const hash = await bcrypt.hash(password, 10);
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
    const token = jwt.sign({ id: userId, email, username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ ok: true, user: { id: userId, username, email }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Đăng nhập (Phân luồng SMS Firebase và App)
router.post("/login", async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;
    if (!email || !password || !captchaToken) return res.status(400).json({ error: "Vui lòng điền đủ thông tin và CAPTCHA" });

    const isHuman = await verifyCaptcha(captchaToken);
    if (!isHuman) return res.status(400).json({ error: "Xác thực người máy thất bại" });

    const pool = getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query(`SELECT id, username, password, mfa_enabled, mfa_type, phone FROM dbo.users WHERE email = @email`);

    if (result.recordset.length === 0) return res.status(401).json({ error: "Sai email hoặc mật khẩu" });

    const user = result.recordset[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Sai email hoặc mật khẩu" });

    if (user.mfa_enabled) {
      if (user.mfa_type === 'sms') {
        // Trả số điện thoại về để Frontend tự gọi Firebase gửi SMS
        const tempToken = jwt.sign({ id: user.id, email, username: user.username, mfaPending: true, mfaType: 'sms', phone: user.phone }, JWT_SECRET, { expiresIn: '10m' });
        return res.json({ ok: true, mfaRequired: true, mfaType: 'sms', phone: user.phone, tempToken, message: "Hệ thống đang gọi Firebase gửi SMS..." });
      } else {
        const tempToken = jwt.sign({ id: user.id, email, username: user.username, mfaPending: true, mfaType: 'app' }, JWT_SECRET, { expiresIn: '5m' });
        return res.json({ ok: true, mfaRequired: true, mfaType: 'app', tempToken, message: "Vui lòng nhập mã Google Authenticator" });
      }
    }

    const token = jwt.sign({ id: user.id, email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, user: { id: user.id, username: user.username, email }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xác thực mã MFA lúc đăng nhập
router.post("/login/mfa", async (req, res) => {
  try {
    // Nhận thêm firebaseToken từ Frontend
    const { tempToken, code, firebaseToken } = req.body; 
    if (!tempToken) return res.status(400).json({ error: "Thiếu thông tin xác thực" });

    const decoded = jwt.verify(tempToken, JWT_SECRET);
    if (!decoded.mfaPending) return res.status(400).json({ error: "Token không hợp lệ" });

    const pool = getPool();
    
    // KIỂM TRA SMS BẰNG FIREBASE
    if (decoded.mfaType === 'sms') {
      if (!firebaseToken) return res.status(400).json({ error: "Thiếu Căn cước Firebase (Firebase Token)" });
      
      try {
        // Backend nhờ Firebase Admin kiểm tra cái Token này xem có phải hàng thật không
        const decodedFirebaseToken = await admin.auth().verifyIdToken(firebaseToken);
        
        // Đảm bảo số điện thoại đăng nhập khớp với số trong Token
        if (decodedFirebaseToken.phone_number !== decoded.phone) {
          return res.status(401).json({ error: "Số điện thoại xác thực không khớp với tài khoản!" });
        }
      } catch (fbError) {
        console.error("Lỗi xác minh Firebase Token:", fbError);
        return res.status(401).json({ error: "Xác thực mã SMS Firebase thất bại!" });
      }
    } 
    // KIỂM TRA GOOGLE AUTH (Giữ nguyên)
    else {
      const result = await pool.request().input('id', sql.Int, decoded.id).query(`SELECT mfa_secret FROM dbo.users WHERE id = @id`);
      const secret = result.recordset[0].mfa_secret;
      const verified = speakeasy.totp.verify({ secret: secret, encoding: 'base32', token: code, window: 1 });
      if (!verified) return res.status(401).json({ error: "Mã xác thực không chính xác" });
    }

    const realToken = jwt.sign({ id: decoded.id, email: decoded.email, username: decoded.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, user: { id: decoded.id, username: decoded.username, email: decoded.email }, token: realToken });
  } catch (err) {
    res.status(401).json({ error: "Phiên đăng nhập hết hạn hoặc lỗi xác thực" });
  }
});

// API Bật SMS OTP vĩnh viễn (Rút gọn nhờ Firebase)
// Frontend tự cho user nhập số -> Gửi SMS -> User nhập OTP -> Frontend xác nhận lấy firebaseToken gửi xuống đây
router.post("/mfa/enable-sms", requireAuth, async (req, res) => {
  try {
    const { firebaseToken } = req.body;
    if (!firebaseToken) return res.status(400).json({ error: "Thiếu Căn cước Firebase" });

    // Xác minh Token với Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const verifiedPhone = decodedToken.phone_number; // Lấy được số điện thoại chuẩn quốc tế (+84...)

    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, req.user.id)
      .input('phone', sql.NVarChar(20), verifiedPhone)
      .query(`UPDATE dbo.users SET mfa_enabled = 1, mfa_type = 'sms', phone = @phone, mfa_secret = NULL WHERE id = @id`);

    res.json({ ok: true, message: "Đã bật bảo mật SMS bằng Firebase thành công!" });
  } catch (err) {
    console.error("Lỗi Enable SMS Firebase:", err);
    res.status(500).json({ error: "Lỗi xác thực chứng chỉ Firebase." });
  }
});


// Các hàm Google Auth giữ nguyên
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
    const result = await pool.request().input('id', sql.Int, req.user.id).query(`SELECT mfa_enabled, mfa_type FROM dbo.users WHERE id = @id`);
    res.json({ ok: true, enabled: result.recordset[0].mfa_enabled, type: result.recordset[0].mfa_type });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/mfa/disable", requireAuth, async (req, res) => {
  try {
    const { code, firebaseToken } = req.body; // Thêm firebaseToken để vô hiệu hóa bằng SMS
    const pool = getPool();
    const result = await pool.request().input('id', sql.Int, req.user.id).query(`SELECT mfa_secret, mfa_type, phone FROM dbo.users WHERE id = @id`);
    const user = result.recordset[0];

    if (user.mfa_type === 'app') {
      if (!code) return res.status(400).json({ error: "Vui lòng nhập mã xác nhận" });
      const verified = speakeasy.totp.verify({ secret: user.mfa_secret, encoding: 'base32', token: code, window: 1 });
      if (!verified) return res.status(400).json({ error: "Mã xác nhận không đúng" });
    } else if (user.mfa_type === 'sms') {
      // Firebase kiểm tra
      if (!firebaseToken) return res.status(400).json({ error: "Thiếu Căn cước Firebase" });
      try {
        const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        if (decodedToken.phone_number !== user.phone) return res.status(400).json({ error: "Số điện thoại không khớp!"});
      } catch (e) {
         return res.status(401).json({ error: "Xác thực Firebase thất bại" });
      }
    }

    await pool.request().input('id', sql.Int, req.user.id).query(`UPDATE dbo.users SET mfa_enabled = 0, mfa_type = NULL, mfa_secret = NULL, phone = NULL WHERE id = @id`);
    res.json({ ok: true, message: "Đã tắt và xóa MFA thành công" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

router.get('/users', async (req, res) => {
  try {
    const database = require('../db'); 
    const pool = typeof database.getPool === 'function' ? database.getPool() : database.pool;
    const result = await pool.request().query(`SELECT id, username, email FROM dbo.users ORDER BY username ASC`);
    res.json({ ok: true, users: result.recordset });
  } catch (error) {
    res.status(500).json({ error: "Lỗi kết nối CSDL" });
  }
});

// API: Xử lý Đăng nhập bằng Google
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "Thiếu thông tin Google" });

    // 1. Xác minh "Căn cước" với Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    const pool = getPool();

    // 2. Tìm User trong Database
    let result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query(`SELECT id, username, mfa_enabled, mfa_type, phone FROM dbo.users WHERE email = @email`);

    let user;

    // 3. Tự động Đăng ký nếu là người mới
    if (result.recordset.length === 0) {
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const hash = await bcrypt.hash(randomPassword, 10);
      const baseUsername = name.replace(/\s+/g, '').toLowerCase();
      
      const insertResult = await pool.request()
        .input('username', sql.NVarChar(100), baseUsername)
        .input('email', sql.NVarChar(255), email)
        .input('password', sql.NVarChar(255), hash)
        .query(`
          INSERT INTO dbo.users (username, email, password, created_at) 
          VALUES (@username, @email, @password, GETUTCDATE());
          SELECT @@IDENTITY as id;
        `);
      user = { id: insertResult.recordset[0].id, username: baseUsername, email, mfa_enabled: false };
    } else {
      user = result.recordset[0];
    }

    // 4. KIỂM TRA BẢO MẬT 2 LỚP (MFA)
    if (user.mfa_enabled) {
      // Nếu dùng SMS Firebase
      if (user.mfa_type === 'sms') {
        const tempToken = jwt.sign({ id: user.id, email, username: user.username, mfaPending: true, mfaType: 'sms', phone: user.phone }, JWT_SECRET, { expiresIn: '10m' });
        return res.json({ ok: true, mfaRequired: true, mfaType: 'sms', phone: user.phone, tempToken, message: "Hệ thống đang gọi Firebase gửi SMS..." });
      } 
      // Nếu dùng Google Auth App
      else {
        const tempToken = jwt.sign({ id: user.id, email, username: user.username, mfaPending: true, mfaType: 'app' }, JWT_SECRET, { expiresIn: '5m' });
        return res.json({ ok: true, mfaRequired: true, mfaType: 'app', tempToken, message: "Vui lòng nhập mã Google Authenticator" });
      }
    }

    // 5. Nếu không bật MFA -> Đăng nhập thành công luôn
    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, user: { id: user.id, username: user.username, email: user.email }, token });

  } catch (err) {
    console.error("Lỗi Google Login:", err);
    res.status(500).json({ error: "Lỗi xác thực với Google" });
  }
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const speakeasy = require('speakeasy');
// const qrcode = require('qrcode');
// const { getPool, sql } = require('../db');
// const { requireAuth } = require('../middleware/auth');

// // Cấu hình Twilio
// const twilio = require('twilio');
// const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) 
//   ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
//   : null;

// // Thêm thư viện Google
// const { OAuth2Client } = require('google-auth-library');
// const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
// const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

// // ==========================================
// // HÀM HỖ TRỢ (HELPERS)
// // ==========================================
// async function verifyCaptcha(token) {
//   if (!token || !RECAPTCHA_SECRET_KEY) return false;
//   try {
//     const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//       body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
//     });
//     const data = await response.json();
//     return data.success;
//   } catch (error) {
//     console.error('Lỗi xác thực CAPTCHA:', error);
//     return false;
//   }
// }

// // Hàm gửi SMS thông minh (Hỗ trợ chuẩn hóa số điện thoại VN)
// async function sendTwilioSMS(toPhone, messageBody) {
//   if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
//     console.log(`\n=========================================`);
//     console.log(`📱 [MÔ PHỎNG SMS] Gửi tới số: ${toPhone}`);
//     console.log(`💬 Nội dung: ${messageBody}`);
//     console.log(`=========================================\n`);
//     return true; 
//   }

//   try {
//     // 1. Chuẩn hóa số điện thoại sang định dạng quốc tế (+84)
//     let formattedPhone = toPhone.trim();
//     if (formattedPhone.startsWith('0')) {
//       formattedPhone = '+84' + formattedPhone.slice(1); // Đổi 09... thành +849...
//     } else if (formattedPhone.startsWith('84')) {
//       formattedPhone = '+' + formattedPhone;            // Đổi 849... thành +849...
//     } else if (!formattedPhone.startsWith('+')) {
//       formattedPhone = '+' + formattedPhone;            // Đề phòng trường hợp thiếu dấu +
//     }

//     // 2. Chặn lỗi tự gửi cho chính mình
//     if (formattedPhone === process.env.TWILIO_PHONE_NUMBER) {
//       console.error("[Twilio] Lỗi: Số nhận trùng với số hệ thống Twilio.");
//       throw new Error("Vui lòng nhập số điện thoại cá nhân của bạn, không nhập số của hệ thống.");
//     }

//     // 3. Tiến hành gửi tin nhắn
//     await twilioClient.messages.create({
//       body: messageBody,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: formattedPhone 
//     });
    
//     console.log(`[Twilio] 🚀 Đã gửi SMS thành công đến số ${formattedPhone}`);
//     return true;
//   } catch (error) {
//     console.error("[Twilio] 🔴 Lỗi gửi SMS:", error.message);
//     throw new Error(error.message || "Lỗi hệ thống gửi tin nhắn SMS của nhà mạng.");
//   }
// }
// // ==========================================
// // CÁC API ROUTER
// // ==========================================

// // API: Xử lý Đăng nhập bằng Google
// router.post("/google", async (req, res) => {
//   try {
//     const { credential } = req.body;
//     if (!credential) return res.status(400).json({ error: "Thiếu thông tin Google" });

//     // 1. Xác thực token với Google
//     const ticket = await googleClient.verifyIdToken({
//       idToken: credential,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });
//     const payload = ticket.getPayload();
//     const { email, name } = payload;

//     const pool = getPool();

//     // 2. Kiểm tra xem user đã tồn tại chưa
//     let result = await pool.request()
//       .input('email', sql.NVarChar(255), email)
//       .query(`SELECT id, username, mfa_enabled, mfa_type, phone FROM dbo.users WHERE email = @email`);

//     let user;

//     // 3. Nếu chưa có tài khoản -> TỰ ĐỘNG ĐĂNG KÝ
//     if (result.recordset.length === 0) {
//       const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
//       const hash = await bcrypt.hash(randomPassword, 10);
//       const baseUsername = name.replace(/\s+/g, '').toLowerCase();
      
//       const insertResult = await pool.request()
//         .input('username', sql.NVarChar(100), baseUsername)
//         .input('email', sql.NVarChar(255), email)
//         .input('password', sql.NVarChar(255), hash)
//         .query(`
//           INSERT INTO dbo.users (username, email, password, created_at) 
//           VALUES (@username, @email, @password, GETUTCDATE());
//           SELECT @@IDENTITY as id;
//         `);
      
//       user = { id: insertResult.recordset[0].id, username: baseUsername, email, mfa_enabled: false };
//     } else {
//       user = result.recordset[0];
//     }

//     // 4. KIỂM TRA BẢO MẬT 2 LỚP (MFA)
//     if (user.mfa_enabled) {
//       if (user.mfa_type === 'sms') {
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
//         await pool.request().input('id', sql.Int, user.id).input('otp', sql.NVarChar(6), otp).query(`UPDATE dbo.users SET sms_otp = @otp, sms_otp_expiry = DATEADD(minute, 5, GETUTCDATE()) WHERE id = @id`);
        
//         // GỌI HÀM GỬI SMS THẬT
//         try {
//           await sendTwilioSMS(user.phone, `[Nexus Games] Ma xac nhan OTP cua ban la: ${otp}. Vui long khong chia se ma nay cho bat ky ai.`);
//           const tempToken = jwt.sign({ id: user.id, email, username: user.username, mfaPending: true, mfaType: 'sms' }, JWT_SECRET, { expiresIn: '5m' });
//           return res.json({ ok: true, mfaRequired: true, mfaType: 'sms', phoneMask: user.phone ? user.phone.slice(-4) : "", tempToken, message: "Mã OTP đã được gửi về số điện thoại" });
//         } catch (smsError) {
//           return res.status(500).json({ error: smsError.message });
//         }
//       } else {
//         const tempToken = jwt.sign({ id: user.id, email, username: user.username, mfaPending: true, mfaType: 'app' }, JWT_SECRET, { expiresIn: '5m' });
//         return res.json({ ok: true, mfaRequired: true, mfaType: 'app', tempToken, message: "Vui lòng nhập mã Google Authenticator" });
//       }
//     }

//     // 5. Nếu không có MFA, cấp Token và cho vào thẳng web
//     const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
//     res.json({ ok: true, user: { id: user.id, username: user.username, email: user.email }, token });
//   } catch (err) {
//     console.error("Lỗi Google Login:", err);
//     res.status(500).json({ error: "Lỗi xác thực với Google" });
//   }
// });

// // 1. Đăng ký
// router.post("/register", async (req, res) => {
//   try {
//     const { username, email, password, captchaToken } = req.body;
//     if (!username || !email || !password || !captchaToken) return res.status(400).json({ error: "Vui lòng điền đủ thông tin và xác nhận CAPTCHA" });

//     const isHuman = await verifyCaptcha(captchaToken);
//     if (!isHuman) return res.status(400).json({ error: "Xác thực người máy thất bại" });

//     const pool = getPool();
//     const checkResult = await pool.request()
//       .input('email', sql.NVarChar(255), email)
//       .input('username', sql.NVarChar(100), username)
//       .query(`SELECT id FROM dbo.users WHERE email = @email OR username = @username`);

//     if (checkResult.recordset.length > 0) return res.status(409).json({ error: "Email hoặc Username đã tồn tại" });

//     const hash = await bcrypt.hash(password, 10);
//     const insertResult = await pool.request()
//       .input('username', sql.NVarChar(100), username)
//       .input('email', sql.NVarChar(255), email)
//       .input('password', sql.NVarChar(255), hash)
//       .query(`
//         INSERT INTO dbo.users (username, email, password, created_at) 
//         VALUES (@username, @email, @password, GETUTCDATE());
//         SELECT @@IDENTITY as id;
//       `);

//     const userId = insertResult.recordset[0].id;
//     const token = jwt.sign({ id: userId, email, username }, JWT_SECRET, { expiresIn: '7d' });

//     res.json({ ok: true, user: { id: userId, username, email }, token });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 2. Đăng nhập (Phân luồng SMS và App)
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password, captchaToken } = req.body;
//     if (!email || !password || !captchaToken) return res.status(400).json({ error: "Vui lòng điền đủ thông tin và CAPTCHA" });

//     const isHuman = await verifyCaptcha(captchaToken);
//     if (!isHuman) return res.status(400).json({ error: "Xác thực người máy thất bại" });

//     const pool = getPool();
//     const result = await pool.request()
//       .input('email', sql.NVarChar(255), email)
//       .query(`SELECT id, username, password, mfa_enabled, mfa_type, phone FROM dbo.users WHERE email = @email`);

//     if (result.recordset.length === 0) return res.status(401).json({ error: "Sai email hoặc mật khẩu" });

//     const user = result.recordset[0];
//     const isValid = await bcrypt.compare(password, user.password);
//     if (!isValid) return res.status(401).json({ error: "Sai email hoặc mật khẩu" });

//     if (user.mfa_enabled) {
//       if (user.mfa_type === 'sms') {
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
//         await pool.request()
//           .input('id', sql.Int, user.id)
//           .input('otp', sql.NVarChar(6), otp)
//           .query(`UPDATE dbo.users SET sms_otp = @otp, sms_otp_expiry = DATEADD(minute, 5, GETUTCDATE()) WHERE id = @id`);

//         // GỌI HÀM GỬI SMS THẬT
//         try {
//           await sendTwilioSMS(user.phone, `[Nexus Games] Ma xac nhan OTP Dang nhap cua ban la: ${otp}`);
//           const tempToken = jwt.sign({ id: user.id, email, username: user.username, mfaPending: true, mfaType: 'sms' }, JWT_SECRET, { expiresIn: '5m' });
//           return res.json({ ok: true, mfaRequired: true, mfaType: 'sms', phoneMask: user.phone ? user.phone.slice(-4) : "", tempToken, message: "Mã OTP đã được gửi về số điện thoại" });
//         } catch (smsError) {
//           return res.status(500).json({ error: smsError.message });
//         }
//       } 
//       else {
//         const tempToken = jwt.sign({ id: user.id, email, username: user.username, mfaPending: true, mfaType: 'app' }, JWT_SECRET, { expiresIn: '5m' });
//         return res.json({ ok: true, mfaRequired: true, mfaType: 'app', tempToken, message: "Vui lòng nhập mã Google Authenticator" });
//       }
//     }

//     const token = jwt.sign({ id: user.id, email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
//     res.json({ ok: true, user: { id: user.id, username: user.username, email }, token });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 3. Xác thực mã MFA lúc đăng nhập (Xử lý cả 2 loại)
// router.post("/login/mfa", async (req, res) => {
//   try {
//     const { tempToken, code } = req.body;
//     if (!tempToken || !code) return res.status(400).json({ error: "Thiếu thông tin xác thực" });

//     const decoded = jwt.verify(tempToken, JWT_SECRET);
//     if (!decoded.mfaPending) return res.status(400).json({ error: "Token không hợp lệ" });

//     const pool = getPool();
    
//     // KIỂM TRA SMS OTP
//     if (decoded.mfaType === 'sms') {
//       const result = await pool.request()
//         .input('id', sql.Int, decoded.id)
//         .query(`SELECT sms_otp, sms_otp_expiry FROM dbo.users WHERE id = @id`);
      
//       const { sms_otp, sms_otp_expiry } = result.recordset[0];

//       if (!sms_otp || sms_otp !== code) return res.status(401).json({ error: "Mã xác thực không chính xác" });
//       if (new Date() > new Date(sms_otp_expiry)) return res.status(401).json({ error: "Mã xác thực đã hết hạn" });

//       await pool.request().input('id', sql.Int, decoded.id).query(`UPDATE dbo.users SET sms_otp = NULL, sms_otp_expiry = NULL WHERE id = @id`);
//     } 
//     // KIỂM TRA GOOGLE AUTH
//     else {
//       const result = await pool.request()
//         .input('id', sql.Int, decoded.id)
//         .query(`SELECT mfa_secret FROM dbo.users WHERE id = @id`);
      
//       const secret = result.recordset[0].mfa_secret;
//       const verified = speakeasy.totp.verify({ secret: secret, encoding: 'base32', token: code });
//       if (!verified) return res.status(401).json({ error: "Mã xác thực không chính xác" });
//     }

//     const realToken = jwt.sign({ id: decoded.id, email: decoded.email, username: decoded.username }, JWT_SECRET, { expiresIn: '7d' });
//     res.json({ ok: true, user: { id: decoded.id, username: decoded.username, email: decoded.email }, token: realToken });
//   } catch (err) {
//     res.status(401).json({ error: "Phiên đăng nhập hết hạn hoặc lỗi xác thực" });
//   }
// });

// // 4. API Bắt đầu thiết lập SMS OTP (Gửi mã về số điện thoại mới)
// router.post("/mfa/setup-sms", requireAuth, async (req, res) => {
//   try {
//     const { phone } = req.body;
//     if (!phone) return res.status(400).json({ error: "Vui lòng nhập số điện thoại" });

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
//     const pool = getPool();
//     await pool.request()
//       .input('id', sql.Int, req.user.id)
//       .input('phone', sql.NVarChar(20), phone)
//       .input('otp', sql.NVarChar(6), otp)
//       .query(`UPDATE dbo.users SET phone = @phone, sms_otp = @otp, sms_otp_expiry = DATEADD(minute, 5, GETUTCDATE()) WHERE id = @id`);

//     // GỌI HÀM GỬI SMS THẬT LÚC CÀI ĐẶT
//     try {
//       await sendTwilioSMS(phone, `[Nexus Games] Ma cai dat bao mat 2 lop cua ban la: ${otp}`);
//       res.json({ ok: true, message: "Mã xác nhận đã được gửi đến số điện thoại" });
//     } catch (smsError) {
//       return res.status(500).json({ error: smsError.message });
//     }
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 5. API Xác nhận mã 6 số để Bật SMS OTP vĩnh viễn
// router.post("/mfa/enable-sms", requireAuth, async (req, res) => {
//   try {
//     const { code } = req.body;
//     const pool = getPool();
    
//     const result = await pool.request()
//       .input('id', sql.Int, req.user.id)
//       .query(`SELECT sms_otp, sms_otp_expiry FROM dbo.users WHERE id = @id`);
    
//     const { sms_otp, sms_otp_expiry } = result.recordset[0];

//     if (!sms_otp || sms_otp !== code) return res.status(400).json({ error: "Mã xác nhận không đúng" });
//     if (new Date() > new Date(sms_otp_expiry)) return res.status(400).json({ error: "Mã xác nhận đã hết hạn" });

//     await pool.request()
//       .input('id', sql.Int, req.user.id)
//       .query(`UPDATE dbo.users SET mfa_enabled = 1, mfa_type = 'sms', sms_otp = NULL, mfa_secret = NULL WHERE id = @id`);

//     res.json({ ok: true, message: "Đã bật bảo mật SMS thành công!" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // CÁC HÀM QUẢN LÝ GOOGLE AUTH V VÀ TẮT BẢO MẬT
// router.post("/mfa/setup", requireAuth, async (req, res) => {
//   try {
//     const secret = speakeasy.generateSecret({ name: `NexusGames (${req.user.email})` });
//     const pool = getPool();
//     await pool.request().input('id', sql.Int, req.user.id).input('secret', sql.NVarChar(100), secret.base32)
//       .query(`UPDATE dbo.users SET mfa_secret = @secret WHERE id = @id`);
//     const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
//     res.json({ ok: true, qrCodeUrl, secret: secret.base32 });
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// router.post("/mfa/enable", requireAuth, async (req, res) => {
//   try {
//     const { code } = req.body;
//     const pool = getPool();
//     const result = await pool.request().input('id', sql.Int, req.user.id).query(`SELECT mfa_secret FROM dbo.users WHERE id = @id`);
//     const verified = speakeasy.totp.verify({ secret: result.recordset[0].mfa_secret, encoding: 'base32', token: code });
//     if (!verified) return res.status(400).json({ error: "Mã xác nhận không đúng" });
    
//     await pool.request().input('id', sql.Int, req.user.id).query(`UPDATE dbo.users SET mfa_enabled = 1, mfa_type = 'app' WHERE id = @id`);
//     res.json({ ok: true, message: "Đã bật bảo mật 2 lớp thành công!" });
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// router.get("/mfa/status", requireAuth, async (req, res) => {
//   try {
//     const pool = getPool();
//     const result = await pool.request().input('id', sql.Int, req.user.id).query(`SELECT mfa_enabled, mfa_type FROM dbo.users WHERE id = @id`);
//     res.json({ ok: true, enabled: result.recordset[0].mfa_enabled, type: result.recordset[0].mfa_type });
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// router.post("/mfa/disable", requireAuth, async (req, res) => {
//   try {
//     const { code } = req.body;
//     if (!code) return res.status(400).json({ error: "Vui lòng nhập mã xác nhận" });

//     const pool = getPool();
//     const result = await pool.request().input('id', sql.Int, req.user.id).query(`SELECT mfa_secret, mfa_type, sms_otp FROM dbo.users WHERE id = @id`);
//     const user = result.recordset[0];

//     if (user.mfa_type === 'app') {
//       const verified = speakeasy.totp.verify({ secret: user.mfa_secret, encoding: 'base32', token: code });
//       if (!verified) return res.status(400).json({ error: "Mã xác nhận không đúng" });
//     } else if (user.mfa_type === 'sms') {
//       if (!user.sms_otp || user.sms_otp !== code) return res.status(400).json({ error: "Mã xác nhận không đúng" });
//     }

//     await pool.request().input('id', sql.Int, req.user.id).query(`UPDATE dbo.users SET mfa_enabled = 0, mfa_type = NULL, mfa_secret = NULL, sms_otp = NULL WHERE id = @id`);
//     res.json({ ok: true, message: "Đã tắt và xóa MFA thành công" });
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // API hỗ trợ gửi lại mã SMS khi đang tắt MFA
// router.post("/mfa/request-disable-sms", requireAuth, async (req, res) => {
//   try {
//     const pool = getPool();
//     const result = await pool.request().input('id', sql.Int, req.user.id).query(`SELECT phone FROM dbo.users WHERE id = @id`);
//     const phone = result.recordset[0].phone;
    
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     await pool.request().input('id', sql.Int, req.user.id).input('otp', sql.NVarChar(6), otp).query(`UPDATE dbo.users SET sms_otp = @otp, sms_otp_expiry = DATEADD(minute, 5, GETUTCDATE()) WHERE id = @id`);
    
//     // GỌI HÀM GỬI SMS THẬT LÚC TẮT MFA
//     try {
//       await sendTwilioSMS(phone, `[Nexus Games] Ma xac nhan de TAT bao mat cua ban la: ${otp}`);
//       res.json({ ok: true, message: "Đã gửi mã xác nhận qua SMS" });
//     } catch (smsError) {
//       return res.status(500).json({ error: smsError.message });
//     }
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// router.get('/me', requireAuth, (req, res) => {
//   res.json({ ok: true, user: req.user });
// });

// // API: Lấy danh sách tất cả người dùng (Để làm danh bạ nhắn tin)
// router.get('/users', async (req, res) => {
//   try {
//     const database = require('../db'); 
//     const pool = typeof database.getPool === 'function' ? database.getPool() : database.pool;
    
//     const result = await pool.request().query(`
//       SELECT id, username, email FROM dbo.users ORDER BY username ASC
//     `);
//     res.json({ ok: true, users: result.recordset });
//   } catch (error) {
//     console.error("Lỗi lấy danh sách user:", error);
//     res.status(500).json({ error: "Lỗi kết nối CSDL" });
//   }
// });

// module.exports = router;