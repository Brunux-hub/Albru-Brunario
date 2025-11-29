import React from 'react';
import { Typography, Box } from '@mui/material';
import type { Cliente } from '../../context/AppContext';

interface AsesorResumenProps {
  clientes: Cliente[];
}

const AsesorResumen: React.FC<AsesorResumenProps> = ({ clientes }) => {
  // Calcular valores reales desde los clientes
  const clientesAsignados = clientes.length;
  
  // Clientes contactados hoy (clientes con estado 'en_gestion' o 'gestionado')
  const contactadosHoy = clientes.filter(c => 
    c.seguimiento_status === 'en_gestion' || 
    c.seguimiento_status === 'gestionado'
  ).length;
  
  // Ventas realizadas (clientes con estado 'gestionado')
  const ventasRealizadas = clientes.filter(c => 
    c.seguimiento_status === 'gestionado'
  ).length;
  
  // En seguimiento (clientes con estado 'derivado' - asignados pero no abiertos)
  const enSeguimiento = clientes.filter(c => 
    c.seguimiento_status === 'derivado'
  ).length;

  const resumen = [
    { 
      icon: '👥', 
      label: 'Clientes asignados', 
      value: clientesAsignados,
      bgColor: 'white',
      iconBg: '#a78bfa',
      textColor: '#111827',
      labelColor: '#6b7280'
    },
    { 
      icon: '📞', 
      label: 'Contactados hoy', 
      value: contactadosHoy,
      bgColor: 'white',
      iconBg: '#fb7185',
      textColor: '#111827',
      labelColor: '#6b7280'
    },
    { 
      icon: '🏆', 
      label: 'Ventas realizadas', 
      value: ventasRealizadas,
      bgColor: 'white',
      iconBg: '#fbbf24',
      textColor: '#111827',
      labelColor: '#6b7280'
    },
    { 
      icon: '⏰', 
      label: 'En seguimiento', 
      value: enSeguimiento,
      bgColor: 'white',
      iconBg: '#22d3ee',
      textColor: '#111827',
      labelColor: '#6b7280'
    },
  ];

  return (
    <Box sx={{ 
      display: 'grid',
      gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
      gap: { xs: 2, sm: 2.5, md: 3 }
    }}>
      {resumen.map((item, idx) => (
        <Box 
          key={idx} 
          sx={{ 
            bgcolor: item.bgColor,
            borderRadius: 3,
            p: { xs: 2, md: 2.5 },
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-4px)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: item.labelColor, fontSize: '0.875rem', fontWeight: 500, mb: 1 }}>
                {item.label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: item.textColor, mb: 0.5, fontSize: '2rem' }}>
                {item.value}
              </Typography>
            </Box>
            <Box sx={{ 
              bgcolor: item.iconBg, 
              borderRadius: 2, 
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              {item.icon}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default AsesorResumen;
