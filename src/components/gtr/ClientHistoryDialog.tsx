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

import type { ClientHistoryData } from './types';

interface ClientHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  clientData: ClientHistoryData | null;
}

const ClientHistoryDialog: React.FC<ClientHistoryDialogProps> = ({ open, onClose, clientData }) => {
  if (!clientData) return null;


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
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: 15, fontWeight: 400, mt: 0.5 }}>
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
              <Typography variant="caption" color="text.secondary">Coordenadas</Typography>
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
        
        {/* Vista de tarjetas del historial */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {clientData.historial.map((evento, index) => (
            <Paper
              key={index}
              sx={{
                p: 3,
                backgroundColor: '#f8fafc',
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {/* Hora */}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#64748b',
                  fontSize: '11px',
                  fontWeight: 500,
                  mb: 1,
                  display: 'block'
                }}
              >
                {evento.fecha}
              </Typography>

              {/* Título de la acción */}
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  color: '#1e293b',
                  mb: 1,
                  fontSize: '16px'
                }}
              >
                {evento.accion}
              </Typography>

              {/* Asesor asignado */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PersonIcon sx={{ fontSize: 16, color: '#64748b' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#475569',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '13px'
                  }}
                >
                  {evento.asesor}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#94a3b8',
                    fontSize: '11px'
                  }}
                >
                  • 30 min
                </Typography>
              </Box>

              {/* Información de reasignación */}
              {evento.accion === 'Reasignación' && evento.estadoNuevo && (
                <Box sx={{ mb: 1 }}>
                  <Chip 
                    label="Reasignado"
                    size="small"
                    sx={{ 
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      fontSize: '10px',
                      height: 18,
                      mr: 1
                    }}
                  />
                  <Typography 
                    variant="caption"
                    sx={{ 
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    → {evento.estadoNuevo}
                  </Typography>
                </Box>
              )}

              {/* Descripción */}
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b',
                  fontSize: '13px',
                  fontStyle: 'italic',
                  lineHeight: 1.5
                }}
              >
                {evento.comentarios}
              </Typography>
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
