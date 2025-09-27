
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import AdminDashboard from '../pages/AdminDashboard';
import GtrDashboard from '../pages/GtrDashboard';
import SupervisorDashboard from '../pages/SupervisorDashboard';
import AsesorDashboard from '../pages/AsesorDashboard';
import ValidacionesDashboard from '../pages/ValidacionesDashboard';

const AppRoutes: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/gtr" element={<GtrDashboard />} />
      <Route path="/supervisor" element={<SupervisorDashboard />} />
      <Route path="/asesor" element={<AsesorDashboard />} />
      <Route path="/validaciones" element={<ValidacionesDashboard />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
