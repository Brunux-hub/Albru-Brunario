import React from 'react';
import { List, ListItemIcon, ListItemText, ListItemButton, ListItem, Typography, Box, Avatar, Divider } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useAuth } from '../../hooks/useAuth';

const menuItems = [
  { text: 'Clientes', icon: <PeopleIcon /> },
  { text: 'Asesores', icon: <AssignmentIndIcon /> },
  { text: 'Gestión del día', icon: <CalendarTodayIcon /> },
];

const GtrSidebar: React.FC<{ onSelect: (section: string) => void, selected: string }> = ({ onSelect, selected }) => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    console.log('🚪 GtrSidebar - Logout iniciado');
    logout();
  };

  return (
    <Box
      sx={{
        width: 240,
        height: '100vh',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1200,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column'
      }}
    >
      {/* Header con logo/título */}
      <Box sx={{ 
        p: 2.5, 
        display: 'flex', 
        alignItems: 'center',
        gap: 1.5,
        borderBottom: '1px solid #e5e7eb'
      }}>
        <Box sx={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          bgcolor: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'white'
        }}>
          G
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', fontSize: '1rem', lineHeight: 1.2 }}>
            Panel GTR
          </Typography>
          <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
            Sistema de gestión
          </Typography>
        </Box>
      </Box>
      
      {/* Lista de navegación */}
      <List sx={{ flex: 1, px: 1.5, pt: 2 }}>
        {menuItems.map(item => (
          <ListItem disablePadding key={item.text} sx={{ mb: 0.5 }}>
            <ListItemButton 
              selected={selected === item.text} 
              onClick={() => onSelect(item.text)}
              sx={{
                borderRadius: '10px',
                py: 1.2,
                px: 1.5,
                '&.Mui-selected': {
                  backgroundColor: '#eff6ff',
                  color: '#3b82f6',
                  '& .MuiListItemIcon-root': {
                    color: '#3b82f6'
                  },
                  '&:hover': {
                    backgroundColor: '#dbeafe',
                  }
                },
                '&:hover': {
                  backgroundColor: '#f9fafb',
                },
                transition: 'all 0.2s'
              }}
            >
              <ListItemIcon sx={{ 
                color: selected === item.text ? '#3b82f6' : '#6b7280', 
                minWidth: '36px',
                fontSize: '1.25rem'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: selected === item.text ? 600 : 500,
                  color: selected === item.text ? '#3b82f6' : '#374151'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Sección de usuario y logout */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          p: 1.5,
          borderRadius: '10px',
          bgcolor: '#f9fafb',
          mb: 1.5
        }}>
          <Avatar sx={{ 
            width: 36, 
            height: 36, 
            bgcolor: '#3b82f6',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            {user?.nombre?.charAt(0) || 'G'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ 
              fontWeight: 600, 
              color: '#111827',
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.nombre || 'Administrador'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
              Administrador
            </Typography>
          </Box>
        </Box>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: '10px',
            py: 1.2,
            px: 1.5,
            border: '1px solid #e5e7eb',
            '&:hover': {
              backgroundColor: '#fef2f2',
              borderColor: '#fecaca',
              '& .MuiListItemIcon-root': {
                color: '#dc2626'
              },
              '& .MuiListItemText-primary': {
                color: '#dc2626'
              }
            }
          }}
        >
          <ListItemIcon sx={{ color: '#6b7280', minWidth: '36px', fontSize: '1.25rem' }}>
            <ExitToAppIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Cerrar sesión"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151'
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
};

export default GtrSidebar;
