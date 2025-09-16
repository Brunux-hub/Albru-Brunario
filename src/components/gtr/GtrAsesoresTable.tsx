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
  sala: 'Sala 1' | 'Sala 2' | 'Sala 3' | 'Sala 4';
}

interface GtrAsesoresTableProps {
  asesores: Asesor[];
}

const GtrAsesoresTable: React.FC<GtrAsesoresTableProps> = ({ asesores }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // Las funciones de asignar/atender cliente se eliminan porque la actualización será automática por reasignación.

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

  const getSalaColor = (sala: string) => {
    switch (sala) {
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
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Sala</TableCell>
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
                        label={asesor.sala}
                        size="small"
                        sx={{
                          backgroundColor: getSalaColor(asesor.sala),
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
