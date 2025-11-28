import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const TendenciasTab: React.FC = () => {
  // Datos para el gráfico de Evolución de Ventas
  const ventasData = [
    { mes: 'Ene', ventas: 45, tendencia: 50 },
    { mes: 'Feb', ventas: 52, tendencia: 48 },
    { mes: 'Mar', ventas: 38, tendencia: 46 },
    { mes: 'Abr', ventas: 61, tendencia: 58 },
    { mes: 'May', ventas: 54, tendencia: 56 },
    { mes: 'Jun', ventas: 51, tendencia: 54 },
    { mes: 'Jul', ventas: 43, tendencia: 52 },
    { mes: 'Ago', ventas: 58, tendencia: 60 },
    { mes: 'Sep', ventas: 63, tendencia: 62 },
    { mes: 'Oct', ventas: 47, tendencia: 58 },
    { mes: 'Nov', ventas: 53, tendencia: 60 },
    { mes: 'Dic', ventas: 68, tendencia: 64 }
  ];

  // Datos para el gráfico de Ingresos y Conversión
  const ingresosData = [
    { mes: 'Ene', ingresos: 65000, conversion: 12 },
    { mes: 'Feb', ingresos: 78000, conversion: 13 },
    { mes: 'Mar', ingresos: 58000, conversion: 11 },
    { mes: 'Abr', ingresos: 92000, conversion: 15 },
    { mes: 'May', ingresos: 81000, conversion: 14 },
    { mes: 'Jun', ingresos: 76000, conversion: 13 },
    { mes: 'Jul', ingresos: 64000, conversion: 12 },
    { mes: 'Ago', ingresos: 87000, conversion: 16 },
    { mes: 'Sep', ingresos: 95000, conversion: 17 },
    { mes: 'Oct', ingresos: 71000, conversion: 13 },
    { mes: 'Nov', ingresos: 79000, conversion: 15 },
    { mes: 'Dic', ingresos: 102000, conversion: 18 }
  ];

  return (
    <Box>
      {/* Gráficos superiores */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
        
        {/* Evolución de Ventas */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Evolución de Ventas
          </Typography>
          
          {/* Gráfico de barras con línea de tendencia */}
          <Box sx={{ height: 250, position: 'relative' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'end', 
              height: '100%', 
              gap: 0.5,
              pb: 3
            }}>
              {ventasData.map((item, index) => (
                <Box key={index} sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <Box
                    sx={{
                      width: '80%',
                      height: `${(item.ventas / 80) * 100}%`,
                      bgcolor: '#1976d2',
                      borderRadius: '2px 2px 0 0',
                      mb: 1,
                      minHeight: 10,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: '#1565c0'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    {item.mes}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            {/* Simulación de línea de tendencia */}
            <Box sx={{
              position: 'absolute',
              top: 20,
              left: 20,
              right: 20,
              height: 180,
              background: 'linear-gradient(45deg, transparent 48%, #e74c3c 49%, #e74c3c 51%, transparent 52%)',
              opacity: 0.6,
              pointerEvents: 'none'
            }} />
          </Box>
        </Paper>

        {/* Ingresos y Conversión */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Ingresos y Conversión
          </Typography>
          
          <Box sx={{ height: 250, position: 'relative' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'end', 
              height: '100%', 
              gap: 0.5,
              pb: 3
            }}>
              {ingresosData.map((item, index) => (
                <Box key={index} sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <Box
                    sx={{
                      width: '80%',
                      height: `${(item.ingresos / 120000) * 100}%`,
                      bgcolor: '#2ecc71',
                      borderRadius: '2px 2px 0 0',
                      mb: 1,
                      minHeight: 10,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: '#27ae60'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    {item.mes}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            {/* Simulación de línea de conversión */}
            <Box sx={{
              position: 'absolute',
              top: 30,
              left: 20,
              right: 20,
              height: 160,
              background: 'linear-gradient(15deg, transparent 48%, #f39c12 49%, #f39c12 51%, transparent 52%)',
              opacity: 0.7,
              pointerEvents: 'none'
            }} />
          </Box>
        </Paper>
      </Box>

      {/* Tendencia Anual Completa */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Tendencia Anual Completa
        </Typography>
        
        <Box sx={{ height: 300, position: 'relative', bgcolor: '#fafafa', borderRadius: 2, p: 2 }}>
          {/* Simulación de gráfico de área */}
          <Box sx={{
            height: '100%',
            background: `
              linear-gradient(to bottom, 
                rgba(25, 118, 210, 0.3) 0%,
                rgba(25, 118, 210, 0.2) 40%,
                rgba(25, 118, 210, 0.1) 70%,
                transparent 100%
              )
            `,
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Línea superior del área */}
            <Box sx={{
              position: 'absolute',
              top: '20%',
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, #1976d2 0%, #1976d2 20%, #1565c0 40%, #0d47a1 60%, #1976d2 80%, #1976d2 100%)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -4,
                left: '60%',
                width: 8,
                height: 8,
                bgcolor: '#1976d2',
                borderRadius: '50%'
              }
            }} />
            
            {/* Tooltip simulado */}
            <Box sx={{
              position: 'absolute',
              top: '10%',
              left: '58%',
              bgcolor: 'white',
              p: 1,
              borderRadius: 1,
              boxShadow: 2,
              fontSize: '0.75rem'
            }}>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>Jul</Typography>
              <Typography variant="caption" sx={{ color: '#1976d2' }}>Ingresos: 64500</Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#2ecc71' }}>ventas: 43</Typography>
            </Box>
          </Box>
          
          {/* Eje X simulado */}
          <Box sx={{ 
            position: 'absolute', 
            bottom: 10, 
            left: 20, 
            right: 20,
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((mes) => (
              <Typography key={mes} variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                {mes}
              </Typography>
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default TendenciasTab;