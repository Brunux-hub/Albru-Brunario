import { createTheme } from '@mui/material/styles';

// Tema Corporativo Profesional - Diseño Empresarial Serio
const corporateTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a365d', // Azul corporativo más oscuro y distintivo
      light: '#2c5aa0',
      dark: '#0f2027',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#718096', // Gris corporativo moderno
      light: '#a0aec0',
      dark: '#4a5568',
      contrastText: '#ffffff'
    },
    success: {
      main: '#27ae60', // Verde corporativo
      light: '#2ecc71',
      dark: '#229954'
    },
    warning: {
      main: '#f39c12', // Naranja profesional
      light: '#e67e22',
      dark: '#d68910'
    },
    error: {
      main: '#e74c3c', // Rojo corporativo
      light: '#ec7063',
      dark: '#c0392b'
    },
    info: {
      main: '#3498db', // Azul información
      light: '#5dade2',
      dark: '#2980b9'
    },
    background: {
      default: '#f7fafc', // Fondo corporativo más claro
      paper: '#ffffff'
    },
    text: {
      primary: '#1a202c', // Texto principal más oscuro
      secondary: '#4a5568' // Texto secundario corporativo
    }
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Arial", sans-serif', // Fuente corporativa moderna
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#2c3e50'
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#2c3e50'
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#2c3e50'
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#2c3e50'
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#2c3e50'
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#2c3e50'
    },
    body1: {
      fontSize: '0.9rem',
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#2c3e50'
    },
    body2: {
      fontSize: '0.8rem',
      fontWeight: 400,
      lineHeight: 1.4,
      color: '#5d6d7e'
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.3,
      color: '#5d6d7e'
    },
    button: {
      fontSize: '0.85rem',
      fontWeight: 600,
      letterSpacing: '0.5px',
      textTransform: 'uppercase'
    }
  },
  shape: {
    borderRadius: 6 // Bordes corporativos suaves
  },
  shadows: [
    'none',
    '0 1px 3px rgba(44, 62, 80, 0.08)', // Sombras sutiles
    '0 2px 6px rgba(44, 62, 80, 0.08)',
    '0 3px 12px rgba(44, 62, 80, 0.08)',
    '0 4px 20px rgba(44, 62, 80, 0.08)',
    '0 5px 25px rgba(44, 62, 80, 0.08)',
    '0 6px 30px rgba(44, 62, 80, 0.08)',
    '0 7px 35px rgba(44, 62, 80, 0.08)',
    '0 8px 40px rgba(44, 62, 80, 0.08)',
    '0 9px 45px rgba(44, 62, 80, 0.08)',
    '0 10px 50px rgba(44, 62, 80, 0.08)',
    '0 11px 55px rgba(44, 62, 80, 0.08)',
    '0 12px 60px rgba(44, 62, 80, 0.08)',
    '0 13px 65px rgba(44, 62, 80, 0.08)',
    '0 14px 70px rgba(44, 62, 80, 0.08)',
    '0 15px 75px rgba(44, 62, 80, 0.08)',
    '0 16px 80px rgba(44, 62, 80, 0.08)',
    '0 17px 85px rgba(44, 62, 80, 0.08)',
    '0 18px 90px rgba(44, 62, 80, 0.08)',
    '0 19px 95px rgba(44, 62, 80, 0.08)',
    '0 20px 100px rgba(44, 62, 80, 0.08)',
    '0 21px 105px rgba(44, 62, 80, 0.08)',
    '0 22px 110px rgba(44, 62, 80, 0.08)',
    '0 23px 115px rgba(44, 62, 80, 0.08)',
    '0 24px 120px rgba(44, 62, 80, 0.08)'
  ],
  components: {
    // Configuraciones específicas para diseño corporativo profesional
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(44, 62, 80, 0.08)',
          border: '1px solid #e9ecef',
          borderRadius: 8,
          backgroundColor: '#ffffff',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(44, 62, 80, 0.12)',
            transform: 'none' // Sin animaciones
          },
          '& .MuiCardContent-root': {
            padding: '16px 20px',
            '&:last-child': {
              paddingBottom: '16px'
            }
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: '0.5px',
          minHeight: '40px',
          padding: '8px 20px',
          fontSize: '0.85rem',
          boxShadow: 'none',
          border: '1px solid transparent',
          '&:hover': {
            boxShadow: 'none',
            transform: 'none' // Sin animaciones
          }
        },
        containedPrimary: {
          backgroundColor: '#1a365d',
          color: '#ffffff',
          border: '1px solid #1a365d',
          '&:hover': {
            backgroundColor: '#0f2027',
            border: '1px solid #0f2027'
          }
        },
        outlinedPrimary: {
          color: '#2c3e50',
          border: '1px solid #2c3e50',
          '&:hover': {
            backgroundColor: 'rgba(44, 62, 80, 0.04)',
            border: '1px solid #2c3e50'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(44, 62, 80, 0.08)',
          border: '1px solid #e9ecef'
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(44, 62, 80, 0.08)'
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(44, 62, 80, 0.08)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: '28px',
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 6,
          backgroundColor: '#f8f9fa',
          color: '#2c3e50',
          border: '1px solid #e9ecef'
        },
        colorSuccess: {
          backgroundColor: '#d5f4e6',
          color: '#27ae60',
          border: '1px solid #27ae60'
        },
        colorError: {
          backgroundColor: '#fdeaea',
          color: '#e74c3c',
          border: '1px solid #e74c3c'
        },
        colorWarning: {
          backgroundColor: '#fef5e7',
          color: '#f39c12',
          border: '1px solid #f39c12'
        },
        colorInfo: {
          backgroundColor: '#ebf3fd',
          color: '#3498db',
          border: '1px solid #3498db'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          fontSize: '0.85rem',
          borderBottom: '1px solid #e9ecef',
          color: '#2c3e50'
        },
        head: {
          backgroundColor: '#f8f9fa',
          fontWeight: 600,
          color: '#2c3e50',
          borderBottom: '2px solid #dee2e6'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#2c3e50',
          boxShadow: '0 2px 8px rgba(44, 62, 80, 0.15)',
          borderBottom: '1px solid #34495e'
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '&.section-title': {
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#2c3e50',
            marginBottom: '16px'
          },
          '&.kpi-title': {
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#5d6d7e',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          },
          '&.kpi-value': {
            fontSize: '1.8rem',
            fontWeight: 700,
            lineHeight: 1.1
          }
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '2px solid #e9ecef'
        },
        indicator: {
          backgroundColor: '#2c3e50',
          height: 3
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
          color: '#5d6d7e',
          minHeight: 48,
          '&.Mui-selected': {
            color: '#2c3e50'
          }
        }
      }
    }
  }
});

export default corporateTheme;