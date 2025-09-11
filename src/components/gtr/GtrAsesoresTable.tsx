import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Phone,
  MoreVert,
  TrendingUp,
  TrendingDown,
  Assignment,
  CheckCircle,
  Schedule,
  Person
} from '@mui/icons-material';

interface Asesor {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado: 'Activo' | 'Ocupado' | 'Descanso' | 'Offline';
  clientesAsignados: number;
  clientesAtendidos: number;
  ventasHoy: number;
  ventasMes: number;
  metaMensual: number;
  eficiencia: number;
  ultimaActividad: string;
  avatar?: string;
  especialidad: string;
}

const asesores: Asesor[] = [
  {
    id: 1,
    nombre: 'Juan Carlos Mendez',
    email: 'juan.mendez@albru.com',
    telefono: '+51 987654321',
    estado: 'Activo',
    clientesAsignados: 25,
    clientesAtendidos: 18,
    ventasHoy: 3,
    ventasMes: 45,
    metaMensual: 50,
    eficiencia: 92,
    ultimaActividad: 'Hace 5 min',
    especialidad: 'Premium'
  },
  {
    id: 2,
    nombre: 'María Elena Saskya',
    email: 'maria.saskya@albru.com',
    telefono: '+51 987654322',
    estado: 'Activo',
    clientesAsignados: 30,
    clientesAtendidos: 28,
    ventasHoy: 5,
    ventasMes: 52,
    metaMensual: 50,
    eficiencia: 95,
    ultimaActividad: 'Hace 2 min',
    especialidad: 'Referidos'
  },
  {
    id: 3,
    nombre: 'Mia Rodriguez',
    email: 'mia.rodriguez@albru.com',
    telefono: '+51 987654323',
    estado: 'Ocupado',
    clientesAsignados: 22,
    clientesAtendidos: 20,
    ventasHoy: 2,
    ventasMes: 38,
    metaMensual: 40,
    eficiencia: 88,
    ultimaActividad: 'En llamada',
    especialidad: 'Leads'
  },
  {
    id: 4,
    nombre: 'Carlos Alberto Vega',
    email: 'carlos.vega@albru.com',
    telefono: '+51 987654324',
    estado: 'Activo',
    clientesAsignados: 28,
    clientesAtendidos: 24,
    ventasHoy: 4,
    ventasMes: 41,
    metaMensual: 45,
    eficiencia: 85,
    ultimaActividad: 'Hace 10 min',
    especialidad: 'Masivo'
  },
  {
    id: 5,
    nombre: 'Ana Lucía Torres',
    email: 'ana.torres@albru.com',
    telefono: '+51 987654325',
    estado: 'Activo',
    clientesAsignados: 26,
    clientesAtendidos: 23,
    ventasHoy: 3,
    ventasMes: 43,
    metaMensual: 45,
    eficiencia: 90,
    ultimaActividad: 'Hace 3 min',
    especialidad: 'Premium'
  },
  {
    id: 6,
    nombre: 'Roberto Silva Lima',
    email: 'roberto.silva@albru.com',
    telefono: '+51 987654326',
    estado: 'Descanso',
    clientesAsignados: 20,
    clientesAtendidos: 16,
    ventasHoy: 1,
    ventasMes: 32,
    metaMensual: 40,
    eficiencia: 78,
    ultimaActividad: 'Hace 30 min',
    especialidad: 'Leads'
  },
  {
    id: 7,
    nombre: 'Patricia Morales',
    email: 'patricia.morales@albru.com',
    telefono: '+51 987654327',
    estado: 'Activo',
    clientesAsignados: 24,
    clientesAtendidos: 22,
    ventasHoy: 2,
    ventasMes: 39,
    metaMensual: 42,
    eficiencia: 87,
    ultimaActividad: 'Hace 7 min',
    especialidad: 'Referidos'
  },
  {
    id: 8,
    nombre: 'Diego Fernando Cruz',
    email: 'diego.cruz@albru.com',
    telefono: '+51 987654328',
    estado: 'Ocupado',
    clientesAsignados: 27,
    clientesAtendidos: 25,
    ventasHoy: 4,
    ventasMes: 47,
    metaMensual: 50,
    eficiencia: 91,
    ultimaActividad: 'En llamada',
    especialidad: 'Premium'
  },
  {
    id: 9,
    nombre: 'Sofía Ramírez',
    email: 'sofia.ramirez@albru.com',
    telefono: '+51 987654329',
    estado: 'Activo',
    clientesAsignados: 23,
    clientesAtendidos: 21,
    ventasHoy: 3,
    ventasMes: 36,
    metaMensual: 40,
    eficiencia: 83,
    ultimaActividad: 'Hace 15 min',
    especialidad: 'Masivo'
  },
  {
    id: 10,
    nombre: 'Luis Miguel Herrera',
    email: 'luis.herrera@albru.com',
    telefono: '+51 987654330',
    estado: 'Activo',
    clientesAsignados: 29,
    clientesAtendidos: 26,
    ventasHoy: 5,
    ventasMes: 49,
    metaMensual: 50,
    eficiencia: 94,
    ultimaActividad: 'Hace 1 min',
    especialidad: 'Premium'
  },
  {
    id: 11,
    nombre: 'Carmen Rosa López',
    email: 'carmen.lopez@albru.com',
    telefono: '+51 987654331',
    estado: 'Offline',
    clientesAsignados: 18,
    clientesAtendidos: 14,
    ventasHoy: 0,
    ventasMes: 28,
    metaMensual: 35,
    eficiencia: 75,
    ultimaActividad: 'Hace 2 horas',
    especialidad: 'Leads'
  },
  {
    id: 12,
    nombre: 'Fernando Castillo',
    email: 'fernando.castillo@albru.com',
    telefono: '+51 987654332',
    estado: 'Activo',
    clientesAsignados: 25,
    clientesAtendidos: 22,
    ventasHoy: 3,
    ventasMes: 42,
    metaMensual: 45,
    eficiencia: 86,
    ultimaActividad: 'Hace 8 min',
    especialidad: 'Referidos'
  },
  {
    id: 13,
    nombre: 'Valeria Gutierrez',
    email: 'valeria.gutierrez@albru.com',
    telefono: '+51 987654333',
    estado: 'Ocupado',
    clientesAsignados: 21,
    clientesAtendidos: 19,
    ventasHoy: 2,
    ventasMes: 34,
    metaMensual: 38,
    eficiencia: 81,
    ultimaActividad: 'En llamada',
    especialidad: 'Masivo'
  },
  {
    id: 14,
    nombre: 'Ricardo Fernández',
    email: 'ricardo.fernandez@albru.com',
    telefono: '+51 987654334',
    estado: 'Activo',
    clientesAsignados: 26,
    clientesAtendidos: 24,
    ventasHoy: 4,
    ventasMes: 44,
    metaMensual: 48,
    eficiencia: 89,
    ultimaActividad: 'Hace 4 min',
    especialidad: 'Premium'
  }
];

const GtrAsesoresTable: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo': return '#22c55e';
      case 'Ocupado': return '#f59e0b';
      case 'Descanso': return '#3b82f6';
      case 'Offline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Activo': return <CheckCircle sx={{ fontSize: 16 }} />;
      case 'Ocupado': return <Phone sx={{ fontSize: 16 }} />;
      case 'Descanso': return <Schedule sx={{ fontSize: 16 }} />;
      case 'Offline': return <Person sx={{ fontSize: 16 }} />;
      default: return <Person sx={{ fontSize: 16 }} />;
    }
  };

  const getEspecialidadColor = (especialidad: string) => {
    switch (especialidad) {
      case 'Premium': return '#8b5cf6';
      case 'Referidos': return '#06b6d4';
      case 'Leads': return '#10b981';
      case 'Masivo': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getProgressColor = (eficiencia: number) => {
    if (eficiencia >= 90) return 'success';
    if (eficiencia >= 80) return 'primary';
    if (eficiencia >= 70) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Resumen de Asesores */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {asesores.filter(a => a.estado === 'Activo').length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Asesores Activos
                </Typography>
              </Box>
              <CheckCircle sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {asesores.reduce((sum, a) => sum + a.ventasHoy, 0)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Ventas Hoy
                </Typography>
              </Box>
              <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {asesores.reduce((sum, a) => sum + a.clientesAsignados, 0)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Clientes Asignados
                </Typography>
              </Box>
              <Assignment sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {Math.round(asesores.reduce((sum, a) => sum + a.eficiencia, 0) / asesores.length)}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Eficiencia Promedio
                </Typography>
              </Box>
              <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabla de Asesores */}
      <Card sx={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Asesor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Especialidad</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Clientes</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Ventas Hoy</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Meta Mensual</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Eficiencia</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Última Actividad</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {asesores.map((asesor) => (
                  <TableRow 
                    key={asesor.id}
                    sx={{ 
                      '&:hover': { backgroundColor: '#f9fafb' },
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40,
                            backgroundColor: '#3b82f6',
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {asesor.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium', color: '#111827' }}>
                            {asesor.nombre}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            {asesor.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        icon={getEstadoIcon(asesor.estado)}
                        label={asesor.estado}
                        size="small"
                        sx={{
                          backgroundColor: getEstadoColor(asesor.estado),
                          color: 'white',
                          fontWeight: 'medium',
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={asesor.especialidad}
                        size="small"
                        sx={{
                          backgroundColor: getEspecialidadColor(asesor.especialidad),
                          color: 'white',
                          fontWeight: 'medium'
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#111827' }}>
                          {asesor.clientesAtendidos}/{asesor.clientesAsignados}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          Atendidos/Asignados
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#111827' }}>
                          {asesor.ventasHoy}
                        </Typography>
                        {asesor.ventasHoy >= 3 ? (
                          <TrendingUp sx={{ fontSize: 16, color: '#22c55e' }} />
                        ) : (
                          <TrendingDown sx={{ fontSize: 16, color: '#ef4444' }} />
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: '#111827', mb: 0.5 }}>
                          {asesor.ventasMes}/{asesor.metaMensual}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(asesor.ventasMes / asesor.metaMensual) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: (asesor.ventasMes / asesor.metaMensual) >= 0.8 ? '#22c55e' : '#f59e0b'
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: '#111827', mb: 0.5 }}>
                          {asesor.eficiencia}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={asesor.eficiencia}
                          color={getProgressColor(asesor.eficiencia)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e5e7eb'
                          }}
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        {asesor.ultimaActividad}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={handleMenuClick}
                        sx={{ color: '#6b7280' }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Ver perfil</MenuItem>
        <MenuItem onClick={handleMenuClose}>Asignar clientes</MenuItem>
        <MenuItem onClick={handleMenuClose}>Cambiar estado</MenuItem>
        <MenuItem onClick={handleMenuClose}>Ver reportes</MenuItem>
      </Menu>
    </Box>
  );
};

export default GtrAsesoresTable;
