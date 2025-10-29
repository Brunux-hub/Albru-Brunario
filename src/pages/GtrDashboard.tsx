import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Button, TextField, FormControlLabel, Checkbox } from '@mui/material';
import GtrSidebar from '../components/gtr/GtrSidebar';
import RealtimeService from '../services/RealtimeService';

import GtrStatusMenu from '../components/gtr/GtrStatusMenu';
import GtrClientsTable from '../components/gtr/GtrClientsTable';
import GtrAsesoresTable from '../components/gtr/GtrAsesoresTable';
import AddClientDialog from '../components/gtr/AddClientDialog';
import type { Asesor, Cliente } from '../components/gtr/types';
import ReportesPanel from '../components/common/ReportesPanel';

// Interfaces adicionales
interface AsesorAPI {
  asesor_id: number;
  usuario_id: number;
  nombre: string;
  email: string;
  telefono: string | number;
  estado: string;
  clientes_asignados: number;
  meta_mensual: string;
  ventas_realizadas: string;
  comision_porcentaje: string;
}

interface ClienteAPI {
  id: number;
  created_at?: string;
  fecha_asignacion?: string;
  telefono: string | null;
  leads_original_telefono?: string | null;
  nombre: string | null;
  lead_id?: number;
  distrito: string | null;
  plan_seleccionado: string | null;
  precio_final: number | null;
  estado_cliente: string | null;
  asesor_nombre: string | null;
  observaciones_asesor: string | null;
  correo_electronico: string | null;
  direccion: string | null;
  canal_adquisicion?: string | null;
  // Campos adicionales que puede devolver el backend
  campana?: string | null;
  campania?: string | null;
  compania?: string | null;
  sala_asignada?: string | null;
  sala?: string | null;
  // Campos adicionales devueltos por el backend
  ultima_fecha_gestion?: string | null;
  fecha_ultimo_contacto?: string | null;
}

const GtrDashboard: React.FC = () => {
  // Helpers seguros para extraer campos desde mensajes WebSocket (unknown)
  const extractClienteId = (message: unknown): number | null => {
    if (!message || typeof message !== 'object') return null;
    const msg = message as Record<string, unknown>;
    const candidates = [msg['clienteId'], msg['data'] && (msg['data'] as Record<string, unknown>)['clienteId'], msg['payload'] && (msg['payload'] as Record<string, unknown>)['clienteId']];
    for (const c of candidates) {
      if (typeof c === 'number') return c;
      if (typeof c === 'string' && c.trim() !== '' && /^\d+$/.test(c)) return Number(c);
    }
    return null;
  };

  const extractOcupado = (message: unknown): boolean | null => {
    if (!message || typeof message !== 'object') return null;
    const msg = message as Record<string, unknown>;
    const candidates = [msg['ocupado'], msg['data'] && (msg['data'] as Record<string, unknown>)['ocupado'], msg['payload'] && (msg['payload'] as Record<string, unknown>)['ocupado']];
    for (const c of candidates) {
      if (typeof c === 'boolean') return c;
      if (typeof c === 'number') return !!c;
      if (typeof c === 'string') {
        const lc = c.toLowerCase();
        if (lc === 'true' || lc === '1') return true;
        if (lc === 'false' || lc === '0') return false;
      }
    }
    return null;
  };
  const [section, setSection] = useState('Clientes');
  const [status, setStatus] = useState('Todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState<Cliente | null>(null);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterNoContactado, setFilterNoContactado] = useState<boolean>(false);
  const [filtersApplied, setFiltersApplied] = useState<number>(0);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
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
          const asesoresFormateados: Asesor[] = data.asesores.map((asesor: AsesorAPI) => ({
            asesor_id: asesor.asesor_id,
            usuario_id: asesor.usuario_id,
            nombre: asesor.nombre,
            email: asesor.email,
            telefono: String(asesor.telefono || 'Sin teléfono'),
            estado: asesor.estado === 'activo' ? 'Activo' : 'Offline',
            clientes_asignados: asesor.clientes_asignados || 0,
            meta_mensual: asesor.meta_mensual || '0.00',
            ventas_realizadas: asesor.ventas_realizadas || '0.00',
            comision_porcentaje: asesor.comision_porcentaje || '5.00'
          }));
          console.log('🔍 zGTR: Asesores cargados desde API:', data.asesores);
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
        const params = new URLSearchParams();
        if (filterStartDate) params.append('startDate', filterStartDate);
        if (filterEndDate) params.append('endDate', filterEndDate);
        if (filterMonth) params.append('month', filterMonth);
        if (status && status !== 'Todos') params.append('estado', status);
        if (filterNoContactado) params.append('no_contactado', '1');

        const url = '/api/clientes' + (Array.from(params).length ? `?${params.toString()}` : '');

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.clientes) {
          const clientesFormateados: Cliente[] = data.clientes.map((cliente: ClienteAPI) => ({
            id: cliente.id,
            fecha: new Date(cliente.created_at || cliente.fecha_asignacion || Date.now()).toLocaleDateString('es-ES'),
            // Priorizar leads_original_telefono si está disponible
            cliente: cliente.leads_original_telefono || cliente.telefono || 'Sin teléfono',
            nombre: cliente.nombre || 'Sin nombre',
            lead_id: cliente.lead_id,
            lead: cliente.lead_id?.toString() || cliente.id.toString(),
            ciudad: cliente.distrito || 'Sin ciudad',
            plan: cliente.plan_seleccionado || 'Sin plan',
            precio: cliente.precio_final || 0,
            estado: cliente.estado_cliente || 'nuevo',
            asesor: cliente.asesor_nombre || 'Disponible',
            canal: cliente.canal_adquisicion || 'Web',
            distrito: cliente.distrito || 'Sin distrito',
            leads_original_telefono: cliente.leads_original_telefono || cliente.telefono || '',
            // Mapear campaña, sala y compañía desde la API
            campana: cliente.campana || cliente.campania || null,
            compania: cliente.compania || cliente.compania || null,
            sala_asignada: cliente.sala_asignada || cliente.sala || null,
            clienteNuevo: true,
            observaciones: cliente.observaciones_asesor || '',
            telefono: cliente.telefono || '',
            email: cliente.correo_electronico || '',
            direccion: cliente.direccion || '',
            historial: [],
            ultima_fecha_gestion: cliente.ultima_fecha_gestion || null,
            fecha_ultimo_contacto: cliente.fecha_ultimo_contacto || null
          }));
          setClients(clientesFormateados);
        }
      } catch (error) {
        console.error('Error cargando clientes:', error);
      }
    };

    fetchClientes();
  }, [filterStartDate, filterEndDate, filterMonth, status, filterNoContactado, filtersApplied]);

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
    const unsubscribe = realtimeService.subscribe('REASSIGNMENT_CONFIRMED', (data: unknown) => {
      console.log('✅ GTR: Reasignación confirmada por WebSocket:', data);
    });

    // Suscribirse a notificaciones de cliente ocupado para actualizar la tabla en tiempo real
    const unsubscribeOcupado = realtimeService.subscribe('CLIENT_OCUPADO', (data: unknown) => {
      try {
        console.log('📣 GTR: Evento CLIENT_OCUPADO recibido:', data);
        const clienteId = extractClienteId(data);
        const ocupado = extractOcupado(data);

        if (clienteId == null) return;

        // Actualizar el estado local de clients para reflejar el flag 'ocupado'
        setClients(prev => prev.map(c => {
          if (c.id === clienteId) {
            return { ...c, ocupado: !!ocupado } as Cliente;
          }
          return c;
        }));
      } catch (e) {
        console.error('Error procesando CLIENT_OCUPADO en GTR:', e);
      }
    });

    // Manejar locks duraderos enviados por el backend
    const unsubscribeLocked = realtimeService.subscribe('CLIENT_LOCKED', (data: unknown) => {
      try {
        const clienteId = extractClienteId(data);
        if (clienteId == null) return;
        setClients(prev => prev.map(c => c.id === clienteId ? { ...c, ocupado: true } as Cliente : c));
      } catch (e) {
        console.error('Error procesando CLIENT_LOCKED en GTR:', e);
      }
    });

    const unsubscribeUnlocked = realtimeService.subscribe('CLIENT_UNLOCKED', (data: unknown) => {
      try {
        const clienteId = extractClienteId(data);
        if (clienteId == null) return;
        setClients(prev => prev.map(c => c.id === clienteId ? { ...c, ocupado: false } as Cliente : c));
      } catch (e) {
        console.error('Error procesando CLIENT_UNLOCKED en GTR:', e);
      }
    });

    // Suscribirse a actualizaciones completas de cliente (guardado desde modal u otras fuentes)
    const unsubscribeUpdated = realtimeService.subscribe('CLIENT_UPDATED', (data: unknown) => {
      try {
        console.log('📣 GTR: Evento CLIENT_UPDATED recibido:', data);
        // data puede venir en varias formas: { cliente: {...} } o en data/payload
        const msg = data as Record<string, unknown>;
        const clienteRaw = msg['cliente'] || (msg['data'] && (msg['data'] as Record<string, unknown>)['cliente']) || (msg['payload'] && (msg['payload'] as Record<string, unknown>)['cliente']) || msg;
        if (!clienteRaw || typeof clienteRaw !== 'object') return;
        const clienteObj = clienteRaw as Cliente & { id?: number };
        if (!clienteObj.id) return;

        setClients(prev => prev.map(c => c.id === clienteObj.id ? { ...c, ...(clienteObj as Cliente) } : c));
      } catch (e) {
        console.error('Error procesando CLIENT_UPDATED en GTR:', e);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeOcupado();
      unsubscribeLocked();
      unsubscribeUnlocked();
      unsubscribeUpdated();
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

            {/* Controles de filtrado */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Fecha inicio"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />

              <TextField
                label="Fecha fin"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />

              <TextField
                label="Mes"
                type="month"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />

              <FormControlLabel
                control={<Checkbox checked={filterNoContactado} onChange={(e) => setFilterNoContactado(e.target.checked)} />}
                label="No contactado"
              />

              <Button variant="outlined" size="small" onClick={() => setFiltersApplied(f => f + 1)}>
                Aplicar filtros
              </Button>
            </Box>

            <GtrClientsTable 
              clients={clients}
              asesores={asesores}
              statusFilter={status}
              setClients={setClients}
            />
          </>
        )}
        
          {section === 'Reportes' && (
            <ReportesPanel />
          )}

          {section === 'Asesores' && (
          <GtrAsesoresTable 
            asesores={asesores.map(asesor => ({
              id: asesor.asesor_id || asesor.usuario_id || 0,
              nombre: asesor.nombre || 'Sin nombre',
              email: asesor.email || '',
              telefono: asesor.telefono || '',
              estado: (asesor.estado || 'Offline') as 'Activo' | 'Ocupado' | 'Descanso' | 'Offline',
              clientesAsignados: asesor.clientes_asignados || 0,
              clientesAtendidos: 0,
              ventasHoy: 0,
              ventasMes: parseInt(asesor.ventas_realizadas) || 0,
              metaMensual: parseInt(asesor.meta_mensual) || 100,
              eficiencia: 0,
              ultimaActividad: new Date().toISOString(),
              sala: 'Sala 1' as const
            }))}
            clients={clients}
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
                tipo_base: data.tipo_base || 'LEADS',
                leads_original_telefono: data.leads_original_telefono,
                // Enviar también `telefono` para compatibilidad con el backend
                telefono: data.leads_original_telefono,
                campana: data.campana || null,
                canal_adquisicion: data.canal_adquisicion || null,
                sala_asignada: data.sala_asignada || null,
                compania: data.compania || null,
                back_office_info: data.back_office_info || null,
                tipificacion_back: data.tipificacion_back || null,
                datos_leads: data.datos_leads || null,
                comentarios_back: data.comentarios_back || null,
                ultima_fecha_gestion: data.ultima_fecha_gestion || null,

                // Legacy/compat fields
                nombre: data.nombre || null,
                dni: data.dni || null,
                coordenadas: data.coordenadas || null,

                estado_cliente: 'nuevo',
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