import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Button, Fab, Pagination } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';  
import GtrSidebar from '../components/gtr/GtrSidebar';
import { useSocket } from '../hooks/useSocket';

import GtrClientsTable from '../components/gtr/GtrClientsTable';
import GtrAsesoresTable from '../components/gtr/GtrAsesoresTable';
import AddClientDialog from '../components/gtr/AddClientDialog';
import type { Asesor, Cliente } from '../components/gtr/types';
import ReportesPanel from '../components/common/ReportesPanel';
import DayManagementPanel from '../components/gtr/DayManagementPanel';
import FiltersDrawer, { type FilterState } from '../components/gtr/FiltersDrawer';

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
  clientes_gestionados_hoy?: number; // Estadística del día (nombre en backend)
  clientes_reasignados_hoy?: number; // Estadística del día
  clientes_atendidos_hoy?: number; // Clientes atendidos en el día
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
  // Campos de seguimiento automático
  seguimiento_status?: string | null;
  derivado_at?: string | null;
  opened_at?: string | null;
  asesor_asignado?: number | null;
  // Historial de gestiones
  historial?: Array<{
    fecha: string;
    asesor: string;
    accion: string;
    estadoAnterior?: string;
    estadoNuevo?: string;
    comentarios: string;
  }>;
  // Campos de estatus comercial (del wizard)
  estatus_comercial_categoria?: string | null;
  estatus_comercial_subcategoria?: string | null;
  fecha_wizard_completado?: string | null;
  // Campo de estado calculado por el backend
  estado?: string | null;
  // Campos del sistema de duplicados
  es_duplicado?: boolean;
  cantidad_duplicados?: number;
  telefono_principal_id?: number | null;
  // Campo del contador de reasignaciones
  contador_reasignaciones?: number;
  // Campo multiplicador del día (cuántas veces apareció este teléfono hoy)
  multiplicador_dia?: number;
  // Campos adicionales para estadísticas diarias
  fechaCreacion?: string;
  fecha_gestion?: string;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState<Cliente | null>(null);
  const [clients, setClients] = useState<Cliente[]>(() => {
    try {
      const saved = localStorage.getItem('gtr_clients');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  // const [validadores, setValidadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para las estadísticas del día (cards superiores)
  const [statsDelDia, setStatsDelDia] = useState({
    ingresadosHoy: 0,
    gestionadosHoy: 0,
    preventaHoy: 0
  });
  
  // Estados para paginación local (de clientes filtrados)
  const [localPage, setLocalPage] = useState(1);
  const [localRowsPerPage] = useState(50); // Mostrar 50 por página
  
  // Estados para el Drawer de Filtros
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  
  // Inicializar con las fechas del mes actual
  const [activeFilters, setActiveFilters] = useState<FilterState>(() => {
    // Sin filtro de fechas por defecto - mostrar todos los clientes
    return {
      categorias: [],
      dateRangeType: 'custom',
      startDate: '',
      endDate: '',
      campanas: [],
      salas: [],
      companias: []
    };
  });

  // Extraer valores únicos para filtros
  const uniqueCampanas = useMemo(() => 
    [...new Set(clients.map(c => c.campana).filter(Boolean))].sort() as string[],
    [clients]
  );
  const uniqueSalas = useMemo(() => 
    [...new Set(clients.map(c => c.sala_asignada || c.sala).filter(Boolean))].sort() as string[],
    [clients]
  );
  const uniqueCompanias = useMemo(() => 
    [...new Set(clients.map(c => c.compania).filter(Boolean))].sort() as string[],
    [clients]
  );

  // Aplicar filtros a los clientes
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Filtrar por categorías
      if (activeFilters.categorias.length > 0) {
        const categoria = client.estatus_comercial_categoria || '';
        if (!activeFilters.categorias.includes(categoria)) {
          return false;
        }
      }

      // Filtrar por rango de fechas
      if (activeFilters.startDate && activeFilters.endDate) {
        const fechaCliente = client.fechaCreacion || client.created_at || '';
        
        // Validar que la fecha del cliente sea válida
        if (!fechaCliente) return false;
        
        // Extraer solo la fecha (YYYY-MM-DD) sin hora para comparación consistente
        const clientDateStr = fechaCliente.split('T')[0].split(' ')[0];
        const clientDate = new Date(clientDateStr + 'T00:00:00');
        const startDate = new Date(activeFilters.startDate + 'T00:00:00');
        const endDate = new Date(activeFilters.endDate + 'T23:59:59');
        
        // Validar que las fechas sean válidas
        if (isNaN(clientDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return false;
        }
        
        if (clientDate < startDate || clientDate > endDate) {
          return false;
        }
      }

      // Filtrar por campañas
      if (activeFilters.campanas.length > 0) {
        const campana = client.campana || '';
        if (!activeFilters.campanas.includes(campana)) {
          return false;
        }
      }

      // Filtrar por salas
      if (activeFilters.salas.length > 0) {
        const sala = client.sala_asignada || client.sala || '';
        if (!activeFilters.salas.includes(sala)) {
          return false;
        }
      }

      // Filtrar por compañías
      if (activeFilters.companias.length > 0) {
        const compania = client.compania || '';
        if (!activeFilters.companias.includes(compania)) {
          return false;
        }
      }

      return true;
    });
  }, [clients, activeFilters]);

  // Clientes paginados localmente
  const paginatedClients = useMemo(() => {
    const startIndex = (localPage - 1) * localRowsPerPage;
    const endIndex = startIndex + localRowsPerPage;
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, localPage, localRowsPerPage]);

  // Total de páginas
  const totalPages = Math.ceil(filteredClients.length / localRowsPerPage);

  // Callback para aplicar filtros
  const handleApplyFilters = (filters: FilterState) => {
    setActiveFilters(filters);
    setFiltersDrawerOpen(false);
    setLocalPage(1); // Resetear a página 1 cuando se aplican filtros
  };

  // Obtener datos del GTR desde localStorage ANTES de useSocket
  const rawUser = localStorage.getItem('userData') || localStorage.getItem('albru_user');
  let parsedUser: Record<string, unknown> | null = null;
  try {
    parsedUser = rawUser ? JSON.parse(rawUser) as Record<string, unknown> : null;
  } catch (error) {
    console.warn('Error parsing stored userData for GTR identification:', error);
    parsedUser = null;
  }

  const gtrId = (parsedUser && (parsedUser['id'] ?? parsedUser['usuario_id'])) ?? null;
  
  // Inicializar socket CON autenticación
  const { socket, isConnected } = useSocket({
    userId: gtrId ? Number(gtrId) : undefined,
    role: 'gtr',
    autoConnect: true
  });

  // Función para cargar asesores (extraída para reutilización en WebSocket)
  const fetchAsesores = useCallback(async () => {
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
            clientes_atendidos_hoy: asesor.clientes_gestionados_hoy || 0,
            clientes_reasignados_hoy: asesor.clientes_reasignados_hoy || 0,
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
  }, []);

  // Cargar asesores al montar el componente
  useEffect(() => {
    fetchAsesores();
  }, [fetchAsesores]);

  // Cargar estadísticas del día para los cards superiores
  useEffect(() => {
    const fetchStatsDelDia = async () => {
      try {
        // Obtener gestiones del día desde el mismo endpoint que usa DayManagementPanel
        const response = await fetch('/api/clientes/gestionados-hoy');
        const data = await response.json();
        
        if (data.success && data.clientes) {
          const hoy = new Date().toISOString().split('T')[0];
          
          // Gestionados Hoy: todos los que tienen wizard_completado hoy
          const gestionadosHoy = data.clientes.length;
          
          // Ingresados Hoy: filtrar por created_at de hoy desde clients
          const ingresadosHoy = clients.filter((c: Cliente) => {
            const fechaCreacion = c.created_at?.split('T')[0];
            return fechaCreacion === hoy;
          }).length;
          
          // Preventa Hoy: los que tienen categoría 'Preventa completa' y fecha wizard hoy
          const preventaHoy = data.clientes.filter((c: ClienteAPI) => {
            return c.estatus_comercial_categoria?.toLowerCase() === 'preventa completa';
          }).length;
          
          setStatsDelDia({
            ingresadosHoy,
            gestionadosHoy,
            preventaHoy
          });
        }
      } catch (error) {
        console.error('Error cargando estadísticas del día:', error);
      }
    };

    fetchStatsDelDia();
    // Recargar cada 30 segundos para mantener actualizado
    const interval = setInterval(fetchStatsDelDia, 30000);
    return () => clearInterval(interval);
  }, [clients]);

  // Cargar clientes desde la API
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        // Cargar TODOS los clientes de una vez (límite alto)
        const url = `/api/clientes?limit=50000&offset=0&orderBy=desc`;

        const response = await fetch(url, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();

        if (data.success && data.clientes) {
          
          // Helper: formatea una fecha recibida desde el backend sin convertirla a la zona local
          const formatDateWithoutTZ = (raw?: string | null) => {
            if (!raw) return new Date().toLocaleDateString('es-ES');
            // Si viene en formato 'YYYY-MM-DD' o 'YYYY-MM-DD HH:MM:SS' o 'YYYY-MM-DDTHH:MM:SS'
            const datePart = String(raw).split('T')[0].split(' ')[0];
            const m = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) {
              return `${m[3]}/${m[2]}/${m[1]}`; // DD/MM/YYYY
            }
            // Fallback: intentar parsear y devolver locale
            try {
              const d = new Date(raw as string);
              if (!isNaN(d.getTime())) return d.toLocaleDateString('es-ES');
            } catch (e) {}
            return String(raw);
          };

          const clientesFormateados: Cliente[] = data.clientes.map((cliente: ClienteAPI) => ({
            id: cliente.id,
            fecha: formatDateWithoutTZ(cliente.fecha_asignacion || cliente.created_at || null),
            // ✅ MAPEAR created_at para que se muestre en la tabla
            created_at: cliente.created_at || null,
            // Priorizar leads_original_telefono si está disponible
            cliente: cliente.leads_original_telefono || cliente.telefono || 'Sin teléfono',
            nombre: cliente.nombre || 'Sin nombre',
            lead_id: cliente.lead_id,
            lead: cliente.lead_id?.toString() || cliente.id.toString(),
            ciudad: cliente.distrito || 'Sin ciudad',
            plan: cliente.plan_seleccionado || 'Sin plan',
            precio: cliente.precio_final || 0,
            estado: cliente.estado || 'nuevo',
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
            historial: cliente.historial || [],
            ultima_fecha_gestion: cliente.ultima_fecha_gestion || null,
            fecha_ultimo_contacto: cliente.fecha_ultimo_contacto || null,
            // CRÍTICO: Mapear campos de seguimiento automático desde el backend
            seguimiento_status: cliente.seguimiento_status || null,
            // ✨ NUEVO: Mapear estatus comercial (categoría y subcategoría)
            estatus_comercial_categoria: cliente.estatus_comercial_categoria || null,
            estatus_comercial_subcategoria: cliente.estatus_comercial_subcategoria || null,
            // ✅ DUPLICADOS: Mapear campos del sistema de duplicados
            es_duplicado: cliente.es_duplicado || false,
            cantidad_duplicados: cliente.cantidad_duplicados || 1,
            telefono_principal_id: cliente.telefono_principal_id || null,
            // ✅ REASIGNACIONES: Mapear contador de reasignaciones
            contador_reasignaciones: cliente.contador_reasignaciones || 0,
            // ✅ MULTIPLICADOR: Mapear cuántas veces apareció este teléfono hoy
            multiplicador_dia: cliente.multiplicador_dia || 1
          }));
          
          setClients(clientesFormateados);
          // NOTE: Avoid storing the full clients list in localStorage (very large datasets cause quota errors)
          // If persistence is needed, store only small metadata or rely on server-side paging/search.
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

  // Conectar eventos de Socket.io para GTR
  useEffect(() => {
    if (!socket || !isConnected) return;

    const gtrName = localStorage.getItem('username') || 'GTR';
    console.log('🔌 GTR: Socket.io conectado, uniéndose a sala GTR como:', gtrName);
    
    // Unirse a la sala de GTR
    socket.emit('join-gtr-room', { username: gtrName });

    // Escuchar confirmación de reasignación
    const handleReassignmentConfirmed = (data: unknown) => {
      console.log('✅ GTR: Reasignación confirmada por Socket.io:', data);
    };

    // Escuchar reasignaciones de clientes en tiempo real
    const handleClientReassigned = (data: unknown) => {
      try {
        console.log('🔄 [GTR FRONTEND] ================================');
        console.log('🔄 [GTR FRONTEND] Evento CLIENT_REASSIGNED recibido!');
        console.log('🔄 [GTR FRONTEND] Payload completo:', JSON.stringify(data, null, 2));
        
        const msg = data as Record<string, unknown>;
        const clienteData = msg['cliente'] as Record<string, unknown> | undefined;
        const nuevoAsesorData = msg['nuevoAsesor'] as Record<string, unknown> | undefined;
        
        console.log('🔄 [GTR FRONTEND] clienteData:', clienteData);
        console.log('🔄 [GTR FRONTEND] nuevoAsesorData:', nuevoAsesorData);
        
        if (!clienteData) {
          console.warn('⚠️ [GTR FRONTEND] No se encontró clienteData en el evento');
          return;
        }
        
        const clienteId = Number(clienteData['id']);
        console.log('🔄 [GTR FRONTEND] clienteId extraído:', clienteId);
        
        if (!clienteId) {
          console.warn('⚠️ [GTR FRONTEND] clienteId inválido');
          return;
        }

        // Obtener el nombre del nuevo asesor
        const asesorNombre = nuevoAsesorData ? String(nuevoAsesorData['nombre'] || '') : '';
        console.log('🔄 [GTR FRONTEND] Nombre nuevo asesor:', asesorNombre);
        
        // Obtener seguimiento_status del payload (debería ser null para resetear)
        const nuevoSeguimientoStatus = clienteData['seguimiento_status'] as string | null;
        console.log('🔄 [GTR FRONTEND] Nuevo seguimiento_status:', nuevoSeguimientoStatus);

        // 🔄 Actualizar el cliente con seguimiento_status reseteado (null) y el nuevo asesor
        console.log('🔄 [GTR FRONTEND] Actualizando lista de clientes...');
        setClients(prev => {
          const updated = prev.map(c => {
            if (c.id === clienteId) {
              console.log('✅ [GTR FRONTEND] Cliente encontrado en lista, actualizando:', c.id);
              console.log('   Reseteo: seguimiento_status = null (disponible para nueva gestión)');
              return { 
                ...c, 
                seguimiento_status: nuevoSeguimientoStatus || null, // ✅ Resetear a null
                asesor: asesorNombre || c.asesor, // Actualizar asesor con el nuevo nombre
                asesor_asignado: clienteData['asesor_asignado'] ? Number(clienteData['asesor_asignado']) : c.asesor_asignado
              } as Cliente;
            }
            return c;
          });
          console.log('✅ [GTR FRONTEND] Lista de clientes actualizada');
          return updated;
        });
        console.log('🔄 [GTR FRONTEND] ================================');
      } catch (e) {
        console.error('❌ [GTR FRONTEND] Error procesando CLIENT_REASSIGNED:', e);
      }
    };

    // Suscribirse a clientes que vuelven a GTR por timeout
    const handleClientReturnedToGTR = (data: unknown) => {
      try {
        console.log('⏰ GTR: Cliente vuelto a GTR por timeout:', data);
        const msg = data as Record<string, unknown>;
        const clienteId = Number(msg['clienteId']);
        if (!clienteId) return;

        // Actualizar el cliente con seguimiento_status = 'no_gestionado' y limpiar asesor_asignado
        setClients(prev => prev.map(c => {
          if (c.id === clienteId) {
            return { ...c, seguimiento_status: 'no_gestionado', asesor_asignado: null } as Cliente;
          }
          return c;
        }));
      } catch (e) {
        console.error('Error procesando CLIENT_RETURNED_TO_GTR en GTR:', e);
      }
    };

    // Suscribirse a notificaciones de cliente ocupado
    const handleClientOcupado = (data: unknown) => {
      try {
        console.log('📣 GTR: Evento CLIENT_OCUPADO recibido:', data);
        const clienteId = extractClienteId(data);
        const ocupado = extractOcupado(data);

        if (clienteId == null) return;

        setClients(prev => prev.map(c => {
          if (c.id === clienteId) {
            return { ...c, ocupado: !!ocupado } as Cliente;
          }
          return c;
        }));
        
        const msg = data as Record<string, unknown>;
        const asesorIdCandidate = msg['asesorId'] ?? (msg['data'] && (msg['data'] as Record<string, unknown>)['asesorId']) ?? (msg['payload'] && (msg['payload'] as Record<string, unknown>)['asesorId']);
        if (typeof asesorIdCandidate !== 'undefined' && asesorIdCandidate !== null) {
          const asesorId = Number(asesorIdCandidate);
          setAsesores(prev => prev.map(a => {
            const matches = (Number(a.asesor_id) === asesorId) || (Number(a.usuario_id) === asesorId) || (Number(a.usuario_id || 0) === asesorId);
            if (matches) {
              return { ...a, estado: ocupado ? 'Ocupado' : 'Activo' };
            }
            return a;
          }));
        }
      } catch (e) {
        console.error('Error procesando CLIENT_OCUPADO en GTR:', e);
      }
    };

    // Manejar locks duraderos
    const handleClientLocked = (data: unknown) => {
      try {
        const clienteId = extractClienteId(data);
        if (clienteId == null) return;
        setClients(prev => prev.map(c => c.id === clienteId ? { ...c, ocupado: true } as Cliente : c));
      } catch (e) {
        console.error('Error procesando CLIENT_LOCKED en GTR:', e);
      }
    };

    const handleClientUnlocked = (data: unknown) => {
      try {
        const clienteId = extractClienteId(data);
        if (clienteId == null) return;
        setClients(prev => prev.map(c => c.id === clienteId ? { ...c, ocupado: false } as Cliente : c));
      } catch (e) {
        console.error('Error procesando CLIENT_UNLOCKED en GTR:', e);
      }
    };

    // Actualizaciones completas de cliente
    const handleClientUpdated = (data: unknown) => {
      try {
        console.log('📣 GTR: Evento CLIENT_UPDATED recibido:', data);
        const msg = data as Record<string, unknown>;
        const clienteRaw = msg['cliente'] || (msg['data'] && (msg['data'] as Record<string, unknown>)['cliente']) || (msg['payload'] && (msg['payload'] as Record<string, unknown>)['cliente']) || msg;
        if (!clienteRaw || typeof clienteRaw !== 'object') return;
        const clienteObj = clienteRaw as Cliente & { id?: number };
        if (!clienteObj.id) return;

        setClients(prev => prev.map(c => {
          if (c.id === clienteObj.id) {
            const updatedClient = { ...c, ...(clienteObj as Cliente) };
            if (!clienteObj.asesor && c.asesor) {
              updatedClient.asesor = c.asesor;
            }
            return updatedClient;
          }
          return c;
        }));
      } catch (e) {
        console.error('Error procesando CLIENT_UPDATED en GTR:', e);
      }
    };

    // Actualizaciones de estatus
    const handleClientStatusUpdated = (data: unknown) => {
      try {
        console.log('📣 [GTR FRONTEND] ================================');
        console.log('📣 [GTR FRONTEND] Evento CLIENT_STATUS_UPDATED recibido!');
        console.log('📣 [GTR FRONTEND] Payload completo:', JSON.stringify(data, null, 2));
        
        const msg = data as Record<string, unknown>;
        const clienteId = Number(msg['clienteId']);
        const categoria = msg['estatus_comercial_categoria'] as string | undefined;
        const subcategoria = msg['estatus_comercial_subcategoria'] as string | undefined;
        
        console.log('📣 [GTR FRONTEND] Datos extraídos:', {
          clienteId,
          categoria,
          subcategoria
        });
        
        if (clienteId) {
          console.log(`📣 [GTR FRONTEND] Actualizando categoría/subcategoría del cliente ${clienteId}`);
          
          setClients(prev => prev.map(c => {
            if (c.id === clienteId) {
              console.log('✅ [GTR FRONTEND] Cliente encontrado, actualizando estatus comercial:', c.id);
              return {
                ...c,
                estatus_comercial_categoria: categoria || c.estatus_comercial_categoria,
                estatus_comercial_subcategoria: subcategoria || c.estatus_comercial_subcategoria
              } as Cliente;
            }
            return c;
          }));
          
          console.log('✅ [GTR FRONTEND] Cliente actualizado con nueva categoría/subcategoría');
        } else {
          console.warn('⚠️ [GTR FRONTEND] clienteId inválido en CLIENT_STATUS_UPDATED');
        }

        // Actualizar estado del asesor si viene en el payload
        const asesorIdCandidate = msg['asesorId'] ?? (msg['data'] && (msg['data'] as Record<string, unknown>)['asesorId']);
        const nuevoEstatusCandidate = msg['nuevoEstatus'] ?? (msg['data'] && (msg['data'] as Record<string, unknown>)['nuevoEstatus']);
        if (typeof asesorIdCandidate !== 'undefined' && nuevoEstatusCandidate !== undefined) {
          const asesorId = Number(asesorIdCandidate);
          const nuevo = String(nuevoEstatusCandidate);
          setAsesores(prev => prev.map(a => {
            const matches = (Number(a.asesor_id) === asesorId) || (Number(a.usuario_id) === asesorId);
            if (matches) {
              return { ...a, estado: nuevo };
            }
            return a;
          }));
        }
        
        console.log('📣 [GTR FRONTEND] ================================');
      } catch (e) {
        console.error('❌ [GTR FRONTEND] Error procesando CLIENT_STATUS_UPDATED:', e);
      }
    };

    // Cliente en gestión (wizard abierto)
    const handleClientInGestion = (data: unknown) => {
      try {
        console.log('🎯 GTR: Evento CLIENT_IN_GESTION recibido:', data);
        const msg = data as Record<string, unknown>;
        const clienteId = Number(msg['clienteId'] ?? (msg['data'] as Record<string, unknown>)?.['clienteId']);
        
        if (clienteId) {
          console.log(`✅ GTR: Actualizando cliente ${clienteId} a "en_gestion" en tiempo real`);
          setClients(prev => prev.map(c => {
            if (c.id === clienteId) {
              return { 
                ...c, 
                seguimiento_status: 'en_gestion',
                opened_at: new Date().toISOString()
              };
            }
            return c;
          }));
        }
      } catch (e) {
        console.error('Error procesando CLIENT_IN_GESTION en GTR:', e);
      }
    };

    // Cliente movido a GTR (wizard completado - GESTIONADO)
    const handleClientMovedToGTR = (data: unknown) => {
      try {
        console.log('📋 [GTR FRONTEND] ================================');
        console.log('📋 [GTR FRONTEND] Evento CLIENT_MOVED_TO_GTR recibido!');
        console.log('📋 [GTR FRONTEND] Payload completo:', JSON.stringify(data, null, 2));
        
        const msg = data as Record<string, unknown>;
        const clienteId = Number(msg['clienteId']);
        
        console.log('📋 [GTR FRONTEND] clienteId extraído:', clienteId);
        
        if (clienteId) {
          console.log(`✅ [GTR FRONTEND] Actualizando cliente ${clienteId} a "gestionado" en tiempo real`);
          setClients(prev => prev.map(c => {
            if (c.id === clienteId) {
              console.log('✅ [GTR FRONTEND] Cliente encontrado, marcando como gestionado:', c.id);
              return { 
                ...c, 
                seguimiento_status: 'gestionado',
                asesor_asignado: null,
                estado: 'gestionado'
              };
            }
            return c;
          }));
          console.log('✅ [GTR FRONTEND] Lista de clientes actualizada con estado "gestionado"');
        } else {
          console.warn('⚠️ [GTR FRONTEND] clienteId inválido en CLIENT_MOVED_TO_GTR');
        }
        console.log('📋 [GTR FRONTEND] ================================');
      } catch (e) {
        console.error('❌ [GTR FRONTEND] Error procesando CLIENT_MOVED_TO_GTR:', e);
      }
    };

    // Escuchar cuando un asesor completa el wizard
    const handleClientCompleted = (data: unknown) => {
      try {
        console.log('✅ [GTR FRONTEND] ================================');
        console.log('✅ [GTR FRONTEND] Evento CLIENT_COMPLETED recibido!');
        console.log('✅ [GTR FRONTEND] Payload completo:', JSON.stringify(data, null, 2));
        
        const msg = data as Record<string, unknown>;
        const clienteId = Number(msg['clienteId']);
        const clienteData = msg['cliente'] as Record<string, unknown> | undefined;
        
        console.log('✅ [GTR FRONTEND] clienteId:', clienteId);
        console.log('✅ [GTR FRONTEND] clienteData:', clienteData);
        
        if (!clienteId || !clienteData) {
          console.warn('⚠️ [GTR FRONTEND] clienteId o clienteData faltantes en CLIENT_COMPLETED');
          return;
        }
        
        // Extraer los campos actualizados
        const categoria = String(clienteData['estatus_comercial_categoria'] || '');
        const subcategoria = String(clienteData['estatus_comercial_subcategoria'] || '');
        const seguimientoStatus = String(clienteData['seguimiento_status'] || 'gestionado');
        
        console.log('✅ [GTR FRONTEND] Datos extraídos:', {
          categoria,
          subcategoria,
          seguimientoStatus
        });
        
        // Actualizar el cliente en el estado
        setClients(prev => prev.map(c => {
          if (c.id === clienteId) {
            console.log('✅ [GTR FRONTEND] Cliente encontrado, actualizando categoría/subcategoría:', c.id);
            return {
              ...c,
              estatus_comercial_categoria: categoria,
              estatus_comercial_subcategoria: subcategoria,
              seguimiento_status: seguimientoStatus,
              wizard_completado: 1,
              estado: 'gestionado'
            } as Cliente;
          }
          return c;
        }));
        
        console.log('✅ [GTR FRONTEND] Cliente actualizado en tiempo real con categoría/subcategoría');
        console.log('✅ [GTR FRONTEND] ================================');
      } catch (e) {
        console.error('❌ [GTR FRONTEND] Error procesando CLIENT_COMPLETED:', e);
      }
    };

    // Handler para recargar estadísticas de asesores cuando cambian los clientes
    const handleReloadAsesoresStats = () => {
      console.log('📊 [GTR] Recargando estadísticas de asesores...');
      fetchAsesores();
    };

    // Registrar todos los listeners
    socket.on('REASSIGNMENT_CONFIRMED', handleReassignmentConfirmed);
    socket.on('CLIENT_REASSIGNED', handleClientReassigned);
    socket.on('CLIENT_RETURNED_TO_GTR', handleClientReturnedToGTR);
    socket.on('CLIENT_OCUPADO', handleClientOcupado);
    socket.on('CLIENT_LOCKED', handleClientLocked);
    socket.on('CLIENT_UNLOCKED', handleClientUnlocked);
    socket.on('CLIENT_UPDATED', handleClientUpdated);
    socket.on('CLIENT_STATUS_UPDATED', handleClientStatusUpdated);
    socket.on('CLIENT_IN_GESTION', handleClientInGestion);
    socket.on('CLIENT_MOVED_TO_GTR', handleClientMovedToGTR);
    socket.on('CLIENT_COMPLETED', handleClientCompleted);
    
    // Recargar estadísticas de asesores cuando haya cambios importantes
    socket.on('CLIENT_REASSIGNED', handleReloadAsesoresStats);
    socket.on('CLIENT_COMPLETED', handleReloadAsesoresStats);
    socket.on('CLIENT_RETURNED_TO_GTR', handleReloadAsesoresStats);

    // Cleanup
    return () => {
      socket.off('REASSIGNMENT_CONFIRMED', handleReassignmentConfirmed);
      socket.off('CLIENT_REASSIGNED', handleClientReassigned);
      socket.off('CLIENT_RETURNED_TO_GTR', handleClientReturnedToGTR);
      socket.off('CLIENT_OCUPADO', handleClientOcupado);
      socket.off('CLIENT_LOCKED', handleClientLocked);
      socket.off('CLIENT_UNLOCKED', handleClientUnlocked);
      socket.off('CLIENT_UPDATED', handleClientUpdated);
      socket.off('CLIENT_STATUS_UPDATED', handleClientStatusUpdated);
      socket.off('CLIENT_IN_GESTION', handleClientInGestion);
      socket.off('CLIENT_MOVED_TO_GTR', handleClientMovedToGTR);
      socket.off('CLIENT_COMPLETED', handleClientCompleted);
      // Nota: handleReloadAsesoresStats usa los mismos eventos, no necesita cleanup adicional
    };
  }, [socket, isConnected, fetchAsesores]);

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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <GtrSidebar
        onSelect={setSection}
        selected={section}
      />
      
      <Box sx={{ 
        flex: 1, 
        marginLeft: { xs: 0, md: '240px' },
        minHeight: '100vh',
        width: { xs: '100%', md: 'calc(100% - 240px)' },
        transition: 'margin-left 0.3s ease',
        boxSizing: 'border-box'
      }}>
        {/* Header móvil */}
        <Box sx={{ 
          display: { xs: 'block', md: 'none' }, 
          bgcolor: 'white',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          p: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 2 }}>
            {section}
          </Typography>
          
          {/* Navegación móvil */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': { height: '4px' },
            '&::-webkit-scrollbar-thumb': { 
              bgcolor: '#cbd5e1',
              borderRadius: '4px'
            }
          }}>
            {['Dashboard', 'Clientes', 'Asesores', 'Gestión del día', 'Reportes'].map((item) => (
              <Button
                key={item}
                variant={section === item ? 'contained' : 'outlined'}
                onClick={() => setSection(item)}
                size="small"
                sx={{
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                  px: 2.5,
                  py: 1,
                  borderRadius: '8px',
                  backgroundColor: section === item ? '#3b82f6' : 'white',
                  borderColor: section === item ? '#3b82f6' : '#e5e7eb',
                  color: section === item ? 'white' : '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: section === item ? '#2563eb' : '#f9fafb',
                    borderColor: section === item ? '#2563eb' : '#d1d5db',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }
                }}
              >
                {item}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Contenedor principal con padding responsivo */}
        <Box sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: '1600px',
          mx: 'auto',
          animation: 'fadeIn 0.3s ease-in',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
          }
        }}>
          {/* Header del panel */}
          <Box sx={{ 
            mb: 4,
            display: { xs: 'none', md: 'block' }
          }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.5rem', md: '1.875rem' },
              color: '#111827',
              mb: 1
            }}>
              Gestión de Clientes
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              Administra y visualiza todos los clientes registrados
            </Typography>
          </Box>
        
          {/* 📊 Estadísticas del día */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: 'repeat(1, 1fr)', 
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)'
            }, 
            gap: { xs: 2, sm: 2.5, md: 3 }, 
            mb: 4 
          }}>
            {/* Ingresados Hoy */}
            <Box sx={{ 
              bgcolor: 'white', 
              p: { xs: 2, md: 2.5 }, 
              borderRadius: 3, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transform: 'translateY(-4px)'
              }
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500, mb: 1 }}>
                    Ingresados Hoy
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5, fontSize: '2rem' }}>
                    {statsDelDia.ingresadosHoy}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.75rem' }}>
                    Nuevos leads del día
                  </Typography>
                </Box>
                <Box sx={{ 
                  bgcolor: '#3b82f6', 
                  borderRadius: 2, 
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Box component="span" sx={{ fontSize: '1.5rem' }}>📥</Box>
                </Box>
              </Box>
            </Box>

            {/* Gestionados Hoy */}
            <Box sx={{ 
              bgcolor: 'white', 
              p: { xs: 2, md: 2.5 }, 
              borderRadius: 3, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transform: 'translateY(-4px)'
              }
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500, mb: 1 }}>
                    Gestionados Hoy
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5, fontSize: '2rem' }}>
                    {statsDelDia.gestionadosHoy}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.75rem' }}>
                    Leads atendidos hoy
                  </Typography>
                </Box>
                <Box sx={{ 
                  bgcolor: '#3b82f6', 
                  borderRadius: 2, 
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Box component="span" sx={{ fontSize: '1.5rem' }}>✓</Box>
                </Box>
              </Box>
            </Box>

            {/* A Preventa */}
            <Box sx={{ 
              bgcolor: 'white', 
              p: { xs: 2, md: 2.5 }, 
              borderRadius: 3, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transform: 'translateY(-4px)'
              }
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500, mb: 1 }}>
                    A Preventa
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5, fontSize: '2rem' }}>
                    {statsDelDia.preventaHoy}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.75rem' }}>
                    Preventa completa
                  </Typography>
                </Box>
                <Box sx={{ 
                  bgcolor: '#f59e0b', 
                  borderRadius: 2, 
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Box component="span" sx={{ fontSize: '1.5rem' }}>🎯</Box>
                </Box>
              </Box>
            </Box>
          </Box>
        
        {section === 'Clientes' && (
          <>
            {/* 📊 Indicador simplificado */}
            <Box sx={{ 
              mb: 2, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 2,
              bgcolor: '#f8fafc',
              borderRadius: 2
            }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#64748b' }}>
                {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mostrando {paginatedClients.length} de {filteredClients.length}
              </Typography>
            </Box>

            <GtrClientsTable 
              clients={paginatedClients}
              asesores={asesores}
              setClients={setClients}
            />

            {/* Paginación estilo MUI */}
            <Box sx={{ 
              mt: 3, 
              mb: 2, 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: 2,
              p: 2,
              bgcolor: '#ffffff',
              borderRadius: 2,
              boxShadow: 1
            }}>
              <Pagination 
                count={totalPages}
                page={localPage}
                onChange={(_event: React.ChangeEvent<unknown>, page: number) => setLocalPage(page)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                siblingCount={2}
                boundaryCount={2}
              />
              <Typography variant="body2" color="text.secondary">
                Página {localPage} de {totalPages}
              </Typography>
            </Box>
          </>
        )}
        {section === 'Gestión del día' && (
          <DayManagementPanel />
        )}
        
          {section === 'Reportes' && (
            <ReportesPanel />
          )}

          {section === 'Asesores' && (
          <GtrAsesoresTable 
            asesores={asesores.map((asesor: AsesorAPI) => ({
              id: asesor.asesor_id || asesor.usuario_id || 0,
              nombre: asesor.nombre || 'Sin nombre',
              email: asesor.email || '',
              telefono: String(asesor.telefono || ''),
              estado: (asesor.estado || 'Offline') as 'Activo' | 'Ocupado' | 'Descanso' | 'Offline',
              clientesAsignados: asesor.clientes_asignados || 0,
              clientesAtendidos: asesor.clientes_atendidos_hoy || 0,
              clientesReasignados: asesor.clientes_reasignados_hoy || 0,
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
        onSave={async (data: any) => {
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

                // Estatus Comercial
                estatus_comercial_categoria: data.estatus_comercial_categoria || null,
                estatus_comercial_subcategoria: data.estatus_comercial_subcategoria || null,

                estado_cliente: 'nuevo',
                asesor_asignado: null // Sin asignar inicialmente
              })
            });

            const result = await response.json();
            
            if (result.success) {
              console.log('✅ Cliente creado exitosamente:', result.cliente);
              
              // Agregar el nuevo cliente al estado local
              setClients((prevClients: Cliente[]) => [result.cliente, ...prevClients]);
              
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

      {/* Floating Action Buttons */}
      {/* Botón para agregar cliente */}
      <Fab 
        color="secondary" 
        aria-label="agregar cliente"
        onClick={() => setDialogOpen(true)}
        sx={{ 
          position: 'fixed', 
          bottom: 96, // Encima del botón de filtros
          right: 24,
          zIndex: 1000
        }}
      >
        <AddIcon />
      </Fab>

      {/* Botón para abrir filtros */}
      <Fab 
        color="primary" 
        aria-label="filtros"
        onClick={() => setFiltersDrawerOpen(true)}
        sx={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24,
          zIndex: 1000
        }}
      >
        <FilterListIcon />
      </Fab>

      {/* Drawer de filtros avanzados */}
      <FiltersDrawer
        open={filtersDrawerOpen}
        onClose={() => setFiltersDrawerOpen(false)}
        onApplyFilters={handleApplyFilters}
        availableCampanas={uniqueCampanas}
        availableSalas={uniqueSalas}
        availableCompanias={uniqueCompanias}
      />
      </Box>
    </Box>
  );
};

export default GtrDashboard;