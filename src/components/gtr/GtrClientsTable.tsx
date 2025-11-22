import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip, 
  Button, 
  Box, 
  Typography, 
  TextField
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SearchIcon from '@mui/icons-material/Search';

import ClientHistoryDialog from './ClientHistoryDialog';
import ReassignDialog from './ReassignDialog';
import type { ClientHistoryData, Asesor, Cliente } from './types';
import RealtimeService from '../../services/RealtimeService';
import { AnimatedCard } from '../common/AnimatedCard';
import { colors, typography } from '../../theme/designTokens';








interface GtrClientsTableProps {
  statusFilter?: string;
  newClient?: Partial<Cliente>; // Cliente parcial para nuevos datos
  clients: Cliente[]; // Lista de clientes
  setClients: React.Dispatch<React.SetStateAction<Cliente[]>>; // Actualizar clientes
  asesores: Asesor[]; // Lista de asesores disponibles
}

const GtrClientsTable: React.FC<GtrClientsTableProps> = ({ statusFilter, newClient, clients, setClients, asesores }) => {
  const [selectedClient, setSelectedClient] = useState<ClientHistoryData | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [clientToReassign, setClientToReassign] = useState<Cliente | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Cliente[] | null>(null);

  React.useEffect(() => {
    if (newClient) {
      const isSoloNumero = !newClient.nombre && !newClient.dni && !newClient.email;
      const now = new Date();
      const fecha = now.toLocaleDateString('es-PE');
      const fechaHora = now.toLocaleString('es-PE');
      setClients(prev => [
        {
          ...newClient,
          id: Date.now(),
          fechaCreacion: fecha,
          estado: isSoloNumero ? 'Nuevo' : 'En gestión',
          asesor: '-',
          comentarios: isSoloNumero ? 'Solo número' : (newClient.comentarios || ''),
          historial: [
            {
              fecha: fechaHora,
              asesor: 'Sistema',
              accion: 'Creación',
              comentarios: isSoloNumero ? 'Cliente registrado solo con número' : 'Cliente registrado con datos completos'
            }
          ]
        },
        ...prev
      ]);
    }
  }, [newClient, setClients]);

  const sortedClients = useMemo(() => [...clients].sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()), [clients]);
  let filtered = sortedClients;
  if (statusFilter === 'Solo números') {
    filtered = sortedClients.filter(c => !c.nombre && !c.dni && !c.email);
  } else if (statusFilter && statusFilter !== 'Todos') {
    filtered = sortedClients.filter(c => c.estado === statusFilter);
  }

  // Si hay una consulta de búsqueda activa (>=3 caracteres), hacemos búsqueda server-side
  const searchActive = query && query.trim().length >= 3;

  React.useEffect(() => {
    let mounted = true;
    let timer: number | undefined;

    const doSearch = async (q: string) => {
      try {
        const url = `/api/clientes/search?term=${encodeURIComponent(q)}&limit=500&page=1`;
        const resp = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
        if (!resp.ok) {
          console.warn('Search API returned', resp.status);
          if (mounted) setSearchResults([]);
          return;
        }
        const j = await resp.json();
        if (mounted) {
          if (j && j.success && Array.isArray(j.items)) {
            const mapped = j.items.map((cliente: any) => ({
              id: cliente.id,
              fechaCreacion: cliente.fecha || cliente.created_at || '',
              created_at: cliente.created_at || null,
              leads_original_telefono: cliente.leads_original_telefono || cliente.telefono || '',
              nombre: cliente.nombre || '',
              telefono: cliente.telefono || '',
              dni: cliente.dni || '',
              estatus_comercial_categoria: cliente.estatus_comercial_categoria || null,
              estatus_comercial_subcategoria: cliente.estatus_comercial_subcategoria || null,
              asesor: cliente.asesor_nombre || cliente.asesor || 'Disponible',
              campana: cliente.campana || cliente.campania || null,
              canal: cliente.canal_adquisicion || cliente.canal || null,
              sala_asignada: cliente.sala_asignada || cliente.sala || null,
              compania: cliente.compania || null,
              seguimiento_status: cliente.seguimiento_status ?? null,
              estado: cliente.estado || 'nuevo',
              historial: cliente.historial || []
            } as Cliente));
            setSearchResults(mapped);
          } else {
            setSearchResults([]);
          }
        }
      } catch (e) {
        console.warn('Error buscando clientes globalmente:', e);
        if (mounted) setSearchResults([]);
      }
    };

    if (!searchActive) {
      // limpiar resultados cuando la búsqueda no está activa
      setSearchResults(null);
    } else {
      // debounce
      timer = window.setTimeout(() => doSearch(query.trim()), 300);
    }

    return () => {
      mounted = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [query]);
  
  const handleViewHistory = async (client: Cliente) => {
    try {
      console.log('📋 GTR Frontend: Solicitando historial actualizado para cliente:', client.id);
      const resp = await fetch(`/api/clientes/${client.id}`);
      if (!resp.ok) {
        console.warn('⚠️ GTR: No se pudo obtener cliente desde backend, usando datos locales');
      }
      const data = await resp.json().catch(() => null);
      const servidorCliente = data && data.cliente ? data.cliente : null;

      const historial = servidorCliente?.historial || client.historial || [];

      const clientHistoryData: ClientHistoryData = {
        id: client.id,
        nombre: servidorCliente?.nombre || client.nombre || '',
        cliente: String(client.id),
        dni: servidorCliente?.dni || client.dni || '',
        email: servidorCliente?.email || client.email || '',
        campana: servidorCliente?.campana ?? client.campana ?? 'Sin campaña',
        canal: servidorCliente?.canal || client.canal || 'Sin canal',
        estado: servidorCliente?.estado || client.estado || '',
        fechaCreacion: servidorCliente?.fechaCreacion || client.fechaCreacion,
        historial: historial
      };

      console.log('📋 GTR Frontend: ClientHistoryData preparado (servidor):', clientHistoryData);
      setSelectedClient(clientHistoryData);
      setHistoryDialogOpen(true);
    } catch (e) {
      console.error('❌ GTR: Error al obtener historial del cliente:', e);
      // Fallback a datos locales
      const clientHistoryData: ClientHistoryData = {
        id: client.id,
        nombre: client.nombre || '',
        cliente: String(client.id),
        dni: client.dni || '',
        email: client.email || '',
        campana: client.campana ?? 'Sin campaña',
        canal: 'Sin canal',
        estado: client.estado || '',
        fechaCreacion: client.fechaCreacion,
        historial: client.historial || []
      };
      setSelectedClient(clientHistoryData);
      setHistoryDialogOpen(true);
    }
  };
  
  const handleReassign = (client: Cliente) => {
    console.log('🔄 GTR: Iniciando reasignación para cliente:', client);
    console.log('🔄 GTR: Categoría del cliente:', client.estatus_comercial_categoria);
    console.log('🔄 GTR: Estado seguimiento:', client.seguimiento_status);
    setClientToReassign(client);
    setReassignDialogOpen(true);
  };

  const handleReassignConfirm = async (newAsesorId: string) => {
    if (!clientToReassign) {
        console.error('❌ GTR: No hay cliente seleccionado para reasignar');
        alert('Error: No se ha seleccionado ningún cliente');
        return;
    }

    console.log('🎯 GTR: Iniciando proceso de reasignación...');
    console.log('📋 GTR: Cliente seleccionado:', JSON.stringify(clientToReassign, null, 2));
    console.log('📋 GTR: Cliente ID:', clientToReassign.id, 'Tipo:', typeof clientToReassign.id);
    console.log('🎯 GTR: Nuevo asesor ID recibido:', newAsesorId, 'Tipo:', typeof newAsesorId);

    try {
        // Validaciones exhaustivas
        const clienteId = clientToReassign.id;
        if (!clienteId || clienteId === undefined || clienteId === null) {
            console.error('❌ GTR: Cliente ID inválido:', clienteId);
            throw new Error(`Cliente no tiene ID válido. ID recibido: ${clienteId}`);
        }

        if (!newAsesorId || newAsesorId.trim() === '') {
            console.error('❌ GTR: Asesor ID inválido:', newAsesorId);
            throw new Error('Debe seleccionar un asesor válido');
        }

        // Convertir IDs a números para asegurar tipo correcto
        const clienteIdNum = parseInt(String(clienteId));
        const asesorIdNum = parseInt(newAsesorId);

        if (isNaN(clienteIdNum) || isNaN(asesorIdNum)) {
            console.error('❌ GTR: Error de conversión:', { clienteIdNum, asesorIdNum });
            throw new Error(`IDs no son números válidos. Cliente: ${clienteIdNum}, Asesor: ${asesorIdNum}`);
        }

        console.log('✅ GTR: Validaciones pasadas. Procediendo con:', { clienteIdNum, asesorIdNum });

        // Buscar el nombre del nuevo asesor para actualizar la UI
        const nuevoAsesor = asesores.find(a => String(a.asesor_id) === newAsesorId);
        const nuevoAsesorNombre = nuevoAsesor?.nombre || `Asesor ID: ${newAsesorId}`;

        // Preparar payload para el backend
        const payload = {
            clienteId: clienteIdNum,
            nuevoAsesorId: asesorIdNum,
            gtrId: 2, // GTR María García ID
            comentario: `Cliente reasignado por GTR desde panel de gestión`
        };

        console.log('� GTR: Enviando payload al backend:', JSON.stringify(payload, null, 2));

        // Realizar reasignación en el backend
        const reasignacionResponse = await fetch('/api/clientes/reasignar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!reasignacionResponse.ok) {
            const errorData = await reasignacionResponse.json();
            console.error('❌ GTR: Error del servidor:', errorData);
            
            // Manejo específico para categorías no reasignables (403 Forbidden)
            if (reasignacionResponse.status === 403) {
                alert(`❌ REASIGNACIÓN NO PERMITIDA\n\n${errorData.message}\n\nCategoría actual: ${errorData.categoria || 'No especificada'}\n\n📌 Solo se pueden reasignar clientes de las siguientes categorías:\n• Lista negra\n• Sin facilidades\n• Retirado\n• Rechazado\n• Agendado\n• Seguimiento\n• Sin contacto`);
            } else {
                alert(`Error al reasignar cliente: ${errorData.message || 'Error desconocido'}`);
            }
            
            throw new Error(errorData.message || 'Error al reasignar en el servidor');
        }

        const result = await reasignacionResponse.json();
        console.log('✅ GTR: Reasignación exitosa en BD:', result);

        // Actualizar la tabla local
        const previousAdvisor = clientToReassign.asesor;
        const currentDate = new Date();
        const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
        const formattedDateTime = `${formattedDate} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;

        const reassignmentEntry = {
            fecha: formattedDateTime,
            asesor: nuevoAsesorNombre,
            accion: 'Reasignación',
            estadoAnterior: previousAdvisor,
            estadoNuevo: nuevoAsesorNombre,
            comentarios: `Reasignado de ${previousAdvisor} a ${nuevoAsesorNombre}`
        };

        setClients(prev => prev.map(c => {
            if (c.id === clientToReassign.id) {
                const updatedHistorial = c.historial ? [reassignmentEntry, ...c.historial] : [reassignmentEntry];
                return {
                    ...c,
                    asesor: nuevoAsesorNombre,
                    historial: updatedHistorial
                };
            }
            return c;
        }));

        console.log('🎉 GTR: Reasignación completada exitosamente');
        alert(`Cliente reasignado exitosamente a ${nuevoAsesorNombre}`);

    } catch (error) {
        console.error('❌ GTR: Error en reasignación:', error);
        alert(`Error al reasignar cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
        setReassignDialogOpen(false);
        setClientToReassign(null);
    }
  };

  // Suscribirse a eventos WebSocket relevantes para marcar 'ocupado' y actualizar clientes en tiempo real
  React.useEffect(() => {
    const realtime = RealtimeService.getInstance();
    const unsubscribeLocked = realtime.subscribe('CLIENT_LOCKED', (data: unknown) => {
      try {
        const payload = data as Record<string, unknown>;
        const clienteId = Number(payload['clienteId'] || payload['cliente_id'] || payload['clienteId']);
          if (!clienteId) return;
          setClients(prev => prev.map(c => c.id === clienteId ? { ...c, ocupado: true } : c));
      } catch (e) { console.warn('CLIENT_LOCKED handler error', e); }
    });

    const unsubscribeUnlocked = realtime.subscribe('CLIENT_UNLOCKED', (data: unknown) => {
      try {
        const payload = data as Record<string, unknown>;
        const clienteId = Number(payload['clienteId'] || payload['cliente_id'] || payload['clienteId']);
        if (!clienteId) return;
        setClients(prev => prev.map(c => c.id === clienteId ? { ...c, ocupado: false } : c));
      } catch (e) { console.warn('CLIENT_UNLOCKED handler error', e); }
    });

    const unsubscribeUpdated = realtime.subscribe('CLIENT_UPDATED', (data: unknown) => {
      try {
        const payload = data as Record<string, unknown>;
        const cliente = payload['cliente'] as Record<string, unknown> | undefined;
        if (!cliente || !cliente['id']) return;
        const id = Number(cliente['id']);
  setClients(prev => prev.map(c => c.id === id ? { ...c, ...(cliente as Partial<Cliente>) } : c));
      } catch (e) { console.warn('CLIENT_UPDATED handler error', e); }
    });

    // 🔥 NUEVO: Escuchar actualizaciones de estatus comercial en tiempo real
    const unsubscribeStatusUpdated = realtime.subscribe('CLIENT_STATUS_UPDATED', (data: unknown) => {
      try {
        const payload = data as Record<string, unknown>;
        const clienteId = Number(payload['clienteId']);
        if (!clienteId) return;

        const categoria = payload['estatus_comercial_categoria'] as string | null;
        const subcategoria = payload['estatus_comercial_subcategoria'] as string | null;
        
        console.log('📡 GTR: Recibido CLIENT_STATUS_UPDATED', { clienteId, categoria, subcategoria });

        // Actualizar cliente en la tabla con los nuevos datos de estatus
        setClients(prev => prev.map(c => 
          c.id === clienteId 
            ? { 
                ...c, 
                estatus_comercial_categoria: categoria, 
                estatus_comercial_subcategoria: subcategoria 
              } 
            : c
        ));

        console.log('✅ GTR: Cliente actualizado en tabla con estatus comercial');
      } catch (e) { 
        console.warn('CLIENT_STATUS_UPDATED handler error', e); 
      }
    });

    return () => {
      unsubscribeLocked();
      unsubscribeUnlocked();
      unsubscribeUpdated();
      unsubscribeStatusUpdated();
    };
  }, [setClients]);
  
  return (
    <Paper sx={{ 
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb',
      width: '100%',
      flex: 1
    }}>
      <AnimatedCard delay={100} elevation={2} sx={{ overflow: 'hidden' }}>
        {/* Header profesional con búsqueda */}
        <Box sx={{ 
          p: 3, 
          borderBottom: `1px solid ${colors.neutral[200]}`, 
          background: `linear-gradient(to right, ${colors.background.paper}, ${colors.neutral[50]})`,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: 3,
          flexWrap: 'wrap'
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: typography.fontWeight.bold, 
            color: colors.text.primary,
            fontSize: typography.fontSize.xl
          }}>
            Gestión de Clientes
            <Typography component="span" sx={{ 
              ml: 2, 
              fontSize: typography.fontSize.sm, 
              color: colors.text.secondary,
              fontWeight: typography.fontWeight.medium
            }}>
              {filtered.length} {filtered.length === 1 ? 'cliente' : 'clientes'}
            </Typography>
          </Typography>
          
          <TextField 
            size="small" 
            placeholder="Buscar cliente, asesor o teléfono..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            sx={{ 
              minWidth: 300,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: colors.background.paper,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: colors.neutral[50],
                },
                '&.Mui-focused': {
                  backgroundColor: colors.background.paper,
                  boxShadow: `0 0 0 3px ${colors.primary[100]}`,
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: colors.text.secondary, fontSize: 20 }} />
              )
            }}
          />
        </Box>
      
      <TableContainer sx={{ maxHeight: '60vh' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
                <TableCell sx={{ 
                  fontWeight: typography.fontWeight.bold, 
                  color: colors.text.primary, 
                  background: colors.neutral[100],
                  borderBottom: `2px solid ${colors.neutral[300]}`,
                  py: 2
                }}>Fecha Registro</TableCell>
                <TableCell sx={{ 
                  fontWeight: typography.fontWeight.bold, 
                  color: colors.text.primary, 
                  background: colors.neutral[100],
                  borderBottom: `2px solid ${colors.neutral[300]}`,
                  py: 2
                }}>Lead</TableCell>
                <TableCell sx={{ 
                  fontWeight: typography.fontWeight.bold, 
                  color: colors.text.primary, 
                  background: colors.neutral[100],
                  borderBottom: `2px solid ${colors.neutral[300]}`,
                  py: 2
                }}>Campaña</TableCell>
                <TableCell sx={{ 
                  fontWeight: typography.fontWeight.bold, 
                  color: colors.text.primary, 
                  background: colors.neutral[100],
                  borderBottom: `2px solid ${colors.neutral[300]}`,
                  py: 2
                }}>Canal</TableCell>
                <TableCell sx={{ 
                  fontWeight: typography.fontWeight.bold, 
                  color: colors.text.primary, 
                  background: colors.neutral[100],
                  borderBottom: `2px solid ${colors.neutral[300]}`,
                  py: 2
                }}>Sala</TableCell>
                <TableCell sx={{ 
                  fontWeight: typography.fontWeight.bold, 
                  color: colors.text.primary, 
                  background: colors.neutral[100],
                  borderBottom: `2px solid ${colors.neutral[300]}`,
                  py: 2
                }}>Compañía</TableCell>
                <TableCell sx={{ 
                  fontWeight: typography.fontWeight.bold, 
                  color: colors.text.primary, 
                  background: colors.neutral[100],
                  borderBottom: `2px solid ${colors.neutral[300]}`,
                  py: 2
                }}>Estatus Comercial</TableCell>
                <TableCell sx={{ 
                  fontWeight: typography.fontWeight.bold, 
                  color: colors.text.primary, 
                  background: colors.neutral[100],
                  borderBottom: `2px solid ${colors.neutral[300]}`,
                  py: 2
                }}>Asesor asignado</TableCell>
                <TableCell sx={{ 
                  fontWeight: typography.fontWeight.bold, 
                  color: colors.text.primary, 
                  background: colors.neutral[100],
                  borderBottom: `2px solid ${colors.neutral[300]}`,
                  py: 2
                }}>Seguimiento</TableCell>
                <TableCell sx={{ 
                  fontWeight: typography.fontWeight.bold, 
                  color: colors.text.primary, 
                  background: colors.neutral[100],
                  borderBottom: `2px solid ${colors.neutral[300]}`,
                  py: 2
                }}>Acciones</TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {(searchActive ? (searchResults || []) : filtered).map(client => (
              <TableRow key={client.id} sx={{ 
                '&:hover': { 
                  backgroundColor: colors.neutral[50],
                  transition: 'background-color 0.2s ease'
                } 
              }}>
                <TableCell>
                  {client.created_at ? (
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {(() => {
                          const dateStr = client.created_at.split('T')[0];
                          const [year, month, day] = dateStr.split('-');
                          return `${day}/${month}/${year}`;
                        })()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {(() => {
                          const timePart = client.created_at.includes('T') ? client.created_at.split('T')[1] : client.created_at.split(' ')[1] || '00:00:00';
                          const [hour, minute] = timePart.split(':');
                          return `${hour}:${minute}`;
                        })()}
                      </div>
                    </div>
                  ) : (
                    client.fechaCreacion || '-'
                  )}
                </TableCell>
                <TableCell>
                  {client.leads_original_telefono || client.telefono || client.cliente || client.lead ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1976d2' }}>
                          {(() => {
                            const t = client.leads_original_telefono || client.telefono || client.cliente || client.lead || '';
                            const digits = String(t).replace(/\D/g, '').slice(-9);
                            if (!digits) return t;
                            return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,9)}`;
                          })()}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{client.telefono ? `(${client.telefono})` : ''}</div>
                      </div>
                      {(() => {
                        // DEBUG: Verificar datos de duplicados
                        if (client.leads_original_telefono === '985 425 120') {
                          console.log('🔍 Cliente 985 425 120:', {
                            cantidad_duplicados: client.cantidad_duplicados,
                            es_duplicado: client.es_duplicado,
                            telefono_principal_id: client.telefono_principal_id
                          });
                        }
                        return client.cantidad_duplicados && client.cantidad_duplicados > 1 ? (
                          <Chip 
                            label={`×${client.cantidad_duplicados}`}
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 700, fontSize: '0.75rem', height: '22px' }}
                            title={`Este número aparece ${client.cantidad_duplicados} veces en la base de datos`}
                          />
                        ) : null;
                      })()}
                    </div>
                  ) : (
                    <span style={{ color: '#1976d2', fontStyle: 'normal', fontWeight:700 }}>Sin teléfono</span>
                  )}
                </TableCell>
                <TableCell>{client.campana ?? <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin campaña</span>}</TableCell>
                <TableCell>{client.canal || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin canal</span>}</TableCell>
                <TableCell>{client.sala_asignada || client.sala || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin sala</span>}</TableCell>
                <TableCell>{client.compania || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin compañía</span>}</TableCell>
                <TableCell>
                  {/* Columna Estatus Comercial: SIEMPRE mostrar categoría/subcategoría si existe */}
                  {client.estatus_comercial_categoria ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{client.estatus_comercial_categoria}</div>
                      {client.estatus_comercial_subcategoria && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                          {client.estatus_comercial_subcategoria}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.875rem' }}>Sin estatus</span>
                  )}
                </TableCell>
                <TableCell>
                  {/* Columna Asesor: solo mostrar nombre, SIN badge de Ocupado */}
                  <div style={{ fontWeight: 500 }}>
                    {client.asesor || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin asignar</span>}
                  </div>
                </TableCell>
                <TableCell>
                  {/* Columna Seguimiento: mostrar estado del flujo (derivado, en_gestion, gestionado, no_gestionado) */}
                  {client.seguimiento_status ? (
                    <Chip 
                      label={(() => {
                        // Formatear el estado para mejor legibilidad
                        const status = String(client.seguimiento_status);
                        switch(status) {
                          case 'derivado': return 'Derivado';
                          case 'en_gestion': return 'En Gestión';
                          case 'gestionado': return 'Gestionado';
                          case 'gestionada': return 'Gestionado'; // mantener compatibilidad
                          case 'no_gestionado': return 'No Gestionado';
                          case 'sin_gestionar': return 'Sin Gestionar'; // mantener compatibilidad
                          case 'nuevo': return 'Nuevo';
                          default: return status;
                        }
                      })()} 
                      size="small" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: (() => {
                          const status = String(client.seguimiento_status);
                          switch(status) {
                            case 'derivado': return '#2563eb';
                            case 'en_gestion': return '#059669';
                            case 'gestionado':
                            case 'gestionada': return '#16a34a';
                            case 'no_gestionado':
                            case 'sin_gestionar': return '#dc2626';
                            case 'nuevo': return '#f59e0b';
                            default: return '#374151';
                          }
                        })(),
                        background: (() => {
                          const status = String(client.seguimiento_status);
                          switch(status) {
                            case 'derivado': return '#dbeafe';
                            case 'en_gestion': return '#d1fae5';
                            case 'gestionado':
                            case 'gestionada': return '#dcfce7';
                            case 'no_gestionado':
                            case 'sin_gestionar': return '#fee2e2';
                            case 'nuevo': return '#fef3c7';
                            default: return '#f3f4f6';
                          }
                        })(),
                        borderRadius: 1
                      }} 
                    />
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewHistory(client)}
                      sx={{ 
                        textTransform: 'none',
                        color: '#22223b',
                        border: '1px solid #e5e7eb',
                        background: '#fff',
                        fontWeight: 700,
                        borderRadius: 1,
                        px: 2,
                        '&:hover': { backgroundColor: '#f3f4f6' }
                      }}
                    >
                      VER
                    </Button>
                    {(() => {
                      const categoriasNoReasignables = ['Preventa', 'Preventa completa'];
                      const esPreventaCliente = Boolean(client.estatus_comercial_categoria && 
                                                categoriasNoReasignables.includes(client.estatus_comercial_categoria));
                      
                      // Debug: Log para verificar estado del botón
                      if (client.id % 50 === 0) { // Log cada 50 clientes para no saturar consola
                        console.log(`🔍 Cliente ID ${client.id}: Categoría="${client.estatus_comercial_categoria}", Deshabilitado=${esPreventaCliente}`);
                      }
                      
                      return (
                        <Button 
                          size="small" 
                          startIcon={<SwapHorizIcon />}
                          onClick={() => handleReassign(client)}
                          disabled={esPreventaCliente}
                          sx={{ 
                            textTransform: 'none',
                            color: esPreventaCliente ? '#9ca3af' : '#fff',
                            backgroundColor: esPreventaCliente ? '#e5e7eb' : '#111827',
                            fontWeight: 700,
                            borderRadius: 1,
                            px: 2,
                            cursor: esPreventaCliente ? 'not-allowed' : 'pointer',
                            '&:hover': { 
                              backgroundColor: esPreventaCliente ? '#e5e7eb' : '#374151' 
                            },
                            '&.Mui-disabled': {
                              color: '#9ca3af',
                              backgroundColor: '#e5e7eb',
                              opacity: 0.7
                            }
                          }}
                          title={esPreventaCliente ? `No se puede reasignar clientes en categoría ${client.estatus_comercial_categoria}` : 'Reasignar cliente a otro asesor'}
                        >
                          REASIGNAR
                        </Button>
                      );
                    })()}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </AnimatedCard>
      
      <ClientHistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        clientData={selectedClient}
  onSave={(updatedClient: Partial<Cliente> & { leads_original_telefono?: string; tipificacion_back?: string | null; canal_adquisicion?: string }) => {
          // Actualizar la lista local de clientes con los valores retornados por el backend
          setClients(prev => prev.map(c => {
            if (c.id === updatedClient.id) {
              return {
                ...c,
                nombre: updatedClient.nombre ?? c.nombre,
                dni: updatedClient.dni ?? c.dni,
                telefono: updatedClient.telefono ?? c.telefono,
                cliente: updatedClient.leads_original_telefono || updatedClient.telefono || c.cliente,
                campana: updatedClient.campana ?? c.campana,
                canal: updatedClient.canal_adquisicion ?? c.canal,
                estado: updatedClient.estado ?? c.estado,
                // prop tipificacion_back no está en la tabla local Cliente en todos los tipos TS — usar valor existente si no viene
                observaciones: updatedClient.tipificacion_back ?? c.observaciones
              };
            }
            return c;
          }));
        }}
      />
      
      <ReassignDialog
        open={reassignDialogOpen}
        onClose={() => setReassignDialogOpen(false)}
        onConfirm={handleReassignConfirm}
        asesores={asesores}
        cliente={clientToReassign ? {
          id: clientToReassign.id,
          historial_asesores: clientToReassign.historial_asesores
        } : undefined}
      />
    </Paper>
  );
};

export default GtrClientsTable;
