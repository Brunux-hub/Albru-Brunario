import React from 'react';
import { Box, Typography, Paper, TextField, Select, MenuItem, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, InputAdornment } from '@mui/material';
import { Search, Download } from '@mui/icons-material';

const DatabasePanel: React.FC = () => {
  const clientes = [
    { 
      nombre: 'Juan Pérez', 
      dni: '45434678', 
      telefono: '914118663',
      email: 'juan@email.com',
      servicio: 'Fibra Óptica',
      plan: 'Plan Premium 300MB',
      montoMensual: 89.90,
      montoTotal: 539.40,
      estado: 'Activo',
      asesor: 'JUAN',
      vencimiento: '14/2/2025'
    },
    { 
      nombre: 'María García', 
      dni: '87654321', 
      telefono: '967654321',
      email: 'maria@email.com',
      servicio: 'Cable + Internet',
      plan: 'Combo Familiar 200MB',
      montoMensual: 129.90,
      montoTotal: 909.30,
      estado: 'Activo',
      asesor: 'SASKYA',
      vencimiento: '9/2/2025'
    },
    { 
      nombre: 'Carlos López', 
      dni: '45612378', 
      telefono: '956587643',
      email: 'carlos@email.com',
      servicio: 'Internet Móvil',
      plan: 'Plan Móvil 50GB',
      montoMensual: 45.90,
      montoTotal: 229.50,
      estado: 'Activo',
      asesor: 'MIA',
      vencimiento: '4/2/2025'
    },
    { 
      nombre: 'Isabella Torres', 
      dni: '36925814', 
      telefono: '963258147',
      email: 'isabella@email.com',
      servicio: 'Fibra Óptica',
      plan: 'Plan Hogar 200MB',
      montoMensual: 65.90,
      montoTotal: 329.50,
      estado: 'Cancelado',
      asesor: 'JUAN',
      vencimiento: '24/12/2024'
    }
  ];

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Activo': return 'success';
      case 'Suspendido': return 'warning';
      case 'Cancelado': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Filtros y Búsqueda */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Filtros y Búsqueda
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr auto' }, gap: 2, alignItems: 'end' }}>
          <TextField
            placeholder="Buscar por nombre, DNI, teléfono o email..."
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          
          <Select
            defaultValue="todos-estados"
            size="small"
            displayEmpty
          >
            <MenuItem value="todos-estados">Todos los Estados</MenuItem>
            <MenuItem value="activo">Activo</MenuItem>
            <MenuItem value="suspendido">Suspendido</MenuItem>
            <MenuItem value="cancelado">Cancelado</MenuItem>
          </Select>
          
          <Select
            defaultValue="todos-servicios"
            size="small"
            displayEmpty
          >
            <MenuItem value="todos-servicios">Todos los Servicios</MenuItem>
            <MenuItem value="fibra">Fibra Óptica</MenuItem>
            <MenuItem value="cable">Cable + Internet</MenuItem>
            <MenuItem value="movil">Internet Móvil</MenuItem>
          </Select>
          
          <Select
            defaultValue="todos-asesores"
            size="small"
            displayEmpty
          >
            <MenuItem value="todos-asesores">Todos los Asesores</MenuItem>
            <MenuItem value="juan">JUAN</MenuItem>
            <MenuItem value="saskya">SASKYA</MenuItem>
            <MenuItem value="mia">MIA</MenuItem>
          </Select>
          
          <Button
            variant="contained"
            startIcon={<Download />}
            sx={{ 
              bgcolor: '#000', 
              color: 'white',
              '&:hover': { bgcolor: '#333' },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Exportar
          </Button>
        </Box>
      </Paper>

      {/* Tabla Principal */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Base de Datos de Clientes - {clientes.length} registros
          </Typography>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contacto</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Servicio</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Monto Mensual</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Monto Total</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Asesor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Próx. Vencimiento</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientes.map((cliente, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {cliente.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        DNI: {cliente.dni}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{cliente.telefono}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cliente.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{cliente.servicio}</TableCell>
                  <TableCell>{cliente.plan}</TableCell>
                  <TableCell sx={{ color: '#2ecc71', fontWeight: 600 }}>
                    ${cliente.montoMensual}
                  </TableCell>
                  <TableCell sx={{ color: '#3498db', fontWeight: 600 }}>
                    ${cliente.montoTotal}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={cliente.estado} 
                      color={getStatusColor(cliente.estado) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{cliente.asesor}</TableCell>
                  <TableCell>{cliente.vencimiento}</TableCell>
                  <TableCell>...</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Resúmenes */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Resumen por Servicio
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {[
              { servicio: 'Fibra Óptica', monto: 389.80, clientes: 2 },
              { servicio: 'Cable + Internet', monto: 209.80, clientes: 2 },
              { servicio: 'Internet Móvil', monto: 115.80, clientes: 2 },
              { servicio: 'Combo Premium', monto: 359.80, clientes: 2 },
              { servicio: 'Televisión', monto: 0.00, clientes: 0 }
            ].map((item, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {item.servicio}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.clientes} clientes activos
                  </Typography>
                </Box>
                <Typography sx={{ color: '#2ecc71', fontWeight: 600, fontSize: '1.1rem' }}>
                  ${item.monto} mensual
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Resumen por Asesor
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {[
              { asesor: 'JUAN', monto: 329.70, clientes: 3 },
              { asesor: 'SASKYA', monto: 199.80, clientes: 2 },
              { asesor: 'MIA', monto: 545.70, clientes: 3 }
            ].map((item, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {item.asesor}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.clientes} clientes activos
                  </Typography>
                </Box>
                <Typography sx={{ color: '#3498db', fontWeight: 600, fontSize: '1.1rem' }}>
                  ${item.monto} mensual generado
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default DatabasePanel;