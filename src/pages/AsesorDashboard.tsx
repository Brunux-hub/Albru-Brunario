import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { Typography } from '@mui/material';

const AsesorDashboard: React.FC = () => (
  <MainLayout>
    <Typography variant="h4" color="primary" fontWeight="bold" align="center" mb={2}>
      Panel Asesor
    </Typography>
    <Typography align="center">Bienvenido, asesor. Aquí podrás ver tus tareas, metas y reportes personales.</Typography>
  </MainLayout>
);

export default AsesorDashboard;
