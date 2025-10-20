import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import GtrSidebar from '../components/gtr/GtrSidebar';
import RealtimeService from '../services/RealtimeService';

import GtrStatusMenu from '../components/gtr/GtrStatusMenu';
import GtrClientsTable from '../components/gtr/GtrClientsTable';
import GtrAsesoresTable from '../components/gtr/GtrAsesoresTable';
import AddClientDialog from '../components/gtr/AddClientDialog';

const GtrDashboard: React.FC = () => {
  const [section, setSection] = useState('Clientes');
  const [status, setStatus] = useState('Todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [asesores, setAsesores] = useState<any[]>([]);
  // const [validadores, setValidadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar asesores desde la API
  useEffect(() => {
    const fetchAsesores = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/asesores');
        const data = await response.json();
        
        if (data.success && data.asesores) {
          const asesoresFormateados = data.asesores.map((asesor: any) => ({
            asesor_id: asesor.asesor_id,
            usuario_id: asesor.usuario_id,
            nombre: asesor.nombre,
            email: asesor.email,
            telefono: asesor.telefono || 'Sin teléfono',
            estado: asesor.estado === 'activo' ? 'Activo' : 'Offline',
            clientes_asignados: asesor.clientes_asignados || 0,
            meta_mensual: asesor.meta_mensual || '50000.00',
            ventas_realizadas: asesor.ventas_realizadas || '0.00',
            comision_porcentaje: asesor.comision_porcentaje || '5.00'
          }));
          console.log('🔍 GTR: Asesores cargados desde API:', data.asesores);
          console.log('🔍 GTR: Asesores formateados:', asesoresFormateados);
          setAsesores(asesoresFormateados);
        } else {
          setError('No se pudieron cargar los asesores');
        }
      } catch (error) {
        console.error('Error cargando asesores:', error);
        setError('Error de conexión al cargar asesores');
        setAsesores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAsesores();
  }, []);

  // Cargar clientes desde la API
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch('/api/clientes');
        const data = await response.json();
        
        if (data.success && data.clientes) {
          const clientesFormateados = data.clientes.map((cliente: any) => ({
            id: cliente.id,
            fecha: new Date(cliente.created_at || cliente.fecha_asignacion).toLocaleDateString('es-ES'),
            cliente: cliente.telefono || 'Sin teléfono',
            nombre: cliente.nombre || 'Sin nombre',
            lead: cliente.lead_id || cliente.id.toString(),
            ciudad: cliente.distrito || 'Sin ciudad',
            plan: cliente.plan_seleccionado || 'Sin plan',
            precio: cliente.precio_final || 0,
            estado: cliente.estado_cliente || 'nuevo',
            asesor: cliente.asesor_nombre || 'Disponible',
            canal: 'Web',
            distrito: cliente.distrito || 'Sin distrito',
            clienteNuevo: true,
            observaciones: cliente.observaciones_asesor || '',
            telefono: cliente.telefono || '',
            email: cliente.correo_electronico || '',
            direccion: cliente.direccion || '',
            historial: []
          }));
          setClients(clientesFormateados);
        }
      } catch (error) {
        console.error('Error cargando clientes:', error);
      }
    };

    fetchClientes();
  }, []);

  // Manejar nuevo cliente agregado
  useEffect(() => {
    if (newClient) {
      setClients(prev => [newClient, ...prev]);
      setNewClient(null);
    }
  }, [newClient]);

  // Conectar WebSocket para GTR
  useEffect(() => {
    const realtimeService = RealtimeService.getInstance();
    const gtrName = localStorage.getItem('username') || 'GTR';
    
    // Solo conectar si no está ya conectado
    if (!realtimeService.isConnected()) {
      realtimeService.connect('GTR', gtrName);
    }
    
    // Suscribirse a confirmaciones de reasignación
    const unsubscribe = realtimeService.subscribe('REASSIGNMENT_CONFIRMED', (data: any) => {
      console.log('✅ GTR: Reasignación confirmada por WebSocket:', data);
    });

    return () => {
      unsubscribe();
      // No desconectar automáticamente
    };
  }, []);



  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando dashboard GTR...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <GtrSidebar
        onSelect={setSection}
        selected={section}
      />
      
      <Box sx={{ 
        flex: 1, 
        p: { xs: 2, sm: 3 }, 
        marginLeft: { xs: 0, md: '220px' }, // Responsivo para móviles
        minHeight: '100vh',
        width: { xs: '100%', md: 'calc(100% - 220px)' }
      }}>
        {/* Header móvil */}
        <Box sx={{ 
          display: { xs: 'block', md: 'none' }, 
          mb: 2
        }}>
          <Box sx={{ 
            p: 2,
            bgcolor: '#1e293b',
            color: 'white',
            borderRadius: 2,
            mx: -2,
            mt: -2,
            mb: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              GTR Panel - {section}
            </Typography>
          </Box>
          
          {/* Navegación móvil */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': { display: 'none' }
          }}>
            {['Clientes', 'Asesores', 'Reportes', 'Configuración'].map((item) => (
              <Button
                key={item}
                variant={section === item ? 'contained' : 'outlined'}
                onClick={() => setSection(item)}
                size="small"
                sx={{
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                  px: 2,
                  py: 1,
                  backgroundColor: section === item ? '#3b82f6' : 'transparent',
                  borderColor: '#3b82f6',
                  color: section === item ? 'white' : '#3b82f6',
                  '&:hover': {
                    backgroundColor: section === item ? '#2563eb' : '#f3f4f6',
                  }
                }}
              >
                {item}
              </Button>
            ))}
          </Box>
        </Box>

        <Typography variant="h4" sx={{ 
          mb: 3, 
          fontWeight: 600,
          fontSize: { xs: '1.75rem', md: '2.125rem' },
          color: '#1f2937',
          display: { xs: 'none', md: 'block' }
        }}>
          Panel GTR
        </Typography>
        
        {/* Estadísticas básicas */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: 'repeat(1, 1fr)', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)' 
          }, 
          gap: 2, 
          mb: 3 
        }}>
          <Box sx={{ 
            bgcolor: 'white', 
            p: 3, 
            borderRadius: 2, 
            boxShadow: 2,
            textAlign: 'center',
            border: '1px solid #e3f2fd'
          }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
              {asesores.length}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              Total Asesores
            </Typography>
          </Box>
          <Box sx={{ 
            bgcolor: 'white', 
            p: 3, 
            borderRadius: 2, 
            boxShadow: 2,
            textAlign: 'center',
            border: '1px solid #e8f5e8'
          }}>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold', mb: 1 }}>
              {clients.length}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              Total Clientes
            </Typography>
          </Box>
          <Box sx={{ 
            bgcolor: 'white', 
            p: 3, 
            borderRadius: 2, 
            boxShadow: 2,
            textAlign: 'center',
            border: '1px solid #fff3e0'
          }}>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold', mb: 1 }}>
              {clients.filter(c => c.estado === 'nuevo').length}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              Clientes Nuevos
            </Typography>
          </Box>
        </Box>
        
        {section === 'Clientes' && (
          <>
            <GtrStatusMenu 
              selected={status} 
              onSelect={setStatus}
              onAddClient={() => setDialogOpen(true)}
            />
            <GtrClientsTable 
              clients={clients.filter(client => 
                status === 'Todos' || client.estado === status.toLowerCase()
              )}
              asesores={asesores}
              statusFilter={status}
              setClients={setClients}
            />
          </>
        )}
        
        {section === 'Asesores' && (
          <GtrAsesoresTable 
            asesores={asesores}
          />
        )}
      </Box>

      <AddClientDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={async (data) => {
          try {
            console.log('Guardando nuevo lead:', data);
            
            const response = await fetch('/api/clientes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                lead_id: data.lead_id,
                nombre: data.nombre || null,
                telefono: data.lead_id, // El lead_id ES el teléfono
                dni: data.dni || null,
                coordenadas: data.coordenadas || null,
                campania: data.campania || null,
                canal: data.canal || null,
                estado_cliente: 'nuevo',
                comentarios_iniciales: data.comentarios || null,
                asesor_asignado: null // Sin asignar inicialmente
              })
            });

            const result = await response.json();
            
            if (result.success) {
              console.log('✅ Cliente creado exitosamente:', result.cliente);
              
              // Agregar el nuevo cliente al estado local
              setClients(prevClients => [result.cliente, ...prevClients]);
              
              // Cerrar el diálogo
              setDialogOpen(false);
              
              // Mostrar mensaje de éxito (opcional)
              alert('Cliente registrado exitosamente');
            } else {
              console.error('❌ Error al crear cliente:', result.message);
              alert(`Error al registrar cliente: ${result.message}`);
            }
          } catch (error) {
            console.error('❌ Error en la petición:', error);
            alert('Error de conexión. Verifique su conexión a internet.');
          }
        }}
      />
    </Box>
  );
};

export default GtrDashboard;