import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Card, CardContent } from '@mui/material';

const AsesoresPanel: React.FC = () => {
  const asesores = [
    { 
      nombre: 'JUAN', 
      estado: 'Activo', 
      login: '08:30', 
      tiempoActivo: '10h 5m', 
      horasTrabajadas: '7.5h',
      clientesAtendidos: 12,
      ventas: 3,
      ingresos: 2850 
    },
    { 
      nombre: 'SASKYA', 
      estado: 'Activo', 
      login: '08:15', 
      tiempoActivo: '10h 20m', 
      horasTrabajadas: '7.75h',
      clientesAtendidos: 15,
      ventas: 4,
      ingresos: 3650 
    },
    { 
      nombre: 'MIA', 
      estado: 'Descanso', 
      login: '09:00', 
      tiempoActivo: 'N/A', 
      horasTrabajadas: '6.5h',
      clientesAtendidos: 8,
      ventas: 2,
      ingresos: 1800 
    },
    { 
      nombre: 'CARLOS', 
      estado: 'Activo', 
      login: '08:45', 
      tiempoActivo: '9h 50m', 
      horasTrabajadas: '7.25h',
      clientesAtendidos: 10,
      ventas: 2,
      ingresos: 2200 
    },
    { 
      nombre: 'ANA', 
      estado: 'Inactivo', 
      login: '08:00', 
      tiempoActivo: 'N/A', 
      horasTrabajadas: '8h',
      clientesAtendidos: 14,
      ventas: 5,
      ingresos: 4200 
    }
  ];

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Activo': return 'success';
      case 'Descanso': return 'warning';
      case 'Inactivo': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* KPIs Header - Compacto */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
        <Card sx={{ minHeight: '85px' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                Asesores Activos
              </Typography>
              <Typography sx={{ fontSize: '1.2rem', opacity: 0.7 }}>👥</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#3498db', fontSize: '1.25rem', lineHeight: 1.2 }}>
              3/5
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ minHeight: '85px' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                Horas Trabajadas
              </Typography>
              <Typography sx={{ fontSize: '1.2rem', opacity: 0.7 }}>⏰</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2ecc71', fontSize: '1.25rem', lineHeight: 1.2 }}>
              37.0
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ minHeight: '85px' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                Ventas Realizadas
              </Typography>
              <Typography sx={{ fontSize: '1.2rem', opacity: 0.7 }}>📈</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#9b59b6', fontSize: '1.25rem', lineHeight: 1.2 }}>
              16
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ minHeight: '85px' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                Ingresos Generados
              </Typography>
              <Typography sx={{ fontSize: '1.2rem', opacity: 0.7 }}>💰</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f39c12', fontSize: '1.25rem', lineHeight: 1.2 }}>
              $14,700
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabla de Asesores */}
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
            Control de Asesores en Tiempo Real
          </Typography>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600 }}>Asesor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Hora Login</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tiempo Activo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Horas Trabajadas</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Clientes Atendidos</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ventas</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ingresos</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {asesores.map((asesor, index) => (
                <TableRow key={index} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{asesor.nombre}</TableCell>
                  <TableCell>
                    <Chip 
                      label={asesor.estado} 
                      color={getStatusColor(asesor.estado) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{asesor.login}</TableCell>
                  <TableCell>{asesor.tiempoActivo}</TableCell>
                  <TableCell>{asesor.horasTrabajadas}</TableCell>
                  <TableCell>👥 {asesor.clientesAtendidos}</TableCell>
                  <TableCell>📈 {asesor.ventas}</TableCell>
                  <TableCell sx={{ color: '#2ecc71', fontWeight: 600 }}>
                    ${asesor.ingresos.toLocaleString()}
                  </TableCell>
                  <TableCell>...</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Sección inferior */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, fontSize: '0.95rem' }}>
            Top Asesores por Ventas
          </Typography>
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                bgcolor: '#3498db', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.75rem'
              }}>
                1
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>ANA</Typography>
                <Typography variant="caption" color="text.secondary">5 ventas</Typography>
              </Box>
              <Typography sx={{ color: '#2ecc71', fontWeight: 600, fontSize: '0.75rem' }}>
                $4,200
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                bgcolor: '#3498db', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                2
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>SASKYA</Typography>
                <Typography variant="body2" color="text.secondary">4 ventas</Typography>
              </Box>
              <Typography sx={{ color: '#2ecc71', fontWeight: 600 }}>
                $3,650 ingresos
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Eficiencia por Asesor
          </Typography>
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>ANA</Typography>
                <Chip label="35.7%" sx={{ bgcolor: '#000', color: 'white' }} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                5/14 conversión
              </Typography>
            </Box>
            
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>SASKYA</Typography>
                <Chip label="26.7%" sx={{ bgcolor: '#000', color: 'white' }} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                4/15 conversión
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AsesoresPanel;