import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { Typography } from '@mui/material';

const AdminDashboard: React.FC = () => (
  <MainLayout>
    <Typography variant="h4" color="primary" fontWeight="bold" align="center" mb={2}>
      Panel de Administración
    </Typography>
    <Typography align="center">Bienvenido, administrador. Aquí podrás gestionar usuarios, roles y ver reportes globales.</Typography>
  </MainLayout>
);

export default AdminDashboard;
