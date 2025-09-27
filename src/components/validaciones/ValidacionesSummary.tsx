import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';

const ValidacionesSummary: React.FC = () => {
  const [stats] = useState({
    totalClientes: 8,
    sinValidar: 2,
    validados: 3,
    pendientes: 5,
    eficiencia: 62.5,
    completados: 3
  });

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
                  {stats.totalClientes}
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
                  {stats.sinValidar}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: 11 }}>
                  Sin Validar
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
                  {stats.validados}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: 11 }}>
                  Validados
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
                  {stats.eficiencia}%
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
                  {stats.completados}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: 11 }}>
                  Completados
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