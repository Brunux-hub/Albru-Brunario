import React from 'react';
import { Box, Typography, Avatar, List, ListItemIcon, ListItemText, Divider, Chip, ListItemButton, Button } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/UnifiedAuthContext';

const AsesorSidebar: React.FC = () => {
  const { logout, user } = useAuth();
  
  const handleCerrarSesion = () => {
    console.log('🚪 AsesorSidebar - Logout iniciado');
    logout();
  };

  // Obtener datos del usuario desde el contexto unificado
  const nombreAsesor = user?.nombre || 'Asesor';
  const iniciales = nombreAsesor.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  return (
    <Box sx={{ 
      width: 260, 
      bgcolor: '#111827', 
      color: '#fff', 
      minHeight: '100vh', 
      p: 2,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar sx={{ bgcolor: '#6366f1', mr: 2 }}>{iniciales}</Avatar>
        <Box>
          <Typography fontWeight={700}>{nombreAsesor}</Typography>
          <Typography variant="caption" color="#cbd5e1">Asesor Comercial</Typography>
        </Box>
      </Box>
      <List>
        <ListItemButton selected>
          <ListItemIcon sx={{ color: '#fff' }}><GroupIcon /></ListItemIcon>
          <ListItemText primary="Mis Clientes" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon sx={{ color: '#fff' }}><AssignmentIcon /></ListItemIcon>
          <ListItemText primary="Gestiones" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon sx={{ color: '#fff' }}><HistoryIcon /></ListItemIcon>
          <ListItemText primary="Mi Historial" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon sx={{ color: '#fff' }}><TrackChangesIcon /></ListItemIcon>
          <ListItemText primary="Seguimientos" />
        </ListItemButton>
      </List>
      <Divider sx={{ my: 2, bgcolor: '#334155' }} />
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="#cbd5e1">Estado de Conexión</Typography>
        <Chip icon={<FiberManualRecordIcon sx={{ color: '#22c55e' }} />} label="Conectado" size="small" sx={{ bgcolor: '#1e293b', color: '#22c55e', mt: 1 }} />
      </Box>
      
      <Box sx={{ mt: 'auto', pt: 3 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleCerrarSesion}
          sx={{
            color: '#ef4444',
            borderColor: '#ef4444',
            '&:hover': {
              bgcolor: '#ef4444',
              color: '#fff',
              borderColor: '#ef4444',
            },
          }}
        >
          Cerrar Sesión
        </Button>
      </Box>
    </Box>
  );
};

export default AsesorSidebar;
