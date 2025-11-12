import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import axios from 'axios';

const ValidacionesSummary: React.FC = () => {
  const [stats, setStats] = useState({
    clientes_asignados: 0,
    clientes_validados: 0,
    pendientes: 0,
    clientes_aprobados: 0,
    clientes_rechazados: 0
  });
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/api/validadores/mis-estadisticas`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setStats(response.data.estadisticas);
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [API_URL]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
        <CircularProgress />
      </Box>
    );
  }

  const eficiencia = stats.clientes_asignados > 0 
    ? ((stats.clientes_validados / stats.clientes_asignados) * 100).toFixed(1)
    : 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#1f2937', mb: 3 }}>
        Resumen de Validaciones
      </Typography>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 3 
      }}>
        {/* Total Clientes */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PeopleIcon sx={{ color: '#2563eb', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937' }}>
                  {stats.clientes_asignados + stats.pendientes}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: 11 }}>
                  Total Clientes
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Sin Validar */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #fee2e2'
        }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CancelIcon sx={{ color: '#dc2626', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#dc2626' }}>
                  {stats.clientes_rechazados}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: 11 }}>
                  Rechazados
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Validados */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #d1fae5'
        }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#059669' }}>
                  {stats.clientes_aprobados}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: 11 }}>
                  Aprobados
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Pendientes */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #fef3c7'
        }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PendingIcon sx={{ color: '#d97706', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#d97706' }}>
                  {stats.pendientes}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: 11 }}>
                  Pendientes
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Eficiencia */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e0e7ff'
        }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUpIcon sx={{ color: '#6366f1', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#6366f1' }}>
                  {eficiencia}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: 11 }}>
                  Eficiencia
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Completados */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f3e8ff'
        }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#f3e8ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AssignmentIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
                  {stats.clientes_asignados}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: 11 }}>
                  Asignados Hoy
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ValidacionesSummary;