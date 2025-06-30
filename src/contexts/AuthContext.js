import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sayfa yüklendiğinde localStorage'dan oturum kontrolü
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('testflow_user');
        const storedAuth = localStorage.getItem('testflow_auth');
        
        if (storedUser && storedAuth === 'true') {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Hatalı veri varsa temizle
        localStorage.removeItem('testflow_user');
        localStorage.removeItem('testflow_auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login fonksiyonu
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      
      const { username, password } = credentials;
      
      // API çağrısı
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Token ve kullanıcı bilgilerini localStorage'a kaydet
        localStorage.setItem('testflow_user', JSON.stringify(data.user));
        localStorage.setItem('testflow_token', data.token);
        localStorage.setItem('testflow_auth', 'true');
        
        return { success: true, user: data.user };
      } else {
        return { 
          success: false, 
          error: data.error || 'Giriş işlemi başarısız' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Giriş işlemi sırasında bir hata oluştu' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout fonksiyonu
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    // LocalStorage'ı temizle
    localStorage.removeItem('testflow_user');
    localStorage.removeItem('testflow_token');
    localStorage.removeItem('testflow_auth');
  };

  // Kullanıcı profili güncelleme
  const updateProfile = async (updates) => {
    try {
      const token = localStorage.getItem('testflow_token');
      
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        localStorage.setItem('testflow_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Profil güncellenemedi' };
    }
  };

  // Şifre değiştirme
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const token = localStorage.getItem('testflow_token');
      
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Şifre değiştirilemedi' };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 