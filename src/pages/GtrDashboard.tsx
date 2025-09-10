import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import GtrSidebar from '../components/gtr/GtrSidebar';
import GtrSummary from '../components/gtr/GtrSummary';
import GtrStatusMenu from '../components/gtr/GtrStatusMenu';
import GtrClientsTable from '../components/gtr/GtrClientsTable';

const GtrDashboard: React.FC = () => {
  const [section, setSection] = useState('Clientes');
  const [status, setStatus] = useState('Todos');

  return (
    <Box sx={{ display: 'flex' }}>
      <GtrSidebar onSelect={setSection} selected={section} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {section === 'Clientes' && (
          <>
            <GtrSummary />
            <GtrStatusMenu selected={status} onSelect={setStatus} />
            <GtrClientsTable statusFilter={status} />
          </>
        )}
        {section === 'Asesores' && (
          <Box>Gestión de asesores (próximamente)</Box>
        )}
        {section === 'Reportes' && (
          <Box>Reportes y métricas (próximamente)</Box>
        )}
        {section === 'Configuración' && (
          <Box>Configuración del panel (próximamente)</Box>
        )}
      </Box>
    </Box>
  );
};

export default GtrDashboard;
