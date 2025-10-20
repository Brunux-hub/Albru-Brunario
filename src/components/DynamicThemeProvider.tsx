// Componente que aplica tema dinámico según el usuario logueado
import React, { useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useTheme } from '../hooks/useTheme';

interface DynamicThemeProviderProps {
  children: React.ReactNode;
}

const DynamicThemeProvider: React.FC<DynamicThemeProviderProps> = ({ children }) => {
  const { theme, userConfig, isLoading } = useTheme();

  const muiTheme = createTheme({
    palette: {
      primary: {
        main: theme?.primary || '#1976d2',
        contrastText: '#ffffff',
      },
      secondary: {
        main: theme?.secondary || '#dc004e',
        contrastText: '#ffffff',
      },
      background: {
        default: theme?.background || '#f5f5f5',
        paper: theme?.surface || '#ffffff',
      },
    },
    typography: {
      h6: {
        fontWeight: 600,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: theme?.primary || '#1976d2',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '8px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: '12px',
          },
        },
      },
    },
  });

  useEffect(() => {
    if (userConfig) {
      // Actualizar title de la página con el brand name
      document.title = `${userConfig.brandName} - CRM`;
      
      // Aplicar favicon personalizado si existe
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon && userConfig.logo) {
        favicon.href = userConfig.logo;
      }
    }
  }, [userConfig]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div>Cargando configuración...</div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default DynamicThemeProvider;