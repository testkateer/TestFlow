const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// JWT Secret - production'da environment variable kullan
const JWT_SECRET = process.env.JWT_SECRET || 'testflow_jwt_secret_key_change_in_production';

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Kullanıcı adı ve şifre gereklidir'
      });
    }

    // User authentication
    const user = await User.login(username, password);

    // JWT token oluştur
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      user: user.toJSON(),
      token,
      message: 'Giriş başarılı'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (veya admin only yapılabilir)
 */
router.post('/register', async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      company,
      position,
      role = 'user'
    } = req.body;

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Kullanıcı adı, email ve şifre gereklidir'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Şifre en az 6 karakter olmalıdır'
      });
    }

    // Kullanıcı oluştur
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      name: firstName && lastName ? `${firstName} ${lastName}` : username,
      company,
      position,
      role
    });

    await user.save();

    // JWT token oluştur
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      user: user.toJSON(),
      token,
      message: 'Kullanıcı başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Register error:', error);
    
    // Duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        error: `Bu ${field === 'username' ? 'kullanıcı adı' : 'email'} zaten kullanılıyor`
      });
    }

    // Validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages[0]
      });
    }

    res.status(500).json({
      success: false,
      error: 'Kullanıcı oluşturulamadı'
    });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Profil bilgileri alınamadı'
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      company,
      position,
      bio,
      avatar,
      preferences
    } = req.body;

    const updateFields = {};
    
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (email !== undefined) updateFields.email = email;
    if (company !== undefined) updateFields.company = company;
    if (position !== undefined) updateFields.position = position;
    if (bio !== undefined) updateFields.bio = bio;
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (preferences !== undefined) updateFields.preferences = preferences;

    // Name field'ini güncelle
    if (firstName !== undefined || lastName !== undefined) {
      const user = await User.findById(req.user.userId);
      const newFirstName = firstName !== undefined ? firstName : user.firstName;
      const newLastName = lastName !== undefined ? lastName : user.lastName;
      
      if (newFirstName && newLastName) {
        updateFields.name = `${newFirstName} ${newLastName}`;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      user: user.toJSON(),
      message: 'Profil başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    // Duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Bu email adresi zaten kullanılıyor'
      });
    }

    // Validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages[0]
      });
    }

    res.status(500).json({
      success: false,
      error: 'Profil güncellenemedi'
    });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Input validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Mevcut şifre ve yeni şifre gereklidir'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Yeni şifre en az 6 karakter olmalıdır'
      });
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    // Mevcut şifreyi doğrula
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Mevcut şifre yanlış'
      });
    }

    // Yeni şifreyi kaydet
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Şifre değiştirilemedi'
    });
  }
});

/**
 * @route   POST /api/auth/verify-token
 * @desc    Verify JWT token
 * @access  Private
 */
router.post('/verify-token', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz token veya deaktif kullanıcı'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Token verify error:', error);
    res.status(401).json({
      success: false,
      error: 'Token doğrulanamadı'
    });
  }
});

module.exports = router; 