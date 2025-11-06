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
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';

interface ClienteHistorial {
  id: number;
  nombre: string;
  telefono: string;
  dni: string;
  estatus_comercial_categoria: string | null;
  estatus_comercial_subcategoria: string | null;
  fecha_wizard_completado: string | null;
  wizard_completado: number;
}

const AsesorHistorial: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

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

  const clientesFiltrados = clientes.filter((cliente) => {
    const searchTerm = busqueda.toLowerCase();
    return (
      cliente.nombre?.toLowerCase().includes(searchTerm) ||
      cliente.telefono?.includes(searchTerm) ||
      cliente.dni?.includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={600}>
          Mi Historial de Gestiones ({clientesFiltrados.length})
        </Typography>
        <TextField
          size="small"
          placeholder="Buscar por nombre, teléfono o DNI..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          sx={{ width: 350 }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Fecha de Cierre</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Teléfono</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>DNI</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Categoría Final</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Subcategoría Final</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {busqueda ? 'No se encontraron resultados' : 'No hay clientes en el historial'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clientesFiltrados.map((cliente) => (
                <TableRow key={cliente.id} hover>
                  <TableCell>
                    {cliente.fecha_wizard_completado 
                      ? new Date(cliente.fecha_wizard_completado).toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'
                    }
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{cliente.nombre}</TableCell>
                  <TableCell>{cliente.telefono || '-'}</TableCell>
                  <TableCell>{cliente.dni || '-'}</TableCell>
                  <TableCell>
                    {cliente.estatus_comercial_categoria ? (
                      <Chip 
                        label={cliente.estatus_comercial_categoria} 
                        color="primary"
                        size="small"
                      />
                    ) : (
                      <span style={{ color: '#9ca3af' }}>No especificado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {cliente.estatus_comercial_subcategoria ? (
                      <Chip 
                        label={cliente.estatus_comercial_subcategoria} 
                        color="secondary"
                        size="small"
                      />
                    ) : (
                      <span style={{ color: '#9ca3af' }}>No especificado</span>
                    )}
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
