
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import AdminDashboard from '../pages/AdminDashboard';
import GtrDashboard from '../pages/GtrDashboard';
import AsesorDashboard from '../pages/AsesorDashboard';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

// Componente para redirigir al dashboard apropiado basado en el tipo de usuario
const DashboardRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  
  console.log('🔄 DashboardRedirect - Loading:', loading);
  console.log('👤 DashboardRedirect - User:', user);
  
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
  
  if (!user) {
    console.log('❌ DashboardRedirect - No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('🎯 DashboardRedirect - User tipo:', user.tipo);
  
  // Usar 'tipo' en lugar de 'role' y valores correctos de la BD
  switch (user.tipo) {
    case 'admin':
      console.log('👑 Redirecting to admin dashboard');
      return <Navigate to="/dashboard/admin" replace />;
    case 'gtr':
      console.log('📊 Redirecting to gtr dashboard');
      return <Navigate to="/dashboard/gtr" replace />;
    case 'asesor':
      console.log('🎯 Redirecting to ASESOR dashboard (custom)');
      return <Navigate to="/dashboard/asesor" replace />;
    default:
      console.warn('⚠️ Tipo de usuario no reconocido:', user.tipo);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center card max-w-md">
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

const AppRoutes: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Ruta de dashboard con redirección automática */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        } 
      />
      
      {/* Rutas específicas por tipo de usuario con protección */}
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
      
      {/* Rutas legacy (mantener por compatibilidad) */}
      <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
      <Route path="/gtr" element={<Navigate to="/dashboard/gtr" replace />} />
      <Route path="/asesor" element={<Navigate to="/dashboard/asesor" replace />} />
      
      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
