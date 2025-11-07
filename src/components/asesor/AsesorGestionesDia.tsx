import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  CircularProgress
} from '@mui/material';

interface ClienteGestion {
  id: number;
  nombre: string;
  telefono: string;
  dni: string;
  campana?: string;
  estatus_comercial_categoria: string | null;
  estatus_comercial_subcategoria: string | null;
  fecha_wizard_completado: string | null;
  wizard_completado: number;
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

const AsesorGestionesDia: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteGestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todos');

  const cargarGestionesDia = useCallback(async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const asesorId = userData.id;

      if (!asesorId) {
        console.error('No se encontró ID de usuario para cargar gestiones');
        return;
      }

      const response = await fetch(`/api/clientes/asesor/${asesorId}/gestiones-dia`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar gestiones del día');
      }

      const result = await response.json();
      if (result.success && result.clientes) {
        setClientes(result.clientes);
      }
    } catch (error) {
      console.error('Error cargando gestiones del día:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarGestionesDia();
  }, [cargarGestionesDia]);

  // Calcular métricas
  const totalGestiones = clientes.length;
  
  // Clientes que van a Preventa (categorías: "Preventa" o "Preventa completa")
  const clientesAPreventa = clientes.filter(c => 
    c.estatus_comercial_categoria === 'Preventa' || 
    c.estatus_comercial_categoria === 'Preventa completa'
  ).length;
  
  // Clientes que NO van a preventa
  const clientesOtros = totalGestiones - clientesAPreventa;

  // Contar por categoría
  const contarPorCategoria = (categoria: string): number => {
    return clientes.filter(c => c.estatus_comercial_categoria === categoria).length;
  };

  // Filtrar clientes según categoría seleccionada
  const clientesFiltrados = categoriaSeleccionada === 'Todos' 
    ? clientes 
    : clientes.filter(c => c.estatus_comercial_categoria === categoriaSeleccionada);

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando datos del día...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Gestiones del Día</Typography>

      {/* 3 Cards superiores */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
          <Typography variant="subtitle2" color="text.secondary">Gestiones hoy</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#2e7d32' }}>{totalGestiones}</Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
          <Typography variant="subtitle2" color="text.secondary">Otros</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#f57c00' }}>{clientesOtros}</Typography>
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
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Fecha de Cierre</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Categoría Final</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Seguimiento</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No hay clientes gestionados en esta categoría hoy
                  </TableCell>
                </TableRow>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.id} hover>
                    <TableCell>
                      {cliente.fecha_wizard_completado 
                        ? new Date(cliente.fecha_wizard_completado).toLocaleString('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'
                      }
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>{cliente.nombre}</TableCell>
                    <TableCell>
                      <Chip 
                        label={cliente.estatus_comercial_categoria || 'Sin categoría'}
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label="Gestionado"
                        size="small"
                        color="success"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AsesorGestionesDia;
