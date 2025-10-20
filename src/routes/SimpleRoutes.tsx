import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import AdminDashboard from '../pages/AdminDashboard';
import GtrDashboard from '../pages/GtrDashboard';
import AsesorDashboard from '../pages/AsesorDashboard';
import ClearStorage from '../components/ClearStorage';

// Componente para verificar autenticación básica
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('albru_token');
  
  console.log('🔐 RequireAuth - Token exists:', !!token);
  
  if (!token) {
    console.log('❌ RequireAuth - No token, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Verificar si el token no está expirado
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    
    if (isExpired) {
      console.log('❌ RequireAuth - Token expired, clearing and redirecting');
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }
    
    console.log('✅ RequireAuth - Valid token, allowing access');
    return <>{children}</>;
  } catch (error) {
    console.log('❌ RequireAuth - Invalid token, clearing and redirecting');
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

// Componente simple para redirección inicial
const HomeRedirect: React.FC = () => {
  const token = localStorage.getItem('albru_token');
  
  console.log('🏠 HomeRedirect - Token encontrado:', !!token);
  console.log('🏠 HomeRedirect - Token completo:', token);
  
  if (!token) {
    console.log('❌ HomeRedirect - No token, redirigiendo a login');
    return <Navigate to="/login" replace />;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userType = payload.tipo;
    
    console.log('👤 HomeRedirect - Tipo de usuario:', userType);
    console.log('👤 HomeRedirect - Payload completo:', payload);
    
    switch (userType) {
      case 'gtr':
        console.log('➡️ Redirigiendo a GTR dashboard');
        return <Navigate to="/dashboard/gtr" replace />;
      case 'asesor':
        console.log('➡️ Redirigiendo a ASESOR dashboard');
        return <Navigate to="/dashboard/asesor" replace />;
      case 'admin':
        console.log('➡️ Redirigiendo a ADMIN dashboard');
        return <Navigate to="/dashboard/admin" replace />;
      default:
        console.log('❌ Tipo de usuario desconocido, limpiando y redirigiendo');
        localStorage.clear();
        return <Navigate to="/login" replace />;
    }
  } catch (error) {
    console.log('❌ Error decodificando token:', error);
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

const SimpleRoutes: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Ruta de login */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/clear" element={<ClearStorage />} />
      
      {/* Ruta de inicio */}
      <Route path="/" element={<HomeRedirect />} />
      
      {/* Rutas protegidas */}
      <Route 
        path="/dashboard/gtr" 
        element={
          <RequireAuth>
            <GtrDashboard />
          </RequireAuth>
        } 
      />
      <Route 
        path="/dashboard/asesor" 
        element={
          <RequireAuth>
            <AsesorDashboard />
          </RequireAuth>
        } 
      />
      <Route 
        path="/dashboard/admin" 
        element={
          <RequireAuth>
            <AdminDashboard />
          </RequireAuth>
        } 
      />
      
      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);

export default SimpleRoutes;