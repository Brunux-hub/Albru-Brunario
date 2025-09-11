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
    cliente: '956887643', 
    nombre: 'Carlos López',
    dni: '45612378',
    email: 'carlos@email.com',
    campania: 'LEADS', 
    canal: 'WSP 4',
    estado: 'Nuevo', 
    asesor: 'MIA',
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
    fecha: '08/09/2025', 
    cliente: '923456789', 
    nombre: 'Ana Rodríguez',
    dni: '78945612',
    email: 'ana@email.com',
    campania: 'MASIVO', 
    canal: 'MEDIOS',
    estado: 'En gestión', 
    asesor: 'JUAN',
    comentarios: 'Información completa proporcionada por el asesor',
    fechaCreacion: '08/09/2025',
    historial: [
      {
        fecha: '08/09/2025 14:20',
        asesor: 'JUAN',
        accion: 'Datos Completados',
        comentarios: 'Asesor ingresó todos los datos del cliente después del contacto'
      }
    ]
  },
  { 
    id: 5, 
    fecha: '08/09/2025', 
    cliente: '987123456', 
    nombre: 'Luis Martínez',
    dni: '32165498',
    email: 'luis@email.com',
    campania: 'LEADS', 
    canal: 'CREATIVA',
    estado: 'Perdido', 
    asesor: 'SASKYA',
    comentarios: 'Pendiente de contacto para obtener datos',
    fechaCreacion: '08/09/2025',
    historial: [
      {
        fecha: '08/09/2025 16:30',
        asesor: 'Sistema',
        accion: 'Creación',
        comentarios: 'Lead automático desde campaña LEADS - Requiere contacto para datos'
      }
    ]
  },
  { 
    id: 6, 
    fecha: '07/09/2025', 
    cliente: '945678123', 
    nombre: 'Carmen Vega',
    dni: '65432187',
    email: 'carmen@email.com',
    campania: 'REFERIDOS', 
    canal: 'WSP 2',
    estado: 'Vendido', 
    asesor: 'MIA',
    comentarios: 'Lead sin información adicional',
    fechaCreacion: '07/09/2025',
    historial: [
      {
        fecha: '07/09/2025 17:15',
        asesor: 'Sistema',
        accion: 'Creación',
        comentarios: 'Número capturado automáticamente - Sin datos adicionales'
      }
    ]
  },
  { 
    id: 7, 
    fecha: '07/09/2025', 
    cliente: '912345678', 
    nombre: 'Roberto Silva',
    dni: '98765432',
    email: 'roberto@email.com',
    campania: 'MASIVO', 
    canal: 'ALAS',
    estado: 'Nuevo', 
    asesor: 'JUAN',
    comentarios: 'Cliente nuevo con datos completos',
    fechaCreacion: '07/09/2025',
    historial: [
      {
        fecha: '07/09/2025 10:30',
        asesor: 'Sistema',
        accion: 'Creación',
        comentarios: 'Cliente registrado desde campaña MASIVO'
      }
    ]
  },
  { 
    id: 8, 
    fecha: '06/09/2025', 
    cliente: '934567891', 
    nombre: 'Patricia Morales',
    dni: '15975348',
    email: 'patricia@email.com',
    campania: 'LEADS', 
    canal: 'WSP 1',
    estado: 'En gestión', 
    asesor: 'SASKYA',
    comentarios: 'Cliente en proceso de gestión',
    fechaCreacion: '06/09/2025',
    historial: [
      {
        fecha: '06/09/2025 11:45',
        asesor: 'Sistema',
        accion: 'Creación',
        comentarios: 'Cliente registrado desde campaña LEADS'
      }
    ]
  }
];

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  'En gestión': 'primary',
  'Vendido': 'success',
  'No contactado': 'warning',
  'Lista negra': 'error',
  'Solo números': 'warning',
  'Nuevo': 'warning',
  'Perdido': 'error'
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
      const previousAdvisor = clientToReassign.asesor;
      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
      const formattedDateTime = `${formattedDate} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;
      
      // Actualizar el asesor
      clientToReassign.asesor = newAdvisor;
      
      // Agregar entrada al historial
      const reassignmentEntry = {
        fecha: formattedDateTime,
        asesor: 'Sistema',
        accion: 'Reasignación',
        estadoAnterior: previousAdvisor,
        estadoNuevo: newAdvisor,
        comentarios: `Cliente reasignado de ${previousAdvisor} a ${newAdvisor}`
      };
      
      // Agregar al inicio del historial (más reciente primero)
      if (!clientToReassign.historial) {
        clientToReassign.historial = [];
      }
      clientToReassign.historial.unshift(reassignmentEntry);
      
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
      <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#22223b' }}>
          Clientes
        </Typography>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#22223b', background: '#f8fafc' }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#22223b', background: '#f8fafc' }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#22223b', background: '#f8fafc' }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#22223b', background: '#f8fafc' }}>DNI</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#22223b', background: '#f8fafc' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#22223b', background: '#f8fafc' }}>Campaña</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#22223b', background: '#f8fafc' }}>Canal</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#22223b', background: '#f8fafc' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#22223b', background: '#f8fafc' }}>Asesor</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#22223b', background: '#f8fafc' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(client => (
              <TableRow key={client.id} sx={{ '&:hover': { background: '#f9fafb' } }}>
                <TableCell>{client.fecha}</TableCell>
                <TableCell>{client.cliente}</TableCell>
                <TableCell>{client.nombre || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin nombre</span>}</TableCell>
                <TableCell>{client.dni || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin DNI</span>}</TableCell>
                <TableCell>{client.email || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin email</span>}</TableCell>
                <TableCell>{client.campania}</TableCell>
                <TableCell>{client.canal}</TableCell>
                <TableCell>
                  <Chip 
                    label={client.estado}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      color: client.estado === 'Vendido' ? '#059669' : client.estado === 'En gestión' ? '#2563eb' : client.estado === 'Nuevo' ? '#f59e0b' : client.estado === 'Perdido' ? '#dc2626' : '#374151',
                      background: client.estado === 'Vendido' ? '#d1fae5' : client.estado === 'En gestión' ? '#dbeafe' : client.estado === 'Nuevo' ? '#fef3c7' : client.estado === 'Perdido' ? '#fee2e2' : '#f3f4f6',
                      borderRadius: 1
                    }}
                  />
                </TableCell>
                <TableCell>{client.asesor}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewHistory(client)}
                      sx={{ 
                        textTransform: 'none',
                        color: '#22223b',
                        border: '1px solid #e5e7eb',
                        background: '#fff',
                        fontWeight: 700,
                        borderRadius: 1,
                        px: 2,
                        '&:hover': { backgroundColor: '#f3f4f6' }
                      }}
                    >
                      VER
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<SwapHorizIcon />}
                      onClick={() => handleReassign(client)}
                      sx={{ 
                        textTransform: 'none',
                        color: '#fff',
                        backgroundColor: '#111827',
                        fontWeight: 700,
                        borderRadius: 1,
                        px: 2,
                        '&:hover': { backgroundColor: '#374151' }
                      }}
                    >
                      REASIGNAR
                    </Button>
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
