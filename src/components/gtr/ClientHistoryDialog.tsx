import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Paper,
  Divider,
  Avatar
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MessageIcon from '@mui/icons-material/Message';

interface ClientHistoryData {
  id: number;
  nombre: string;
  cliente: string;
  dni: string;
  email: string;
  campania: string;
  canal: string;
  estado: string;
  fechaCreacion: string;
  historial: {
    fecha: string;
    asesor: string;
    accion: string;
    estadoAnterior?: string;
    estadoNuevo?: string;
    comentarios: string;
  }[];
}

interface ClientHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  clientData: ClientHistoryData | null;
}

const ClientHistoryDialog: React.FC<ClientHistoryDialogProps> = ({ open, onClose, clientData }) => {
  if (!clientData) return null;

  const getActionColor = (accion: string) => {
    switch (accion) {
      case 'Creación': return '#10b981';
      case 'Reasignación': return '#f59e0b';
      case 'Actualización': return '#3b82f6';
      case 'Contacto': return '#8b5cf6';
      case 'Mensaje Cliente': return '#f59e0b';
      case 'Venta': return '#059669';
      default: return '#6b7280';
    }
  };

  const getActionIcon = (accion: string) => {
    switch (accion) {
      case 'Creación': return <PersonIcon />;
      case 'Reasignación': return <SwapHorizIcon />;
      case 'Contacto': return <PhoneIcon />;
      case 'Mensaje Cliente': return <MessageIcon />;
      default: return <CalendarTodayIcon />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Historial del Cliente
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {/* Información del Cliente */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8fafc' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ backgroundColor: '#3b82f6', mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {clientData.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cliente desde: {clientData.fechaCreacion}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Teléfono</Typography>
              <Typography variant="body2">{clientData.cliente}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">DNI</Typography>
              <Typography variant="body2">{clientData.dni}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography variant="body2">{clientData.email}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Campaña</Typography>
              <Typography variant="body2">{clientData.campania}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Canal</Typography>
              <Chip label={clientData.canal} size="small" sx={{ backgroundColor: '#eff6ff', color: '#1e40af' }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Estado Actual</Typography>
              <Chip label={clientData.estado} size="small" color="primary" />
            </Box>
          </Box>
        </Paper>

        <Divider sx={{ my: 2 }} />

        {/* Historial de Gestión */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Historial de Gestión
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {clientData.historial.map((evento, index) => (
            <Paper key={index} sx={{ p: 3, position: 'relative' }}>
              {/* Línea conectora */}
              {index < clientData.historial.length - 1 && (
                <Box sx={{
                  position: 'absolute',
                  left: 25,
                  top: 60,
                  bottom: -16,
                  width: 2,
                  backgroundColor: '#e5e7eb'
                }} />
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {/* Icono de acción */}
                <Avatar 
                  sx={{ 
                    backgroundColor: getActionColor(evento.accion),
                    width: 40,
                    height: 40
                  }}
                >
                  {getActionIcon(evento.accion)}
                </Avatar>
                
                {/* Contenido del evento */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {evento.accion}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {evento.fecha}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Asesor:</strong> {evento.asesor}
                  </Typography>
                  
                  {evento.estadoAnterior && evento.estadoNuevo && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip label={evento.estadoAnterior} size="small" variant="outlined" />
                      <Typography variant="caption">→</Typography>
                      <Chip label={evento.estadoNuevo} size="small" color="primary" />
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="text.secondary">
                    {evento.comentarios}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClientHistoryDialog;
