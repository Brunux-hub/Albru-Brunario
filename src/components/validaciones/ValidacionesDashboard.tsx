import React from 'react';
import {
  Box,
  Container,
  Typography
} from '@mui/material';
import ValidacionesSummary from './ValidacionesSummary';
import ValidacionesTable from './ValidacionesTable';

const ValidacionesDashboard: React.FC = () => {
  return (
    <Box sx={{ 
      flexGrow: 1, 
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      p: 3
    }}>
      <Container maxWidth="xl">
        {/* Encabezado */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#1f2937',
              mb: 1
            }}
          >
            Dashboard de Validaciones
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#6b7280',
              fontSize: 16
            }}
          >
            Gestiona y supervisa el proceso de validación de clientes
          </Typography>
        </Box>

        {/* Tarjetas de resumen */}
        <ValidacionesSummary />
        
        {/* Tabla de validaciones */}
        <ValidacionesTable />
      </Container>
    </Box>
  );
};

export default ValidacionesDashboard;