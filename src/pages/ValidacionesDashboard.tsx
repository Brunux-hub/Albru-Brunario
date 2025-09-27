import React, { useState } from 'react';
import { Box } from '@mui/material';
import { 
  ValidacionesSidebar, 
  ValidacionesDashboard as ValidacionesDashboardComponent, 
  ValidacionesBusqueda, 
  ValidacionesProceso 
} from '../components/validaciones';

const ValidacionesDashboard: React.FC = () => {
  const [section, setSection] = useState('Dashboard');

  const renderContent = () => {
    switch (section) {
      case 'Dashboard':
        return (
          <>
            <ValidacionesDashboardComponent />
          </>
        );
      case 'Búsqueda':
        return <ValidacionesBusqueda />;
      case 'Validación':
        return <ValidacionesProceso />;
      case 'Reportes':
        return (
          <Box sx={{ 
            p: 4, 
            backgroundColor: '#f8fafc',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <h2 style={{ color: '#059669' }}>Reportes de Validación</h2>
              <p style={{ color: '#6b7280' }}>Próximamente: Reportes detallados de calidad y validación</p>
            </Box>
          </Box>
        );
      case 'Configuración':
        return (
          <Box sx={{ 
            p: 4, 
            backgroundColor: '#f8fafc',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <h2 style={{ color: '#059669' }}>Configuración de Validaciones</h2>
              <p style={{ color: '#6b7280' }}>Próximamente: Configuración de parámetros de validación</p>
            </Box>
          </Box>
        );
      default:
        return <ValidacionesDashboardComponent />;
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <ValidacionesSidebar onSelect={setSection} selected={section} />
      
      <Box sx={{ 
        flexGrow: 1, 
        marginLeft: '220px'
      }}>
        {renderContent()}
      </Box>
    </Box>
  );
};

export default ValidacionesDashboard;
