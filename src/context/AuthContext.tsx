import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getAuthUrl } from '../config/environment';

// Interface para el JWT decodificado
interface DecodedToken {
  sub: number;
  userId: number;
  nombre: string;
  email: string;
  tipo: 'admin' | 'asesor' | 'validador' | 'supervisor' | 'gtr';
  theme_primary: string;
  theme_secondary: string;
  theme_background: string;
  brand_name: string;
  exp: number;
  iat: number;
}

interface User {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  tipo: 'admin' | 'gtr' | 'asesor' | 'supervisor' | 'validador';
  estado: string;
}

// Interface para el tema
interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
}

// Interface para la configuración
interface Config {
  brandName: string;
  logoPath?: string;
  permissions: string[];
  dashboardPath?: string;
}

interface AuthContextType {
  user: User | null;
  theme: Theme | null;
  config: Config | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  canAccess: (roles: string[]) => boolean;
  applyTheme: (theme: Theme) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Aplicar tema dinámico al DOM
  const applyTheme = (themeData: Theme) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', themeData.primary);
    root.style.setProperty('--color-secondary', themeData.secondary);
    root.style.setProperty('--color-accent', themeData.accent);
    root.style.setProperty('--color-background', themeData.background);
    root.style.setProperty('--color-surface', themeData.surface);
    setTheme(themeData);
  };

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('albru_token');
      
      if (storedToken) {
        try {
          const decoded: DecodedToken = jwtDecode(storedToken);
          
          // Verificar si el token no ha expirado
          if (decoded.exp * 1000 > Date.now()) {
            setToken(storedToken);
            setUser({
              id: decoded.userId,
              nombre: decoded.nombre,
              email: decoded.email,
              tipo: decoded.tipo,
              estado: 'activo'
            });
            
            // Aplicar tema desde el JWT
            applyTheme({
              primary: decoded.theme_primary,
              secondary: decoded.theme_secondary,
              accent: '#9c27b0', // valor por defecto
              background: decoded.theme_background,
              surface: '#ffffff' // valor por defecto
            });
            
            setConfig({
              brandName: decoded.brand_name,
              permissions: [],
              logoPath: undefined,
              dashboardPath: undefined
            });
          } else {
            // Token expirado
            localStorage.removeItem('albru_token');
            localStorage.removeItem('albru_user');
            localStorage.removeItem('albru_theme');
            localStorage.removeItem('albru_config');
          }
        } catch (error) {
          console.error('Error decodificando token:', error);
          localStorage.removeItem('albru_token');
          localStorage.removeItem('albru_user');
          localStorage.removeItem('albru_theme');
          localStorage.removeItem('albru_config');
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      
      // Usar la URL dinámica basada en el hostname actual
      const endpoint = getAuthUrl('/login');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      console.log('Login response:', data);

      if (data.success && data.token) {
        console.log('Login successful, setting user data');
        console.log('User data:', data.user);
        
        // Guardar token
        localStorage.setItem('albru_token', data.token);
        setToken(data.token);

        // Establecer datos del usuario
        setUser(data.user);
        setConfig(data.config);

        // Aplicar tema
        applyTheme(data.theme);

        // Guardar datos en localStorage
        localStorage.setItem('albru_user', JSON.stringify(data.user));
        localStorage.setItem('albru_theme', JSON.stringify(data.theme));
        localStorage.setItem('albru_config', JSON.stringify(data.config));

        return { success: true, message: 'Login exitoso' };
      } else {
        return { success: false, message: data.message || 'Error en el login' };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Limpiar completamente localStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Resetear estados
    setToken(null);
    setUser(null);
    setTheme(null);
    setConfig(null);
    
    // Restablecer tema por defecto
    const root = document.documentElement;
    root.style.setProperty('--color-primary', '#1976d2');
    root.style.setProperty('--color-secondary', '#dc004e');
    root.style.setProperty('--color-accent', '#9c27b0');
    root.style.setProperty('--color-background', '#f5f5f5');
    root.style.setProperty('--color-surface', '#ffffff');
    
    // Forzar redirección al login
    window.location.href = '/login';
  };

  const isAuthenticated = !!user && !!token && (() => {
    if (!token) return false;
    try {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  })();
  const isAdmin = user?.tipo === 'admin';

  const canAccess = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.tipo);
  };

  const value: AuthContextType = {
    user,
    theme,
    config,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    canAccess,
    applyTheme
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};