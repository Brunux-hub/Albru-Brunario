import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import CallIcon from '@mui/icons-material/Call';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
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
    { icon: <GroupIcon color="primary" />, label: 'Clientes asignados', value: clientesAsignados },
    { icon: <CallIcon color="success" />, label: 'Contactados hoy', value: contactadosHoy },
    { icon: <EmojiEventsIcon color="secondary" />, label: 'Ventas realizadas', value: ventasRealizadas },
    { icon: <AccessTimeIcon color="warning" />, label: 'En seguimiento', value: enSeguimiento },
  ];

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {resumen.map((item, idx) => (
        <Box key={idx} sx={{ flex: '1 1 200px', minWidth: 200, maxWidth: 300 }}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
            <Box sx={{ mr: 2 }}>{item.icon}</Box>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="h6" fontWeight={700}>{item.value}</Typography>
              <Typography variant="body2" color="text.secondary">{item.label}</Typography>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
};

export default AsesorResumen;
