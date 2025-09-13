import React, { useState } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import GestionarClienteDialog from './GestionarClienteDialog';

const clientes = [
  { fecha: '08/09/2025', nombre: 'Juan Pérez', telefono: '914118663', dni: '12345678', servicio: 'Fibra Óptica', estado: 'En gestión', gestion: 'En proceso', seguimiento: '2025-09-14T10:00', coordenadas: '-12.0464,-77.0428', campania: 'MASIVO', canal: 'WSP 1', comentariosIniciales: 'Cliente interesado en fibra' },
  { fecha: '06/09/2025', nombre: 'Ana Rodríguez', telefono: '923456789', dni: '78945612', servicio: 'Combo', estado: 'En seguimiento', gestion: 'En proceso', seguimiento: '2025-09-15T16:00', coordenadas: '', campania: 'LEADS', canal: 'WSP 4', comentariosIniciales: '' },
  { fecha: '07/09/2025', nombre: 'Roberto Silva', telefono: '912345678', dni: '98765432', servicio: 'Fibra Óptica', estado: 'Nuevo', gestion: 'Derivado', seguimiento: '2025-09-14T09:00', coordenadas: '-12.0500,-77.0500', campania: 'REFERIDOS', canal: 'REFERIDO', comentariosIniciales: 'Referido por cliente actual' },
];

const estados = ['Todos los estados', 'En gestión', 'En seguimiento', 'Nuevo'];
const gestiones = ['Todas las gestiones', 'En proceso', 'Derivado'];

const AsesorClientesTable: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [filtroEstado, setFiltroEstado] = useState('Todos los estados');
  const [filtroGestion, setFiltroGestion] = useState('Todas las gestiones');
  const [busqueda, setBusqueda] = useState('');

  // Filtrar clientes según los filtros aplicados
  const clientesFiltrados = clientes.filter(cliente => {
    const cumpleEstado = filtroEstado === 'Todos los estados' || cliente.estado === filtroEstado;
    const cumpleGestion = filtroGestion === 'Todas las gestiones' || cliente.gestion === filtroGestion;
    const cumpleBusqueda = busqueda === '' || 
      cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.telefono.includes(busqueda) ||
      cliente.dni.includes(busqueda);
    
    return cumpleEstado && cumpleGestion && cumpleBusqueda;
  });

  const handleGestionar = (cliente: any) => {
    setClienteSeleccionado(cliente);
    setDialogOpen(true);
  };

  const handleSaveGestion = (clienteActualizado: any, gestion: any) => {
    console.log('Cliente actualizado:', clienteActualizado);
    console.log('Nueva gestión:', gestion);
    // Aquí se actualizaría el estado de clientes y se guardaría la gestión
    setDialogOpen(false);
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
              {estados.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Gestión</InputLabel>
            <Select
              value={filtroGestion}
              label="Gestión"
              onChange={(e) => setFiltroGestion(e.target.value)}
            >
              {gestiones.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
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
            {clientesFiltrados.map((c, idx) => (
              <TableRow key={idx}>
                <TableCell>{c.fecha}</TableCell>
                <TableCell>{c.nombre}</TableCell>
                <TableCell>{c.telefono}</TableCell>
                <TableCell>{c.dni}</TableCell>
                <TableCell>{c.servicio}</TableCell>
                <TableCell>
                  <Chip label={c.estado} color={c.estado === 'Nuevo' ? 'warning' : c.estado === 'En gestión' ? 'primary' : 'success'} size="small" />
                </TableCell>
                <TableCell>
                  <Chip label={c.gestion} color={c.gestion === 'Derivado' ? 'info' : 'secondary'} size="small" />
                </TableCell>
                <TableCell>{c.seguimiento.replace('T', ' ')}</TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" sx={{ mr: 1 }} onClick={() => handleGestionar(c)}>
                    GESTIONAR
                  </Button>
                  <Button variant="outlined" size="small">📍</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <GestionarClienteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        cliente={clienteSeleccionado}
        onSave={handleSaveGestion}
      />
    </Box>
  );
};

export default AsesorClientesTable;
