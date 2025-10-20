// Barra de navegación personalizada según el usuario
import React from 'react';
import { AppBar, Toolbar, Typography, Box, Avatar, Chip } from '@mui/material';
import { useTheme } from '../hooks/useTheme';

interface CustomAppBarProps {
  title?: string;
}

const CustomAppBar: React.FC<CustomAppBarProps> = ({ title }) => {
  const { userConfig } = useTheme();

  if (!userConfig) return null;

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        {/* Logo y Brand Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {userConfig.logo && (
            <Avatar
              src={userConfig.logo}
              alt={userConfig.brandName}
              sx={{ width: 40, height: 40, mr: 2 }}
            />
          )}
          <Typography variant="h6" component="div">
            {title || userConfig.brandName}
          </Typography>
        </Box>

        {/* Información del usuario */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={userConfig.userId.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
          <Typography variant="body2">
            {userConfig.name}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default CustomAppBar;