import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Badge,
  Paper,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  ChatBubbleOutline as ChatIcon
} from '@mui/icons-material';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

interface Comentario {
  id: number;
  cliente_id: number;
  gtr_id: number;
  asesor_id: number | null;
  mensaje: string;
  leido: boolean;
  created_at: string;
  gtr_nombre?: string;
  gtr_email?: string;
}

interface GtrChatModalProps {
  clienteId: number;
  asesorId: number;
}

const GtrChatModal: React.FC<GtrChatModalProps> = ({ clienteId, asesorId }) => {
  const [open, setOpen] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [noLeidos, setNoLeidos] = useState(0);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Cargar comentarios del cliente
  const loadComentarios = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/comentarios-gtr/${clienteId}`);
      if (response.data.success) {
        setComentarios(response.data.comentarios || []);
        // Contar no leídos
        const count = response.data.comentarios.filter((c: Comentario) => !c.leido && c.asesor_id === asesorId).length;
        setNoLeidos(count);
      }
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar comentarios como leídos al abrir el modal
  const marcarLeidos = async () => {
    try {
      const noLeidosIds = comentarios.filter(c => !c.leido && c.asesor_id === asesorId).map(c => c.id);
      
      for (const id of noLeidosIds) {
        await axios.put(`/api/comentarios-gtr/${id}/marcar-leido`);
      }
      
      setNoLeidos(0);
      // Recargar para actualizar estado
      await loadComentarios();
    } catch (error) {
      console.error('Error marcando comentarios como leídos:', error);
    }
  };

  // Configurar WebSocket para recibir comentarios en tiempo real
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    
    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Autenticar como asesor
    socketRef.current.emit('authenticate', {
      userId: asesorId,
      role: 'asesor'
    });

    // Escuchar nuevos comentarios GTR
    socketRef.current.on('NEW_GTR_COMMENT', (data: { comentario: Comentario; clienteId: number }) => {
      console.log('📩 Nuevo comentario GTR recibido:', data);
      
      // Si es para este cliente, agregarlo
      if (data.clienteId === clienteId) {
        setComentarios(prev => [data.comentario, ...prev]);
        
        // Si el modal está cerrado, incrementar contador
        if (!open) {
          setNoLeidos(prev => prev + 1);
        }
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [asesorId, clienteId, open]);

  // Cargar comentarios al montar
  useEffect(() => {
    loadComentarios();
  }, [clienteId]);

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comentarios, open]);

  // Marcar como leídos al abrir
  useEffect(() => {
    if (open && noLeidos > 0) {
      marcarLeidos();
    }
  }, [open]);

  const formatDateTime = (dateStr: string) => {
    try {
      const fecha = new Date(dateStr);
      const hoy = new Date();
      const esHoy = fecha.toDateString() === hoy.toDateString();
      
      const hora = String(fecha.getHours()).padStart(2, '0');
      const minuto = String(fecha.getMinutes()).padStart(2, '0');
      
      if (esHoy) {
        return `Hoy ${hora}:${minuto}`;
      }
      
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      return `${dia}/${mes} ${hora}:${minuto}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Botón flotante para abrir chat */}
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          backgroundColor: '#667eea',
          color: 'white',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          '&:hover': {
            backgroundColor: '#5568d3',
            boxShadow: '0 6px 16px rgba(102, 126, 234, 0.6)'
          },
          zIndex: 1300
        }}
      >
        <Badge badgeContent={noLeidos} color="error">
          <ChatIcon sx={{ fontSize: 28 }} />
        </Badge>
      </IconButton>

      {/* Modal de chat */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: 20,
            right: 20,
            m: 0,
            maxHeight: '70vh',
            width: '400px',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Mensajes del GTR
            </Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Contenido del chat */}
        <DialogContent sx={{ p: 2, backgroundColor: '#f8f9fa', maxHeight: '50vh', overflowY: 'auto' }}>
          {loading ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              Cargando mensajes...
            </Typography>
          ) : comentarios.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ChatIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No hay mensajes del GTR
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column-reverse', gap: 1.5 }}>
              {comentarios.map((comentario) => (
                <Paper
                  key={comentario.id}
                  elevation={1}
                  sx={{
                    p: 1.5,
                    backgroundColor: comentario.leido ? '#ffffff' : '#e3f2fd',
                    borderLeft: comentario.leido ? '3px solid #e0e0e0' : '3px solid #2196f3',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: '#667eea',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {comentario.gtr_nombre ? comentario.gtr_nombre.substring(0, 2).toUpperCase() : 'GTR'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                          {comentario.gtr_nombre || 'GTR'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          {formatDateTime(comentario.created_at)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#374151', whiteSpace: 'pre-wrap' }}>
                        {comentario.mensaje}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
              <div ref={chatEndRef} />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GtrChatModal;
