import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../../config/backend';
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

// Tipo de cliente que viene desde la API
interface ClienteApi {
  id: number | string;
  nombre?: string | null;
  asesor_nombre?: string | null;
  precio_final?: number | null;
  estado_cliente?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  observaciones_asesor?: string | null;
  telefono?: string | null;
  correo_electronico?: string | null;
  direccion?: string | null;
  distrito?: string | null;
  plan_seleccionado?: string | null;
  fecha_cita?: string | null;
}

const ValidacionesTable: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

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
            id: String(cliente.id),
            nombre: cliente.nombre || 'Sin nombre',
            tipoCliente: 'Regular', // Campo para determinar después
            asesorActual: cliente.asesor_nombre || 'Sin asignar',
            montoCartera: cliente.precio_final ?? 0,
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
            precioFinal: cliente.precio_final ?? 0,
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

  // Mapeo de colores más descriptivo (usar hex para consistencia)
  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'nuevo': return { bg: '#bfdbfe', color: '#0369a1' }; // azul claro
      case 'contactado': return { bg: '#d1fae5', color: '#065f46' }; // verde claro
      case 'interesado': return { bg: '#fff7ed', color: '#92400e' }; // naranja claro
      case 'cotizado': return { bg: '#eef2ff', color: '#3730a3' }; // morado claro
      case 'vendido': return { bg: '#dcfce7', color: '#166534' }; // verde
      case 'perdido': return { bg: '#fee2e2', color: '#991b1b' }; // rojo claro
      case 'seguimiento': return { bg: '#f8fafc', color: '#374151' }; // gris claro
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const filteredClientes = useMemo(() => {
    if (!query) return clientes;
    const q = query.toLowerCase();
    return clientes.filter(c => (
      c.nombre.toLowerCase().includes(q) ||
      c.asesorActual.toLowerCase().includes(q) ||
      c.planSeleccionado.toLowerCase().includes(q)
    ));
  }, [clientes, query]);

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Clientes para Validación ({clientes.length})
        </Typography>
        <Box>
          <input
            aria-label="buscar clientes"
            placeholder="Buscar por nombre, asesor o plan..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', minWidth: 220 }}
          />
        </Box>
      </Box>

      {filteredClientes.length === 0 ? (
        <Alert severity="info">
          No hay clientes registrados para validación.
        </Alert>
      ) : (
        <TableContainer component={Box} sx={{ boxShadow: 1, bgcolor: 'white', borderRadius: 1 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', top: 0, zIndex: 2 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', top: 0, zIndex: 2 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', top: 0, zIndex: 2 }}>Asesor</TableCell>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', top: 0, zIndex: 2 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', top: 0, zIndex: 2 }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', top: 0, zIndex: 2 }}>Monto</TableCell>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', top: 0, zIndex: 2 }}>Contacto</TableCell>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', top: 0, zIndex: 2 }}>Fecha Ingreso</TableCell>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', top: 0, zIndex: 2 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow key={cliente.id} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#fcfcfd' } }}>
                  <TableCell sx={{ fontWeight: 600, width: 80 }}>
                    {cliente.id}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Box>
                      <Tooltip title={cliente.nombre}>
                        <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>
                          {cliente.nombre}
                        </Typography>
                      </Tooltip>
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
                    {(() => {
                      const c = getStatusColor(cliente.estado);
                      return <Chip label={cliente.estado.toUpperCase()} size="small" sx={{ backgroundColor: c.bg, color: c.color, fontWeight: 700 }} />;
                    })()}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={cliente.planSeleccionado}>
                      <Typography variant="body2" sx={{ maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cliente.planSeleccionado}
                      </Typography>
                    </Tooltip>
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