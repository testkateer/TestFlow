const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'testflow_jwt_secret_key_change_in_production';

const auth = (req, res, next) => {
  try {
    // Token'ı header'dan al
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token süresi dolmuş'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz token'
      });
    }

    res.status(401).json({
      success: false,
      error: 'Token doğrulanamadı'
    });
  }
};

// Admin kontrolü
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin yetkisi gereklidir'
    });
  }
  next();
};

module.exports = auth;
module.exports.adminAuth = adminAuth; 