import React, { useState } from 'react';
import { Box } from '@mui/material';
import GtrSidebar from '../components/gtr/GtrSidebar';
import GtrSummary from '../components/gtr/GtrSummary';
import GtrStatusMenu from '../components/gtr/GtrStatusMenu';
import GtrClientsTable from '../components/gtr/GtrClientsTable';
import GtrAsesoresTable from '../components/gtr/GtrAsesoresTable';
import initialAsesores from '../components/gtr/initialAsesores';
import AddClientDialog from '../components/gtr/AddClientDialog';

const GtrDashboard: React.FC = () => {
  const [section, setSection] = useState('Clientes');
  const [status, setStatus] = useState('Todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState<any>(null);
  // Estado centralizado de asesores
  const [asesores, setAsesores] = useState(
    initialAsesores.map(a => ({
      ...a,
      clientesAsignados: 0,
      clientesAtendidos: 0,
      estado: a.estado as 'Activo' | 'Ocupado' | 'Descanso' | 'Offline',
      sala: a.sala as 'Sala 1' | 'Sala 2' | 'Sala 3' | 'Sala 4'
    }))
  );

  const handleSaveClient = (clientData: any) => {
    setNewClient(clientData);
    setDialogOpen(false);
  };

  // Función para incrementar asignados de un asesor por nombre
  const incrementarAsignados = (asesorNombre: string) => {
    setAsesores(prev => prev.map(a =>
      a.nombre.toUpperCase().includes(asesorNombre.toUpperCase())
        ? { ...a, clientesAsignados: a.clientesAsignados + 1 }
        : a
    ));
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <GtrSidebar onSelect={setSection} selected={section} />
      
      <Box sx={{ 
        flexGrow: 1, 
        p: 3,
        overflow: 'auto',
        marginLeft: '220px'
      }}>


        {section === 'Clientes' && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            gap: 3 
          }}>
            <GtrSummary />
            <GtrStatusMenu 
              selected={status} 
              onSelect={setStatus}
              onAddClient={() => setDialogOpen(true)}
            />
            <Box sx={{ flex: 1, display: 'flex' }}>
              <GtrClientsTable 
                statusFilter={status} 
                newClient={newClient} 
                incrementarAsignados={incrementarAsignados}
              />
            </Box>
          </Box>
        )}
        
        {section === 'Asesores' && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            gap: 3 
          }}>
            <Box sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              p: 3
            }}>
              <Box sx={{ mb: 3 }}>
                <h2 style={{ margin: 0, color: '#111827', fontSize: '1.5rem', fontWeight: '600' }}>
                  Gestión de Asesores
                </h2>
                <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                  Aquí se muestran todos los asesores disponibles y su rendimiento en tiempo real.
                </p>
              </Box>
              <GtrAsesoresTable asesores={asesores} />
            </Box>
          </Box>
        )}
        
        {section === 'Reportes' && (
          <Box sx={{ 
            p: 4, 
            backgroundColor: 'white',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2>Reportes y Análisis</h2>
            <p>Aquí se mostrarán gráficos y reportes detallados.</p>
          </Box>
        )}
        
        {section === 'Configuración' && (
          <Box sx={{ 
            p: 4, 
            backgroundColor: 'white',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2>Configuración del Sistema</h2>
            <p>Configuración de parámetros y preferencias.</p>
          </Box>
        )}
      </Box>

      <AddClientDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSave={handleSaveClient}
      />
    </Box>
  );
};

export default GtrDashboard;
