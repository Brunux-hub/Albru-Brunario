import React from 'react';
import { Box, Typography } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AsesorSidebar from './AsesorSidebar.tsx';
import AsesorResumen from './AsesorResumen.tsx';
import AsesorClientesTable from './AsesorClientesTable.tsx';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const AsesorPanel: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
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
    </ThemeProvider>
  );
};

export default AsesorPanel;
