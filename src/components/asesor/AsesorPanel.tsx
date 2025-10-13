import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AsesorSidebar from './AsesorSidebar.tsx';
import AsesorResumen from './AsesorResumen.tsx';
import AsesorClientesTable from './AsesorClientesTable.tsx';
import RealtimeService from '../../services/RealtimeService';
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
  const [notification, setNotification] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);
  const asesorClientesTableRef = useRef<any>(null);
  const realtimeService = RealtimeService.getInstance();

  useEffect(() => {
    // Conectar al WebSocket como asesor
    const asesorName = localStorage.getItem('username') || 'Asesor';
    
    // Solo conectar si no está ya conectado
    if (!realtimeService.isConnected()) {
      realtimeService.connect('ASESOR', asesorName);
    }

    // Suscribirse a eventos de reasignación
    const unsubscribeReassigned = realtimeService.subscribe('CLIENT_REASSIGNED', (data: any) => {
      console.log('🔔 Asesor: Cliente reasignado recibido:', data);
      
      // Verificar si este asesor recibió un nuevo cliente
      if (data.nuevoAsesor && data.nuevoAsesor.nombre === asesorName) {
        setNotification(`¡Nuevo cliente asignado: ${data.cliente.nombre}!`);
        setShowNotification(true);
        
        // Actualizar la tabla de clientes
        if (asesorClientesTableRef.current && asesorClientesTableRef.current.refreshClientes) {
          asesorClientesTableRef.current.refreshClientes();
        }
      }
    });

    // Limpiar al desmontar
    return () => {
      unsubscribeReassigned();
      // No desconectar automáticamente para mantener la conexión
    };
  }, []);

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

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
            <AsesorClientesTable ref={asesorClientesTableRef} />
          </Box>
        </Box>
      </Box>

      {/* Notificación de nuevos clientes */}
      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity="success" sx={{ width: '100%' }}>
          {notification}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default AsesorPanel;
