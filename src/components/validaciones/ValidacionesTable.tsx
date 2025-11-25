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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import Paper from '@mui/material/Paper';

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
  estatusCategoria?: string;
  estatusSubcategoria?: string;
  // Datos completos del wizard
  wizardData?: {
    // Paso 1
    tipoCliente?: string;
    leadScore?: string;
    coordenadas?: string;
    nombresApellidos?: string;
    tipoDocumento?: string;
    numeroDocumento?: string;
    // Paso 2
    fechaNacimiento?: string;
    lugarNacimiento?: string;
    telefonoRegistro?: string;
    dniNombreTitular?: string;
    parentescoTitular?: string;
    telefonoReferencia?: string;
    telefonoGrabacion?: string;
    correoAfiliado?: string;
    departamento?: string;
    distrito?: string;
    direccion?: string;
    direccionCompleta?: string;
    piso?: string;
    numeroPiso?: string;
    // Paso 3
    tipoPlan?: string;
    servicioContratado?: string | string[];
    velocidadContratada?: string;
    precioPlan?: number | string;
    // Paso 4
    dispositivosAdicionales?: string | string[];
    plataformaDigital?: string | string[];
    pagoAdelantoInstalacion?: string;
    fechaWizardCompletado?: string;
  };
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
  fecha_asignacion_validador?: string | null;
  estatus_comercial_categoria?: string | null;
  estatus_comercial_subcategoria?: string | null;
  // Campos del wizard - Paso 1
  tipo_cliente_wizard?: string | null;
  lead_score?: string | null;
  coordenadas?: string | null;
  tipo_documento?: string | null;
  dni?: string | null;
  // Campos del wizard - Paso 2
  fecha_nacimiento?: string | null;
  lugar_nacimiento?: string | null;
  telefono_registro?: string | null;
  dni_nombre_titular?: string | null;
  parentesco_titular?: string | null;
  telefono_referencia_wizard?: string | null;
  telefono_grabacion_wizard?: string | null;
  departamento?: string | null;
  direccion_completa?: string | null;
  numero_piso_wizard?: string | null;
  // Campos del wizard - Paso 3
  tipo_plan?: string | null;
  servicio_contratado?: string | null;
  velocidad_contratada?: string | null;
  precio_plan?: number | null;
  // Campos del wizard - Paso 4
  dispositivos_adicionales_wizard?: string | null;
  plataforma_digital_wizard?: string | null;
  pago_adelanto_instalacion_wizard?: string | null;
  wizard_completado?: number | null;
  fecha_wizard_completado?: string | null;
  wizard_data_json?: string | null;
}

const ValidacionesTable: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; cliente: Cliente | null; action: 'aprobar' | 'rechazar' | null }>({
    open: false,
    cliente: null,
    action: null
  });
  const [comentarios, setComentarios] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleViewDetails = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCliente(null);
  };

  const handleOpenActionDialog = (cliente: Cliente, action: 'aprobar' | 'rechazar') => {
    setActionDialog({ open: true, cliente, action });
    setComentarios('');
  };

  const handleCloseActionDialog = () => {
    setActionDialog({ open: false, cliente: null, action: null });
    setComentarios('');
  };

  const handleConfirmAction = async () => {
    if (!actionDialog.cliente || !actionDialog.action) return;

    const nuevoEstado = actionDialog.action === 'aprobar' ? 'VENTAS' : 'RECHAZADO';

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/validadores/cliente/${actionDialog.cliente.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nuevoEstado,
            comentarios
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        // Recargar clientes
        const base = API_BASE || 'http://localhost:3001';
        const clientesResponse = await fetch(`${base}/api/validadores/mis-clientes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const clientesData = await clientesResponse.json();
        
        if (clientesData.success && clientesData.clientes) {
          const clientesFormateados = clientesData.clientes.map((cliente: ClienteApi) => ({
            id: String(cliente.id),
            nombre: cliente.nombre || 'Sin nombre',
            tipoCliente: 'Preventa Completa',
            asesorActual: cliente.asesor_nombre || 'Sin asignar',
            montoCartera: cliente.precio_plan ? Number(cliente.precio_plan) : 0,
            estado: 'PREVENTA COMPLETA',
            fechaIngreso: cliente.created_at || new Date().toISOString(),
            fechaUltimaValidacion: cliente.fecha_asignacion_validador 
              ? new Date(cliente.fecha_asignacion_validador).toLocaleDateString() 
              : 'Sin validar',
            comentario: 'Pendiente de validación',
            telefono: cliente.telefono || 'Sin teléfono',
            email: cliente.correo_electronico || 'Sin email',
            direccion: cliente.direccion || 'Sin dirección',
            ciudad: cliente.distrito || 'Sin ciudad',
            codigoPostal: '00000',
            tipoInstalacion: 'Residencial',
            planSeleccionado: cliente.tipo_plan || 'Sin plan',
            precioFinal: cliente.precio_plan ? Number(cliente.precio_plan) : 0,
            metodoPago: 'Por definir',
            observacionesAsesor: '',
            documentosRequeridos: ['INE', 'Comprobante de domicilio'],
            fechaCita: '',
            horaCita: '',
            estatusCategoria: cliente.estatus_comercial_categoria || 'PREVENTA',
            estatusSubcategoria: cliente.estatus_comercial_subcategoria || 'PREVENTA COMPLETA',
            wizardData: {} // Simplificado por ahora
          }));
          
          setClientes(clientesFormateados);
        }
        
        handleCloseActionDialog();
      } else {
        setError('Error al actualizar el cliente');
      }
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      setError('Error de conexión al actualizar cliente');
    } finally {
      setActionLoading(false);
    }
  };

  // Cargar clientes reales desde la API
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setLoading(true);
        const base = API_BASE || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        
        // Usar endpoint de validadores autenticado
        const url = `${base}/api/validadores/mis-clientes`;
        console.log('🔍 Validaciones: Fetching from:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        
        console.log('📊 Validaciones: Response:', {
          success: data.success,
          total: data.total,
          clientes: data.clientes?.length || 0
        });
        
        if (data.success && data.clientes) {
          // DEBUG: Ver datos raw del primer cliente
          if (data.clientes.length > 0) {
            console.log('🔍 DEBUG - Primer cliente desde validadores:', data.clientes[0]);
          }
          
          // Mapear datos de BD a formato del componente
          const clientesFormateados = data.clientes.map((cliente: ClienteApi) => ({
            id: String(cliente.id),
            nombre: cliente.nombre || 'Sin nombre',
            tipoCliente: 'Preventa Completa',
            asesorActual: cliente.asesor_nombre || 'Sin asignar',
            montoCartera: cliente.precio_plan ? Number(cliente.precio_plan) : 0,
            estado: 'PREVENTA COMPLETA',
            fechaIngreso: cliente.created_at || new Date().toISOString(),
            fechaUltimaValidacion: cliente.fecha_asignacion_validador 
              ? new Date(cliente.fecha_asignacion_validador).toLocaleDateString() 
              : 'Sin validar',
            comentario: 'Pendiente de validación',
            telefono: cliente.telefono || 'Sin teléfono',
            email: cliente.correo_electronico || 'Sin email',
            direccion: cliente.direccion || 'Sin dirección',
            ciudad: cliente.distrito || 'Sin ciudad',
            codigoPostal: '00000',
            tipoInstalacion: 'Residencial',
            planSeleccionado: cliente.tipo_plan || 'Sin plan',
            precioFinal: cliente.precio_plan ? Number(cliente.precio_plan) : 0,
            metodoPago: 'Por definir',
            observacionesAsesor: '',
            documentosRequeridos: ['INE', 'Comprobante de domicilio'],
            fechaCita: '',
            horaCita: '',
            estatusCategoria: cliente.estatus_comercial_categoria || 'PREVENTA',
            estatusSubcategoria: cliente.estatus_comercial_subcategoria || 'PREVENTA COMPLETA',
            // Datos completos del wizard
            wizardData: {
              // Paso 1: Información del Cliente
              tipoCliente: cliente.tipo_cliente_wizard || '',
              leadScore: cliente.lead_score || '',
              coordenadas: cliente.coordenadas || '',
              nombresApellidos: cliente.nombre || '',  // El nombre completo está en 'nombre'
              tipoDocumento: cliente.tipo_documento || '',
              numeroDocumento: cliente.dni || '',  // DNI está en 'dni'
              // Paso 2: Datos Personales y Referencias
              fechaNacimiento: cliente.fecha_nacimiento || '',
              lugarNacimiento: cliente.lugar_nacimiento || '',
              telefonoRegistro: cliente.telefono_registro || '',
              dniNombreTitular: cliente.dni_nombre_titular || '',
              parentescoTitular: cliente.parentesco_titular || '',
              telefonoReferencia: cliente.telefono_referencia_wizard || '',
              telefonoGrabacion: cliente.telefono_grabacion_wizard || '',
              correoAfiliado: cliente.correo_electronico || '',
              departamento: cliente.departamento || '',
              distrito: cliente.distrito || '',
              direccion: cliente.direccion || '',
              direccionCompleta: cliente.direccion_completa || '',
              piso: cliente.numero_piso_wizard || '',
              numeroPiso: cliente.numero_piso_wizard || '',
              // Paso 3: Plan y Servicios
              tipoPlan: cliente.tipo_plan || '',
              servicioContratado: cliente.servicio_contratado || '',
              velocidadContratada: cliente.velocidad_contratada || '',
              precioPlan: cliente.precio_plan ?? 0,
              // Paso 4: Adicionales
              dispositivosAdicionales: cliente.dispositivos_adicionales_wizard || '',
              plataformaDigital: cliente.plataforma_digital_wizard || '',
              pagoAdelantoInstalacion: cliente.pago_adelanto_instalacion_wizard || '',
              fechaWizardCompletado: cliente.fecha_wizard_completado || ''
            }
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

  // WebSocket: Escuchar eventos de cambios en clientes para actualizar en tiempo real
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    const handleClientUpdate = () => {
      console.log('🔔 [VALIDACIONES] Cliente actualizado, recargando lista...');
      fetchClientes();
    };

    // Escuchar eventos relevantes para validaciones
    socket.on('CLIENT_COMPLETED', handleClientUpdate);
    socket.on('CLIENT_UPDATED', handleClientUpdate);
    socket.on('CLIENT_STATUS_UPDATED', handleClientUpdate);
    socket.on('CLIENT_REASSIGNED', handleClientUpdate);

    return () => {
      socket.off('CLIENT_COMPLETED', handleClientUpdate);
      socket.off('CLIENT_UPDATED', handleClientUpdate);
      socket.off('CLIENT_STATUS_UPDATED', handleClientUpdate);
      socket.off('CLIENT_REASSIGNED', handleClientUpdate);
    };
  }, [fetchClientes]);

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
                <TableCell sx={{ fontWeight: 700, position: 'sticky', top: 0, zIndex: 2 }}>Estatus Comercial</TableCell>
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
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a' }}>
                        {cliente.estatusCategoria || 'Sin categoría'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {cliente.estatusSubcategoria || 'Sin subcategoría'}
                      </Typography>
                    </Box>
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
                        <IconButton 
                          size="small" 
                          sx={{ color: '#3498db' }}
                          onClick={() => handleViewDetails(cliente)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Aprobar">
                        <IconButton 
                          size="small" 
                          sx={{ color: '#10b981' }}
                          onClick={() => handleOpenActionDialog(cliente, 'aprobar')}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rechazar">
                        <IconButton 
                          size="small" 
                          sx={{ color: '#ef4444' }}
                          onClick={() => handleOpenActionDialog(cliente, 'rechazar')}
                        >
                          <CancelIcon fontSize="small" />
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

      {/* Dialog para ver detalles del wizard */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#1e293b',
          color: 'white', 
          fontWeight: 600,
          py: 3,
          px: 4,
          borderBottom: '3px solid #3b82f6'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                bgcolor: '#3b82f6', 
                borderRadius: 1.5, 
                p: 1.5, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59,130,246,0.4)'
              }}>
                <VisibilityIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', letterSpacing: '-0.5px' }}>
                  Información del Cliente
                </Typography>
                <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5, fontWeight: 400 }}>
                  Registro completo del proceso de gestión comercial
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={handleCloseDialog}
              sx={{ 
                color: 'rgba(255,255,255,0.8)',
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white'
                }
              }}
            >
              <CancelIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 3, px: 4 }}>
          {selectedCliente && (
            <Box>
              {/* Información básica */}
              <Paper elevation={0} sx={{ bgcolor: '#f8f9fa', p: 3, borderRadius: 2, mb: 3, border: '1px solid #e9ecef' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, color: '#495057', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ fontSize: '1.3rem' }}>�</Box> Información Básica
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8 }}>
                      Nombre Completo
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', mt: 0.8, fontSize: '0.95rem' }}>
                      {selectedCliente.nombre}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8 }}>
                      Teléfono
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', mt: 0.8, fontSize: '0.95rem' }}>
                      {selectedCliente.telefono}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8 }}>
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', mt: 0.8, fontSize: '0.95rem', wordBreak: 'break-word' }}>
                      {selectedCliente.email || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8 }}>
                      Asesor Asignado
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0891b2', mt: 0.8, fontSize: '0.95rem' }}>
                      {selectedCliente.asesorActual}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8 }}>
                      Fecha de Ingreso
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', mt: 0.8, fontSize: '0.95rem' }}>
                      {new Date(selectedCliente.fechaIngreso).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8 }}>
                      Estado
                    </Typography>
                    <Box sx={{ mt: 0.8 }}>
                      <Chip 
                        label={selectedCliente.estado}
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          bgcolor: selectedCliente.estado === 'gestionado' ? '#d1fae5' : '#fef3c7',
                          color: selectedCliente.estado === 'gestionado' ? '#059669' : '#d97706'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Paper>

              <Divider sx={{ my: 2.5, borderColor: '#e2e8f0' }} />

              {/* Datos del wizard - Paso 1 */}
              <Paper elevation={0} sx={{ bgcolor: 'white', p: 3, borderRadius: 1.5, mb: 2.5, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, pb: 2, borderBottom: '2px solid #f1f5f9' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.1rem' }}>
                    <Box sx={{ 
                      bgcolor: '#eff6ff', 
                      borderRadius: 1, 
                      p: 0.8, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Box component="span" sx={{ fontSize: '1.2rem' }}>🎯</Box>
                    </Box>
                    Paso 1: Información del Cliente
                  </Typography>
                  <Button
                    startIcon={<EditIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderColor: '#3b82f6',
                      color: '#3b82f6',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#2563eb',
                        bgcolor: '#eff6ff'
                      }
                    }}
                  >
                    Editar Sección
                  </Button>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8 }}>
                      Tipo de Cliente
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', mt: 0.8, fontSize: '0.95rem' }}>
                      {selectedCliente.wizardData?.tipoCliente || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8 }}>
                      Lead Score
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#3b82f6', fontSize: '1.1rem' }}>
                        {selectedCliente.wizardData?.leadScore || 'N/A'}
                      </Typography>
                      {selectedCliente.wizardData?.leadScore && (
                        <Chip 
                          label={Number(selectedCliente.wizardData.leadScore) >= 70 ? 'Alto' : Number(selectedCliente.wizardData.leadScore) >= 40 ? 'Medio' : 'Bajo'}
                          size="small"
                          sx={{ 
                            bgcolor: Number(selectedCliente.wizardData.leadScore) >= 70 ? '#d1fae5' : Number(selectedCliente.wizardData.leadScore) >= 40 ? '#fef3c7' : '#fee2e2',
                            color: Number(selectedCliente.wizardData.leadScore) >= 70 ? '#059669' : Number(selectedCliente.wizardData.leadScore) >= 40 ? '#d97706' : '#dc2626',
                            fontWeight: 600,
                            fontSize: '0.65rem'
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8 }}>
                      Coordenadas
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', mt: 0.8, fontSize: '0.95rem' }}>
                      {selectedCliente.wizardData?.coordenadas || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8 }}>
                      Nombres y Apellidos
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', mt: 0.8, fontSize: '0.95rem' }}>
                      {selectedCliente.wizardData?.nombresApellidos || selectedCliente.nombre}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8 }}>
                      Tipo de Documento
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', mt: 0.8, fontSize: '0.95rem' }}>
                      {selectedCliente.wizardData?.tipoDocumento || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8 }}>
                      Número de Documento
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', mt: 0.8, fontSize: '0.95rem' }}>
                      {selectedCliente.wizardData?.numeroDocumento || 'No especificado'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Paso 2: Datos Personales y Referencias */}
              <Paper elevation={0} sx={{ bgcolor: 'white', p: 3, borderRadius: 1.5, mb: 2.5, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, pb: 2, borderBottom: '2px solid #f1f5f9' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.1rem' }}>
                    <Box sx={{ 
                      bgcolor: '#f0fdf4', 
                      borderRadius: 1, 
                      p: 0.8, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Box component="span" sx={{ fontSize: '1.2rem' }}>👥</Box>
                    </Box>
                    Paso 2: Datos Personales y Referencias
                  </Typography>
                  <Button
                    startIcon={<EditIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderColor: '#10b981',
                      color: '#10b981',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#059669',
                        bgcolor: '#f0fdf4'
                      }
                    }}
                  >
                    Editar Sección
                  </Button>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Fecha de Nacimiento
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5 }}>
                      {selectedCliente.wizardData?.fechaNacimiento 
                        ? new Date(selectedCliente.wizardData.fechaNacimiento).toLocaleDateString('es-ES')
                        : 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Lugar de Nacimiento
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5 }}>
                      {selectedCliente.wizardData?.lugarNacimiento || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Teléfono de Registro
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5 }}>
                      {selectedCliente.wizardData?.telefonoRegistro || selectedCliente.telefono}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      DNI/Nombre Titular
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5 }}>
                      {selectedCliente.wizardData?.dniNombreTitular || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Parentesco con Titular
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5 }}>
                      {selectedCliente.wizardData?.parentescoTitular || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Teléfono de Referencia
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5 }}>
                      {selectedCliente.wizardData?.telefonoReferencia || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Teléfono de Grabación
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5 }}>
                      {selectedCliente.wizardData?.telefonoGrabacion || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #bbf7d0', gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Correo del Afiliado
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5, wordBreak: 'break-word' }}>
                      {selectedCliente.wizardData?.correoAfiliado || selectedCliente.email || 'No especificado'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Divider sx={{ my: 2.5, borderColor: '#e2e8f0' }} />

              {/* Paso 2: Dirección */}
              <Paper elevation={0} sx={{ bgcolor: 'white', p: 3, borderRadius: 1.5, mb: 2.5, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, pb: 2, borderBottom: '2px solid #f1f5f9' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.1rem' }}>
                    <Box sx={{ 
                      bgcolor: '#fef3c7', 
                      borderRadius: 1, 
                      p: 0.8, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Box component="span" sx={{ fontSize: '1.2rem' }}>📍</Box>
                    </Box>
                    Dirección de Instalación
                  </Typography>
                  <Button
                    startIcon={<EditIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderColor: '#f59e0b',
                      color: '#f59e0b',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#d97706',
                        bgcolor: '#fffbeb'
                      }
                    }}
                  >
                    Editar Sección
                  </Button>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2.5 }}>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #fde68a', gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Dirección Completa
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5 }}>
                      {selectedCliente.wizardData?.direccion || selectedCliente.wizardData?.direccionCompleta || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #fde68a' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Departamento
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5 }}>
                      {selectedCliente.wizardData?.departamento || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #fde68a' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Distrito
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5 }}>
                      {selectedCliente.wizardData?.distrito || selectedCliente.ciudad || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #fde68a' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Número de Piso
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5 }}>
                      {selectedCliente.wizardData?.piso || selectedCliente.wizardData?.numeroPiso || 'No especificado'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Divider sx={{ my: 2.5, borderColor: '#e2e8f0' }} />

              {/* Paso 3: Plan y Servicios */}
              <Paper elevation={0} sx={{ bgcolor: 'white', p: 3, borderRadius: 1.5, mb: 2.5, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, pb: 2, borderBottom: '2px solid #f1f5f9' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.1rem' }}>
                    <Box sx={{ 
                      bgcolor: '#f5f3ff', 
                      borderRadius: 1, 
                      p: 0.8, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Box component="span" sx={{ fontSize: '1.2rem' }}>💼</Box>
                    </Box>
                    Paso 3: Plan y Servicios Contratados
                  </Typography>
                  <Button
                    startIcon={<EditIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderColor: '#8b5cf6',
                      color: '#8b5cf6',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#7c3aed',
                        bgcolor: '#f5f3ff'
                      }
                    }}
                  >
                    Editar Sección
                  </Button>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5 }}>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #ddd6fe' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Tipo de Plan
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#5b21b6', mt: 0.5 }}>
                      {selectedCliente.wizardData?.tipoPlan || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #ddd6fe' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Velocidad Contratada
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5 }}>
                      {selectedCliente.wizardData?.velocidadContratada || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #ddd6fe', gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Servicios Contratados
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedCliente.wizardData?.servicioContratado ? (
                        Array.isArray(selectedCliente.wizardData.servicioContratado) 
                          ? selectedCliente.wizardData.servicioContratado.map((servicio, idx) => (
                              <Chip 
                                key={idx}
                                label={servicio}
                                size="small"
                                sx={{ 
                                  bgcolor: '#f3f4f6',
                                  color: '#374151',
                                  fontWeight: 600
                                }}
                              />
                            ))
                          : <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529' }}>
                              {selectedCliente.wizardData.servicioContratado}
                            </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No especificado</Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2.5, borderRadius: 1.5, border: '2px solid #ddd6fe', gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                          Precio del Plan
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#059669', mt: 0.5 }}>
                          S/ {selectedCliente.wizardData?.precioPlan ? Number(selectedCliente.wizardData.precioPlan).toFixed(2) : '0.00'}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        bgcolor: '#d1fae5', 
                        borderRadius: '50%', 
                        width: 56, 
                        height: 56, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '1.8rem'
                      }}>
                        💰
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Paper>

              <Divider sx={{ my: 2.5, borderColor: '#e2e8f0' }} />

              {/* Paso 4: Adicionales */}
              <Paper elevation={0} sx={{ bgcolor: 'white', p: 3, borderRadius: 1.5, mb: 2.5, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, pb: 2, borderBottom: '2px solid #f1f5f9' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.1rem' }}>
                    <Box sx={{ 
                      bgcolor: '#fce7f3', 
                      borderRadius: 1, 
                      p: 0.8, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Box component="span" sx={{ fontSize: '1.2rem' }}>➕</Box>
                    </Box>
                    Paso 4: Servicios Adicionales
                  </Typography>
                  <Button
                    startIcon={<EditIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderColor: '#ec4899',
                      color: '#ec4899',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#db2777',
                        bgcolor: '#fce7f3'
                      }
                    }}
                  >
                    Editar Sección
                  </Button>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5 }}>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #fbcfe8', gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Dispositivos Adicionales
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedCliente.wizardData?.dispositivosAdicionales && Array.isArray(selectedCliente.wizardData.dispositivosAdicionales) && selectedCliente.wizardData.dispositivosAdicionales.length > 0 ? (
                        selectedCliente.wizardData.dispositivosAdicionales.map((dispositivo, idx) => (
                          <Chip 
                            key={idx}
                            label={dispositivo}
                            size="small"
                            icon={<Box component="span">📱</Box>}
                            sx={{ 
                              bgcolor: '#fef3c7',
                              color: '#92400e',
                              fontWeight: 600,
                              '& .MuiChip-icon': { fontSize: '1rem' }
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {selectedCliente.wizardData?.dispositivosAdicionales || 'Ninguno'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #fbcfe8', gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Plataforma Digital
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedCliente.wizardData?.plataformaDigital && Array.isArray(selectedCliente.wizardData.plataformaDigital) && selectedCliente.wizardData.plataformaDigital.length > 0 ? (
                        selectedCliente.wizardData.plataformaDigital.map((plataforma, idx) => (
                          <Chip 
                            key={idx}
                            label={plataforma}
                            size="small"
                            icon={<Box component="span">📺</Box>}
                            sx={{ 
                              bgcolor: '#dbeafe',
                              color: '#1e40af',
                              fontWeight: 600,
                              '& .MuiChip-icon': { fontSize: '1rem' }
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {selectedCliente.wizardData?.plataformaDigital || 'No especificado'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #fbcfe8' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Pago Adelanto Instalación
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={selectedCliente.wizardData?.pagoAdelantoInstalacion || 'No especificado'}
                        color={selectedCliente.wizardData?.pagoAdelantoInstalacion === 'SI' ? 'success' : 'default'}
                        icon={selectedCliente.wizardData?.pagoAdelantoInstalacion === 'SI' ? <CheckCircleIcon /> : <CancelIcon />}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1.5, border: '1px solid #fbcfe8' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                      Fecha Completado Wizard
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#212529', mt: 0.5 }}>
                      {selectedCliente.wizardData?.fechaWizardCompletado 
                        ? new Date(selectedCliente.wizardData.fechaWizardCompletado).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'No disponible'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Divider sx={{ my: 2.5, borderColor: '#e2e8f0' }} />

              {/* Estatus Comercial */}
              <Paper elevation={0} sx={{ bgcolor: 'white', p: 3, borderRadius: 1.5, mb: 2.5, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, pb: 2, borderBottom: '2px solid #f1f5f9' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.1rem' }}>
                    <Box sx={{ 
                      bgcolor: '#d1fae5', 
                      borderRadius: 1, 
                      p: 0.8, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Box component="span" sx={{ fontSize: '1.2rem' }}>📊</Box>
                    </Box>
                    Estatus Comercial
                  </Typography>
                  <Button
                    startIcon={<EditIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderColor: '#10b981',
                      color: '#10b981',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#059669',
                        bgcolor: '#d1fae5'
                      }
                    }}
                  >
                    Editar Sección
                  </Button>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8, mb: 1.5, display: 'block' }}>
                      Categoría
                    </Typography>
                    <Chip 
                      label={selectedCliente.estatusCategoria || 'Sin categoría'}
                      sx={{ 
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        bgcolor: '#10b981',
                        color: 'white',
                        px: 2,
                        py: 2.5,
                        height: 'auto',
                        borderRadius: 1
                      }}
                    />
                  </Box>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.8, display: 'block', mb: 1 }}>
                      Subcategoría
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.5, fontSize: '1.05rem' }}>
                      {selectedCliente.estatusSubcategoria || 'Sin subcategoría'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Observaciones del Asesor */}
              {selectedCliente.observacionesAsesor && (
                <Paper elevation={0} sx={{ bgcolor: 'white', p: 3, borderRadius: 1.5, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, pb: 2, borderBottom: '2px solid #f1f5f9' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.1rem' }}>
                      <Box sx={{ 
                        bgcolor: '#fef3c7', 
                        borderRadius: 1, 
                        p: 0.8, 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Box component="span" sx={{ fontSize: '1.2rem' }}>📝</Box>
                      </Box>
                      Observaciones del Asesor
                    </Typography>
                    <Button
                      startIcon={<EditIcon />}
                      variant="outlined"
                      size="small"
                      sx={{ 
                        borderColor: '#f59e0b',
                        color: '#f59e0b',
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#d97706',
                          bgcolor: '#fffbeb'
                        }
                      }}
                    >
                      Editar Sección
                    </Button>
                  </Box>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                      {selectedCliente.observacionesAsesor}
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '2px solid #e2e8f0', gap: 2, justifyContent: 'space-between' }}>
          <Button
            startIcon={<EditIcon />}
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#3b82f6',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderRadius: 1.5,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
              '&:hover': {
                bgcolor: '#2563eb',
                boxShadow: '0 6px 16px rgba(59,130,246,0.4)'
              }
            }}
          >
            Editar Información
          </Button>
          <Button 
            onClick={handleCloseDialog} 
            variant="outlined"
            size="large"
            sx={{ 
              borderColor: '#64748b',
              color: '#64748b',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderRadius: 1.5,
              textTransform: 'none',
              fontSize: '0.95rem',
              '&:hover': {
                borderColor: '#475569',
                bgcolor: '#f1f5f9'
              }
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación de acción */}
      <Dialog
        open={actionDialog.open}
        onClose={handleCloseActionDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: actionDialog.action === 'aprobar' ? '#10b981' : '#ef4444',
          color: 'white',
          fontWeight: 600
        }}>
          {actionDialog.action === 'aprobar' ? '✅ Aprobar Cliente' : '❌ Rechazar Cliente'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {actionDialog.cliente && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Cliente:</strong> {actionDialog.cliente.nombre}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Plan:</strong> {actionDialog.cliente.planSeleccionado}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Monto:</strong> {formatCurrency(actionDialog.cliente.precioFinal)}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Comentarios (opcional):
            </Typography>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Agrega comentarios sobre la validación..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseActionDialog} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            disabled={actionLoading}
            sx={{
              bgcolor: actionDialog.action === 'aprobar' ? '#10b981' : '#ef4444',
              '&:hover': {
                bgcolor: actionDialog.action === 'aprobar' ? '#059669' : '#dc2626'
              }
            }}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ValidacionesTable;
