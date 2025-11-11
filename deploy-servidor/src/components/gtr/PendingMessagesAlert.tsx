import React from 'react';
import { Box, Paper, Typography, Chip, Avatar, Button } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReplyIcon from '@mui/icons-material/Reply';

interface PendingMessage {
  id: number;
  nombre: string;
  cliente: string;
  mensaje: string;
  hora: string;
  canal: string;
  urgencia: 'alta' | 'media' | 'baja';
}

interface PendingMessagesAlertProps {
  messages: PendingMessage[];
  onRespond: (clientId: number) => void;
}

const PendingMessagesAlert: React.FC<PendingMessagesAlertProps> = ({ messages, onRespond }) => {
  if (messages.length === 0) return null;

  const getUrgencyColor = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return '#ef4444';
      case 'media': return '#f59e0b';
      case 'baja': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getTimeAgo = (hora: string) => {
    const now = new Date();
    const messageTime = new Date(hora);
    const diffMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 5) return 'Hace unos minutos';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `Hace ${diffHours}h`;
  };

  return (
    <Paper sx={{ 
      p: 3, 
      mb: 3, 
      backgroundColor: '#fef2f2', 
      border: '1px solid #fecaca',
      borderRadius: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <MessageIcon sx={{ color: '#ef4444', mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#dc2626' }}>
          ⚠️ Clientes Esperando Respuesta ({messages.length})
        </Typography>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Estos clientes han escrito y están esperando una respuesta del asesor
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((message) => (
          <Paper key={message.id} sx={{ p: 2, backgroundColor: 'white', border: '1px solid #f3f4f6' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                <Avatar sx={{ backgroundColor: getUrgencyColor(message.urgencia) }}>
                  <MessageIcon />
                </Avatar>
                
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {message.nombre}
                    </Typography>
                    <Chip 
                      label={message.canal} 
                      size="small" 
                      sx={{ backgroundColor: '#eff6ff', color: '#1e40af' }}
                    />
                    <Chip 
                      label={`Urgencia ${message.urgencia}`} 
                      size="small" 
                      sx={{ 
                        backgroundColor: `${getUrgencyColor(message.urgencia)}15`,
                        color: getUrgencyColor(message.urgencia)
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Tel: {message.cliente}
                  </Typography>
                  
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: '#f8fafc', 
                    borderRadius: 1, 
                    border: '1px solid #e5e7eb',
                    mb: 1
                  }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      💬 "{message.mensaje}"
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: '16px', color: '#6b7280' }} />
                    <Typography variant="caption" color="text.secondary">
                      {getTimeAgo(message.hora)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Button 
                variant="contained"
                startIcon={<ReplyIcon />}
                onClick={() => onRespond(message.id)}
                sx={{ 
                  backgroundColor: '#f59e0b',
                  '&:hover': { backgroundColor: '#d97706' },
                  textTransform: 'none'
                }}
              >
                Responder Ahora
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>
    </Paper>
  );
};

export default PendingMessagesAlert;
