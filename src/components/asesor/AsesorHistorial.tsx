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

interface ClienteHistorial {
  id: number;
  telefono: string;
  campana?: string;
  estatus_comercial_categoria: string | null;
  estatus_comercial_subcategoria: string | null;
  fecha_wizard_completado: string | null;
  fecha_cierre_formateada?: string;
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

const AsesorHistorial: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todos');

  const cargarHistorial = useCallback(async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const asesorId = userData.id;

      if (!asesorId) {
        console.error('No se encontró ID de usuario para cargar historial');
        return;
      }

      const response = await fetch(`/api/clientes/asesor/${asesorId}/historial`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar historial');
      }

      const result = await response.json();
      if (result.success && result.clientes) {
        setClientes(result.clientes);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

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
        <Typography sx={{ ml: 2 }}>Cargando gestiones del mes...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Gestiones del Mes
      </Typography>

      {/* Métricas principales */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 300px' }}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#d1fae5' }}>
            <Typography variant="body2" color="text.secondary">
              Gestiones del mes
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#059669' }}>
              {totalGestiones}
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 300px' }}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fed7aa' }}>
            <Typography variant="body2" color="text.secondary">
              Otros
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#ea580c' }}>
              {clientesOtros}
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 300px' }}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#dbeafe' }}>
            <Typography variant="body2" color="text.secondary">
              A Preventa
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#2563eb' }}>
              {clientesAPreventa}
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Filtros por categoría */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Desglose por Categoría Comercial (Click para filtrar)
      </Typography>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, 
        gap: 2, 
        mb: 3 
      }}>
        {CATEGORIAS.map((cat) => (
          <CategoriaButton key={cat} categoria={cat} />
        ))}
        {/* Botón "Todos" */}
        <Paper 
          sx={{ 
            p: 2, 
            textAlign: 'center',
            cursor: 'pointer',
            border: categoriaSeleccionada === 'Todos' ? '2px solid #10b981' : '1px solid #e0e0e0',
            bgcolor: categoriaSeleccionada === 'Todos' ? '#d1fae5' : 'white',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: categoriaSeleccionada === 'Todos' ? '#d1fae5' : '#f5f5f5',
              transform: 'translateY(-2px)',
              boxShadow: 2
            }
          }}
          onClick={() => setCategoriaSeleccionada('Todos')}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Todos
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: categoriaSeleccionada === 'Todos' ? '#10b981' : 'text.primary' }}>
            {totalGestiones}
          </Typography>
          {categoriaSeleccionada === 'Todos' && (
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
              ✓ Activo
            </Typography>
          )}
        </Paper>
      </Box>

      {/* Tabla de clientes */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Clientes Gestionados - {categoriaSeleccionada} ({clientesFiltrados.length})
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: '50vh' }}>
        <Table stickyHeader size="small">
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
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No hay clientes gestionados en esta categoría del mes
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clientesFiltrados.map((cliente) => (
                <TableRow key={cliente.id} hover>
                  <TableCell>
                    {cliente.fecha_cierre_formateada || 
                      (cliente.fecha_wizard_completado 
                        ? new Date(cliente.fecha_wizard_completado).toLocaleDateString('es-PE', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).replace(',', '')
                        : '-'
                      )
                    }
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>
                    {(() => {
                      const t = cliente.telefono || '';
                      const digits = String(t).replace(/\D/g, '').slice(-9);
                      if (!digits) return t;
                      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
                    })()}
                  </TableCell>
                  <TableCell>
                    {cliente.estatus_comercial_categoria ? (
                      <Chip 
                        label={cliente.estatus_comercial_categoria} 
                        color="primary"
                        size="small"
                      />
                    ) : (
                      <span style={{ color: '#9ca3af' }}>Sin estatus</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label="Gestionado"
                      color="success"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AsesorHistorial;
