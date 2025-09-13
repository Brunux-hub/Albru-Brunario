import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import CallIcon from '@mui/icons-material/Call';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const resumen = [
  { icon: <GroupIcon color="primary" />, label: 'Clientes asignados', value: 8 },
  { icon: <CallIcon color="success" />, label: 'Contactados hoy', value: 5 },
  { icon: <EmojiEventsIcon color="secondary" />, label: 'Ventas realizadas', value: 2 },
  { icon: <AccessTimeIcon color="warning" />, label: 'En seguimiento', value: 3 },
];

const AsesorResumen: React.FC = () => (
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

export default AsesorResumen;
