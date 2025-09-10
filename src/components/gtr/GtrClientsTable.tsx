import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button } from '@mui/material';

// Datos simulados
const clients = [
  { id: 1, fecha: '09/09/2025', cliente: '914118863', campania: 'MASIVO', estado: 'En gestión', asesor: 'JUAN' },
  { id: 2, fecha: '09/09/2025', cliente: '987654321', campania: 'REF', estado: 'Vendido', asesor: 'SASKYA' },
  { id: 3, fecha: '09/09/2025', cliente: '965887043', campania: 'LEADS', estado: 'Nuevo', asesor: 'MIA' },
];

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  'Nuevo': 'info',
  'En gestión': 'primary',
  'Vendido': 'success',
  'No contactado': 'warning',
  'Lista negra': 'error',
};

const GtrClientsTable: React.FC<{ statusFilter: string }> = ({ statusFilter }) => {
  const filtered = statusFilter === 'Todos' ? clients : clients.filter(c => c.estado === statusFilter);
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>Campaña</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Asesor</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map(row => (
            <TableRow key={row.id}>
              <TableCell>{row.fecha}</TableCell>
              <TableCell>{row.cliente}</TableCell>
              <TableCell>{row.campania}</TableCell>
              <TableCell>
                <Chip label={row.estado} color={statusColors[row.estado] || 'default'} size="small" />
              </TableCell>
              <TableCell>{row.asesor}</TableCell>
              <TableCell>
                <Button size="small" variant="outlined">Ver</Button>
                <Button size="small" variant="contained" sx={{ ml: 1 }}>Reasignar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GtrClientsTable;
