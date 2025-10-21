import React, { createContext } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Exportar el contexto para el hook personalizado
export { AuthContext };

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const logout = () => {
    console.log('🚪 AuthContext - Logout iniciado');
    
    // Limpiar TODO el almacenamiento
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('✅ Storage limpiado, redirigiendo...');
    
    // Redireccionar inmediatamente
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ logout }}>
      {children}
    </AuthContext.Provider>
  );
};