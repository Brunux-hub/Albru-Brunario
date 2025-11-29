import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AsesorSidebar from './AsesorSidebar.tsx';
import AsesorResumen from './AsesorResumen.tsx';
import AsesorClientesTable from './AsesorClientesTable.tsx';
import AsesorGestionesDia from './AsesorGestionesDia.tsx';
import AsesorHistorial from './AsesorHistorial.tsx';
import { useSocket } from '../../hooks/useSocket';
import { useClientes } from '../../context/AppContext';
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
  const [tabActual, setTabActual] = useState(0);
  const asesorClientesTableRef = useRef<AsesorClientesTableRef | null>(null);
  const { clientes } = useClientes();

  // Obtener datos del asesor desde localStorage ANTES de useSocket
  const rawUser = localStorage.getItem('userData') || localStorage.getItem('albru_user');
  let parsedUser: Record<string, unknown> | null = null;
  try {
    parsedUser = rawUser ? JSON.parse(rawUser) as Record<string, unknown> : null;
  } catch (error) {
    console.warn('Error parsing stored userData for advisor identification:', error);
    parsedUser = null;
  }

  const asesorId = (parsedUser && (parsedUser['id'] ?? parsedUser['usuario_id'])) ?? null;
  const asesorName = ((parsedUser && (parsedUser['nombre'] as string)) ?? localStorage.getItem('username')) || 'Asesor';
  const identifyValue = asesorId ? String(asesorId) : asesorName;

  // Inicializar socket CON autenticación
  const { socket, isConnected } = useSocket({
    userId: asesorId ? Number(asesorId) : undefined,
    role: 'asesor',
    autoConnect: true
  });

  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🔌 Asesor: Socket.io conectado, uniéndose a sala Asesor:', identifyValue);
    
    // Unirse a la sala de asesor
    socket.emit('join-asesor-room', { 
      asesorId: asesorId, 
      username: asesorName 
    });

    // Manejar eventos de reasignación
    const handleClientReassigned = (data: unknown) => {
      console.log('🔔 [ASESOR FRONTEND] ================================');
      console.log('🔔 [ASESOR FRONTEND] Evento CLIENT_REASSIGNED recibido!');
      console.log('🔔 [ASESOR FRONTEND] Payload completo:', JSON.stringify(data, null, 2));
      console.log('🔔 [ASESOR FRONTEND] asesorId actual:', asesorId);
      console.log('🔔 [ASESOR FRONTEND] asesorName actual:', asesorName);

      const payload = (data as Record<string, unknown>) || {};
      const nuevo = (payload['nuevoAsesor'] as Record<string, unknown>) || {};
      const nuevoId = (nuevo['usuario_id'] ?? nuevo['id']) ?? null;
      const nuevoName = (nuevo['nombre'] ?? nuevo['username']) ?? null;

      console.log('🔔 [ASESOR FRONTEND] nuevoAsesor extraído:', nuevo);
      console.log('🔔 [ASESOR FRONTEND] nuevoId:', nuevoId, 'nuevoName:', nuevoName);

      const matchById = nuevoId !== null && asesorId !== null && Number(nuevoId) === Number(asesorId);
      const matchByName = nuevoName !== null && nuevoName === asesorName;

      console.log('🔔 [ASESOR FRONTEND] matchById:', matchById, 'matchByName:', matchByName);

      if (matchById || matchByName) {
        console.log('✅ [ASESOR FRONTEND] ¡Match encontrado! Actualizando lista de clientes...');
        
        const clienteObj = payload['cliente'] as Record<string, unknown> | undefined;
        const clienteNombre = clienteObj ? (clienteObj['nombre'] as string | undefined) : undefined;
        setNotification(`¡Nuevo cliente asignado: ${clienteNombre ?? 'cliente'}!`);
        setShowNotification(true);

        // Actualizar la tabla de clientes
        if (asesorClientesTableRef.current && asesorClientesTableRef.current.refreshClientes) {
          console.log('✅ [ASESOR FRONTEND] Llamando a refreshClientes()');
          asesorClientesTableRef.current.refreshClientes();
        } else {
          console.warn('⚠️ [ASESOR FRONTEND] refreshClientes() no disponible en la ref');
        }
      } else {
        console.log('ℹ️ [ASESOR FRONTEND] No match - evento no es para este asesor');
      }
      console.log('🔔 [ASESOR FRONTEND] ================================');
    };

    // Manejar actualizaciones de historial
    const handleHistorialUpdated = () => {
      if (asesorClientesTableRef.current && asesorClientesTableRef.current.refreshClientes) {
        asesorClientesTableRef.current.refreshClientes();
      }
    };

    // Manejar cliente movido a GTR (wizard completado - desaparece de la lista del asesor)
    const handleClientMovedToGTR = (data: unknown) => {
      console.log('📋 [ASESOR FRONTEND] ================================');
      console.log('📋 [ASESOR FRONTEND] Evento CLIENT_MOVED_TO_GTR recibido!');
      console.log('📋 [ASESOR FRONTEND] Payload completo:', JSON.stringify(data, null, 2));
      
      const msg = data as Record<string, unknown>;
      const clienteId = Number(msg['clienteId']);
      
      console.log('📋 [ASESOR FRONTEND] clienteId extraído:', clienteId);
      
      if (clienteId) {
        console.log('✅ [ASESOR FRONTEND] Cliente gestionado - Refrescando lista para removerlo...');
        
        // Actualizar la tabla de clientes para que desaparezca el cliente gestionado
        if (asesorClientesTableRef.current && asesorClientesTableRef.current.refreshClientes) {
          console.log('✅ [ASESOR FRONTEND] Llamando a refreshClientes() para actualizar lista');
          asesorClientesTableRef.current.refreshClientes();
        } else {
          console.warn('⚠️ [ASESOR FRONTEND] refreshClientes() no disponible en la ref');
        }
        
        // Mostrar notificación de que el cliente fue gestionado
        setNotification('Cliente movido a GTR - Gestión completada');
        setShowNotification(true);
      } else {
        console.warn('⚠️ [ASESOR FRONTEND] clienteId inválido en CLIENT_MOVED_TO_GTR');
      }
      console.log('📋 [ASESOR FRONTEND] ================================');
    };

    // Manejar CLIENT_COMPLETED (señala que el cliente fue gestionado)
    const handleClientCompleted = (data: unknown) => {
      console.log('📋 [ASESOR FRONTEND] Evento CLIENT_COMPLETED recibido (handler adicional)');
      try {
        const msg = data as Record<string, unknown>;
        // payload puede venir como { clienteId, cliente, asesorId }
        const clienteId = Number(msg['clienteId'] || (msg['cliente'] && (msg['cliente'] as Record<string, unknown>)['id']));
        if (clienteId) {
          console.log('✅ [ASESOR FRONTEND] Cliente gestionado (CLIENT_COMPLETED) - Refrescando lista', clienteId);
          if (asesorClientesTableRef.current && asesorClientesTableRef.current.refreshClientes) {
            asesorClientesTableRef.current.refreshClientes();
          }
          setNotification('Cliente gestionado y movido a GTR');
          setShowNotification(true);
        } else {
          console.warn('⚠️ [ASESOR FRONTEND] clienteId inválido en CLIENT_COMPLETED');
        }
      } catch (e) {
        console.error('❌ [ASESOR FRONTEND] Error procesando CLIENT_COMPLETED en asesor:', e);
      }
    };

    // Registrar listeners
    socket.on('CLIENT_REASSIGNED', handleClientReassigned);
    socket.on('HISTORIAL_UPDATED', handleHistorialUpdated);
    socket.on('CLIENT_MOVED_TO_GTR', handleClientMovedToGTR);
    socket.on('CLIENT_COMPLETED', handleClientCompleted);

    // Cleanup
    return () => {
      socket.off('CLIENT_REASSIGNED', handleClientReassigned);
      socket.off('HISTORIAL_UPDATED', handleHistorialUpdated);
      socket.off('CLIENT_MOVED_TO_GTR', handleClientMovedToGTR);
      socket.off('CLIENT_COMPLETED', handleClientCompleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected]);

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  const handleChangeTab = (newTab: number) => {
    setTabActual(newTab);
  };

  const getTitulo = () => {
    switch (tabActual) {
      case 0: return 'Mis Clientes Asignados';
      case 1: return 'Gestiones del Día';
      case 2: return 'Mi Historial';
      default: return 'Panel del Asesor';
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
        <AsesorSidebar tabActual={tabActual} onTabChange={handleChangeTab} />
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, zoom: 0.85 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.5rem', md: '1.875rem' },
              color: '#111827',
              mb: 1
            }}>
              {getTitulo()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Gestiona y visualiza tus clientes asignados
            </Typography>
          </Box>

          {tabActual === 0 && (
            <>
              <AsesorResumen clientes={clientes} />
              <Box mt={3}>
                <AsesorClientesTable ref={asesorClientesTableRef} />
              </Box>
            </>
          )}

          {tabActual === 1 && <AsesorGestionesDia />}

          {tabActual === 2 && <AsesorHistorial />}
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
