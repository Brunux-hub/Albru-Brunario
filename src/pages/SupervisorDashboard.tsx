import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { Typography } from '@mui/material';

const SupervisorDashboard: React.FC = () => (
  <MainLayout>
    <Typography variant="h4" color="primary" fontWeight="bold" align="center" mb={2}>
      Panel Supervisor
    </Typography>
    <Typography align="center">Bienvenido, supervisor. Aquí podrás monitorear a tu equipo y revisar reportes de desempeño.</Typography>
  </MainLayout>
);

export default SupervisorDashboard;
