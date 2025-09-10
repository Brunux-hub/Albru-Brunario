import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { Typography } from '@mui/material';

const CalidadDashboard: React.FC = () => (
  <MainLayout>
    <Typography variant="h4" color="primary" fontWeight="bold" align="center" mb={2}>
      Panel Calidad
    </Typography>
    <Typography align="center">Bienvenido, calidad. Aquí podrás auditar procesos y revisar reportes de calidad.</Typography>
  </MainLayout>
);

export default CalidadDashboard;
