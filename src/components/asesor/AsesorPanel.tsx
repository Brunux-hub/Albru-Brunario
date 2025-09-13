import React from 'react';
import { Box, Typography } from '@mui/material';
import AsesorSidebar from './AsesorSidebar.tsx';
import AsesorResumen from './AsesorResumen.tsx';
import AsesorClientesTable from './AsesorClientesTable.tsx';

const AsesorPanel: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f7f9fb' }}>
      <AsesorSidebar />
      <Box sx={{ flex: 1, p: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Mis Clientes Asignados
        </Typography>
        <AsesorResumen />
        <Box mt={3}>
          <AsesorClientesTable />
        </Box>
      </Box>
    </Box>
  );
};

export default AsesorPanel;
