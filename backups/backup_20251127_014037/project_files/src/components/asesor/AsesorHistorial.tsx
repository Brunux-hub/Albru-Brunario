import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  CircularProgress
} from '@mui/material';

interface ClienteHistorial {
  id: number;
  telefono: string;
  campana?: string;
  estatus_comercial_categoria: string | null;
  estatus_comercial_subcategoria: string | null;
  fecha_wizard_completado: string | null;
  fecha_cierre_formateada?: string;
}

const AsesorHistorial: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteHistorial[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarHistorial = useCallback(async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const asesorId = userData.id;

      if (!asesorId) {
        console.error('No se encontró ID de usuario para cargar historial');
        return;
      }

      const response = await fetch(`/api/clientes/asesor/${asesorId}/historial`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar historial');
      }

      const result = await response.json();
      if (result.success && result.clientes) {
        setClientes(result.clientes);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  // Filtrar solo clientes que van a Validaciones
  const clientesFiltrados = clientes.filter(c => 
    c.estatus_comercial_categoria === 'Preventa completa' && 
    (c.estatus_comercial_subcategoria === 'Venta cerrada' || 
     c.estatus_comercial_subcategoria === 'Preventa pendiente de score')
  );
  
  const clientesAValidaciones = clientesFiltrados.length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando gestiones del mes...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Gestiones del Mes
      </Typography>

      {/* Métrica principal: Solo A Validaciones */}
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#dbeafe' }}>
          <Typography variant="body2" color="text.secondary">
            A Validaciones
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#2563eb' }}>
            {clientesAValidaciones}
          </Typography>
        </Paper>
      </Box>

      {/* Tabla de clientes que van a validaciones */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Clientes enviados a Validaciones ({clientesFiltrados.length})
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: '50vh' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Fecha de Cierre</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Categoría</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Subcategoría</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Seguimiento</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No hay clientes gestionados en esta categoría del mes
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clientesFiltrados.map((cliente) => (
                <TableRow key={cliente.id} hover>
                  <TableCell>
                    {cliente.fecha_cierre_formateada || 
                      (cliente.fecha_wizard_completado 
                        ? new Date(cliente.fecha_wizard_completado).toLocaleDateString('es-PE', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).replace(',', '')
                        : '-'
                      )
                    }
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>
                    {(() => {
                      const t = cliente.telefono || '';
                      const digits = String(t).replace(/\D/g, '').slice(-9);
                      if (!digits) return t;
                      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
                    })()}
                  </TableCell>
                  <TableCell>
                    {cliente.estatus_comercial_categoria ? (
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1f2937' }}>
                        {cliente.estatus_comercial_categoria}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>Sin categoría</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {cliente.estatus_comercial_subcategoria ? (
                      <div style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 500 }}>
                        {cliente.estatus_comercial_subcategoria}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label="Gestionado"
                      color="success"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AsesorHistorial;
