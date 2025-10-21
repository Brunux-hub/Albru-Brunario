import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Box, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import ClientHistoryDialog from './ClientHistoryDialog';
import ReassignDialog from './ReassignDialog';
import type { ClientHistoryData, Asesor } from './types';


interface Historial {
  fecha: string;
  asesor: string;
  accion: string;
  comentarios: string;
}

interface Cliente {
  id: number;
  lead_id?: string;
  nombre?: string;
  dni?: string;
  email?: string;
  estado: string;
  asesor: string;
  historial?: Historial[];
  fecha: string;
  comentarios?: string;
  // Campos adicionales necesarios para la tabla
  telefono?: string;
  cliente?: string;
  lead?: string;
  ciudad?: string;
  plan?: string;
  precio?: number;
  canal?: string;
  distrito?: string;
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
      id: client.id,
      nombre: client.nombre || '',
      cliente: String(client.id),
      dni: client.dni || '',
      email: client.email || '',
      campania: client.comentarios || 'Sin campaña',
      canal: 'Sin canal',
      estado: client.estado || '',
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

  const handleReassignConfirm = async (newAsesorId: string) => {
    if (!clientToReassign) {
        console.error('❌ GTR: No hay cliente seleccionado para reasignar');
        alert('Error: No se ha seleccionado ningún cliente');
        return;
    }

    console.log('🎯 GTR: Iniciando proceso de reasignación...');
    console.log('📋 GTR: Cliente seleccionado:', JSON.stringify(clientToReassign, null, 2));
    console.log('📋 GTR: Cliente ID:', clientToReassign.id, 'Tipo:', typeof clientToReassign.id);
    console.log('🎯 GTR: Nuevo asesor ID recibido:', newAsesorId, 'Tipo:', typeof newAsesorId);

    try {
        // Validaciones exhaustivas
        const clienteId = clientToReassign.id;
        if (!clienteId || clienteId === undefined || clienteId === null) {
            console.error('❌ GTR: Cliente ID inválido:', clienteId);
            throw new Error(`Cliente no tiene ID válido. ID recibido: ${clienteId}`);
        }

        if (!newAsesorId || newAsesorId.trim() === '') {
            console.error('❌ GTR: Asesor ID inválido:', newAsesorId);
            throw new Error('Debe seleccionar un asesor válido');
        }

        // Convertir IDs a números para asegurar tipo correcto
        const clienteIdNum = parseInt(String(clienteId));
        const asesorIdNum = parseInt(newAsesorId);

        if (isNaN(clienteIdNum) || isNaN(asesorIdNum)) {
            console.error('❌ GTR: Error de conversión:', { clienteIdNum, asesorIdNum });
            throw new Error(`IDs no son números válidos. Cliente: ${clienteIdNum}, Asesor: ${asesorIdNum}`);
        }

        console.log('✅ GTR: Validaciones pasadas. Procediendo con:', { clienteIdNum, asesorIdNum });

        // Buscar el nombre del nuevo asesor para actualizar la UI
        const nuevoAsesor = asesores.find(a => String(a.asesor_id) === newAsesorId);
        const nuevoAsesorNombre = nuevoAsesor?.nombre || `Asesor ID: ${newAsesorId}`;

        // Preparar payload para el backend
        const payload = {
            clienteId: clienteIdNum,
            nuevoAsesorId: asesorIdNum,
            gtrId: 2, // GTR María García ID
            comentario: `Cliente reasignado por GTR desde panel de gestión`
        };

        console.log('� GTR: Enviando payload al backend:', JSON.stringify(payload, null, 2));

        // Realizar reasignación en el backend
        const reasignacionResponse = await fetch('/api/clientes/reasignar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!reasignacionResponse.ok) {
            const errorData = await reasignacionResponse.json();
            console.error('❌ GTR: Error del servidor:', errorData);
            throw new Error(errorData.message || 'Error al reasignar en el servidor');
        }

        const result = await reasignacionResponse.json();
        console.log('✅ GTR: Reasignación exitosa en BD:', result);

        // Actualizar la tabla local
        const previousAdvisor = clientToReassign.asesor;
        const currentDate = new Date();
        const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
        const formattedDateTime = `${formattedDate} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;

        const reassignmentEntry = {
            fecha: formattedDateTime,
            asesor: nuevoAsesorNombre,
            accion: 'Reasignación',
            estadoAnterior: previousAdvisor,
            estadoNuevo: nuevoAsesorNombre,
            comentarios: `Reasignado de ${previousAdvisor} a ${nuevoAsesorNombre}`
        };

        setClients(prev => prev.map(c => {
            if (c.id === clientToReassign.id) {
                const updatedHistorial = c.historial ? [reassignmentEntry, ...c.historial] : [reassignmentEntry];
                return {
                    ...c,
                    asesor: nuevoAsesorNombre,
                    historial: updatedHistorial
                };
            }
            return c;
        }));

        console.log('🎉 GTR: Reasignación completada exitosamente');
        alert(`Cliente reasignado exitosamente a ${nuevoAsesorNombre}`);

    } catch (error) {
        console.error('❌ GTR: Error en reasignación:', error);
        alert(`Error al reasignar cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
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
              <TableCell sx={{ fontWeight: 700, color: '#22223b', background: '#f8fafc' }}>Lead (Teléfono)</TableCell>
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
                <TableCell>
                  {client.telefono || client.cliente || client.lead ? (
                    <span style={{ fontWeight: 600, color: '#1976d2' }}>
                      {client.telefono || client.cliente || client.lead}
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin lead</span>
                  )}
                </TableCell>
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
