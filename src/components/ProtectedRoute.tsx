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

  console.log('ProtectedRoute - Loading:', loading);
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('ProtectedRoute - User:', user);
  console.log('ProtectedRoute - allowedRoles:', allowedRoles);
  console.log('ProtectedRoute - location:', location.pathname);

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

  // Verificación ESTRICTA: debe haber token Y usuario
  const hasValidToken = (() => {
    const token = localStorage.getItem('albru_token');
    if (!token) return false;
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  })();

  // FORZAR logout si no hay token válido
  if (!hasValidToken || !user || !isAuthenticated) {
    console.log('ProtectedRoute - FORCED logout: No valid token or user');
    localStorage.clear();
    sessionStorage.clear();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar roles permitidos si se especifican
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.tipo)) {
    console.log('ProtectedRoute - Role mismatch:', user.tipo, 'not in', allowedRoles);
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

  console.log('ProtectedRoute - Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;