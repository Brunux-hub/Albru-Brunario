import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider, CircularProgress, Alert } from '@mui/material';
import RealtimeService from '../../services/RealtimeService';

interface HistorialItem {
  id: number;
  cliente_id: number;
  usuario_id: number | null;
  usuario_nombre?: string | null;
  accion: string;
  descripcion: string;
  estado_nuevo?: string | null;
  fecha_accion: string;
}

type MovedItem = {
  dni?: string | null;
  informe?: string | null;
  usuarioNombre?: string | null;
  fecha?: string;
  clienteId?: number;
};

const ReportesPanel: React.FC = () => {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [movedToGtr, setMovedToGtr] = useState<MovedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/historial');
        const data = await res.json();
        if (data && data.success) {
          // Filtrar entradas relacionadas a reasignaciones para que no se muestren en el panel
          const raw: HistorialItem[] = (data.historial as HistorialItem[]) || [];
          const filtered = raw.filter((h: HistorialItem) => {
            const acc = (h.accion || '').toString().toLowerCase();
            // Excluir acciones que contengan 'reasign' o 'reasignado'
            if (acc.includes('reasign')) return false;
            return true;
          });
          setHistorial(filtered);
        } else {
          setError('No fue posible cargar el historial');
        }
      } catch (e) {
        console.error('Error cargando historial:', e);
        setError('Error de conexión al cargar historial');
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();

    const realtime = RealtimeService.getInstance();
    if (!realtime.isConnected()) realtime.connect('GTR', localStorage.getItem('username') || 'GTR');
    const unsubscribe = realtime.subscribe('HISTORIAL_UPDATED', () => {
      // refetch and apply same filter to exclude reasignaciones
      fetch('/api/historial').then(r => r.json()).then(j => {
        if (j && j.success) {
          const raw: HistorialItem[] = (j.historial as HistorialItem[]) || [];
          const filtered = raw.filter((h: HistorialItem) => {
            const acc = (h.accion || '').toString().toLowerCase();
            if (acc.includes('reasign')) return false;
            return true;
          });
          setHistorial(filtered);
        }
      }).catch(e => console.warn('Error refetch historial after WS', e));
    });

    const unsubMoved = realtime.subscribe('CLIENT_MOVED_TO_GTR', (payload: unknown) => {
      try {
        const msg = payload as Record<string, unknown>;

        // Narrow and validate fields coming from unknown payload
        const dniCandidate = msg['dni'] ?? (msg['data'] && (msg['data'] as Record<string, unknown>)['dni']);
        const dni = typeof dniCandidate === 'string' ? dniCandidate : null;

        const informeCandidate = msg['informe'] ?? msg['descripcion'];
        const informe = typeof informeCandidate === 'string' ? informeCandidate : null;

        const usuarioNombreCandidate = msg['usuarioNombre'] ?? msg['usuario_nombre'];
        const usuarioNombre = typeof usuarioNombreCandidate === 'string' ? usuarioNombreCandidate : null;

        const fecha = typeof msg['fecha'] === 'string' ? msg['fecha'] : new Date().toISOString();

        const clienteIdRaw = msg['clienteId'] ?? msg['cliente_id'];
        const clienteId = typeof clienteIdRaw === 'number' ? clienteIdRaw : (typeof clienteIdRaw === 'string' && /^\\d+$/.test(clienteIdRaw) ? Number(clienteIdRaw) : undefined);

        const newItem: MovedItem = { dni, informe, usuarioNombre, fecha, clienteId };

        setMovedToGtr(prev => [newItem, ...(Array.isArray(prev) ? prev : [])].slice(0, 100));
      } catch (e) {
        console.warn('Error procesando CLIENT_MOVED_TO_GTR en ReportesPanel', e);
      }
    });

    return () => {
      unsubscribe();
      try { unsubMoved(); } catch (e) { console.warn('Error unsubscribing CLIENT_MOVED_TO_GTR', e); }
    };
  }, []);

  return (
    <Box>
      <Typography variant="h5" mb={2}>Reportes - Historial de gestiones</Typography>
      {loading && <Box display="flex" alignItems="center"><CircularProgress size={20} /><Typography sx={{ ml:1 }}>Cargando historial...</Typography></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Paper elevation={1} sx={{ maxHeight: '60vh', overflow: 'auto' }}>
          {/* Sección de notificaciones en tiempo real: clientes movidos a GTR (payload reducido) */}
          {movedToGtr.length > 0 && (
            <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb', bgcolor: '#f8fafc' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Clientes gestionados (en tiempo real)</Typography>
              <List>
                {movedToGtr.map((m, idx) => (
                  <React.Fragment key={`moved-${idx}-${m.clienteId || ''}`}>
                    <ListItem>
                      <ListItemText
                        primary={`${m.dni || 'SIN DNI'} — ${m.usuarioNombre || 'DESCONOCIDO'}`}
                        secondary={<>{m.informe}<br/><span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{new Date(m.fecha || '').toLocaleString('es-PE')}</span></>}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
          <List>
            {historial.map((h) => (
              <React.Fragment key={h.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={`${h.accion} — cliente ${h.cliente_id} — usuario: ${h.usuario_nombre || h.usuario_id || 'N/A'}`}
                    secondary={<>
                      <Typography component="span" variant="body2" color="text.primary">{new Date(h.fecha_accion).toLocaleString('es-PE')}</Typography>
                      {' — '}{h.descripcion}
                    </>}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
            {historial.length === 0 && (
              <ListItem><ListItemText primary="No hay gestiones registradas." /></ListItem>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default ReportesPanel;
