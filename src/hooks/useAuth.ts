import { useContext } from 'react';
import { AuthContext as MainAuthContext } from '../context/AuthContext';
import { AuthContext as SimpleAuthContext } from '../context/SimpleAuthContext';
import { AuthContext as UnifiedAuthContext } from '../context/UnifiedAuthContext';

// Hook para AuthContext principal (admin/gtr/asesor completo)
export const useAuth = () => {
  const context = useContext(MainAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook para SimpleAuthContext (logout simple)
export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

// Hook para UnifiedAuthContext (autenticación unificada)
export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};
