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
      
      // Demo amaçlı basit auth kontrolü
      // Gerçek uygulamada API çağrısı yapılacak
      const { username, password } = credentials;
      
      if (username === 'admin' && password === 'admin123') {
        const userData = {
          id: 1,
          username: 'admin',
          email: 'admin@testflow.com',
          name: 'TestFlow Admin',
          role: 'admin',
          avatar: null,
          loginTime: new Date().toISOString()
        };

        setUser(userData);
        setIsAuthenticated(true);
        
        // LocalStorage'a kaydet
        localStorage.setItem('testflow_user', JSON.stringify(userData));
        localStorage.setItem('testflow_auth', 'true');
        
        return { success: true, user: userData };
      } else {
        return { 
          success: false, 
          error: 'Geçersiz kullanıcı adı veya şifre' 
        };
      }
    } catch (error) {
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
    localStorage.removeItem('testflow_auth');
  };

  // Kullanıcı profili güncelleme
  const updateProfile = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('testflow_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 