import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AsesorSidebar from './AsesorSidebar.tsx';
import AsesorResumen from './AsesorResumen.tsx';
import AsesorClientesTable from './AsesorClientesTable.tsx';
import RealtimeService from '../../services/RealtimeService';
import type { AsesorClientesTableRef } from './AsesorClientesTable';
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
  const asesorClientesTableRef = useRef<AsesorClientesTableRef | null>(null);
  const realtimeService = RealtimeService.getInstance();

  useEffect(() => {
    // Obtener datos del asesor desde localStorage (compatibilidad con varias claves)
    const rawUser = localStorage.getItem('userData') || localStorage.getItem('albru_user') || localStorage.getItem('albru_user');
    let parsedUser: Record<string, unknown> | null = null;
    try {
      parsedUser = rawUser ? JSON.parse(rawUser) as Record<string, unknown> : null;
    } catch (error) {
      console.warn('Error parsing stored userData for advisor identification:', error);
      parsedUser = null;
    }

    const asesorId = (parsedUser && (parsedUser['id'] ?? parsedUser['usuario_id'])) ?? null;
  const asesorName = ((parsedUser && (parsedUser['nombre'] as string)) ?? localStorage.getItem('username')) || 'Asesor';

    // Conectar al WebSocket como asesor usando preferentemente el id como identificador
    const identifyValue = asesorId ? String(asesorId) : asesorName;
    if (!realtimeService.isConnected()) {
      realtimeService.connect('ASESOR', identifyValue);
    }

    // Suscribirse a eventos de reasignación
  const unsubscribeReassigned = realtimeService.subscribe('CLIENT_REASSIGNED', (data: unknown) => {
  console.log('🔔 Asesor: Cliente reasignado recibido:', data);

  // Intentar obtener id y nombre del nuevo asesor desde el payload (con casting defensivo)
  const payload = (data as Record<string, unknown>) || {};
  const nuevo = (payload['nuevoAsesor'] as Record<string, unknown>) || {};
  const nuevoId = (nuevo['usuario_id'] ?? nuevo['id']) ?? null;
  const nuevoName = (nuevo['nombre'] ?? nuevo['username']) ?? null;

      // Verificar si este asesor recibió un nuevo cliente. Primero por id (más robusto), luego por nombre.
      const matchById = nuevoId !== null && asesorId !== null && Number(nuevoId) === Number(asesorId);
      const matchByName = nuevoName !== null && nuevoName === asesorName;

      if (matchById || matchByName) {
  const clienteObj = payload['cliente'] as Record<string, unknown> | undefined;
  const clienteNombre = clienteObj ? (clienteObj['nombre'] as string | undefined) : undefined;
  setNotification(`¡Nuevo cliente asignado: ${clienteNombre ?? 'cliente'}!`);
        setShowNotification(true);

        // Actualizar la tabla de clientes
        if (asesorClientesTableRef.current && asesorClientesTableRef.current.refreshClientes) {
          asesorClientesTableRef.current.refreshClientes();
        }
      }
    });

    // Suscribirse a actualizaciones de historial generales (reportes)
    const unsubscribeHist = realtimeService.subscribe('HISTORIAL_UPDATED', () => {
      // For simplicity, refrescamos la tabla de clientes del asesor ya que el reporte puede mostrar la gestión
      if (asesorClientesTableRef.current && asesorClientesTableRef.current.refreshClientes) {
        asesorClientesTableRef.current.refreshClientes();
      }
    });

    // Limpiar al desmontar
    return () => {
      unsubscribeReassigned();
      unsubscribeHist();
      // No desconectar automáticamente para mantener la conexión
    };
  }, [realtimeService]);

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
