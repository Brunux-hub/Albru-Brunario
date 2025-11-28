import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const ComparativoTab: React.FC = () => {
  const comparativoData = [
    { mes: 'Ene', actual: 45, anterior: 52, promedio: 14 },
    { mes: 'Feb', actual: 52, anterior: 48, promedio: 15 },
    { mes: 'Mar', actual: 38, anterior: 51, promedio: 12 },
    { mes: 'Abr', actual: 61, anterior: 49, promedio: 16 },
    { mes: 'May', actual: 54, anterior: 58, promedio: 16 },
    { mes: 'Jun', actual: 51, anterior: 55, promedio: 14 },
    { mes: 'Jul', actual: 43, anterior: 47, promedio: 12 },
    { mes: 'Ago', actual: 58, anterior: 50, promedio: 17 },
    { mes: 'Sep', actual: 63, anterior: 45, promedio: 17 },
    { mes: 'Oct', actual: 47, anterior: 62, promedio: 15 },
    { mes: 'Nov', actual: 53, anterior: 58, promedio: 16 },
    { mes: 'Dic', actual: 68, anterior: 61, promedio: 18 }
  ];

  return (
    <Box>
      {/* Gráfico Comparativo Principal */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Comparativo Anual - Últimos 12 Meses
        </Typography>
        
        <Box sx={{ height: 300, position: 'relative' }}>
          {/* Líneas comparativas */}
          <Box sx={{ 
            height: '85%', 
            position: 'relative',
            display: 'flex',
            alignItems: 'end',
            pb: 2
          }}>
            {/* Simulación de 3 líneas */}
            <Box sx={{
              position: 'absolute',
              top: 20,
              left: 20,
              right: 20,
              height: '80%'
            }}>
              {/* Línea azul - año actual */}
              <Box sx={{
                position: 'absolute',
                top: '30%',
                width: '100%',
                height: 3,
                background: 'linear-gradient(90deg, #1976d2 0%, #0d47a1 20%, #1976d2 40%, #1565c0 60%, #0d47a1 80%, #1976d2 100%)',
                borderRadius: 1,
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  bgcolor: '#1976d2',
                  borderRadius: '50%'
                },
                '&::before': { left: '8%', top: -2.5 },
                '&::after': { right: '5%', top: -2.5 }
              }} />
              
              {/* Línea rosa punteada - año anterior */}
              <Box sx={{
                position: 'absolute',
                top: '45%',
                width: '100%',
                height: 2,
                background: `repeating-linear-gradient(
                  90deg,
                  #e91e63 0px,
                  #e91e63 8px,
                  transparent 8px,
                  transparent 16px
                )`,
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  width: 6,
                  height: 6,
                  bgcolor: '#e91e63',
                  borderRadius: '50%'
                },
                '&::before': { left: '15%', top: -2 },
                '&::after': { right: '10%', top: -2 }
              }} />
              
              {/* Línea verde - promedio */}
              <Box sx={{
                position: 'absolute',
                top: '65%',
                width: '100%',
                height: 2,
                bgcolor: '#2ecc71',
                borderRadius: 1,
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  width: 6,
                  height: 6,
                  bgcolor: '#2ecc71',
                  borderRadius: '50%'
                },
                '&::before': { left: '20%', top: -2 },
                '&::after': { right: '8%', top: -2 }
              }} />
            </Box>
          </Box>
          
          {/* Eje X */}
          <Box sx={{ 
            position: 'absolute', 
            bottom: 10, 
            left: 20, 
            right: 20,
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            {comparativoData.map((item) => (
              <Typography key={item.mes} variant="caption" sx={{ 
                fontSize: '0.7rem', 
                color: 'text.secondary'
              }}>
                {item.mes}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Leyenda */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 4, 
          mt: 2,
          pt: 2,
          borderTop: '1px solid #f0f0f0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 3, bgcolor: '#1976d2', borderRadius: 1 }} />
            <Typography variant="caption">Año Actual</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 20, 
              height: 2, 
              background: `repeating-linear-gradient(
                90deg,
                #e91e63 0px,
                #e91e63 4px,
                transparent 4px,
                transparent 8px
              )`
            }} />
            <Typography variant="caption">Año Anterior</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 2, bgcolor: '#2ecc71', borderRadius: 1 }} />
            <Typography variant="caption">Promedio</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Cards de resumen */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        
        {/* Mejor Mes */}
        <Paper sx={{ p: 3, textAlign: 'center', border: '2px solid #2ecc71' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2ecc71' }}>
            Mejor Mes
          </Typography>
          
          <Typography variant="h2" sx={{ 
            fontWeight: 'bold', 
            color: '#2ecc71', 
            mb: 1,
            fontSize: { xs: '2rem', md: '3rem' }
          }}>
            Dic
          </Typography>
          
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
            67 ventas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            $100,500
          </Typography>
        </Paper>

        {/* Promedio Mensual */}
        <Paper sx={{ p: 3, textAlign: 'center', border: '2px solid #1976d2' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>
            Promedio Mensual
          </Typography>
          
          <Typography variant="h2" sx={{ 
            fontWeight: 'bold', 
            color: '#1976d2', 
            mb: 1,
            fontSize: { xs: '2rem', md: '3rem' }
          }}>
            52
          </Typography>
          
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
            ventas/mes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            $79K
          </Typography>
        </Paper>

        {/* Crecimiento Anual */}
        <Paper sx={{ p: 3, textAlign: 'center', border: '2px solid #9b59b6' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#9b59b6' }}>
            Crecimiento Anual
          </Typography>
          
          <Typography variant="h2" sx={{ 
            fontWeight: 'bold', 
            color: '#9b59b6', 
            mb: 1,
            fontSize: { xs: '2rem', md: '3rem' }
          }}>
            48.9%
          </Typography>
          
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
            crecimiento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            vs año anterior
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default ComparativoTab;