import React from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';

const ProductosTab: React.FC = () => {
  const productos = [
    { 
      nombre: 'Fibra Óptica', 
      porcentaje: 41.8, 
      ventas: 28, 
      ingresos: 42000,
      color: '#1976d2' 
    },
    { 
      nombre: 'Cable + Internet', 
      porcentaje: 26.9, 
      ventas: 18, 
      ingresos: 27000,
      color: '#2ecc71' 
    },
    { 
      nombre: 'Internet Móvil', 
      porcentaje: 17.9, 
      ventas: 12, 
      ingresos: 18000,
      color: '#f39c12' 
    },
    { 
      nombre: 'Televisión', 
      porcentaje: 9.0, 
      ventas: 6, 
      ingresos: 9000,
      color: '#e74c3c' 
    },
    { 
      nombre: 'Combo Premium', 
      porcentaje: 4.5, 
      ventas: 3, 
      ingresos: 4500,
      color: '#9b59b6' 
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
        
        {/* Distribución por Producto - Gráfico Circular */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Distribución por Producto
          </Typography>
          
          {/* Simulación de gráfico circular */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: 250,
            position: 'relative'
          }}>
            <Box sx={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: `conic-gradient(
                #1976d2 0deg ${41.8 * 3.6}deg,
                #2ecc71 ${41.8 * 3.6}deg ${(41.8 + 26.9) * 3.6}deg,
                #f39c12 ${(41.8 + 26.9) * 3.6}deg ${(41.8 + 26.9 + 17.9) * 3.6}deg,
                #e74c3c ${(41.8 + 26.9 + 17.9) * 3.6}deg ${(41.8 + 26.9 + 17.9 + 9.0) * 3.6}deg,
                #9b59b6 ${(41.8 + 26.9 + 17.9 + 9.0) * 3.6}deg 360deg
              )`,
              border: '8px solid white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }} />
          </Box>
        </Paper>

        {/* Ingresos por Producto - Gráfico de Barras Horizontal */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Ingresos por Producto
          </Typography>
          
          <Box sx={{ display: 'grid', gap: 2 }}>
            {productos.map((producto, index) => (
              <Box key={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {producto.nombre}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ${(producto.ingresos / 1000).toFixed(0)}K
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(producto.ingresos / 45000) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#f0f0f0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: producto.color,
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* Detalle por Producto */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Detalle por Producto
        </Typography>
        
        <Box sx={{ display: 'grid', gap: 2 }}>
          {productos.map((producto, index) => (
            <Box 
              key={index}
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                bgcolor: '#fafafa',
                borderRadius: 2,
                border: '1px solid #f0f0f0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: producto.color
                }} />
                
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {producto.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {producto.porcentaje}% del total
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {producto.ventas} ventas
                </Typography>
                <Typography variant="body2" sx={{ color: '#2ecc71', fontWeight: 600 }}>
                  ${producto.ingresos.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default ProductosTab;