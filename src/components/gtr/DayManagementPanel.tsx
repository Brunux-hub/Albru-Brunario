import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Chip, IconButton, Button } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

interface HistRow {
  id: number;
  cliente_id: number;
  usuario_id: number | null;
  accion: string;
  descripcion: string;
  estado_nuevo: string | null;
  created_at: string;
}

interface ClienteGestionado {
  id: number;
  nombre: string;
  telefono: string;
  leads_original_telefono?: string;
  dni?: string;
  campana?: string;
  canal?: string;
  sala_asignada?: string;
  compania?: string;
  asesor_nombre: string;
  asesor_asignado?: number;
  estatus_comercial_categoria: string;
  estatus_comercial_subcategoria: string;
  fecha_wizard_completado: string;
  seguimiento_status: string;
  fecha_registro?: string;
}

const DayManagementPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState<HistRow[]>([]);
  const [clientesGestionadosHoy, setClientesGestionadosHoy] = useState<ClienteGestionado[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        
        // Cargar historial
        const respHist = await fetch(`${backendUrl}/api/historial?limit=1000`);
        const jHist = await respHist.json();
        if (jHist && jHist.success && Array.isArray(jHist.historial)) {
          setHistorial(jHist.historial as HistRow[]);
        }

        // Cargar clientes gestionados del día
        const respClientes = await fetch(`${backendUrl}/api/clientes/gestionados-hoy`);
        const jClientes = await respClientes.json();
        if (jClientes && jClientes.success && Array.isArray(jClientes.clientes)) {
          setClientesGestionadosHoy(jClientes.clientes as ClienteGestionado[]);
        }
      } catch (e) {
        console.warn('Error cargando datos para Gestión del día', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar solo entradas del día actual
  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);
  const endOfDay = new Date();
  endOfDay.setHours(23,59,59,999);

  const todays = historial.filter(h => {
    const d = new Date(h.created_at);
    return d >= startOfDay && d <= endOfDay;
  });

  const totalGestiones = todays.length;
  const clientesGestionados = new Set(todays.map(h => h.cliente_id)).size;
  const avgGestionesPorCliente = clientesGestionados ? (totalGestiones / clientesGestionados).toFixed(2) : '0';

  // Calcular tasa de moved_to_gtr: clientes que tuvieron accion moved_to_gtr hoy
  const movedToGtrSet = new Set(todays.filter(h => (h.accion || '').toLowerCase().includes('moved_to_gtr')).map(h => h.cliente_id));
  const clientesMovedToGtr = movedToGtrSet.size;
  const tasaGestion = clientesGestionados ? ((clientesMovedToGtr / clientesGestionados) * 100).toFixed(1) + '%' : '0%';

  // Calcular tiempo medio hasta moved_to_gtr (en minutos) usando primera acción del día -> moved_to_gtr
  const timeDiffsMinutes: number[] = [];
  // Agrupar por cliente
  const mapByCliente = new Map<number, HistRow[]>();
  todays.forEach(h => {
    const arr = mapByCliente.get(h.cliente_id) || [];
    arr.push(h);
    mapByCliente.set(h.cliente_id, arr);
  });

  // Note: avoid declaring an unused clienteId to satisfy TS linter
  mapByCliente.forEach((arr) => {
    const sorted = arr.slice().sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const first = sorted[0];
    const moved = sorted.find(s => (s.accion || '').toLowerCase().includes('moved_to_gtr'));
    if (first && moved && new Date(moved.created_at).getTime() >= new Date(first.created_at).getTime()) {
      const diffMs = new Date(moved.created_at).getTime() - new Date(first.created_at).getTime();
      timeDiffsMinutes.push(diffMs / 60000);
    }
  });

  const avgTimeMinutes = timeDiffsMinutes.length ? (timeDiffsMinutes.reduce((a,b) => a+b, 0) / timeDiffsMinutes.length) : 0;
  const formatMinutes = (mins: number) => {
    if (!mins || mins <= 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Gestión del día</Typography>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Cargando datos...</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Paper sx={{ p: 2, flex: '1 1 30%', minWidth: 200 }}>
              <Typography variant="subtitle2" color="text.secondary">Gestiones hoy</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{totalGestiones}</Typography>
            </Paper>

            <Paper sx={{ p: 2, flex: '1 1 30%', minWidth: 200 }}>
              <Typography variant="subtitle2" color="text.secondary">Clientes gestionados</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{clientesGestionados}</Typography>
            </Paper>

            <Paper sx={{ p: 2, flex: '1 1 30%', minWidth: 200 }}>
              <Typography variant="subtitle2" color="text.secondary">Avg gest./cliente</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{avgGestionesPorCliente}</Typography>
            </Paper>

            <Paper sx={{ p: 2, flex: '1 1 30%', minWidth: 200 }}>
              <Typography variant="subtitle2" color="text.secondary">Clientes moved_to_gtr</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{clientesMovedToGtr}</Typography>
              <Typography variant="caption" color="text.secondary">Tasa: {tasaGestion}</Typography>
            </Paper>

            <Paper sx={{ p: 2, flex: '1 1 30%', minWidth: 200 }}>
              <Typography variant="subtitle2" color="text.secondary">Tiempo medio hasta moved_to_gtr</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatMinutes(avgTimeMinutes)}</Typography>
            </Paper>
          </Box>

          {/* Tabla de Clientes Gestionados del Día */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Clientes Gestionados Hoy ({clientesGestionadosHoy.length})
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Fecha Registro</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Lead</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Campaña</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Canal</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Sala</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Compañía</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Estatus Comercial</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Asesor asignado</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Seguimiento</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientesGestionadosHoy.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No hay clientes gestionados hoy
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesGestionadosHoy.map(cliente => (
                    <TableRow key={cliente.id} hover>
                      <TableCell>
                        {cliente.fecha_registro 
                          ? new Date(cliente.fecha_registro).toLocaleDateString('es-PE')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1976d2' }}>
                            {cliente.leads_original_telefono || cliente.telefono || 'Sin teléfono'}
                          </div>
                          {cliente.leads_original_telefono && cliente.telefono && cliente.telefono !== cliente.leads_original_telefono && (
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              ({cliente.telefono})
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{cliente.campana || '-'}</TableCell>
                      <TableCell>{cliente.canal || '-'}</TableCell>
                      <TableCell>{cliente.sala_asignada || '-'}</TableCell>
                      <TableCell>{cliente.compania || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <Chip 
                            label={cliente.estatus_comercial_categoria || 'Sin categoría'}
                            size="small"
                            color="primary"
                            sx={{ mb: 0.5 }}
                          />
                          <Typography variant="caption" display="block" color="text.secondary">
                            {cliente.estatus_comercial_subcategoria || 'Sin subcategoría'}
                          </Typography>
                        </div>
                      </TableCell>
                      <TableCell>{cliente.asesor_nombre || 'Disponible'}</TableCell>
                      <TableCell>
                        <Chip 
                          label="Gestionado" 
                          size="small"
                          color="success"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            title="Ver detalles"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<SwapHorizIcon />}
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            REASIGNAR
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Últimas gestiones (hoy)</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hora</TableCell>
                  <TableCell>Cliente ID</TableCell>
                  <TableCell>Acción</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Descripción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {todays.slice(0, 50).map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{new Date(row.created_at).toLocaleTimeString('es-ES')}</TableCell>
                    <TableCell>{row.cliente_id}</TableCell>
                    <TableCell>{row.accion}</TableCell>
                    <TableCell>{row.usuario_id ?? 'Sistema'}</TableCell>
                    <TableCell style={{ maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.descripcion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default DayManagementPanel;
