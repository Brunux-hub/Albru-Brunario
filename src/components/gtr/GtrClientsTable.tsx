import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Box, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ClientHistoryDialog from './ClientHistoryDialog';
import ReassignDialog from './ReassignDialog';


interface Historial {
  fecha: string;
  asesor: string;
  accion: string;
  comentarios: string;
}

interface Cliente {
  id: number;
  nombre?: string;
  dni?: string;
  email?: string;
  estado: string;
  asesor: string;
  historial?: Historial[];
  fecha: string;
  comentarios?: string;
}

interface Asesor {
  id: number;
  nombre: string;
  email: string;
  estado: string;
  tipo: string;
}

interface ClientHistoryData {
  cliente: number;
  campania: string;
  canal: string;
  fechaCreacion: string;
  historial: Historial[];
}

interface GtrClientsTableProps {
  statusFilter: string;
  newClient?: Partial<Cliente>; // Cliente parcial para nuevos datos
  clients: Cliente[]; // Lista de clientes
  setClients: React.Dispatch<React.SetStateAction<Cliente[]>>; // Actualizar clientes
  asesores: Asesor[]; // Lista de asesores disponibles
}

const GtrClientsTable: React.FC<GtrClientsTableProps> = ({ statusFilter, newClient, clients, setClients, asesores }) => {
  const [selectedClient, setSelectedClient] = useState<ClientHistoryData | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [clientToReassign, setClientToReassign] = useState<Cliente | null>(null);

  React.useEffect(() => {
    if (newClient) {
      const isSoloNumero = !newClient.nombre && !newClient.dni && !newClient.email;
      const now = new Date();
      const fecha = now.toLocaleDateString('es-PE');
      const fechaHora = now.toLocaleString('es-PE');
      setClients(prev => [
        {
          ...newClient,
          id: Date.now(),
          fecha,
          estado: isSoloNumero ? 'Nuevo' : 'En gestión',
          asesor: '-',
          comentarios: isSoloNumero ? 'Solo número' : (newClient.comentarios || ''),
          historial: [
            {
              fecha: fechaHora,
              asesor: 'Sistema',
              accion: 'Creación',
              comentarios: isSoloNumero ? 'Cliente registrado solo con número' : 'Cliente registrado con datos completos'
            }
          ]
        },
        ...prev
      ]);
    }
  }, [newClient, setClients]);

  const sortedClients = [...clients].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  let filtered = sortedClients;
  if (statusFilter === 'Solo números') {
    filtered = sortedClients.filter(c => !c.nombre && !c.dni && !c.email);
  } else if (statusFilter !== 'Todos') {
    filtered = sortedClients.filter(c => c.estado === statusFilter);
  }
  
  const handleViewHistory = (client: Cliente) => {
    const clientHistoryData: ClientHistoryData = {
      cliente: client.id,
      campania: client.comentarios || 'Sin campaña',
      canal: 'Sin canal',
      fechaCreacion: client.fecha,
      historial: client.historial || []
    };
    setSelectedClient(clientHistoryData);
    setHistoryDialogOpen(true);
  };
  
  const handleReassign = (client: Cliente) => {
    setClientToReassign(client);
    setReassignDialogOpen(true);
  };

  const handleReassignConfirm = async (newAdvisor: string) => {
    if (clientToReassign) {
        console.log('🎯 GTR: Confirmando reasignación...');
        console.log('📋 GTR: Cliente seleccionado:', clientToReassign);
        console.log('🎯 GTR: Nuevo asesor seleccionado:', newAdvisor);

        try {
            // 1. Buscar ID del asesor en la base de datos
            const asesorResponse = await fetch(`http://localhost:3001/api/asesores/buscar/${newAdvisor}`);

            if (!asesorResponse.ok) {
                const errorData = await asesorResponse.json();
                throw new Error(errorData.message || `Asesor "${newAdvisor}" no encontrado en la base de datos`);
            }

            const asesorData = await asesorResponse.json();
            const asesorId = asesorData.asesor.id;

            console.log('👤 GTR: Asesor encontrado:', asesorData.asesor);

            // 2. Realizar reasignación en el backend
            const reasignacionResponse = await fetch('http://localhost:3001/api/clientes/reasignar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cliente_id: clientToReassign.id,
                    nuevo_asesor_id: asesorId,
                    gtr_id: 1, // ID del GTR (puede ser dinámico)
                    comentario: `Reasignado desde GTR a ${newAdvisor}`
                }),
            });

            if (!reasignacionResponse.ok) {
                const errorData = await reasignacionResponse.json();
                throw new Error(errorData.message || 'Error al reasignar en el servidor');
            }

            const result = await reasignacionResponse.json();
            console.log('✅ GTR: Reasignación exitosa en BD:', result);

            // 3. Actualizar la tabla local
            const previousAdvisor = clientToReassign.asesor;
            const currentDate = new Date();
            const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
            const formattedDateTime = `${formattedDate} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;

            const reassignmentEntry = {
                fecha: formattedDateTime,
                asesor: newAdvisor,
                accion: 'Reasignación',
                estadoAnterior: previousAdvisor,
                estadoNuevo: newAdvisor,
                comentarios: `Reasignado de ${previousAdvisor} a ${newAdvisor}`
            };

            setClients(prev => prev.map(c => {
                if (c.id === clientToReassign.id) {
                    const updatedHistorial = c.historial ? [reassignmentEntry, ...c.historial] : [reassignmentEntry];
                    return {
                        ...c,
                        asesor: newAdvisor,
                        historial: updatedHistorial
                    };
                }
                return c;
            }));

            console.log('🎉 GTR: Reasignación completada exitosamente');

        } catch (error) {
            console.error('❌ GTR: Error en reasignación:', error);
            alert(`Error al reasignar cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setReassignDialogOpen(false);
        }
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
              <TableCell sx={{ fontWeight: 700, color: '#22223b', background: '#f8fafc' }}>Coordenadas</TableCell>
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
                <TableCell>{client.id}</TableCell>
                <TableCell>{client.nombre || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin nombre</span>}</TableCell>
                <TableCell>{client.dni || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin DNI</span>}</TableCell>
                <TableCell>{client.email || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin coordenadas</span>}</TableCell>
                <TableCell>{client.comentarios}</TableCell>
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
        asesores={asesores}
      />
    </Paper>
  );
};

export default GtrClientsTable;
