const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const createDefaultAdmin = async () => {
  try {
    // MongoDB'ye bağlan
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/testflow';
    await mongoose.connect(mongoURI);
    console.log('MongoDB bağlantısı başarılı');

    // Admin kullanıcısının var olup olmadığını kontrol et
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin kullanıcısı zaten mevcut');
      process.exit(0);
    }

    // Default admin kullanıcısını oluştur
    const adminData = {
      username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@testflow.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
      firstName: 'TestFlow',
      lastName: 'Admin',
      name: 'TestFlow Admin',
      role: 'admin',
      company: 'TestFlow Inc.',
      position: 'System Administrator',
      bio: 'TestFlow platformunun sistem yöneticisi',
      isActive: true
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Default admin kullanıcısı oluşturuldu:');
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   Role: ${adminData.role}`);
    
  } catch (error) {
    console.error('❌ Admin kullanıcısı oluşturulamadı:', error.message);
    
    if (error.code === 11000) {
      console.log('Bu kullanıcı adı veya email zaten kullanılıyor');
    }
    
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
    process.exit(0);
  }
};

// Script'i çalıştır
createDefaultAdmin(); 