// Componente de demostración de temas personalizados - Versión simplificada
import React from 'react';
import { 
  Box, 
  Container, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  Chip,
  Avatar,
  Stack
} from '@mui/material';
import { useTheme, usePermissions } from '../hooks/useTheme';
import CustomAppBar from './CustomAppBar';

const ThemeDemo: React.FC = () => {
  const { userConfig, theme } = useTheme();
  const { hasPermission, permissions } = usePermissions();

  if (!userConfig) {
    return <div>Cargando configuración del usuario...</div>;
  }

  return (
    <Box>
      <CustomAppBar title="Demo de Temas Personalizados" />
      
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Stack spacing={3}>
          {/* Información del Usuario */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Card sx={{ flex: 1, minWidth: 300 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información del Usuario
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Avatar
                    src={userConfig.logo}
                    alt={userConfig.brandName}
                    sx={{ width: 60, height: 60, mb: 2 }}
                  />
                  <Typography variant="h5" color="primary">
                    {userConfig.brandName}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Usuario: {userConfig.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {userConfig.userId}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Configuración de Tema */}
            <Card sx={{ flex: 1, minWidth: 300 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configuración de Tema
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box 
                      sx={{ 
                        width: 30, 
                        height: 30, 
                        backgroundColor: theme?.primary,
                        borderRadius: 1 
                      }} 
                    />
                    <Typography>Primario: {theme?.primary}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box 
                      sx={{ 
                        width: 30, 
                        height: 30, 
                        backgroundColor: theme?.secondary,
                        borderRadius: 1 
                      }} 
                    />
                    <Typography>Secundario: {theme?.secondary}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box 
                      sx={{ 
                        width: 30, 
                        height: 30, 
                        backgroundColor: theme?.accent,
                        borderRadius: 1 
                      }} 
                    />
                    <Typography>Acento: {theme?.accent}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Permisos */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Permisos del Usuario
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {permissions.map((permission) => (
                  <Chip
                    key={permission}
                    label={permission}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Botones de Ejemplo */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Componentes con Tema Personalizado
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" color="primary">
                  Botón Primario
                </Button>
                <Button variant="contained" color="secondary">
                  Botón Secundario
                </Button>
                <Button variant="outlined" color="primary">
                  Botón Outlined
                </Button>
                
                {hasPermission('wizard_access') && (
                  <Button variant="contained" sx={{ bgcolor: theme?.accent }}>
                    Acceso Wizard
                  </Button>
                )}
                
                {hasPermission('full_access') && (
                  <Button variant="contained" color="error">
                    Admin Access
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default ThemeDemo;