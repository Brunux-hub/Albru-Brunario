import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';

interface Cliente {
  id: string;
  nombre: string;
  tipoCliente: string;
  asesorActual: string;
  montoCartera: number;
  estado: string;
  fechaIngreso: string;
  fechaUltimaValidacion: string;
  comentario: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  tipoInstalacion: string;
  planSeleccionado: string;
  precioFinal: number;
  metodoPago: string;
  observacionesAsesor: string;
  documentosRequeridos: string[];
  fechaCita: string;
  horaCita: string;
}

const ValidacionesTable: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar clientes reales desde la API
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/clientes');
        const data = await response.json();
        
        if (data.success && data.clientes) {
          // Mapear datos de BD a formato del componente
          const clientesFormateados = data.clientes.map((cliente: any) => ({
            id: cliente.id.toString(),
            nombre: cliente.nombre || 'Sin nombre',
            tipoCliente: 'Regular', // Campo para determinar después
            asesorActual: cliente.asesor_nombre || 'Sin asignar',
            montoCartera: cliente.precio_final || 0,
            estado: cliente.estado_cliente || 'nuevo',
            fechaIngreso: cliente.created_at || new Date().toISOString(),
            fechaUltimaValidacion: cliente.updated_at ? new Date(cliente.updated_at).toLocaleDateString() : 'Sin validar',
            comentario: cliente.observaciones_asesor || 'Sin comentarios',
            telefono: cliente.telefono || 'Sin teléfono',
            email: cliente.correo_electronico || 'Sin email',
            direccion: cliente.direccion || 'Sin dirección',
            ciudad: cliente.distrito || 'Sin ciudad',
            codigoPostal: '00000',
            tipoInstalacion: 'Residencial',
            planSeleccionado: cliente.plan_seleccionado || 'Sin plan',
            precioFinal: cliente.precio_final || 0,
            metodoPago: 'Por definir',
            observacionesAsesor: cliente.observaciones_asesor || '',
            documentosRequeridos: ['INE', 'Comprobante de domicilio'],
            fechaCita: cliente.fecha_cita ? new Date(cliente.fecha_cita).toISOString().split('T')[0] : '',
            horaCita: cliente.fecha_cita ? new Date(cliente.fecha_cita).toLocaleTimeString() : ''
          }));
          
          setClientes(clientesFormateados);
        } else {
          setError('No se pudieron cargar los clientes');
        }
      } catch (error) {
        console.error('Error cargando clientes:', error);
        setError('Error de conexión al cargar clientes');
        setClientes([]); // Array vacío si hay error
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'nuevo': return 'info';
      case 'contactado': return 'primary';
      case 'interesado': return 'warning';
      case 'cotizado': return 'secondary';
      case 'vendido': return 'success';
      case 'perdido': return 'error';
      case 'seguimiento': return 'default';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando clientes...
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

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Clientes para Validación ({clientes.length})
      </Typography>

      {clientes.length === 0 ? (
        <Alert severity="info">
          No hay clientes registrados para validación.
        </Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Asesor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Monto</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contacto</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fecha Ingreso</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {cliente.id}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {cliente.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cliente.ciudad}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {cliente.asesorActual}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={cliente.estado.toUpperCase()} 
                      color={getStatusColor(cliente.estado) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {cliente.planSeleccionado}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(cliente.precioFinal)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {cliente.telefono !== 'Sin teléfono' && (
                        <Tooltip title={cliente.telefono}>
                          <IconButton size="small" color="primary">
                            <PhoneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {cliente.email !== 'Sin email' && (
                        <Tooltip title={cliente.email}>
                          <IconButton size="small" color="secondary">
                            <EmailIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(cliente.fechaIngreso).toLocaleDateString('es-ES')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" sx={{ color: '#3498db' }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" sx={{ color: '#f39c12' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" sx={{ color: '#e74c3c' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ValidacionesTable;