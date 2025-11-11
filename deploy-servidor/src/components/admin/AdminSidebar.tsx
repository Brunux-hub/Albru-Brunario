import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import { Home, Settings, ExitToApp } from '@mui/icons-material';

const AdminSidebar: React.FC = () => {
  return (
    <Box
      sx={{
        width: 280,
        height: '100vh',
        bgcolor: '#1976d2', // Azul primario de Angular Material
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1200,
        boxShadow: '0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14)' // Sombra Angular Material
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
          Admin General
        </Typography>
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

      {/* Menu Items */}
      <List sx={{ flex: 1, px: 2, py: 3 }}>
        {/* Admin General - Active */}
        <ListItem
          sx={{
            mb: 1,
            borderRadius: 0, // Angular no usa border-radius en items
            bgcolor: 'rgba(255,255,255,0.12)', // Fondo Angular Material
            borderLeft: '4px solid #fff', // Indicador izquierdo Angular
            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <Home />
          </ListItemIcon>
          <ListItemText 
            primary="Admin General" 
            sx={{ 
              '& .MuiListItemText-primary': { 
                fontWeight: 600,
                fontSize: '0.95rem'
              } 
            }} 
          />
        </ListItem>

        {/* Configuración */}
        <ListItem
          sx={{
            mb: 1,
            borderRadius: 0,
            cursor: 'pointer',
            '&:hover': { 
              bgcolor: 'rgba(255,255,255,0.04)',
              borderLeft: '4px solid transparent'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <Settings />
          </ListItemIcon>
          <ListItemText 
            primary="Configuración" 
            sx={{ 
              '& .MuiListItemText-primary': { 
                fontSize: '0.95rem'
              } 
            }} 
          />
        </ListItem>
      </List>

      {/* Bottom Section - Cerrar Sesión */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />
        <ListItem
          sx={{
            borderRadius: 2,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'rgba(231, 76, 60, 0.2)' }
          }}
        >
          <ListItemIcon sx={{ color: '#e74c3c', minWidth: 40 }}>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText 
            primary="Cerrar Sesión" 
            sx={{ 
              '& .MuiListItemText-primary': { 
                fontSize: '0.95rem',
                color: '#e74c3c'
              } 
            }} 
          />
        </ListItem>
      </Box>
    </Box>
  );
};

export default AdminSidebar;