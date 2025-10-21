import React from 'react';
import { List, ListItemIcon, ListItemText, ListItemButton, ListItem, Typography, Box, Button, Divider } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useUnifiedAuth as useAuth } from '../../hooks/useAuth';

const menuItems = [
  { text: 'Clientes', icon: <PeopleIcon /> },
  { text: 'Asesores', icon: <AssignmentIndIcon /> },
  { text: 'Reportes', icon: <BarChartIcon /> },
  { text: 'Configuración', icon: <SettingsIcon /> },
];

const GtrSidebar: React.FC<{ onSelect: (section: string) => void, selected: string }> = ({ onSelect, selected }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    console.log('🚪 GtrSidebar - Logout iniciado');
    logout();
  };

  return (
    <Box
      sx={{
        width: 220,
        height: '100vh',
        backgroundColor: '#1e293b',
        color: 'white',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1200,
        display: { xs: 'none', md: 'flex' }, // Ocultar en móviles por ahora
        flexDirection: 'column',
        boxShadow: '4px 0 8px rgba(0,0,0,0.1)'
      }}
    >
      <Box sx={{ p: 3, borderBottom: '1px solid #334155' }}>
        <Typography variant="h6" fontWeight="bold">GTR Admin</Typography>
      </Box>
      
      <List sx={{ flex: 1 }}>
        {menuItems.map(item => (
          <ListItem disablePadding key={item.text}>
            <ListItemButton 
              selected={selected === item.text} 
              onClick={() => onSelect(item.text)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#3b82f6',
                  '&:hover': {
                    backgroundColor: '#2563eb',
                  }
                },
                '&:hover': {
                  backgroundColor: '#334155',
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
        <Divider sx={{ backgroundColor: '#334155', mb: 2 }} />
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            color: '#f1f5f9',
            borderColor: '#475569',
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

export default GtrSidebar;
