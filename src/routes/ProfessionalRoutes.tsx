import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginPage from '../pages/LoginPage';
import AdminDashboard from '../pages/AdminDashboard';
import GtrDashboard from '../pages/GtrDashboard';
import AsesorDashboard from '../pages/AsesorDashboard';
import ClearStorage from '../components/ClearStorage';

// Componente para proteger rutas
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  console.log('🔐 ProtectedRoute - Auth:', isAuthenticated, 'User:', user?.tipo, 'Loading:', loading);
  
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
  
  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute - No autenticado, redirigiendo a login');
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.tipo)) {
    console.log('❌ ProtectedRoute - Rol no autorizado:', user.tipo);
    return <Navigate to="/login" replace />;
  }
  
  console.log('✅ ProtectedRoute - Acceso autorizado');
  return <>{children}</>;
};

// Componente para redirección inicial
const HomeRedirect: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  
  console.log('🏠 HomeRedirect - Auth:', isAuthenticated, 'User:', user, 'Loading:', loading);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-gray-600 mt-2">Cargando dashboard personalizado...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    console.log('❌ HomeRedirect - No autenticado, redirigiendo a login');
    return <Navigate to="/login" replace />;
  }
  
  // Redireccionar según el tipo de usuario
  switch (user.tipo) {
    case 'admin':
      console.log('👑 HomeRedirect - Redirigiendo a admin dashboard');
      return <Navigate to="/dashboard/admin" replace />;
    case 'gtr':
      console.log('📊 HomeRedirect - Redirigiendo a gtr dashboard');
      return <Navigate to="/dashboard/gtr" replace />;
    case 'asesor':
      console.log('🎯 HomeRedirect - Redirigiendo a asesor dashboard');
      return <Navigate to="/dashboard/asesor" replace />;
    default:
      console.warn('⚠️ Tipo de usuario no reconocido:', user.tipo);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center card max-w-md p-6">
            <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Tipo de Usuario No Reconocido
            </h2>
            <p className="text-gray-600 mb-4">
              Tu tipo de usuario "{user.tipo}" no tiene un dashboard asignado.
            </p>
            <p className="text-sm text-gray-500">
              Contacta al administrador para resolver este problema.
            </p>
          </div>
        </div>
      );
  }
};

const ProfessionalRoutes: React.FC = () => (
  <BrowserRouter>
    <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/clear" element={<ClearStorage />} />      {/* Ruta de inicio con redirección inteligente */}
      <Route path="/" element={<HomeRedirect />} />
      
      {/* Rutas protegidas por rol */}
      <Route 
        path="/dashboard/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/gtr" 
        element={
          <ProtectedRoute allowedRoles={['gtr']}>
            <GtrDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/asesor" 
        element={
          <ProtectedRoute allowedRoles={['asesor']}>
            <AsesorDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Ruta /dashboard con redirección automática según tipo de usuario */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <HomeRedirect />
        </ProtectedRoute>
      } />
      
      {/* Rutas legacy (sin /dashboard) para compatibilidad */}
      <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
      <Route path="/gtr" element={<Navigate to="/dashboard/gtr" replace />} />
      <Route path="/asesor" element={<Navigate to="/dashboard/asesor" replace />} />
      
      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);

export default ProfessionalRoutes;