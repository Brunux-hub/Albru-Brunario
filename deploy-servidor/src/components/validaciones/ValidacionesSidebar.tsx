import React from 'react';
import { List, ListItemIcon, ListItemText, ListItemButton, ListItem, Typography, Box, Button, Divider, Avatar } from '@mui/material';

import { useAuth } from '../../hooks/useAuth';
import VerifiedIcon from '@mui/icons-material/Verified';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

const menuItems = [
  { text: 'Dashboard', icon: <VerifiedIcon /> },
  { text: 'Búsqueda', icon: <SearchIcon /> },
  { text: 'Validación', icon: <AssignmentIcon /> },
  { text: 'Reportes', icon: <BarChartIcon /> },
  { text: 'Configuración', icon: <SettingsIcon /> },
];

const ValidacionesSidebar: React.FC<{ onSelect: (section: string) => void, selected: string }> = ({ onSelect, selected }) => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  // Obtener nombre del contexto unificado
  const nombreValidador = user?.nombre || 'Validador';
  const iniciales = nombreValidador.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  return (
    <Box
      sx={{
        width: { xs: 88, md: 220 },
        minWidth: 88,
        height: '100vh',
        backgroundColor: '#059669',
        color: 'white',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(2,6,23,0.08)'
      }}
    >
      <Box sx={{ p: 3, borderBottom: '1px solid #065f46' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: '#10b981', mr: 2, width: 44, height: 44 }}>{iniciales}</Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">Validaciones</Typography>
            <Typography variant="caption" sx={{ color: '#a7f3d0' }}>
              {nombreValidador}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <List sx={{ flex: 1 }}>
        {menuItems.map(item => (
          <ListItem disablePadding key={item.text}>
            <ListItemButton 
              selected={selected === item.text} 
              onClick={() => onSelect(item.text)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#34d399',
                  color: '#064e3b',
                  '&:hover': {
                    backgroundColor: '#10b981',
                  }
                },
                '&:hover': {
                  backgroundColor: '#065f46',
                },
                color: 'white',
                margin: '4px 8px',
                borderRadius: '8px'
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: '40px' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Sección de cerrar sesión */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ backgroundColor: '#065f46', mb: 2 }} />
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            color: '#f0fdf4',
            borderColor: '#065f46',
            textTransform: 'none',
            fontWeight: 500,
            py: 1.5,
            '&:hover': {
              backgroundColor: '#dc2626',
              borderColor: '#dc2626',
              color: 'white'
            }
          }}
        >
          Cerrar Sesión
        </Button>
      </Box>
    </Box>
  );
};

export default ValidacionesSidebar;