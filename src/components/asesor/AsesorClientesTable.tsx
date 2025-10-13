import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import GestionarClienteDialog from './GestionarClienteDialog';
import { useClientes } from '../../context/ClientesContext';
import type { Cliente } from '../../context/ClientesContext';

const estados = ['Todos los estados', 'En gestión', 'En seguimiento', 'Nuevo'];
const gestiones = ['Todas las gestiones', 'En proceso', 'Derivado'];

const AsesorClientesTable = forwardRef<any, {}>((_, ref) => {
  const { clientes, actualizarCliente, agregarCliente, recargarClientes } = useClientes();
  const agregarClienteRef = useRef(agregarCliente);
  
  // Tipado para datos crudos de la API
  type ClienteApi = {
    id?: number;
    fecha?: string;
    nombre?: string;
    telefono?: string;
    dni?: string;
    servicio?: string;
    estado?: string;
    gestion?: string;
    seguimiento?: string;
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('Todos los estados');
  const [filtroGestion, setFiltroGestion] = useState('Todas las gestiones');
  const [busqueda, setBusqueda] = useState('');

  // Mantener la referencia actualizada
  useEffect(() => {
    agregarClienteRef.current = agregarCliente;
  }, [agregarCliente]);

  // Cargar clientes del asesor autenticado
  useEffect(() => {
    cargarClientesAsignados();
  }, []);

  // Exponer funciones al componente padre
  useImperativeHandle(ref, () => ({
    refreshClientes: cargarClientesAsignados
  }));

  // Función para cargar clientes desde la BD
  const cargarClientesAsignados = async () => {
    try {
      console.log('📡 Cargando clientes asignados al asesor desde BD...');
      
      // Para demo, usamos el asesor Carlos López (ID: 1)
      // En producción esto vendría del token o usuario autenticado
      const asesorId = 1; // Carlos López
      
      // Obtener solo los clientes asignados a este asesor
      const response = await fetch(`/api/clientes/asesor/${asesorId}`);
      
      if (!response.ok) {
        console.log('⚠️ Error al cargar clientes');
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.clientes) {
        // Limpiar clientes existentes antes de cargar los nuevos
        recargarClientes();
        
        // Mapear y actualizar clientes en el contexto
        (result.clientes as ClienteApi[]).forEach((cliente) => {
          const clienteFormateado: Cliente = {
            id: cliente.id,
            fecha: cliente.fecha ? new Date(cliente.fecha).toLocaleDateString('es-PE') : new Date().toLocaleDateString('es-PE'),
            nombre: cliente.nombre ?? 'Sin nombre',
            telefono: cliente.telefono ?? 'Sin teléfono',
            dni: cliente.dni ?? 'Sin DNI',
            servicio: cliente.servicio ?? 'Internet',
            estado: cliente.estado === 'nuevo' ? 'Nuevo' : (cliente.estado ?? 'Nuevo'),
            gestion: 'En proceso',
            seguimiento: cliente.seguimiento ? new Date(cliente.seguimiento).toISOString().slice(0, 16) : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          };
          agregarClienteRef.current(clienteFormateado);
        });
        
        console.log(`✅ ${result.clientes.length} clientes cargados desde BD`);
      }
      
    } catch (error) {
      console.error('❌ JUAN: Error cargando clientes:', error);
    }
  };

  // TODO: Implementar monitoreo de reasignaciones en tiempo real con WebSockets cuando sea necesario  // Filtrar clientes
  const clientesFiltrados = clientes.filter(cliente => {
    const cumpleEstado = filtroEstado === 'Todos los estados' || cliente.estado === filtroEstado;
    const cumpleGestion = filtroGestion === 'Todas las gestiones' || cliente.gestion === filtroGestion;
    const cumpleBusqueda = busqueda === '' || 
      cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.telefono.includes(busqueda) ||
      cliente.dni.includes(busqueda);
    
    return cumpleEstado && cumpleGestion && cumpleBusqueda;
  });

  const handleGestionar = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setClienteSeleccionado(null);
  };

  // Sistema de notificaciones removido - usar toast o similar cuando sea necesario

  return (
    <Box>      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField 
          label="Buscar por nombre, teléfono o DNI..." 
          variant="outlined" 
          size="small" 
          sx={{ width: 350 }}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filtroEstado}
              label="Estado"
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              {estados.map((estado) => (
                <MenuItem key={estado} value={estado}>
                  {estado}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Gestión</InputLabel>
            <Select
              value={filtroGestion}
              label="Gestión"
              onChange={(e) => setFiltroGestion(e.target.value)}
            >
              {gestiones.map((gestion) => (
                <MenuItem key={gestion} value={gestion}>
                  {gestion}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha Asignación</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>Tipo Servicio</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Gestión</TableCell>
              <TableCell>Próximo Seguimiento</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientesFiltrados.map((cliente, index) => (
              <TableRow key={index} hover>
                <TableCell>{cliente.fecha}</TableCell>
                <TableCell>{cliente.nombre}</TableCell>
                <TableCell>{cliente.telefono}</TableCell>
                <TableCell>{cliente.dni}</TableCell>
                <TableCell>{cliente.servicio}</TableCell>
                <TableCell>
                  <Chip 
                    label={cliente.estado} 
                    color={cliente.estado === 'En gestión' ? 'primary' : cliente.estado === 'En seguimiento' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={cliente.gestion} 
                    color={cliente.gestion === 'En proceso' ? 'error' : 'info'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(cliente.seguimiento).toLocaleString('es-PE')}</TableCell>
                <TableCell>
                  <Button 
                    variant="contained" 
                    size="small" 
                    onClick={() => handleGestionar(cliente)}
                  >
                    GESTIONAR
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <GestionarClienteDialog
        open={dialogOpen}
        cliente={clienteSeleccionado}
        onClose={handleCloseDialog}
        onSave={actualizarCliente}
      />

      {/* Sistema de notificaciones removido */}
    </Box>
  );
});

export default AsesorClientesTable;
