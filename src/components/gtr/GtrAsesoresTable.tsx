import React, { useState, useMemo } from 'react';
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
  MenuItem,
  TextField
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
import AsesorReportModal from './AsesorReportModal';

interface Asesor {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado: 'Activo' | 'Ocupado' | 'Descanso' | 'Offline';
  clientesAsignados: number;
  clientesAtendidos: number;
  clientesReasignados: number; // Nuevo: contador de reasignaciones del día
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
  // lista de clientes para calcular ocupados por asesor
  // soporta emparejar por nombre (`asesor`) o por id (`asesorId`) para mayor robustez
  clients?: Array<{ asesor?: string; asesorId?: number; ocupado?: boolean }>;
}

const GtrAsesoresTable: React.FC<GtrAsesoresTableProps> = ({ asesores, clients = [] }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAsesor, setSelectedAsesor] = useState<Asesor | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  
  // Las funciones de asignar/atender cliente se eliminan porque la actualización será automática por reasignación.

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, asesor: Asesor) => {
    setAnchorEl(event.currentTarget);
    setSelectedAsesor(asesor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleVerReportes = () => {
    if (selectedAsesor) {
      setReportModalOpen(true);
      handleMenuClose();
    }
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

  const [query, setQuery] = useState('');

  const filteredAsesores = useMemo(() => {
    if (!query) return asesores;
    const q = query.toLowerCase();
    return asesores.filter(a => a.nombre.toLowerCase().includes(q) || String(a.id).includes(q));
  }, [asesores, query]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Resumen de Asesores */}
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 3, mb: 3 }}>
        <Card 
          sx={{ 
            bgcolor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-4px)'
            }
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 1 }}>
                  Asesores Activos
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#111827' }}>
                  {asesores.filter(a => a.estado === 'Activo').length}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: '#a78bfa', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle sx={{ fontSize: 32, color: 'white' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card 
          sx={{ 
            bgcolor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-4px)'
            }
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 1 }}>
                  Ventas Hoy
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#111827' }}>
                  {asesores.reduce((sum, a) => sum + a.ventasHoy, 0)}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: '#fb7185', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp sx={{ fontSize: 32, color: 'white' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card 
          sx={{ 
            bgcolor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-4px)'
            }
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 1 }}>
                  Total Asignados
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#111827' }}>
                  {asesores.reduce((sum, a) => sum + a.clientesAsignados, 0)}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: '#22d3ee', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Assignment sx={{ fontSize: 32, color: 'white' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card 
          sx={{ 
            bgcolor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-4px)'
            }
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 1 }}>
                  Eficiencia Promedio
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#111827' }}>
                  {Math.round(asesores.reduce((sum, a) => sum + a.eficiencia, 0) / asesores.length)}%
                </Typography>
              </Box>
              <Box sx={{ bgcolor: '#fbbf24', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp sx={{ fontSize: 32, color: 'white' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabla de Asesores */}
      <Card sx={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Asesores</Typography>
            <TextField size="small" placeholder="Buscar asesor..." value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} sx={{ minWidth: 200 }} />
          </Box>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Asesor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Sala</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151', textAlign: 'center' }}>Asignados</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151', textAlign: 'center' }}>Gestionados Hoy</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151', textAlign: 'center' }}>Reasignados Hoy</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Ventas Hoy</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Meta Mensual</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Eficiencia</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Última Actividad</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAsesores.map((asesor) => (
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
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {(() => {
                          const occupiedCount = clients.reduce((acc, c) => {
                            const match = (typeof c.asesorId !== 'undefined' ? c.asesorId === asesor.id : String(c.asesor) === String(asesor.nombre));
                            return acc + (match && c.ocupado ? 1 : 0);
                          }, 0);

                          if (occupiedCount > 0) {
                            // Mostrar un solo chip 'Ocupado' en lugar de 'Activo' + contador
                            return (
                              <Chip
                                icon={<Phone sx={{ fontSize: 16, color: 'white' }} />}
                                label={occupiedCount > 1 ? `${occupiedCount} ocup.` : 'Ocupado'}
                                size="small"
                                sx={{ backgroundColor: '#f97316', color: '#fff', fontWeight: 700 }}
                              />
                            );
                          }

                          // Si no hay ocupados, mostrar estado normal
                          return (
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
                          );
                        })()}
                      </Box>
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
                        <Chip
                          label={asesor.clientesAsignados}
                          size="small"
                          sx={{
                            backgroundColor: '#e0e7ff',
                            color: '#4f46e5',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            minWidth: 50
                          }}
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ textAlign: 'center' }}>
                        <Chip
                          label={asesor.clientesAtendidos || 0}
                          size="small"
                          sx={{
                            backgroundColor: asesor.clientesAtendidos > 0 ? '#d1fae5' : '#f3f4f6',
                            color: asesor.clientesAtendidos > 0 ? '#059669' : '#6b7280',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            minWidth: 50
                          }}
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ textAlign: 'center' }}>
                        <Chip
                          label={asesor.clientesReasignados || 0}
                          size="small"
                          sx={{
                            backgroundColor: asesor.clientesReasignados > 0 ? '#fee2e2' : '#f3f4f6',
                            color: asesor.clientesReasignados > 0 ? '#dc2626' : '#6b7280',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            minWidth: 50
                          }}
                        />
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
                        {/* Evitar división por cero cuando metaMensual es 0 */}
                        {typeof asesor.metaMensual === 'number' && asesor.metaMensual > 0 ? (
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
                        ) : (
                          <LinearProgress
                            variant="determinate"
                            value={0}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#e5e7eb',
                              '& .MuiLinearProgress-bar': { backgroundColor: '#f59e0b' }
                            }}
                          />
                        )}
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
                        onClick={(e) => handleMenuClick(e, asesor)}
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
        <MenuItem onClick={handleVerReportes}>Ver reportes</MenuItem>
      </Menu>

      {/* Modal de reportes */}
      {selectedAsesor && (
        <AsesorReportModal
          open={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          asesorId={selectedAsesor.id}
          asesorNombre={selectedAsesor.nombre}
        />
      )}
    </Box>
  );
};

export default GtrAsesoresTable;
