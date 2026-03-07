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

module.exports = { requireAuth };