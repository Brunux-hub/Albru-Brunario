import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: number;
  nombre: string;
  email: string;
  tipo: 'admin' | 'gtr' | 'asesor' | 'supervisor';
  tenant_id: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => void;
  setAuthData: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Inicializar autenticación al cargar
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('albru_token');
        
        if (storedToken) {
          // Verificar si el token no está expirado
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          
          if (!isExpired) {
            console.log('✅ Token válido encontrado, restaurando sesión');
            
            const userData: User = {
              id: payload.userId,
              nombre: payload.nombre,
              email: payload.email,
              tipo: payload.tipo,
              tenant_id: payload.tenant_id || payload.tenantId
            };
            
            setToken(storedToken);
            setUser(userData);
            
            // Guardar también en formato legacy para compatibilidad
            localStorage.setItem('token', storedToken);
            localStorage.setItem('albru_user', JSON.stringify(userData));
            localStorage.setItem('userData', JSON.stringify(userData));
          } else {
            console.log('❌ Token expirado, limpiando datos');
            clearAuth();
          }
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const setAuthData = (newToken: string, userData: User) => {
    console.log('🔑 Estableciendo datos de autenticación');
    
    // Guardar en estado
    setToken(newToken);
    setUser(userData);
    
    // Guardar en localStorage con múltiples formatos para compatibilidad
    localStorage.setItem('albru_token', newToken);
    localStorage.setItem('token', newToken); // Para ThemeService
    localStorage.setItem('albru_user', JSON.stringify(userData));
    localStorage.setItem('userData', JSON.stringify(userData)); // Para componentes legacy
  };

  const clearAuth = () => {
    console.log('🧹 Limpiando autenticación');
    
    // Limpiar estado
    setToken(null);
    setUser(null);
    
    // Limpiar localStorage
    localStorage.removeItem('albru_token');
    localStorage.removeItem('token');
    localStorage.removeItem('albru_user');
    localStorage.removeItem('userData');
  };

  const logout = () => {
    console.log('🚪 Logout iniciado');
    
    clearAuth();
    
    // Limpiar todo el localStorage y sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Redireccionar
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  const isAuthenticated = !!token && !!user;

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    loading,
    logout,
    setAuthData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};