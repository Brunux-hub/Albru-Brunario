import React from 'react';
import { Box, Typography, Avatar, List, ListItemIcon, ListItemText, ListItemButton, Button } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../hooks/useAuth';

interface AsesorSidebarProps {
  tabActual?: number;
  onTabChange?: (tab: number) => void;
}

const AsesorSidebar: React.FC<AsesorSidebarProps> = ({ tabActual = 0, onTabChange }) => {
  const { logout, user } = useAuth();
  
  const handleCerrarSesion = () => {
    console.log('🚪 AsesorSidebar - Logout iniciado');
    logout();
  };

  // Obtener datos del usuario desde el contexto unificado
  const nombreAsesor = user?.nombre || 'Asesor';
  const iniciales = nombreAsesor.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  return (
    <Box sx={{ 
      width: 240, 
      bgcolor: 'white', 
      borderRight: '1px solid #e5e7eb',
      minHeight: '100vh', 
      p: 3,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo/Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ 
          width: 40, 
          height: 40, 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: '1.25rem'
        }}>
          A
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>Panel Asesor</Typography>
        </Box>
      </Box>

      {/* User Info */}
      <Box sx={{ 
        mb: 3, 
        p: 2, 
        bgcolor: '#f9fafb', 
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5
      }}>
        <Avatar sx={{ 
          bgcolor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          width: 44,
          height: 44,
          fontWeight: 600
        }}>{iniciales}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nombreAsesor}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FiberManualRecordIcon sx={{ fontSize: '0.5rem', color: '#22c55e' }} />
            En línea
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <List sx={{ px: 0 }}>
        <ListItemButton 
          selected={tabActual === 0} 
          onClick={() => onTabChange?.(0)}
          sx={{
            borderRadius: '10px',
            mb: 0.5,
            '&.Mui-selected': {
              bgcolor: '#eff6ff',
              '& .MuiListItemIcon-root': { color: '#3b82f6' },
              '& .MuiListItemText-primary': { color: '#3b82f6', fontWeight: 600 }
            },
            '&:hover': {
              bgcolor: '#f3f4f6'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: '#6b7280' }}><GroupIcon /></ListItemIcon>
          <ListItemText 
            primary="Mis Clientes" 
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </ListItemButton>
        <ListItemButton 
          selected={tabActual === 1} 
          onClick={() => onTabChange?.(1)}
          sx={{
            borderRadius: '10px',
            mb: 0.5,
            '&.Mui-selected': {
              bgcolor: '#eff6ff',
              '& .MuiListItemIcon-root': { color: '#3b82f6' },
              '& .MuiListItemText-primary': { color: '#3b82f6', fontWeight: 600 }
            },
            '&:hover': {
              bgcolor: '#f3f4f6'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: '#6b7280' }}><AssignmentIcon /></ListItemIcon>
          <ListItemText 
            primary="Gestiones del Día" 
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </ListItemButton>
        <ListItemButton 
          selected={tabActual === 2} 
          onClick={() => onTabChange?.(2)}
          sx={{
            borderRadius: '10px',
            mb: 0.5,
            '&.Mui-selected': {
              bgcolor: '#eff6ff',
              '& .MuiListItemIcon-root': { color: '#3b82f6' },
              '& .MuiListItemText-primary': { color: '#3b82f6', fontWeight: 600 }
            },
            '&:hover': {
              bgcolor: '#f3f4f6'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: '#6b7280' }}><HistoryIcon /></ListItemIcon>
          <ListItemText 
            primary="Mi Historial" 
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </ListItemButton>
      </List>
      
      {/* Logout Button */}
      <Box sx={{ mt: 'auto', pt: 3 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleCerrarSesion}
          sx={{
            color: '#ef4444',
            borderColor: '#fee2e2',
            bgcolor: '#fef2f2',
            borderRadius: '10px',
            py: 1,
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              bgcolor: '#ef4444',
              color: '#fff',
              borderColor: '#ef4444',
            },
          }}
        >
          Cerrar Sesión
        </Button>
      </Box>
    </Box>
  );
};

export default AsesorSidebar;
