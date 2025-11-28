import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';

const CanalesTab: React.FC = () => {
  const canalesData = [
    { nombre: 'WSP 1', ventas: 22, conversion: 15.8, ingresos: 33000 },
    { nombre: 'WSP 2', ventas: 18, conversion: 12.4, ingresos: 27000 },
    { nombre: 'WSP 4', ventas: 15, conversion: 11.2, ingresos: 22500 },
    { nombre: 'REFERIDOS', ventas: 8, conversion: 28.5, ingresos: 12000, destacado: true },
    { nombre: 'MEDIOS', ventas: 3, conversion: 8.1, ingresos: 4500 },
    { nombre: 'CREATIVA', ventas: 1, conversion: 5.5, ingresos: 1500 }
  ];

  return (
    <Box>
      {/* Gráfico de Rendimiento por Canal */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Rendimiento por Canal
        </Typography>
        
        {/* Gráfico de barras con línea de conversión */}
        <Box sx={{ height: 250, position: 'relative' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'end', 
            height: '85%', 
            gap: 1,
            pb: 2
          }}>
            {canalesData.map((canal, index) => (
              <Box key={index} sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                height: '100%',
                position: 'relative'
              }}>
                <Box
                  sx={{
                    width: '80%',
                    height: `${(canal.ventas / 24) * 100}%`,
                    bgcolor: canal.destacado ? '#e74c3c' : '#1976d2',
                    borderRadius: '2px 2px 0 0',
                    mb: 1,
                    minHeight: 15,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: canal.destacado ? '#c0392b' : '#1565c0',
                      transform: 'translateY(-2px)'
                    }
                  }}
                />
                
                {/* Tooltip para REFERIDOS */}
                {canal.destacado && (
                  <Box sx={{
                    position: 'absolute',
                    top: -50,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: 'white',
                    p: 1,
                    borderRadius: 1,
                    boxShadow: 2,
                    fontSize: '0.75rem',
                    zIndex: 1
                  }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                      REFERIDOS
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#e74c3c' }}>
                      conversión: 28.5
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#1976d2' }}>
                      ventas: 8
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="caption" sx={{ 
                  fontSize: '0.7rem', 
                  color: 'text.secondary',
                  textAlign: 'center',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'center',
                  mt: 1
                }}>
                  {canal.nombre}
                </Typography>
              </Box>
            ))}
          </Box>
          
          {/* Línea de conversión simulada */}
          <Box sx={{
            position: 'absolute',
            top: 30,
            left: 20,
            right: 20,
            height: 2,
            bgcolor: '#e74c3c',
            borderRadius: 1,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -3,
              left: '55%',
              width: 8,
              height: 8,
              bgcolor: '#e74c3c',
              borderRadius: '50%'
            }
          }} />
        </Box>
      </Paper>

      {/* Cards de métricas por canal */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        {/* WSP 1 */}
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>WSP 1</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>22</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Ventas</Typography>
          <Typography variant="body2" sx={{ color: '#2ecc71', mb: 1 }}>15.8% Conversión</Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>$33,000</Typography>
          <Typography variant="caption" color="text.secondary">Ingresos</Typography>
        </Paper>

        {/* WSP 2 */}
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>WSP 2</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>18</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Ventas</Typography>
          <Typography variant="body2" sx={{ color: '#2ecc71', mb: 1 }}>12.4% Conversión</Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>$27,000</Typography>
          <Typography variant="caption" color="text.secondary">Ingresos</Typography>
        </Paper>

        {/* WSP 4 */}
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>WSP 4</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>15</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Ventas</Typography>
          <Typography variant="body2" sx={{ color: '#2ecc71', mb: 1 }}>11.2% Conversión</Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>$22,500</Typography>
          <Typography variant="caption" color="text.secondary">Ingresos</Typography>
        </Paper>
      </Box>

      {/* Segunda fila de cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {/* REFERIDOS */}
        <Paper sx={{ p: 3, textAlign: 'center', border: '2px solid #e74c3c' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#e74c3c' }}>REFERIDOS</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#e74c3c', mb: 1 }}>8</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Ventas</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <Typography variant="body2" sx={{ color: '#2ecc71' }}>28.5% Conversión</Typography>
            <Chip 
              label="TOP" 
              size="small" 
              sx={{ bgcolor: '#e74c3c', color: 'white', fontSize: '0.7rem' }}
            />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>$12,000</Typography>
          <Typography variant="caption" color="text.secondary">Ingresos</Typography>
        </Paper>

        {/* MEDIOS */}
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>MEDIOS</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>3</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Ventas</Typography>
          <Typography variant="body2" sx={{ color: '#f39c12', mb: 1 }}>8.1% Conversión</Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>$4,500</Typography>
          <Typography variant="caption" color="text.secondary">Ingresos</Typography>
        </Paper>

        {/* CREATIVA */}
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>CREATIVA</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>1</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Ventas</Typography>
          <Typography variant="body2" sx={{ color: '#e67e22', mb: 1 }}>5.5% Conversión</Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>$1,500</Typography>
          <Typography variant="caption" color="text.secondary">Ingresos</Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default CanalesTab;