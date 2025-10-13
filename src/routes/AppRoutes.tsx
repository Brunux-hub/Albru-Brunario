
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import AdminDashboard from '../pages/AdminDashboard';
import GtrDashboard from '../pages/GtrDashboard';
import SupervisorDashboard from '../pages/SupervisorDashboard';
import AsesorDashboard from '../pages/AsesorDashboard';
import ValidacionesDashboard from '../pages/ValidacionesDashboard';
import { useAuth } from '../context/AuthContext';

// Componente para redirigir al dashboard apropiado basado en el rol
const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'gtr':
      return <Navigate to="/gtr" replace />;
    case 'supervisor':
      return <Navigate to="/supervisor" replace />;
    case 'asesor':
      return <Navigate to="/asesor" replace />;
    case 'validaciones':
      return <Navigate to="/validaciones" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

const AppRoutes: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/gtr" element={<GtrDashboard />} />
      <Route path="/supervisor" element={<SupervisorDashboard />} />
      <Route path="/asesor" element={<AsesorDashboard />} />
      <Route path="/validaciones" element={<ValidacionesDashboard />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
