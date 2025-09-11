import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Box, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ReplyIcon from '@mui/icons-material/Reply';
import ClientHistoryDialog from './ClientHistoryDialog';
import ReassignDialog from './ReassignDialog';

// Datos simulados expandidos con historial
const clients = [
  { 
    id: 1, 
    fecha: '09/09/2025', 
    cliente: '914118863', 
    nombre: 'Juan Pérez',
    dni: '12345678',
    email: 'juan@email.com',
    campania: 'MASIVO', 
    canal: 'WSP 1',
    estado: 'En gestión', 
    asesor: 'JUAN',
    comentarios: 'Cliente con información completa ingresada por asesor',
    fechaCreacion: '05/09/2025',
    historial: [
      {
        fecha: '09/09/2025 14:30',
        asesor: 'JUAN',
        accion: 'Datos Completados',
        comentarios: 'Asesor completó toda la información del cliente'
      },
      {
        fecha: '07/09/2025 10:15',
        asesor: 'JUAN',
        accion: 'Contacto',
        comentarios: 'Primera llamada exitosa, cliente proporcionó datos'
      },
      {
        fecha: '05/09/2025 09:00',
        asesor: 'Sistema',
        accion: 'Creación',
        comentarios: 'Cliente registrado desde campaña MASIVO vía WhatsApp'
      }
    ]
  },
  { 
    id: 2, 
    fecha: '09/09/2025', 
    cliente: '987654321', 
    nombre: 'María García',
    dni: '87654321',
    email: 'maria@email.com',
    campania: 'REFERIDOS', 
    canal: 'REFERIDO',
    estado: 'Vendido', 
    asesor: 'SASKYA',
    comentarios: 'Venta cerrada exitosamente',
    fechaCreacion: '08/09/2025',
    historial: [
      {
        fecha: '09/09/2025 16:45',
        asesor: 'SASKYA',
        accion: 'Venta',
        estadoAnterior: 'En gestión',
        estadoNuevo: 'Vendido',
        comentarios: 'Venta cerrada exitosamente. Cliente satisfecho con el servicio.'
      },
      {
        fecha: '08/09/2025 11:20',
        asesor: 'SASKYA',
        accion: 'Contacto',
        comentarios: 'Primera llamada, cliente muy interesado'
      },
      {
        fecha: '08/09/2025 09:30',
        asesor: 'SASKYA',
        accion: 'Creación',
        comentarios: 'Cliente referido por María López'
      }
    ]
  },
  { 
    id: 3, 
    fecha: '09/09/2025', 
    cliente: '965887043', 
    nombre: '',
    dni: '',
    email: '',
    campania: 'LEADS', 
    canal: 'WSP 4',
    estado: 'Solo números', 
    asesor: 'Sin asignar',
    comentarios: 'Cliente registrado solo con número de teléfono',
    fechaCreacion: '09/09/2025',
    historial: [
      {
        fecha: '09/09/2025 15:00',
        asesor: 'Sistema',
        accion: 'Creación',
        comentarios: 'Cliente registrado automáticamente desde campaña LEADS - Solo número disponible'
      }
    ]
  },
  { 
    id: 4, 
    fecha: '10/09/2025', 
    cliente: '976543210', 
    nombre: 'Ana Torres',
    dni: '98765432',
    email: 'ana.torres@email.com',
    campania: 'MASIVO', 
    canal: 'WSP 2',
    estado: 'En gestión', 
    asesor: 'MIA',
    comentarios: 'Información completa proporcionada por el asesor',
    fechaCreacion: '10/09/2025',
    historial: [
      {
        fecha: '10/09/2025 14:20',
        asesor: 'MIA',
        accion: 'Datos Completados',
        comentarios: 'Asesor ingresó todos los datos del cliente después del contacto'
      },
      {
        fecha: '10/09/2025 14:00',
        asesor: 'MIA',
        accion: 'Contacto',
        comentarios: 'Cliente atendido y datos recolectados'
      },
      {
        fecha: '10/09/2025 13:45',
        asesor: 'Sistema',
        accion: 'Creación',
        comentarios: 'Cliente registrado desde campaña MASIVO'
      }
    ]
  },
  { 
    id: 5, 
    fecha: '10/09/2025', 
    cliente: '912876543', 
    nombre: '',
    dni: '',
    email: '',
    campania: 'LEADS', 
    canal: 'WSP 3',
    estado: 'Solo números', 
    asesor: 'Sin asignar',
    comentarios: 'Pendiente de contacto para obtener datos',
    fechaCreacion: '10/09/2025',
    historial: [
      {
        fecha: '10/09/2025 16:30',
        asesor: 'Sistema',
        accion: 'Creación',
        comentarios: 'Lead automático desde campaña LEADS - Requiere contacto para datos'
      }
    ]
  },
  { 
    id: 6, 
    fecha: '10/09/2025', 
    cliente: '998877665', 
    nombre: '',
    dni: '',
    email: '',
    campania: 'MASIVO', 
    canal: 'WSP 1',
    estado: 'Solo números', 
    asesor: 'Sin asignar',
    comentarios: 'Lead sin información adicional',
    fechaCreacion: '10/09/2025',
    historial: [
      {
        fecha: '10/09/2025 17:15',
        asesor: 'Sistema',
        accion: 'Creación',
        comentarios: 'Número capturado automáticamente - Sin datos adicionales'
      }
    ]
  },
];

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  'En gestión': 'primary',
  'Vendido': 'success',
  'No contactado': 'warning',
  'Lista negra': 'error',
  'Solo números': 'warning',
};

const GtrClientsTable: React.FC<{ statusFilter: string }> = ({ statusFilter }) => {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [clientToReassign, setClientToReassign] = useState<any>(null);
  
  const sortedClients = [...clients].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  const filtered = statusFilter === 'Todos' ? sortedClients : sortedClients.filter(c => c.estado === statusFilter);
  
  const handleViewHistory = (client: any) => {
    setSelectedClient({
      ...client,
      historial: client.historial || []
    });
    setHistoryDialogOpen(true);
  };
  
  const handleReassign = (client: any) => {
    setClientToReassign(client);
    setReassignDialogOpen(true);
  };

  const handleReassignConfirm = (newAdvisor: string) => {
    if (clientToReassign) {
      clientToReassign.asesor = newAdvisor;
      setReassignDialogOpen(false);
      setClientToReassign(null);
    }
  };
  
  return (
    <Paper sx={{ 
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      width: '100%',
      flex: 1
    }}>
      <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937' }}>
          Gestión de Clientes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {filtered.length} clientes {statusFilter !== 'Todos' ? `con estado "${statusFilter}"` : 'totales'}
        </Typography>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ '& .MuiTableCell-head': { backgroundColor: '#f8fafc', fontWeight: 600, color: '#374151' } }}>
              <TableCell>Cliente</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Canal</TableCell>
              <TableCell>Campaña</TableCell>
              <TableCell>Asesor</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(client => (
              <TableRow 
                key={client.id}
                sx={{ 
                  '&:hover': { backgroundColor: '#f9fafb' },
                  '& .MuiTableCell-body': { borderBottom: '1px solid #f3f4f6' }
                }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1f2937' }}>
                      {client.nombre || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin nombre</span>}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tel: {client.cliente}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {client.email || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin email</span>}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      DNI: {client.dni || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin DNI</span>}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={client.canal} 
                    size="small" 
                    sx={{ 
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      fontWeight: 500
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {client.campania}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {client.asesor}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={client.estado} 
                    color={statusColors[client.estado] || 'default'}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewHistory(client)}
                      sx={{ 
                        textTransform: 'none',
                        color: '#6b7280',
                        '&:hover': { backgroundColor: '#f3f4f6' }
                      }}
                    >
                      Ver
                    </Button>
                    {client.estado === 'Cliente escribió' ? (
                      <Button 
                        size="small" 
                        startIcon={<ReplyIcon />}
                        variant="contained"
                        sx={{ 
                          textTransform: 'none',
                          backgroundColor: '#f59e0b',
                          '&:hover': { backgroundColor: '#d97706' }
                        }}
                      >
                        Responder
                      </Button>
                    ) : (
                      <Button 
                        size="small" 
                        startIcon={<SwapHorizIcon />}
                        onClick={() => handleReassign(client)}
                        sx={{ 
                          textTransform: 'none',
                          color: '#6b7280',
                          '&:hover': { backgroundColor: '#f3f4f6' }
                        }}
                      >
                        Reasignar
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <ClientHistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        clientData={selectedClient}
      />
      <ReassignDialog
        open={reassignDialogOpen}
        onClose={() => setReassignDialogOpen(false)}
        onConfirm={handleReassignConfirm}
      />
    </Paper>
  );
};

export default GtrClientsTable;
