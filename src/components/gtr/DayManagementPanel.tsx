import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Chip } from '@mui/material';
import { getBackendUrl } from '../../utils/getBackendUrl';

interface ClienteGestionado {
  id: number;
  nombre: string;
  telefono: string;
  leads_original_telefono?: string;
  dni?: string;
  campana?: string;
  canal?: string;
  sala_asignada?: string;
  compania?: string;
  asesor_nombre: string;
  asesor_asignado?: number;
  estatus_comercial_categoria: string;
  estatus_comercial_subcategoria: string;
  fecha_wizard_completado: string;
  seguimiento_status: string;
  fecha_registro?: string;
}

// Todas las categorías disponibles
const CATEGORIAS = [
  'Seleccionar categoría',
  'Lista negra',
  'Preventa completa',
  'Preventa',
  'Sin facilidades',
  'Retirado',
  'Rechazado',
  'Agendado',
  'Seguimiento',
  'Sin contacto'
];

const DayManagementPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [clientesGestionadosHoy, setClientesGestionadosHoy] = useState<ClienteGestionado[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todos');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const backendUrl = getBackendUrl();
        
        // Cargar clientes gestionados del día
        const respClientes = await fetch(`${backendUrl}/api/clientes/gestionados-hoy`);
        const jClientes = await respClientes.json();
        if (jClientes && jClientes.success && Array.isArray(jClientes.clientes)) {
          setClientesGestionadosHoy(jClientes.clientes as ClienteGestionado[]);
        }
      } catch (e) {
        console.warn('Error cargando datos para Gestión del día', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calcular métricas
  const totalGestiones = clientesGestionadosHoy.length;
  
  // Clientes que van a Preventa (categorías: "Preventa" o "Preventa completa")
  const clientesAPreventa = clientesGestionadosHoy.filter(c => 
    c.estatus_comercial_categoria === 'Preventa' || 
    c.estatus_comercial_categoria === 'Preventa completa'
  ).length;
  
  // Clientes que se quedan en GTR (todos los que NO van a preventa)
  const clientesEnGTR = totalGestiones - clientesAPreventa;

  // Contar por categoría
  const contarPorCategoria = (categoria: string): number => {
    return clientesGestionadosHoy.filter(c => c.estatus_comercial_categoria === categoria).length;
  };

  // Filtrar clientes según categoría seleccionada
  const clientesFiltrados = categoriaSeleccionada === 'Todos' 
    ? clientesGestionadosHoy 
    : clientesGestionadosHoy.filter(c => c.estatus_comercial_categoria === categoriaSeleccionada);

  // Componente de botón de categoría
  const CategoriaButton: React.FC<{ categoria: string }> = ({ categoria }) => {
    const count = contarPorCategoria(categoria);
    const isActive = categoriaSeleccionada === categoria;
    
    return (
      <Paper 
        sx={{ 
          p: 2, 
          textAlign: 'center',
          cursor: 'pointer',
          border: isActive ? '2px solid #1976d2' : '1px solid #e0e0e0',
          bgcolor: isActive ? '#e3f2fd' : 'white',
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: isActive ? '#e3f2fd' : '#f5f5f5',
            transform: 'translateY(-2px)',
            boxShadow: 2
          }
        }}
        onClick={() => setCategoriaSeleccionada(categoria)}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {categoria}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: isActive ? '#1976d2' : 'text.primary' }}>
          {count}
        </Typography>
        {isActive && (
          <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 600 }}>
            ✓ Activo
          </Typography>
        )}
      </Paper>
    );
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Gestión del día</Typography>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Cargando datos...</Typography>
        </Box>
      ) : (
        <>
          {/* 3 Cards superiores */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
              <Typography variant="subtitle2" color="text.secondary">Gestiones hoy</Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#2e7d32' }}>{totalGestiones}</Typography>
            </Paper>

            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
              <Typography variant="subtitle2" color="text.secondary">Registrados en GTR</Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#f57c00' }}>{clientesEnGTR}</Typography>
            </Paper>

            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
              <Typography variant="subtitle2" color="text.secondary">A Preventa</Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#1976d2' }}>{clientesAPreventa}</Typography>
            </Paper>
          </Box>

          {/* Desglose por Categoría Comercial */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Desglose por Categoría Comercial (Click para filtrar)
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, mb: 2 }}>
              {CATEGORIAS.map(cat => (
                <CategoriaButton key={cat} categoria={cat} />
              ))}
              
              {/* Botón "Todos" */}
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: categoriaSeleccionada === 'Todos' ? '2px solid #4caf50' : '1px solid #e0e0e0',
                  bgcolor: categoriaSeleccionada === 'Todos' ? '#e8f5e9' : 'white',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: categoriaSeleccionada === 'Todos' ? '#e8f5e9' : '#f5f5f5',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
                onClick={() => setCategoriaSeleccionada('Todos')}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Todos
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: categoriaSeleccionada === 'Todos' ? '#4caf50' : 'text.primary' }}>
                  {totalGestiones}
                </Typography>
                {categoriaSeleccionada === 'Todos' && (
                  <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600 }}>
                    ✓ Activo
                  </Typography>
                )}
              </Paper>
            </Box>
          </Box>

          {/* Tabla de Clientes Gestionados Filtrados */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Clientes Gestionados - {categoriaSeleccionada} ({clientesFiltrados.length})
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Lead</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Campaña</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Canal</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Sala</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Categoría</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Asesor</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Seguimiento</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No hay clientes gestionados en esta categoría hoy
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesFiltrados.map(cliente => (
                    <TableRow key={cliente.id} hover>
                      <TableCell>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1976d2' }}>
                            {cliente.leads_original_telefono || cliente.telefono || 'Sin teléfono'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{cliente.campana || '-'}</TableCell>
                      <TableCell>{cliente.canal || '-'}</TableCell>
                      <TableCell>{cliente.sala_asignada || '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={cliente.estatus_comercial_categoria || 'Sin categoría'}
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>{cliente.asesor_nombre || 'Disponible'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={cliente.seguimiento_status || 'gestionado'} 
                          size="small"
                          color={
                            cliente.seguimiento_status === 'derivado' ? 'info' :
                            cliente.seguimiento_status === 'en_gestion' ? 'warning' :
                            'success'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default DayManagementPanel;
