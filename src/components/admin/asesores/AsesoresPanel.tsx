import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip, 
  Card, 
  CardContent, 
  Button,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../../../hooks/useAuth';
import FormularioAsesor from '../usuarios/FormularioAsesor';

interface Asesor {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  tipo: string;
  username: string;
  role: string;
  estado_acceso: 'pendiente' | 'activo' | 'suspendido';
  fecha_creacion: string;
  ultimo_login: string | null;
}

const AsesoresPanel: React.FC = () => {
  const { token } = useAuth();
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openFormulario, setOpenFormulario] = useState(false);

  const fetchAsesores = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/admin/asesores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAsesores(data.data);
      } else {
        setError(data.message || 'Error al cargar asesores');
      }
    } catch (error) {
      console.error('Error fetching asesores:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAsesores();
  }, [fetchAsesores]);

  const getStatusColor = (estado: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (estado) {
      case 'activo': return 'success';
      case 'pendiente': return 'warning';
      case 'suspendido': return 'error';
      default: return 'default';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gtr': return 'GTR';
      case 'asesor': return 'Asesor';
      case 'supervisor': return 'Supervisor';
      case 'validaciones': return 'Validaciones';
      default: return role;
    }
  };

  const handleFormularioSuccess = () => {
    fetchAsesores();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Header con estadísticas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
        <Card sx={{ minHeight: '85px' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                Total Asesores
              </Typography>
              <Typography sx={{ fontSize: '1.2rem', opacity: 0.7 }}>👥</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#3498db', fontSize: '1.25rem', lineHeight: 1.2 }}>
              {asesores.length}
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ minHeight: '85px' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                Activos
              </Typography>
              <Typography sx={{ fontSize: '1.2rem', opacity: 0.7 }}>✅</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2ecc71', fontSize: '1.25rem', lineHeight: 1.2 }}>
              {asesores.filter(a => a.estado_acceso === 'activo').length}
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ minHeight: '85px' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                Pendientes
              </Typography>
              <Typography sx={{ fontSize: '1.2rem', opacity: 0.7 }}>⏳</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f39c12', fontSize: '1.25rem', lineHeight: 1.2 }}>
              {asesores.filter(a => a.estado_acceso === 'pendiente').length}
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ minHeight: '85px' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                Suspendidos
              </Typography>
              <Typography sx={{ fontSize: '1.2rem', opacity: 0.7 }}>�</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#e74c3c', fontSize: '1.25rem', lineHeight: 1.2 }}>
              {asesores.filter(a => a.estado_acceso === 'suspendido').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabla de Asesores */}
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
            Gestión de Asesores
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenFormulario(true)}
            sx={{ 
              bgcolor: '#3498db',
              '&:hover': { bgcolor: '#2980b9' }
            }}
          >
            Agregar Asesor
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Teléfono</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Último Login</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {asesores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay asesores registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                asesores.map((asesor) => (
                  <TableRow key={asesor.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{asesor.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{asesor.nombre}</TableCell>
                    <TableCell>{asesor.email}</TableCell>
                    <TableCell>{asesor.telefono || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={asesor.tipo.toUpperCase()} 
                        size="small"
                        sx={{ bgcolor: '#ecf0f1', color: '#2c3e50' }}
                      />
                    </TableCell>
                    <TableCell>{getRoleText(asesor.role)}</TableCell>
                    <TableCell>{asesor.username}</TableCell>
                    <TableCell>
                      <Chip 
                        label={asesor.estado_acceso.toUpperCase()} 
                        color={getStatusColor(asesor.estado_acceso)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {asesor.ultimo_login 
                        ? new Date(asesor.ultimo_login).toLocaleString('es-ES')
                        : 'Nunca'
                      }
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" sx={{ color: '#3498db' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: '#e74c3c' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Formulario de Asesor */}
      <FormularioAsesor
        open={openFormulario}
        onClose={() => setOpenFormulario(false)}
        onSuccess={handleFormularioSuccess}
      />
    </Box>
  );
};

export default AsesoresPanel;