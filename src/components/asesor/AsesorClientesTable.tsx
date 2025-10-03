import React, { useState, useEffect, useRef } from 'react';
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
  InputLabel,
  Alert,
  Snackbar
} from '@mui/material';
import GestionarClienteDialog from './GestionarClienteDialog';
import { useClientes } from '../../context/ClientesContext';
import type { Cliente } from '../../context/ClientesContext';

const estados = ['Todos los estados', 'En gestión', 'En seguimiento', 'Nuevo'];
const gestiones = ['Todas las gestiones', 'En proceso', 'Derivado'];

const AsesorClientesTable: React.FC = () => {
  const { clientes, actualizarCliente, agregarCliente } = useClientes();
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
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Mantener la referencia actualizada
  useEffect(() => {
    agregarClienteRef.current = agregarCliente;
  }, [agregarCliente]);

  // Establecer usuario JUAN y cargar clientes
  useEffect(() => {
    localStorage.setItem('currentUser', 'JUAN');
    console.log('🎯 JUAN: Sistema inicializado');
    cargarClientesAsignados();
  }, []);

  // Función para cargar clientes desde la BD
  const cargarClientesAsignados = async () => {
    try {
      console.log('📡 JUAN: Cargando clientes desde BD...');
      
      // Primero obtener ID del asesor JUAN
      const asesorResponse = await fetch('http://localhost:3001/api/asesores/buscar/JUAN');
      
      if (!asesorResponse.ok) {
        console.log('⚠️ JUAN: Asesor no encontrado en BD');
        return;
      }
      
      const asesorData = await asesorResponse.json();
      const asesorId = asesorData.asesor.id;
      
      // Cargar clientes asignados
      const clientesResponse = await fetch(`http://localhost:3001/api/clientes/asesor/${asesorId}`);
      
      if (clientesResponse.ok) {
        const result = await clientesResponse.json();
        
        // Actualizar clientes en el contexto
        (result.clientes as ClienteApi[]).forEach((cliente) => {
          const clienteFormateado: any = {
            id: cliente.id,
            fecha: cliente.fecha ? new Date(cliente.fecha).toLocaleDateString('es-PE') : '',
            nombre: cliente.nombre ?? 'Sin nombre',
            telefono: cliente.telefono ?? 'Sin teléfono',
            dni: cliente.dni ?? 'Sin DNI',
            servicio: cliente.servicio ?? 'Internet',
            estado: cliente.estado === 'asignado' ? 'Nuevo' : (cliente.estado ?? ''),
            gestion: 'En proceso',
            seguimiento: cliente.seguimiento ? new Date(cliente.seguimiento).toISOString().slice(0, 16) : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          } as Cliente;
          agregarClienteRef.current(clienteFormateado);
        });
        
        console.log(`✅ JUAN: ${result.clientes.length} clientes cargados desde BD`);
      }
      
    } catch (error) {
      console.error('❌ JUAN: Error cargando clientes:', error);
    }
  };

  // Monitoreo de nuevas reasignaciones desde BD
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Verificar si hay nuevos clientes asignados
        const asesorResponse = await fetch('http://localhost:3001/api/asesores/buscar/JUAN');
        if (!asesorResponse.ok) return;
        
        const asesorData = await asesorResponse.json();
        const asesorId = asesorData.asesor.id;
        
        const clientesResponse = await fetch(`http://localhost:3001/api/clientes/asesor/${asesorId}`);
        if (!clientesResponse.ok) return;
        
        const result = await clientesResponse.json();
        const clientesBD = result.clientes;
        
        // Verificar si hay clientes nuevos (comparar con los que ya tengo)
        const clientesActuales = clientes.map(c => c.dni).filter(dni => dni !== 'Sin DNI');
        const clientesNuevos = (clientesBD as ClienteApi[]).filter((cliente) => 
          cliente.dni && !clientesActuales.includes(cliente.dni)
        );
        
        if (clientesNuevos.length > 0) {
          console.log(`🔔 JUAN: ${clientesNuevos.length} cliente(s) nuevo(s) detectado(s)`);
          
          clientesNuevos.forEach((cliente) => {
            const clienteFormateado: Cliente = {
              fecha: cliente.fecha ? new Date(cliente.fecha).toLocaleDateString('es-PE') : '',
              nombre: cliente.nombre ?? 'Sin nombre',
              telefono: cliente.telefono ?? 'Sin teléfono',
              dni: cliente.dni ?? 'Sin DNI',
              servicio: cliente.servicio ?? 'Internet',
              estado: 'Nuevo',
              gestion: 'En proceso',
              seguimiento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
            };
            agregarClienteRef.current(clienteFormateado);
            setNotificationMessage(`¡Cliente ${cliente.nombre ?? ''} reasignado desde GTR!`);
            setNotificationOpen(true);
            console.log('🎉 JUAN: Cliente agregado automáticamente:', clienteFormateado);
          });
        }
        
      } catch (error) {
        console.error('❌ JUAN: Error verificando nuevos clientes:', error);
      }
    }, 3000); // Verificar cada 3 segundos
    
    console.log('🔄 JUAN: Monitoreo automático activado (cada 3s)');
    
    return () => {
      clearInterval(interval);
      console.log('🛑 JUAN: Monitoreo automático desactivado');
    };
  }, [clientes]);

  // Filtrar clientes
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

  const handleCloseNotification = () => {
    setNotificationOpen(false);
  };

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

      <Snackbar
        open={notificationOpen}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity="success" sx={{ width: '100%' }}>
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AsesorClientesTable;
