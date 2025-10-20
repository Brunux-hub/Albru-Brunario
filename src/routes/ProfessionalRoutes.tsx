import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/UnifiedAuthContext';
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
      <div className="min-h-screen flex items-center justify-center">
        <div>Verificando autenticación...</div>
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
      <div className="min-h-screen flex items-center justify-center">
        <div>Cargando...</div>
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
      console.log('➡️ HomeRedirect - Redirigiendo a admin');
      return <Navigate to="/dashboard/admin" replace />;
    case 'gtr':
      console.log('➡️ HomeRedirect - Redirigiendo a gtr');
      return <Navigate to="/dashboard/gtr" replace />;
    case 'asesor':
      console.log('➡️ HomeRedirect - Redirigiendo a asesor');
      return <Navigate to="/dashboard/asesor" replace />;
    default:
      console.log('❌ HomeRedirect - Tipo de usuario desconocido:', user.tipo);
      return <Navigate to="/login" replace />;
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
      
      {/* Rutas legacy para compatibilidad */}
      <Route path="/dashboard" element={<HomeRedirect />} />
      
      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default ProfessionalRoutes;