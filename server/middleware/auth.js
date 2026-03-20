const jwt = require('jsonwebtoken');

// Lấy Secret Key từ file .env (phải giống hệt key lúc đăng ký/đăng nhập)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const requireAuth = (req, res, next) => {
  // 1. Lấy token từ header của Frontend gửi lên
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập để thực hiện chức năng này' });
  }

  // 2. Tách lấy phần mã token
  const token = authHeader.split(' ')[1];

  try {
    // 3. Giải mã và kiểm tra tính hợp lệ
    const payload = jwt.verify(token, JWT_SECRET);
    
    // 4. Lưu thông tin user (id, username, email) vào req để các API sau sử dụng
    req.user = payload;
    
    // 5. Cho phép đi tiếp vào API
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Trạm gác: Chỉ cho phép Admin đi qua
const requireAdmin = (req, res, next) => {
  // req.user đã được giải mã từ token ở bước requireAuth trước đó
  if (req.user && req.user.role === 'admin') {
    next(); // Hợp lệ, cho đi tiếp
  } else {
    res.status(403).json({ error: "Truy cập bị từ chối. Khu vực dành riêng cho Admin." });
  }
};

module.exports = { requireAuth, requireAdmin };