import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  
  Card,
  CardContent,
  Chip,
  Button,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
// Usamos Grid estándar y añadimos component="div" en los items para mantener compatibilidad de tipos
import { Grid as MuiGrid } from '@mui/material';
const GridComponent = MuiGrid as unknown as any;
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FilterListIcon from '@mui/icons-material/FilterList';

interface ClienteResult {
  id: string;
  nombre: string;
  tipoCliente: string;
  asesorActual: string;
  montoCartera: number;
  estado: 'sin_validar' | 'pendiente' | 'validado' | 'rechazado';
  fechaIngreso: string;
  telefono: string;
  email: string;
}

const ValidacionesBusqueda: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('nombre');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [resultados, setResultados] = useState<ClienteResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const clientesEjemplo: ClienteResult[] = [
    {
      id: '1',
      nombre: 'María Elena Rodríguez García',
      tipoCliente: 'Premium',
      asesorActual: 'Ana García',
      montoCartera: 250000,
      estado: 'sin_validar',
      fechaIngreso: '2024-01-15',
      telefono: '+52 55 1234-5678',
      email: 'maria.rodriguez@email.com'
    },
    {
      id: '2',
      nombre: 'Carlos Alberto Mendoza',
      tipoCliente: 'Standard',
      asesorActual: 'Luis López',
      montoCartera: 125000,
      estado: 'pendiente',
      fechaIngreso: '2024-01-10',
      telefono: '+52 55 8765-4321',
      email: 'carlos.mendoza@email.com'
    }
  ];

  const handleSearch = () => {
    setIsSearching(true);
    // Simular búsqueda
    setTimeout(() => {
      const filtered = clientesEjemplo.filter(cliente => {
        if (tipoFiltro === 'nombre') {
          return cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (tipoFiltro === 'asesor') {
          return cliente.asesorActual.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (tipoFiltro === 'email') {
          return cliente.email.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
      }).filter(cliente => {
        return estadoFiltro === 'todos' || cliente.estado === estadoFiltro;
      });
      
      setResultados(filtered);
      setIsSearching(false);
    }, 1000);
  };

  const getEstadoChip = (estado: string) => {
    const configs = {
      sin_validar: { color: '#dc2626', bgColor: '#fee2e2', label: 'Sin Validar' },
      pendiente: { color: '#d97706', bgColor: '#fef3c7', label: 'Pendiente' },
      validado: { color: '#059669', bgColor: '#d1fae5', label: 'Validado' },
      rechazado: { color: '#dc2626', bgColor: '#fee2e2', label: 'Rechazado' }
    };

    const config = configs[estado as keyof typeof configs];
    
    return (
      <Chip
        label={config.label}
        sx={{
          color: config.color,
          backgroundColor: config.bgColor,
          border: `1px solid ${config.color}`,
          fontWeight: 600,
          fontSize: 11
        }}
      />
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <Box sx={{ 
      flexGrow: 1, 
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      p: 3
    }}>
      <Container maxWidth="xl">
        {/* Encabezado */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#1f2937',
              mb: 1
            }}
          >
            Búsqueda de Clientes
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#6b7280',
              fontSize: 16
            }}
          >
            Encuentra clientes específicos para gestionar su proceso de validación
          </Typography>
        </Box>

        {/* Panel de búsqueda */}
        <Paper sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 3 }}>
            Criterios de Búsqueda
          </Typography>
          
          <GridComponent container spacing={3}>
            <GridComponent item component="div" xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Búsqueda</InputLabel>
                <Select
                  value={tipoFiltro}
                  label="Tipo de Búsqueda"
                  onChange={(e) => setTipoFiltro(e.target.value)}
                >
                  <MenuItem value="nombre">Por Nombre</MenuItem>
                  <MenuItem value="asesor">Por Asesor</MenuItem>
                  <MenuItem value="email">Por Email</MenuItem>
                </Select>
              </FormControl>
            </GridComponent>
            
            <GridComponent item component="div" xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder={`Buscar por ${tipoFiltro}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#6b7280' }} />
                    </InputAdornment>
                  ),
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </GridComponent>
            
            <GridComponent item component="div" xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estadoFiltro}
                  label="Estado"
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="sin_validar">Sin Validar</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="validado">Validado</MenuItem>
                  <MenuItem value="rechazado">Rechazado</MenuItem>
                </Select>
              </FormControl>
            </GridComponent>
            
            <GridComponent item component="div" xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                startIcon={<FilterListIcon />}
                sx={{
                  backgroundColor: '#059669',
                  '&:hover': { backgroundColor: '#047857' },
                  height: '40px'
                }}
              >
                {isSearching ? 'Buscando...' : 'Buscar'}
              </Button>
            </GridComponent>
          </GridComponent>
        </Paper>

        {/* Resultados */}
        {resultados.length > 0 && (
          <Paper sx={{ 
            p: 3, 
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 3 }}>
              Resultados de Búsqueda ({resultados.length} encontrados)
            </Typography>
            
            <GridComponent container spacing={3}>
              {resultados.map((cliente) => (
                <GridComponent item component="div" xs={12} key={cliente.id}>
                  <Card sx={{ 
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                    '&:hover': { 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      borderColor: '#059669'
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 1 }}>
                            {cliente.nombre}
                          </Typography>
                          {getEstadoChip(cliente.estado)}
                        </Box>
                        
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            backgroundColor: '#059669',
                            '&:hover': { backgroundColor: '#047857' }
                          }}
                        >
                          Iniciar Validación
                        </Button>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <GridComponent container spacing={3}>
                        <GridComponent item component="div" xs={12} sm={6} md={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PersonIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                              Asesor Actual
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#1f2937', fontWeight: 600 }}>
                            {cliente.asesorActual}
                          </Typography>
                        </GridComponent>
                        
                        <GridComponent item component="div" xs={12} sm={6} md={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <BusinessIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                              Tipo Cliente
                            </Typography>
                          </Box>
                          <Chip
                            label={cliente.tipoCliente}
                            size="small"
                            sx={{
                              backgroundColor: cliente.tipoCliente === 'VIP' ? '#ede9fe' : 
                                             cliente.tipoCliente === 'Premium' ? '#dbeafe' : '#f3f4f6',
                              color: cliente.tipoCliente === 'VIP' ? '#7c3aed' :
                                     cliente.tipoCliente === 'Premium' ? '#2563eb' : '#6b7280',
                              fontWeight: 500
                            }}
                          />
                        </GridComponent>
                        
                        <GridComponent item component="div" xs={12} sm={6} md={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AccountBalanceIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                              Monto Cartera
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#1f2937', fontWeight: 600 }}>
                            {formatCurrency(cliente.montoCartera)}
                          </Typography>
                        </GridComponent>
                        
                        <GridComponent item component="div" xs={12} sm={6} md={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <DateRangeIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                            <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                              Fecha Ingreso
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#1f2937', fontWeight: 600 }}>
                            {new Date(cliente.fechaIngreso).toLocaleDateString('es-MX')}
                          </Typography>
                        </GridComponent>
                      </GridComponent>
                      
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e5e7eb' }}>
                        <GridComponent container spacing={2}>
                          <GridComponent item component="div" xs={12} sm={6}>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                              Teléfono: {cliente.telefono}
                            </Typography>
                          </GridComponent>
                          <GridComponent item component="div" xs={12} sm={6}>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                              Email: {cliente.email}
                            </Typography>
                          </GridComponent>
                        </GridComponent>
                      </Box>
                    </CardContent>
                  </Card>
                </GridComponent>
              ))}
            </GridComponent>
          </Paper>
        )}

        {/* Mensaje cuando no hay resultados */}
        {resultados.length === 0 && searchTerm && !isSearching && (
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            border: '1px solid #e5e7eb'
          }}>
            <SearchIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#6b7280', mb: 1 }}>
              No se encontraron resultados
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              Intenta con diferentes términos de búsqueda o ajusta los filtros
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default ValidacionesBusqueda;