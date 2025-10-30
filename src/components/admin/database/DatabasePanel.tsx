import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../../config/backend';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip, 
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';

interface Cliente {
  id: number;
  nombre: string;
  dni: string;
  telefono: string;
  email: string;
  servicio: string;
  plan: string;
  montoMensual: number;
  montoTotal: number;
  estado: string;
  asesor: string;
  vencimiento: string;
}

// Tipo que viene desde la API
interface ClienteApi {
  id: number;
  nombre?: string | null;
  dni?: string | null;
  telefono?: string | null;
  correo_electronico?: string | null;
  plan_seleccionado?: string | null;
  precio_final?: number | null;
  estado_cliente?: string | null;
  asesor_nombre?: string | null;
  fecha_cita?: string | null;
}

const DatabasePanel: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar clientes reales desde la API
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setLoading(true);
        const base = API_BASE || '';
        const response = await fetch(`${base}/api/clientes`);
        const data = await response.json();
        
        if (data.success && data.clientes) {
          // Mapear datos de BD a formato del componente
          const clientesFormateados = data.clientes.map((cliente: ClienteApi) => ({
            id: cliente.id,
            nombre: cliente.nombre || 'Sin nombre',
            dni: cliente.dni || 'Sin DNI',
            telefono: cliente.telefono || 'Sin teléfono',
            email: cliente.correo_electronico || 'Sin email',
            servicio: 'Internet', // Valor por defecto
            plan: cliente.plan_seleccionado || 'Sin plan',
            montoMensual: cliente.precio_final ?? 0,
            montoTotal: (cliente.precio_final ?? 0) * 6, // Estimado 6 meses
            estado: cliente.estado_cliente || 'nuevo',
            asesor: cliente.asesor_nombre || 'Sin asignar',
            vencimiento: cliente.fecha_cita ? new Date(cliente.fecha_cita).toLocaleDateString('es-ES') : 'Sin fecha'
          }));
          
          setClientes(clientesFormateados);
        } else {
          setError('No se pudieron cargar los clientes');
        }
      } catch (error) {
        console.error('Error cargando clientes:', error);
        setError('Error de conexión al cargar clientes');
        setClientes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  type ColorType = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

  const getStatusColor = (estado: string): ColorType => {
    switch (estado.toLowerCase()) {
      case 'nuevo': return 'info';
      case 'activo': return 'success';
      case 'vendido': return 'success';
      case 'cancelado': return 'error';
      case 'perdido': return 'error';
      case 'pendiente': return 'warning';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Filtrar clientes por término de búsqueda
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.dni.includes(searchTerm) ||
    cliente.telefono.includes(searchTerm) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando base de datos...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  // Estadísticas
  const totalClientes = clientes.length;
  const clientesActivos = clientes.filter(c => c.estado.toLowerCase() === 'activo' || c.estado.toLowerCase() === 'vendido').length;
  const ingresosTotales = clientes.reduce((sum, c) => sum + c.montoTotal, 0);
  const ingresosMensuales = clientes.reduce((sum, c) => sum + c.montoMensual, 0);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Base de Datos de Clientes
      </Typography>

      {/* Estadísticas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#3498db', fontWeight: 'bold' }}>
              {totalClientes}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Clientes
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#2ecc71', fontWeight: 'bold' }}>
              {clientesActivos}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clientes Activos
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#f39c12', fontWeight: 'bold' }}>
              {formatCurrency(ingresosMensuales)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresos Mensuales
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#9b59b6', fontWeight: 'bold' }}>
              {formatCurrency(ingresosTotales)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresos Totales
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Buscador */}
      <TextField
        fullWidth
        label="Buscar clientes por nombre, DNI, teléfono o email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        variant="outlined"
      />

      {/* Tabla de clientes */}
      {clientesFiltrados.length === 0 ? (
        <Alert severity="info">
          {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados en la base de datos.'}
        </Alert>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>DNI</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contacto</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Monto Mensual</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Asesor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {cliente.id}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {cliente.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cliente.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{cliente.dni}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {cliente.telefono}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {cliente.plan}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#2ecc71' }}>
                        {formatCurrency(cliente.montoMensual)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={cliente.estado.toUpperCase()} 
                        color={getStatusColor(cliente.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {cliente.asesor}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {cliente.vencimiento}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        Mostrando {clientesFiltrados.length} de {totalClientes} clientes
      </Typography>
    </Box>
  );
};

export default DatabasePanel;