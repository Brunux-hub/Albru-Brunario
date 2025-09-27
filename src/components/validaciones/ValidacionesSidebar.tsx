import React from 'react';
import { List, ListItemIcon, ListItemText, ListItemButton, ListItem, Typography, Box, Button, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        width: 220,
        height: '100vh',
        backgroundColor: '#059669',
        color: 'white',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ p: 3, borderBottom: '1px solid #065f46' }}>
        <Typography variant="h6" fontWeight="bold">Validaciones</Typography>
      </Box>
      
      <List sx={{ flex: 1 }}>
        {menuItems.map(item => (
          <ListItem disablePadding key={item.text}>
            <ListItemButton 
              selected={selected === item.text} 
              onClick={() => onSelect(item.text)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#10b981',
                  '&:hover': {
                    backgroundColor: '#059669',
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