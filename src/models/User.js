const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir email adresi girin']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  name: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'viewer'],
    default: 'user'
  },
  company: {
    type: String,
    trim: true,
    maxlength: 100
  },
  position: {
    type: String,
    trim: true,
    maxlength: 100
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String, // URL veya base64
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'tr'
    },
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
      slack: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true // createdAt, updatedAt otomatik
});

// Virtual field - name getter
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.name || this.username;
});

// Pre-save middleware - şifre hash'leme
userSchema.pre('save', async function(next) {
  // Şifre değişmediyse skip
  if (!this.isModified('password')) return next();
  
  try {
    // Şifreyi hash'le
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method - şifre doğrulama
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method - JSON response'da şifreyi gizle
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Static method - aktif kullanıcıları getir
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method - kullanıcı login
userSchema.statics.login = async function(username, password) {
  // Username veya email ile ara
  const user = await this.findOne({
    $or: [
      { username: username },
      { email: username }
    ],
    isActive: true
  });

  if (!user) {
    throw new Error('Kullanıcı bulunamadı');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Geçersiz şifre');
  }

  // Son login zamanını güncelle
  user.lastLogin = new Date();
  await user.save();

  return user;
};

// Index'ler
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema); 