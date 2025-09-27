import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentIcon from '@mui/icons-material/Payment';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

interface Cliente {
  id: string;
  nombre: string;
  tipoCliente: string;
  asesorActual: string;
  montoCartera: number;
  estado: 'sin_validar' | 'pendiente' | 'validado' | 'rechazado';
  fechaIngreso: string;
  fechaUltimaValidacion: string;
  comentario: string;
  // Datos adicionales del asesor
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

// Componente para campo editable
const EditableField: React.FC<{
  label: string;
  value: string | number;
  isEditing: boolean;
  onChange: (value: string | number) => void;
  type?: 'text' | 'email' | 'tel' | 'number';
  multiline?: boolean;
  select?: boolean;
  options?: string[];
}> = ({ label, value, isEditing, onChange, type = 'text', multiline = false, select = false, options = [] }) => {
  if (!isEditing) {
    return (
      <ListItemText 
        primary={label}
        secondary={value}
        primaryTypographyProps={{ fontWeight: 500, color: '#374151' }}
        secondaryTypographyProps={{ color: '#6b7280', fontSize: 16 }}
      />
    );
  }

  if (select) {
    return (
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          label={label}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <SelectMenuItem key={option} value={option}>
              {option}
            </SelectMenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      type={type}
      multiline={multiline}
      rows={multiline ? 3 : 1}
      sx={{ mb: 2 }}
    />
  );
};

const ValidacionesTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedCliente, setEditedCliente] = useState<Cliente | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: '12345678',
      nombre: 'Juan Pérez',
      tipoCliente: 'Premium',
      asesorActual: 'Ana García',
      montoCartera: 250000,
      estado: 'pendiente',
      fechaIngreso: '2025-09-14T10:00',
      fechaUltimaValidacion: '9/8/2025',
      comentario: 'Cliente muy interesado, solicita información de planes pre...',
      telefono: '+52 55 1234 5678',
      email: 'juan.perez@email.com',
      direccion: 'Av. Insurgentes 1234, Col. Roma Norte',
      ciudad: 'Ciudad de México',
      codigoPostal: '06700',
      tipoInstalacion: 'Residencial',
      planSeleccionado: 'Plan Premium 500MB',
      precioFinal: 899,
      metodoPago: 'Tarjeta de Crédito',
      observacionesAsesor: 'Cliente muy entusiasta, requiere instalación urgente por trabajo remoto',
      documentosRequeridos: ['INE', 'Comprobante de domicilio', 'RFC'],
      fechaCita: '2025-09-20',
      horaCita: '10:00 AM'
    },
    {
      id: '87654321',
      nombre: 'María García',
      tipoCliente: 'VIP',
      asesorActual: 'Luis López',
      montoCartera: 450000,
      estado: 'validado',
      fechaIngreso: '09/09/2025',
      fechaUltimaValidacion: '9/7/2025',
      comentario: 'Venta exitosa, instalación programada para el 15/09',
      telefono: '+52 55 9876 5432',
      email: 'maria.garcia@empresa.com',
      direccion: 'Paseo de la Reforma 456, Col. Juárez',
      ciudad: 'Ciudad de México',
      codigoPostal: '06600',
      tipoInstalacion: 'Empresarial',
      planSeleccionado: 'Plan Empresarial 1GB',
      precioFinal: 1599,
      metodoPago: 'Transferencia Bancaria',
      observacionesAsesor: 'Empresa consolidada, excelente historial crediticio, instalación para 50 empleados',
      documentosRequeridos: ['Acta constitutiva', 'RFC empresa', 'Poder notarial'],
      fechaCita: '2025-09-15',
      horaCita: '9:00 AM'
    },
    {
      id: '45612378',
      nombre: 'Carlos López',
      tipoCliente: 'Standard',
      asesorActual: 'Carmen Torres',
      montoCartera: 125000,
      estado: 'sin_validar',
      fechaIngreso: '2025-09-13T14:00',
      fechaUltimaValidacion: '9/9/2025',
      comentario: 'Lead nuevo - pendiente primera llamada',
      telefono: '+52 55 5555 1111',
      email: 'carlos.lopez@gmail.com',
      direccion: 'Calle Morelos 789, Col. Centro',
      ciudad: 'Guadalajara',
      codigoPostal: '44100',
      tipoInstalacion: 'Residencial',
      planSeleccionado: 'Plan Básico 200MB',
      precioFinal: 599,
      metodoPago: 'Efectivo',
      observacionesAsesor: 'Lead generado por campaña digital, mostró interés inicial',
      documentosRequeridos: ['INE', 'Comprobante de domicilio'],
      fechaCita: 'Pendiente',
      horaCita: 'Pendiente'
    },
    {
      id: '78945612',
      nombre: 'Ana Rodríguez',
      tipoCliente: 'Premium',
      asesorActual: 'Roberto Silva',
      montoCartera: 180000,
      estado: 'pendiente',
      fechaIngreso: '2025-09-15T16:00',
      fechaUltimaValidacion: '9/6/2025',
      comentario: 'Cliente requiere más información sobre planes combo',
      telefono: '+52 55 7777 8888',
      email: 'ana.rodriguez@hotmail.com',
      direccion: 'Av. Universidad 321, Col. Copilco',
      ciudad: 'Ciudad de México',
      codigoPostal: '04360',
      tipoInstalacion: 'Residencial + TV',
      planSeleccionado: 'Plan Combo TV+Internet',
      precioFinal: 1299,
      metodoPago: 'Débito Automático',
      observacionesAsesor: 'Interesada en paquete completo, evalúa opciones de competencia',
      documentosRequeridos: ['INE', 'Comprobante de domicilio', 'Estado de cuenta bancario'],
      fechaCita: '2025-09-22',
      horaCita: '4:00 PM'
    },
    {
      id: '32165498',
      nombre: 'Luis Martínez',
      tipoCliente: 'VIP',
      asesorActual: 'Patricia Morales',
      montoCartera: 320000,
      estado: 'validado',
      fechaIngreso: '07/09/2025',
      fechaUltimaValidacion: '9/5/2025',
      comentario: 'Cliente no muestra interés después de 3 intentos de cont...',
      telefono: '+52 55 3333 4444',
      email: 'luis.martinez@corporativo.mx',
      direccion: 'Torre Corporativa, Piso 15, Santa Fe',
      ciudad: 'Ciudad de México',
      codigoPostal: '05109',
      tipoInstalacion: 'Corporativo',
      planSeleccionado: 'Plan Corporativo 2GB',
      precioFinal: 2999,
      metodoPago: 'Contrato Anual',
      observacionesAsesor: 'Contrato corporativo renovado, cliente satisfecho con el servicio',
      documentosRequeridos: ['Contrato anterior', 'Orden de compra', 'Autorización gerencial'],
      fechaCita: '2025-09-10',
      horaCita: '11:00 AM'
    },
    {
      id: '65432187',
      nombre: 'Carmen Vega',
      tipoCliente: 'Premium',
      asesorActual: 'Ana García',
      montoCartera: 295000,
      estado: 'validado',
      fechaIngreso: '07/09/2025',
      fechaUltimaValidacion: '9/5/2025',
      comentario: 'Venta exitosa de plan premium, cliente muy satisfecho',
      telefono: '+52 55 6666 7777',
      email: 'carmen.vega@yahoo.com',
      direccion: 'Residencial Las Palmas, Casa 45',
      ciudad: 'Naucalpan',
      codigoPostal: '53950',
      tipoInstalacion: 'Residencial Premium',
      planSeleccionado: 'Plan Premium Plus 800MB',
      precioFinal: 1199,
      metodoPago: 'Tarjeta de Crédito',
      observacionesAsesor: 'Cliente referido, instalación exitosa, muy satisfecho con la velocidad',
      documentosRequeridos: ['INE', 'Comprobante de domicilio', 'Referencia comercial'],
      fechaCita: '2025-09-08',
      horaCita: '2:00 PM'
    },
    {
      id: '98765432',
      nombre: 'Roberto Silva',
      tipoCliente: 'Standard',
      asesorActual: 'Luis López',
      montoCartera: 85000,
      estado: 'sin_validar',
      fechaIngreso: '2025-09-14T09:00',
      fechaUltimaValidacion: '9/7/2025',
      comentario: 'Lead de alta calidad - prioritario',
      telefono: '+52 55 2222 3333',
      email: 'roberto.silva@outlook.com',
      direccion: 'Fraccionamiento Los Pinos, Lote 12',
      ciudad: 'Tlalnepantla',
      codigoPostal: '54030',
      tipoInstalacion: 'Residencial',
      planSeleccionado: 'Plan Estándar 300MB',
      precioFinal: 699,
      metodoPago: 'Efectivo',
      observacionesAsesor: 'Lead calificado por marketing, alta probabilidad de cierre',
      documentosRequeridos: ['INE', 'Comprobante de domicilio'],
      fechaCita: 'Por confirmar',
      horaCita: 'Por confirmar'
    },
    {
      id: '15975348',
      nombre: 'Patricia Morales',
      tipoCliente: 'Premium',
      asesorActual: 'Carmen Torres',
      montoCartera: 210000,
      estado: 'pendiente',
      fechaIngreso: '2025-09-16T11:00',
      fechaUltimaValidacion: '9/4/2025',
      comentario: 'Cliente interesado, solicita cotización detallada',
      telefono: '+52 55 4444 5555',
      email: 'patricia.morales@gmail.com',
      direccion: 'Condominio Vertical, Torre B, Depto 804',
      ciudad: 'Ciudad de México',
      codigoPostal: '03100',
      tipoInstalacion: 'Departamento',
      planSeleccionado: 'Plan Premium 600MB',
      precioFinal: 999,
      metodoPago: 'Domiciliación Bancaria',
      observacionesAsesor: 'Cliente evalúa cambio de proveedor, precio competitivo es clave',
      documentosRequeridos: ['INE', 'Comprobante de domicilio', 'Autorización condominio'],
      fechaCita: '2025-09-25',
      horaCita: '6:00 PM'
    }
  ]);

  const getEstadoChip = (estado: string) => {
    const configs = {
      sin_validar: { 
        color: '#dc2626', 
        bgColor: '#fee2e2', 
        label: 'Sin validar',
        icon: null
      },
      pendiente: { 
        color: '#d97706', 
        bgColor: '#fef3c7', 
        label: 'Pendiente',
        icon: null
      },
      validado: { 
        color: '#059669', 
        bgColor: '#d1fae5', 
        label: 'Validado',
        icon: null
      },
      rechazado: { 
        color: '#dc2626', 
        bgColor: '#fee2e2', 
        label: 'Rechazado',
        icon: null
      }
    };

    const config = configs[estado as keyof typeof configs];
    
    return (
      <Chip
        label={config.label}
        sx={{
          color: config.color,
          backgroundColor: config.bgColor,
          border: `1px solid ${config.color}20`,
          fontWeight: 500,
          fontSize: 12,
          height: 28,
          borderRadius: 1,
          '& .MuiChip-label': {
            px: 2
          }
        }}
      />
    );
  };

  const clientesFiltrados = clientes.filter(cliente => {
    const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filtroEstado === 'todos' || cliente.estado === filtroEstado;
    
    return matchesSearch && matchesFilter;
  });

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleViewDetails = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setEditedCliente(cliente);
    setEditMode(false);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCliente(null);
    setEditedCliente(null);
    setEditMode(false);
  };

  const handleEditMode = () => {
    setEditMode(true);
  };

  const handleSaveChanges = () => {
    if (editedCliente) {
      // Aquí actualizarías el cliente en el estado o base de datos
      console.log('Guardando cambios:', editedCliente);
      setSelectedCliente(editedCliente);
      setEditMode(false);
      // Mostrar mensaje de éxito
      alert('Cambios guardados exitosamente');
    }
  };

  const handleCancelEdit = () => {
    setEditedCliente(selectedCliente);
    setEditMode(false);
  };

  const handleInputChange = (field: keyof Cliente, value: string | number | string[]) => {
    if (editedCliente) {
      setEditedCliente({
        ...editedCliente,
        [field]: value
      });
    }
  };

  return (
    <Box>
      {/* Barra de búsqueda y filtros */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        gap: 2
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937' }}>
          Resultados de Búsqueda (8)
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Buscar por DNI o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#6b7280' }} />
                </InputAdornment>
              ),
            }}
            size="small"
          />
          
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={handleFilterClick}
            sx={{
              color: '#059669',
              borderColor: '#059669',
              '&:hover': {
                borderColor: '#047857',
                backgroundColor: '#f0fdf4'
              }
            }}
          >
            Filtrar
          </Button>
        </Box>
      </Box>

      {/* Tabla */}
      <TableContainer component={Paper} sx={{ 
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f9fafb' }}>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: 13 }}>
                STATUS
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: 13 }}>
                DNI
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: 13 }}>
                NOMBRE
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: 13 }}>
                FECHA DE PROGRAMACIÓN
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: 13 }}>
                FECHA DE INSTALACIÓN
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: 13 }}>
                COMENTARIO
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: 13 }}>
                ACCIONES
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientesFiltrados.map((cliente) => (
              <TableRow 
                key={cliente.id}
                sx={{ 
                  '&:hover': { backgroundColor: '#f9fafb' },
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                <TableCell>
                  {getEstadoChip(cliente.estado)}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1f2937' }}>
                    {cliente.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1f2937' }}>
                    {cliente.nombre}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#374151' }}>
                    {cliente.fechaIngreso}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#374151' }}>
                    {cliente.fechaUltimaValidacion}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 300 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#374151',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cliente.comentario}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver detalles completos">
                      <IconButton 
                        size="small"
                        onClick={() => handleViewDetails(cliente)}
                        sx={{ 
                          color: '#059669',
                          '&:hover': { backgroundColor: '#f0fdf4' }
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Menu de filtros */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={() => { setFiltroEstado('todos'); handleFilterClose(); }}>
          Todos los estados
        </MenuItem>
        <MenuItem onClick={() => { setFiltroEstado('sin_validar'); handleFilterClose(); }}>
          Sin validar
        </MenuItem>
        <MenuItem onClick={() => { setFiltroEstado('pendiente'); handleFilterClose(); }}>
          Pendientes
        </MenuItem>
        <MenuItem onClick={() => { setFiltroEstado('validado'); handleFilterClose(); }}>
          Validados
        </MenuItem>
        <MenuItem onClick={() => { setFiltroEstado('rechazado'); handleFilterClose(); }}>
          Rechazados
        </MenuItem>
      </Menu>

      {/* Modal de Detalles Completos */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>
              {editMode ? 'Editar Validación' : 'Detalles de Validación'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
              {editMode ? 'Modifica la información del cliente y servicio' : 'Información completa registrada por el asesor'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseModal} sx={{ color: '#64748b' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {selectedCliente && editedCliente && (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 4
            }}>
              {/* Información del Cliente */}
              <Box>
                <Paper sx={{ p: 3, height: '100%', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <PersonIcon sx={{ color: '#3b82f6', mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      Información del Cliente
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2 }}>
                    <EditableField
                      label="DNI/Identificación"
                      value={editedCliente.id}
                      isEditing={editMode}
                      onChange={(value) => handleInputChange('id', value)}
                    />
                    <EditableField
                      label="Nombre Completo"
                      value={editedCliente.nombre}
                      isEditing={editMode}
                      onChange={(value) => handleInputChange('nombre', value)}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: editMode ? 0 : 1 }}>
                      {!editMode && <PhoneIcon sx={{ color: '#059669', mr: 2 }} />}
                      <EditableField
                        label="Teléfono"
                        value={editedCliente.telefono}
                        isEditing={editMode}
                        onChange={(value) => handleInputChange('telefono', value)}
                        type="tel"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: editMode ? 0 : 1 }}>
                      {!editMode && <EmailIcon sx={{ color: '#8b5cf6', mr: 2 }} />}
                      <EditableField
                        label="Correo Electrónico"
                        value={editedCliente.email}
                        isEditing={editMode}
                        onChange={(value) => handleInputChange('email', value)}
                        type="email"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: editMode ? 0 : 1 }}>
                      {!editMode && <LocationOnIcon sx={{ color: '#ef4444', mr: 2 }} />}
                      <Box sx={{ width: '100%' }}>
                        <EditableField
                          label="Dirección"
                          value={editedCliente.direccion}
                          isEditing={editMode}
                          onChange={(value) => handleInputChange('direccion', value)}
                        />
                        {editMode && (
                          <>
                            <EditableField
                              label="Ciudad"
                              value={editedCliente.ciudad}
                              isEditing={editMode}
                              onChange={(value) => handleInputChange('ciudad', value)}
                            />
                            <EditableField
                              label="Código Postal"
                              value={editedCliente.codigoPostal}
                              isEditing={editMode}
                              onChange={(value) => handleInputChange('codigoPostal', value)}
                            />
                          </>
                        )}
                      </Box>
                    </Box>
                    <EditableField
                      label="Tipo de Cliente"
                      value={editedCliente.tipoCliente}
                      isEditing={editMode}
                      onChange={(value) => handleInputChange('tipoCliente', value)}
                      select={editMode}
                      options={['Standard', 'Premium', 'VIP']}
                    />
                  </Box>
                </Paper>
              </Box>

              {/* Información del Servicio */}
              <Box>
                <Paper sx={{ p: 3, height: '100%', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <PaymentIcon sx={{ color: '#10b981', mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      Información del Servicio
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2 }}>
                    <EditableField
                      label="Tipo de Instalación"
                      value={editedCliente.tipoInstalacion}
                      isEditing={editMode}
                      onChange={(value) => handleInputChange('tipoInstalacion', value)}
                      select={editMode}
                      options={['Residencial', 'Empresarial', 'Corporativo', 'Residencial Premium', 'Departamento']}
                    />
                    <EditableField
                      label="Plan Seleccionado"
                      value={editedCliente.planSeleccionado}
                      isEditing={editMode}
                      onChange={(value) => handleInputChange('planSeleccionado', value)}
                    />
                    <EditableField
                      label="Precio Final (MXN/mes)"
                      value={editedCliente.precioFinal}
                      isEditing={editMode}
                      onChange={(value) => handleInputChange('precioFinal', value)}
                      type="number"
                    />
                    <EditableField
                      label="Método de Pago"
                      value={editedCliente.metodoPago}
                      isEditing={editMode}
                      onChange={(value) => handleInputChange('metodoPago', value)}
                      select={editMode}
                      options={['Efectivo', 'Tarjeta de Crédito', 'Débito Automático', 'Transferencia Bancaria', 'Domiciliación Bancaria', 'Contrato Anual']}
                    />
                    <EditableField
                      label="Asesor Responsable"
                      value={editedCliente.asesorActual}
                      isEditing={editMode}
                      onChange={(value) => handleInputChange('asesorActual', value)}
                      select={editMode}
                      options={['Ana García', 'Luis López', 'Carmen Torres', 'Roberto Silva', 'Patricia Morales']}
                    />
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', mb: 1 }}>
                        Estado de Validación:
                      </Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small">
                          <Select
                            value={editedCliente.estado}
                            onChange={(e) => handleInputChange('estado', e.target.value)}
                          >
                            <SelectMenuItem value="sin_validar">Sin validar</SelectMenuItem>
                            <SelectMenuItem value="pendiente">Pendiente</SelectMenuItem>
                            <SelectMenuItem value="validado">Validado</SelectMenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Box sx={{ mt: 1 }}>
                          {getEstadoChip(editedCliente.estado)}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Box>

              {/* Programación de Cita */}
              <Box>
                <Paper sx={{ p: 3, height: '100%', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <CalendarTodayIcon sx={{ color: '#f59e0b', mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      Programación de Cita
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: editMode ? 0 : 1 }}>
                      {!editMode && <CalendarTodayIcon sx={{ color: '#3b82f6', mr: 2 }} />}
                      <EditableField
                        label="Fecha de Cita"
                        value={editedCliente.fechaCita}
                        isEditing={editMode}
                        onChange={(value) => handleInputChange('fechaCita', value)}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: editMode ? 0 : 1 }}>
                      {!editMode && <AccessTimeIcon sx={{ color: '#8b5cf6', mr: 2 }} />}
                      <EditableField
                        label="Hora de Cita"
                        value={editedCliente.horaCita}
                        isEditing={editMode}
                        onChange={(value) => handleInputChange('horaCita', value)}
                      />
                    </Box>
                    <EditableField
                      label="Fecha de Registro"
                      value={editedCliente.fechaIngreso}
                      isEditing={editMode}
                      onChange={(value) => handleInputChange('fechaIngreso', value)}
                    />
                    <EditableField
                      label="Última Validación"
                      value={editedCliente.fechaUltimaValidacion}
                      isEditing={editMode}
                      onChange={(value) => handleInputChange('fechaUltimaValidacion', value)}
                    />
                  </Box>
                </Paper>
              </Box>

              {/* Documentos y Observaciones */}
              <Box>
                <Paper sx={{ p: 3, height: '100%', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <DescriptionIcon sx={{ color: '#ef4444', mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      Documentos y Observaciones
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#374151', mb: 1 }}>
                        Documentos Requeridos:
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          label="Documentos (separados por comas)"
                          value={editedCliente.documentosRequeridos.join(', ')}
                          onChange={(e) => handleInputChange('documentosRequeridos', e.target.value.split(', ').map(doc => doc.trim()))}
                          placeholder="INE, Comprobante de domicilio, RFC"
                          helperText="Separe cada documento con una coma"
                        />
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {editedCliente.documentosRequeridos.map((doc, index) => (
                            <Chip
                              key={index}
                              label={doc}
                              size="small"
                              sx={{
                                backgroundColor: '#dbeafe',
                                color: '#1d4ed8',
                                fontWeight: 500
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#374151', mb: 1 }}>
                        Observaciones del Asesor:
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          size="small"
                          value={editedCliente.observacionesAsesor}
                          onChange={(e) => handleInputChange('observacionesAsesor', e.target.value)}
                          placeholder="Escriba las observaciones del asesor..."
                        />
                      ) : (
                        <Paper sx={{ 
                          p: 2, 
                          backgroundColor: '#f8fafc', 
                          border: '1px solid #e2e8f0',
                          borderRadius: 1
                        }}>
                          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
                            {editedCliente.observacionesAsesor}
                          </Typography>
                        </Paper>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#374151', mb: 1 }}>
                        Comentario de Validación:
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          size="small"
                          value={editedCliente.comentario}
                          onChange={(e) => handleInputChange('comentario', e.target.value)}
                          placeholder="Escriba el comentario de validación..."
                        />
                      ) : (
                        <Paper sx={{ 
                          p: 2, 
                          backgroundColor: '#f0fdf4', 
                          border: '1px solid #bbf7d0',
                          borderRadius: 1
                        }}>
                          <Typography variant="body2" sx={{ color: '#166534', lineHeight: 1.6 }}>
                            {editedCliente.comentario}
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          {editMode ? (
            <>
              <Button
                onClick={handleCancelEdit}
                variant="outlined"
                startIcon={<CancelIcon />}
                sx={{
                  color: '#dc2626',
                  borderColor: '#dc2626',
                  '&:hover': {
                    borderColor: '#b91c1c',
                    backgroundColor: '#fef2f2'
                  }
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveChanges}
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{
                  backgroundColor: '#059669',
                  '&:hover': {
                    backgroundColor: '#047857'
                  }
                }}
              >
                Guardar Cambios
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleCloseModal}
                variant="outlined"
                sx={{
                  color: '#475569',
                  borderColor: '#cbd5e1',
                  '&:hover': {
                    borderColor: '#94a3b8',
                    backgroundColor: '#f1f5f9'
                  }
                }}
              >
                Cerrar
              </Button>
              <Button
                onClick={handleEditMode}
                variant="outlined"
                startIcon={<EditIcon />}
                sx={{
                  color: '#3b82f6',
                  borderColor: '#3b82f6',
                  '&:hover': {
                    borderColor: '#2563eb',
                    backgroundColor: '#eff6ff'
                  }
                }}
              >
                Editar
              </Button>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: '#059669',
                  '&:hover': {
                    backgroundColor: '#047857'
                  }
                }}
              >
                Aprobar Validación
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ValidacionesTable;