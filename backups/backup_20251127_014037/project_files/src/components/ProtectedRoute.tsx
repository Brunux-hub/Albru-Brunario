import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  userId: number;
  tipo: string;
  exp: number;
  iat: number;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  const isDev = import.meta.env.MODE === 'development';

  if (isDev) {
    console.debug('ProtectedRoute - Loading:', loading);
    console.debug('ProtectedRoute - isAuthenticated:', isAuthenticated);
    console.debug('ProtectedRoute - User:', user);
    console.debug('ProtectedRoute - allowedRoles:', allowedRoles);
    console.debug('ProtectedRoute - location:', location.pathname);
  }

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-gray-600 mt-2">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Verificación del token
  const hasValidToken = (() => {
    const token = localStorage.getItem('albru_token');
    if (!token) return false;
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const isExpired = decoded.exp * 1000 <= Date.now();
      if (isExpired && isDev) console.debug('ProtectedRoute - Token expirado');
      return !isExpired;
    } catch (e) {
      if (isDev) console.debug('ProtectedRoute - Error decodificando token:', e);
      return false;
    }
  })();

  // Redirect a login si no hay token válido o usuario
  if (!hasValidToken || !user || !isAuthenticated) {
    if (isDev) {
      console.debug('ProtectedRoute - Redirect a login:', {
        hasValidToken,
        hasUser: !!user,
        isAuthenticated
      });
    }
    // NO limpiar localStorage aquí - solo redirect
    // El logout explícito debe hacerse desde AppContext
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar roles permitidos si se especifican
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.tipo)) {
    if (isDev) console.debug('ProtectedRoute - Role mismatch:', user.tipo, 'not in', allowedRoles);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta sección.
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Tu rol: <span className="font-medium">{user.tipo}</span>
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Roles permitidos: <span className="font-medium">{allowedRoles.join(', ')}</span>
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            Ir a mi Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isDev) console.debug('ProtectedRoute - Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;