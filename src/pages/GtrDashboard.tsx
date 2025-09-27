import React, { useState, useEffect } from 'react';
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
  const [clients, setClients] = useState<any[]>([]); // Estado inicial vacío para clientes
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

  // Cargar clientes iniciales
  useEffect(() => {
    setClients([
      {
        id: 1,
        fecha: '8/9/2025',
        cliente: '914 118 863',
        nombre: 'Cliente Lead 01',
        dni: '71234567',
        email: 'cliente01@example.com',
        campania: 'CAMPAÑA 08',
        canal: 'WSP 4',
        estado: 'En gestión',
        asesor: 'SASKYA',
        comentarios: 'LEADS - Rango 14-15',
        historial: [
          {
            fecha: new Date().toLocaleString('es-PE'),
            asesor: 'SASKYA',
            accion: 'Creación',
            comentarios: 'Cliente derivado desde LEADS'
          }
        ]
      },
      {
        id: 2,
        fecha: '8/9/2025',
        cliente: '960 147 625',
        nombre: 'Cliente Lead 02',
        dni: '72345678',
        email: 'cliente02@example.com',
        campania: 'CAMPAÑA 08',
        canal: 'WSP 4',
        estado: 'Nuevo',
        asesor: 'KAREN',
        comentarios: 'LEADS - Rango 11-12',
        historial: [
          {
            fecha: new Date().toLocaleString('es-PE'),
            asesor: 'KAREN',
            accion: 'Creación',
            comentarios: 'Cliente derivado desde LEADS'
          }
        ]
      },
      {
        id: 3,
        fecha: '4/9/2025',
        cliente: '944 658 388',
        nombre: 'Cliente Lead 03',
        dni: '73456789',
        email: 'cliente03@example.com',
        campania: 'CAMPAÑA 08',
        canal: 'WSP 4',
        estado: 'En gestión',
        asesor: 'CESAR',
        comentarios: 'LEADS - Rango 10-11',
        historial: [
          {
            fecha: new Date().toLocaleString('es-PE'),
            asesor: 'CESAR',
            accion: 'Creación',
            comentarios: 'Cliente derivado desde LEADS'
          }
        ]
      },
      {
        id: 4,
        fecha: '8/9/2025',
        cliente: '935 885 304',
        nombre: 'Cliente Masivo 01',
        dni: '74567890',
        email: 'masivo01@example.com',
        campania: 'MASIVO',
        canal: 'WSP 1',
        estado: 'En seguimiento',
        asesor: 'ALBERTO',
        comentarios: 'MASIVO - Rango 12-13',
        historial: [
          {
            fecha: new Date().toLocaleString('es-PE'),
            asesor: 'ALBERTO',
            accion: 'Creación',
            comentarios: 'Cliente derivado desde MASIVO'
          }
        ]
      },
      {
        id: 5,
        fecha: '1/9/2025',
        cliente: '991 240 254',
        nombre: 'Cliente Lead 04',
        dni: '75678901',
        email: 'cliente04@example.com',
        campania: 'CAMPAÑA 08',
        canal: 'WSP 4',
        estado: 'Vendido',
        asesor: 'SEBASTIAN',
        comentarios: 'LEADS - Rango 14-15',
        historial: [
          {
            fecha: new Date().toLocaleString('es-PE'),
            asesor: 'SEBASTIAN',
            accion: 'Creación',
            comentarios: 'Cliente derivado desde LEADS'
          }
        ]
      },
      {
        id: 6,
        fecha: '3/9/2025',
        cliente: '965 688 704',
        nombre: 'Cliente Referido 01',
        dni: '76789012',
        email: 'referido01@example.com',
        campania: 'REFERIDOS',
        canal: 'REFERIDO',
        estado: 'En gestión',
        asesor: 'JUAN',
        comentarios: 'REFERIDO - Rango 17-18',
        historial: [
          {
            fecha: new Date().toLocaleString('es-PE'),
            asesor: 'JUAN',
            accion: 'Creación',
            comentarios: 'Cliente derivado desde REFERIDOS'
          }
        ]
      },
      {
        id: 7,
        fecha: '2/9/2025',
        cliente: '999 047 141',
        nombre: 'Cliente Masivo 02',
        dni: '77890123',
        email: 'masivo02@example.com',
        campania: 'MASIVO',
        canal: 'WSP 5',
        estado: 'Nuevo',
        asesor: 'JHUDIT',
        comentarios: 'MASIVO - Rango 14-15',
        historial: [
          {
            fecha: new Date().toLocaleString('es-PE'),
            asesor: 'JHUDIT',
            accion: 'Creación',
            comentarios: 'Cliente derivado desde MASIVO'
          }
        ]
      },
      {
        id: 8,
        fecha: '19/8/2025',
        cliente: '912 074 009',
        nombre: 'Cliente Masivo 03',
        dni: '78901234',
        email: 'masivo03@example.com',
        campania: 'MASIVO',
        canal: 'WSP 1',
        estado: 'En seguimiento',
        asesor: 'GINGER',
        comentarios: 'MASIVO - Rango 15-16',
        historial: [
          {
            fecha: new Date().toLocaleString('es-PE'),
            asesor: 'GINGER',
            accion: 'Creación',
            comentarios: 'Cliente derivado desde MASIVO'
          }
        ]
      }
    ]);

    // Todos los asesores empiezan desde 0 - se incrementarán con las reasignaciones
    setAsesores(prev => prev.map(asesor => ({
      ...asesor,
      clientesAsignados: 0  // Empezar desde cero
    })));
  }, []);

  const handleSaveClient = (clientData: any) => {
    setNewClient(clientData);
    setDialogOpen(false);
  };

  // Manejar eventos de reasignación
  useEffect(() => {
    const handleLocalReassignment = (data: any) => {
      // Solo actualizar el asesor del cliente (el historial ya se maneja en GtrClientsTable)
      setClients((prevClients: any[]) => prevClients.map((client: any) => 
        client.id === data.clientId 
          ? { ...client, asesor: data.newAdvisor }
          : client
      ));

      // Actualizar estado de asesores - Solo incrementar el nuevo, no decrementar el anterior
      setAsesores((prevAsesores: any[]) => prevAsesores.map((asesor: any) => {
        if (asesor.nombre === data.newAdvisor) {
          return { ...asesor, clientesAsignados: asesor.clientesAsignados + 1 };
        }
        return asesor;
      }));
    };

    const eventHandler = (event: any) => {
      handleLocalReassignment(event.detail);
    };

    window.addEventListener('local-reassignment', eventHandler);

    return () => {
      window.removeEventListener('local-reassignment', eventHandler);
    };
  }, []);

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
                clients={clients} 
                setClients={setClients}
                asesores={asesores}
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
