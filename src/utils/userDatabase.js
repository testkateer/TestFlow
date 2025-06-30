import bcrypt from 'bcryptjs';

// Default admin kullanıcısı
const DEFAULT_ADMIN = {
  id: 1,
  username: 'admin',
  email: 'admin@testflow.com',
  name: 'TestFlow Admin',
  firstName: 'Test',
  lastName: 'Admin',
  role: 'admin',
  company: 'TestFlow Inc.',
  position: 'System Administrator',
  bio: 'TestFlow platformunun sistem yöneticisi',
  avatar: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isActive: true,
  lastLogin: null
};

// Veritabanı anahtarları
const DB_KEYS = {
  USERS: 'testflow_users_db',
  LAST_USER_ID: 'testflow_last_user_id'
};

/**
 * Veritabanını başlat (ilk kullanım)
 */
export const initializeDatabase = async () => {
  try {
    const users = getUsers();
    if (!users || users.length === 0) {
      // Admin kullanıcısı şifresini hash'le
      const hashedPassword = await hashPassword('admin123');
      const adminUser = {
        ...DEFAULT_ADMIN,
        password: hashedPassword
      };
      
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify([adminUser]));
      localStorage.setItem(DB_KEYS.LAST_USER_ID, '1');
      
      console.log('User database initialized with default admin');
      return adminUser;
    }
    return users[0]; // İlk kullanıcıyı döndür (genellikle admin)
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

/**
 * Tüm kullanıcıları getir
 */
export const getUsers = () => {
  try {
    const users = localStorage.getItem(DB_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Failed to get users:', error);
    return [];
  }
};

/**
 * Kullanıcıyı ID ile getir
 */
export const getUserById = (id) => {
  const users = getUsers();
  return users.find(user => user.id === parseInt(id));
};

/**
 * Kullanıcıyı username ile getir
 */
export const getUserByUsername = (username) => {
  const users = getUsers();
  return users.find(user => user.username === username);
};

/**
 * Kullanıcıyı email ile getir
 */
export const getUserByEmail = (email) => {
  const users = getUsers();
  return users.find(user => user.email === email);
};

/**
 * Kullanıcı girişi doğrula
 */
export const authenticateUser = async (username, password) => {
  try {
    const user = getUserByUsername(username);
    if (!user) {
      return { success: false, error: 'Kullanıcı bulunamadı' };
    }

    if (!user.isActive) {
      return { success: false, error: 'Hesap devre dışı bırakılmış' };
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return { success: false, error: 'Geçersiz şifre' };
    }

    // Son giriş zamanını güncelle
    const updatedUser = await updateUser(user.id, {
      lastLogin: new Date().toISOString()
    });

    // Şifreyi response'dan çıkar
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    return { 
      success: true, 
      user: userWithoutPassword 
    };
  } catch (error) {
    console.error('Authentication failed:', error);
    return { 
      success: false, 
      error: 'Giriş işlemi sırasında bir hata oluştu' 
    };
  }
};

/**
 * Yeni kullanıcı oluştur
 */
export const createUser = async (userData) => {
  try {
    const users = getUsers();
    
    // Username ve email kontrolü
    if (getUserByUsername(userData.username)) {
      return { success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' };
    }
    
    if (getUserByEmail(userData.email)) {
      return { success: false, error: 'Bu e-posta adresi zaten kullanılıyor' };
    }

    // Yeni ID oluştur
    const lastId = parseInt(localStorage.getItem(DB_KEYS.LAST_USER_ID) || '0');
    const newId = lastId + 1;

    // Şifreyi hash'le
    const hashedPassword = await hashPassword(userData.password);

    const newUser = {
      id: newId,
      username: userData.username,
      email: userData.email,
      name: userData.name || `${userData.firstName} ${userData.lastName}`,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      role: userData.role || 'user',
      company: userData.company || '',
      position: userData.position || '',
      bio: userData.bio || '',
      avatar: userData.avatar || null,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      lastLogin: null
    };

    users.push(newUser);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(DB_KEYS.LAST_USER_ID, newId.toString());

    // Şifreyi response'dan çıkar
    const { password: _, ...userWithoutPassword } = newUser;
    
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('User creation failed:', error);
    return { success: false, error: 'Kullanıcı oluşturulamadı' };
  }
};

/**
 * Kullanıcı bilgilerini güncelle
 */
export const updateUser = async (id, updates) => {
  try {
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === parseInt(id));
    
    if (userIndex === -1) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Şifre güncelleniyorsa hash'le
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    
    return users[userIndex];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};

/**
 * Kullanıcıyı sil
 */
export const deleteUser = (id) => {
  try {
    const users = getUsers();
    const filteredUsers = users.filter(user => user.id !== parseInt(id));
    
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(filteredUsers));
    
    return { success: true };
  } catch (error) {
    console.error('User deletion failed:', error);
    return { success: false, error: 'Kullanıcı silinemedi' };
  }
};

/**
 * Şifre değiştir
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = getUserById(userId);
    if (!user) {
      return { success: false, error: 'Kullanıcı bulunamadı' };
    }

    // Mevcut şifreyi doğrula
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return { success: false, error: 'Mevcut şifre yanlış' };
    }

    // Yeni şifreyi hash'le ve güncelle
    await updateUser(userId, { password: newPassword });
    
    return { success: true };
  } catch (error) {
    console.error('Password change failed:', error);
    return { success: false, error: 'Şifre değiştirilemedi' };
  }
};

/**
 * Şifre hash'leme
 */
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Şifre doğrulama
 */
export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Veritabanını temizle (development amaçlı)
 */
export const clearDatabase = () => {
  localStorage.removeItem(DB_KEYS.USERS);
  localStorage.removeItem(DB_KEYS.LAST_USER_ID);
  console.log('User database cleared');
}; 