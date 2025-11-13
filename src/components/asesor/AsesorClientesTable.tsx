import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { API_BASE } from '../../config/backend';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import GestionarClienteDialog from './GestionarClienteDialog';
import { useClientes } from '../../context/AppContext';
import type { Cliente } from '../../context/AppContext';
import RealtimeService from '../../services/RealtimeService';
import { getBackendUrl } from '../../utils/getBackendUrl';

const estados = ['Todos los estados', 'En gestión', 'En seguimiento', 'Nuevo'];
const gestiones = ['Todas las gestiones', 'En proceso', 'Derivado'];

// Interface para el ref
export interface AsesorClientesTableRef {
  refreshClientes: () => Promise<void>;
}

// Props del componente (vacío por ahora, pero permite extensión futura)
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AsesorClientesTableProps {
  // Props futuras si las necesitas
}

const AsesorClientesTable = forwardRef<AsesorClientesTableRef, AsesorClientesTableProps>((_props, ref) => {
  const { clientes, actualizarCliente, agregarCliente, marcarClienteOcupadoLocal, recargarClientes } = useClientes();
  const agregarClienteRef = useRef(agregarCliente);
  
  // Tipado para datos crudos de la API
  type ClienteApi = {
    id?: number;
    fecha?: string;
    nombre?: string;
    leads_original_telefono?: string;
    telefono?: string;
    dni?: string;
    servicio?: string;
    estado?: string;
    gestion?: string;
    seguimiento?: string;
    campana?: string;
    sala_asignada?: string;
    compania?: string;
    seguimiento_status?: string | null;
    derivado_at?: string | null;
    opened_at?: string | null;
    asesor_asignado?: number | null;
    estatus_comercial_categoria?: string | null;
    estatus_comercial_subcategoria?: string | null;
    // Campos para sistema de duplicados
    es_duplicado?: boolean;
    cantidad_duplicados?: number;
    telefono_principal_id?: number | null;
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('Todos los estados');
  const [filtroGestion, setFiltroGestion] = useState('Todas las gestiones');
  const [busqueda, setBusqueda] = useState('');

  // Mantener la referencia actualizada
  useEffect(() => {
    agregarClienteRef.current = agregarCliente;
  }, [agregarCliente]);

  // Función para cargar clientes desde la BD
  const cargarClientesAsignados = useCallback(async () => {
    try {
      // Obtener el ID del usuario autenticado desde localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const asesorId = userData.id;

      if (!asesorId) {
        console.error('No se encontró ID de usuario autenticado para cargar clientes');
        return;
      }

      // Obtener solo los clientes asignados a este asesor específico
      const response = await fetch(`/api/clientes/asesor/${asesorId}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) return;

      const result = await response.json();
      if (result.success && result.clientes) {
        // Reemplazar la lista actual en el contexto
        recargarClientes();
        (result.clientes as ClienteApi[]).forEach((cliente) => {
          const clienteFormateado: Cliente = {
            id: cliente.id,
            fecha: cliente.fecha ? new Date(cliente.fecha).toLocaleDateString('es-PE') : new Date().toLocaleDateString('es-PE'),
            nombre: cliente.nombre ?? '',
            telefono: cliente.telefono ?? '',
            leads_original_telefono: cliente.leads_original_telefono ?? cliente.telefono ?? '',
            dni: cliente.dni ?? '',
            servicio: cliente.servicio ?? 'Internet',
            estado: cliente.estado === 'nuevo' ? 'Nuevo' : (cliente.estado ?? 'Nuevo'),
            campana: cliente.campana ?? undefined,
            sala_asignada: cliente.sala_asignada ?? undefined,
            compania: cliente.compania ?? undefined,
            gestion: 'En proceso',
            seguimiento: cliente.seguimiento ? new Date(cliente.seguimiento).toISOString().slice(0, 16) : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
            // CRÍTICO: Incluir campos de seguimiento automático desde el backend
            seguimiento_status: cliente.seguimiento_status ?? null,
            derivado_at: cliente.derivado_at ?? null,
            opened_at: cliente.opened_at ?? null,
            asesor_asignado: cliente.asesor_asignado ?? null,
            // Campos de estatus comercial del wizard
            estatus_comercial_categoria: cliente.estatus_comercial_categoria ?? null,
            estatus_comercial_subcategoria: cliente.estatus_comercial_subcategoria ?? null,
          };
          try {
            if (typeof agregarClienteRef.current === 'function') {
              agregarClienteRef.current(clienteFormateado);
            } else {
              console.warn('agregarCliente no está disponible en el contexto, omitiendo:', clienteFormateado);
            }
          } catch (e) {
            console.warn('Error agregando cliente al contexto local:', e);
          }
        });
      }
    } catch (error) {
      console.error('Error cargando clientes asignados:', error);
    }
  }, [recargarClientes]);

  // Cargar clientes del asesor autenticado
  useEffect(() => {
    cargarClientesAsignados();
  }, [cargarClientesAsignados]);

  // Suscribirse a eventos realtime de reasignación para forzar recarga local
  useEffect(() => {
    const realtime = RealtimeService.getInstance();
    const handler = (data: unknown) => {
      try {
        const payload = (data as Record<string, unknown>) || {};
        const nuevo = (payload['nuevoAsesor'] as Record<string, unknown>) || {};
        const nuevoId = (nuevo['usuario_id'] ?? nuevo['id']) ?? null;

        // Obtener id de asesor autenticado
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const asesorId = userData.id;

        const matchById = nuevoId !== null && asesorId !== null && Number(nuevoId) === Number(asesorId);
        if (matchById) {
          // Refrescar la tabla
          cargarClientesAsignados();
        }
      } catch (e) {
        console.warn('Realtime handler failed:', e);
      }
    };

    // Handler genérico: para varios eventos solo recargamos la lista del asesor
    const genericHandler = () => {
      try {
        // Actualizar siempre: deja la decisión de filtrado al backend
        cargarClientesAsignados();
      } catch (e) {
        console.warn('Realtime generic handler failed:', e);
      }
    };

    const unsubReassign = realtime.subscribe('CLIENT_REASSIGNED', handler);
    const unsubHist = realtime.subscribe('HISTORIAL_UPDATED', genericHandler);
    const unsubMoved = realtime.subscribe('CLIENT_MOVED_TO_GTR', genericHandler);

    // 🔥 CRÍTICO: Escuchar cuando el asesor abre el wizard (actualizar estado en tiempo real)
    const unsubInGestion = realtime.subscribe('CLIENT_IN_GESTION', (data: unknown) => {
      try {
        const msg = data as Record<string, unknown>;
        const clienteId = Number(msg['clienteId'] ?? (msg['data'] as Record<string, unknown>)?.['clienteId']);
        
        if (clienteId) {
          console.log(`✅ Asesor: Cliente ${clienteId} cambió a "en_gestion"`);
          // Recargar la lista para reflejar el cambio
          cargarClientesAsignados();
        }
      } catch (e) {
        console.warn('Error procesando CLIENT_IN_GESTION en Asesor:', e);
      }
    });

    // Nota: no nos suscribimos aquí a CLIENT_OCUPADO porque el bloqueo lo maneja
    // localmente cuando el propio asesor abre el wizard (se notifica al backend),
    // y el GTR recibe el evento para mostrar qué asesores están ocupados.

    return () => {
      try {
        if (typeof unsubReassign === 'function') unsubReassign();
      } catch (err) { console.warn('Error unsubscribing CLIENT_REASSIGNED', err); }
      try {
        if (typeof unsubHist === 'function') unsubHist();
      } catch (err) { console.warn('Error unsubscribing HISTORIAL_UPDATED', err); }
      try {
        if (typeof unsubMoved === 'function') unsubMoved();
      } catch (err) { console.warn('Error unsubscribing CLIENT_MOVED_TO_GTR', err); }
      try {
        if (typeof unsubInGestion === 'function') unsubInGestion();
      } catch (err) { console.warn('Error unsubscribing CLIENT_IN_GESTION', err); }
      // nothing to cleanup for CLIENT_OCUPADO here
    };
  }, [cargarClientesAsignados]);

  // Exponer funciones al componente padre
  useImperativeHandle(ref, () => ({
    refreshClientes: cargarClientesAsignados
  }));

  // TODO: Implementar monitoreo de reasignaciones en tiempo real con WebSockets cuando sea necesario  // Filtrar clientes
  const clientesFiltrados = clientes.filter(cliente => {
    const cumpleEstado = filtroEstado === 'Todos los estados' || cliente.estado === filtroEstado;
    const cumpleGestion = filtroGestion === 'Todas las gestiones' || cliente.gestion === filtroGestion;
    const nombreSafe = (cliente.nombre || '').toString();
    const telefonoSafe = (cliente.telefono || '').toString();
    const dniSafe = (cliente.dni || '').toString();
    const cumpleBusqueda = busqueda === '' || 
      nombreSafe.toLowerCase().includes(busqueda.toLowerCase()) ||
      telefonoSafe.includes(busqueda) ||
      dniSafe.includes(busqueda);
    
    return cumpleEstado && cumpleGestion && cumpleBusqueda;
  });

  const handleGestionar = (cliente: Cliente) => {
    // Indicar localmente que este cliente está siendo gestionado por el asesor
    try {
      marcarClienteOcupadoLocal(cliente.id, true);

      // Notificar al backend (diagnóstico) para que podamos verificar en logs y
      // también enviar un evento WebSocket para que GTR reciba la señal en tiempo real.
      const backendUrl = API_BASE || getBackendUrl();
      fetch(`${backendUrl}/api/clientes/notify-ocupado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: cliente.id, asesorId: (localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData') as string).id : null), ocupado: true })
      }).catch(err => console.warn('No se pudo notificar backend notify-ocupado:', err));
    } catch (e) {
      console.error('Error marcando cliente ocupado localmente:', e);
    }

    // Intentar adquirir lock y notificar al backend que abrimos el wizard.
    (async () => {
      try {
        const userData = localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData') as string) : null;
        const asesorId = userData ? userData.id : null;
        if (!asesorId) {
          console.warn('No hay asesor autenticado para solicitar lock');
          setClienteSeleccionado(cliente);
          setDialogOpen(true);
          return;
        }

        // Solicitar lock al backend
        const backendUrl = API_BASE || getBackendUrl();
        const lockRes = await fetch(`${backendUrl}/api/clientes/${cliente.id}/lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asesorId, durationSeconds: 300 })
        });

        if (!lockRes.ok) {
          console.warn('No se pudo adquirir lock para el cliente, status=', lockRes.status);
          // Abrir el dialog igualmente (modo no bloqueante) pero avisar
          setClienteSeleccionado(cliente);
          setDialogOpen(true);
          return;
        }

        const lockJson = await lockRes.json();
        const lockToken = lockJson && lockJson.lockToken ? lockJson.lockToken : null;

        // Llamar open-wizard para marcar opened_at y seguimiento en backend
        const openRes = await fetch(`/api/clientes/${cliente.id}/open-wizard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asesorId, lockToken })
        });

        if (!openRes.ok) {
          console.warn('open-wizard falló con status=', openRes.status);
          setClienteSeleccionado(cliente);
          setDialogOpen(true);
          return;
        }

        const openJson = await openRes.json();
        if (openJson && openJson.success) {
          // Actualizamos el cliente local con datos retornados por backend si vienen
          if (openJson.cliente) {
            try {
              // Llamar a actualizarCliente sólo si la función existe y la respuesta contiene un id
              if (typeof actualizarCliente === 'function' && (openJson.cliente.id || openJson.cliente.dni)) {
                actualizarCliente(openJson.cliente);
              } else {
                console.warn('open-wizard returned cliente without id or actualizarCliente no está disponible', openJson.cliente);
              }
            } catch (e) { console.warn('Error actualizando cliente localmente tras open-wizard:', e); }
          }
          setClienteSeleccionado(cliente);
          setDialogOpen(true);
        } else {
          setClienteSeleccionado(cliente);
          setDialogOpen(true);
        }
      } catch (err) {
        console.warn('Error en flujo de lock/open-wizard, abriendo dialog localmente:', err);
        setClienteSeleccionado(cliente);
        setDialogOpen(true);
      }
    })();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setClienteSeleccionado(null);
  };

  // Sistema de notificaciones removido - usar toast o similar cuando sea necesario

  return (
    <Box>      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField 
          label="Buscar por nombre, teléfono o DNI..." 
          variant="outlined" 
          size="small" 
          sx={{ width: 350 }}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filtroEstado}
              label="Estado"
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              {estados.map((estado) => (
                <MenuItem key={estado} value={estado}>
                  {estado}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Gestión</InputLabel>
            <Select
              value={filtroGestion}
              label="Gestión"
              onChange={(e) => setFiltroGestion(e.target.value)}
            >
              {gestiones.map((gestion) => (
                <MenuItem key={gestion} value={gestion}>
                  {gestion}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

       <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
                <Table stickyHeader size="small">
              <TableHead>
              <TableRow>
              <TableCell>Fecha Asignación</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Seguimiento</TableCell>
              <TableCell>Acciones</TableCell>
            
            </TableRow>
          </TableHead>
          <TableBody>
            {clientesFiltrados.map((cliente, index) => (
              <TableRow key={cliente.id ?? index} hover>
                <TableCell>{cliente.fecha}</TableCell>
                <TableCell>{cliente.nombre}</TableCell>
                <TableCell>
                  {cliente.leads_original_telefono ? (
                    <div>
                      <div style={{ fontWeight: 600 }}>{cliente.leads_original_telefono}</div>
                      {cliente.telefono && cliente.telefono !== cliente.leads_original_telefono ? (
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>({cliente.telefono})</div>
                      ) : null}
                    </div>
                  ) : (
                    cliente.telefono || '-'
                  )}
                </TableCell>
                <TableCell>
                  {cliente.seguimiento_status ? (
                    <Chip 
                      label={cliente.seguimiento_status} 
                      color={
                        cliente.seguimiento_status === 'derivado' ? 'info' :
                        cliente.seguimiento_status === 'en_gestion' ? 'warning' :
                        cliente.seguimiento_status === 'gestionado' ? 'success' :
                        'default'
                      }
                      size="small"
                    />
                  ) : (
                    <span style={{ color: '#9ca3af' }}>Sin seguimiento</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="contained" 
                    size="small" 
                    onClick={() => handleGestionar(cliente)}
                  >
                    GESTIONAR
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <GestionarClienteDialog
        open={dialogOpen}
        cliente={clienteSeleccionado}
        onClose={handleCloseDialog}
        onSave={actualizarCliente}
      />

      {/* Sistema de notificaciones removido */}
    </Box>
  );
});

export default AsesorClientesTable;
