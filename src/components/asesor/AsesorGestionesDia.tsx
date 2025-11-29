import React, { useState, useEffect, useCallback } from 'react';
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
  seguimiento_status: string | null;
  fecha_wizard_completado: string | null;
  wizard_completado: number;
  // Campos para sistema de duplicados
  cantidad_duplicados?: number;
  es_duplicado?: number;
}

interface ResponseGestionesDia {
  success: boolean;
  clientes: ClienteGestion[];
  totalGestiones?: number;  // Total con multiplicador desde backend
  totalRegistros?: number;  // Total de registros únicos
}

// Todas las categorías disponibles
const CATEGORIAS = [
  'Lista negra',
  'Preventa completa',
  'Sin facilidades',
  'Retirado',
  'Rechazado',
  'Agendado',
  'Seguimiento',
  'Sin contacto'
];

// Colores pasteles para cada categoría
const CATEGORIA_COLORS: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  'Lista negra': { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626', hover: '#fecaca' },
  'Preventa completa': { bg: '#dcfce7', border: '#86efac', text: '#16a34a', hover: '#bbf7d0' },
  'Sin facilidades': { bg: '#fef3c7', border: '#fcd34d', text: '#ca8a04', hover: '#fde68a' },
  'Retirado': { bg: '#e0e7ff', border: '#a5b4fc', text: '#4f46e5', hover: '#c7d2fe' },
  'Rechazado': { bg: '#ffe4e6', border: '#fda4af', text: '#e11d48', hover: '#fecdd3' },
  'Agendado': { bg: '#ddd6fe', border: '#c4b5fd', text: '#7c3aed', hover: '#e9d5ff' },
  'Seguimiento': { bg: '#dbeafe', border: '#93c5fd', text: '#2563eb', hover: '#bfdbfe' },
  'Sin contacto': { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280', hover: '#e5e7eb' }
};

// Colores para seguimiento_status (columna Seguimiento)
const SEGUIMIENTO_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'gestionado': { bg: '#dcfce7', border: '#86efac', text: '#16a34a' },
  'derivado': { bg: '#dbeafe', border: '#93c5fd', text: '#2563eb' },
  'en_gestion': { bg: '#fef3c7', border: '#fcd34d', text: '#ca8a04' },
  'no_contactado': { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626' },
  'reagendado': { bg: '#e0e7ff', border: '#a5b4fc', text: '#4f46e5' },
  'en_seguimiento': { bg: '#ddd6fe', border: '#c4b5fd', text: '#7c3aed' }
};

const AsesorGestionesDia: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteGestion[]>([]);
  const [totalGestionesBackend, setTotalGestionesBackend] = useState<number>(0);
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

      const result: ResponseGestionesDia = await response.json();
      if (result.success && result.clientes) {
        setClientes(result.clientes);
        // Usar el total con multiplicador que viene del backend
        setTotalGestionesBackend(result.totalGestiones || result.clientes.length);
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

  // WebSocket: Escuchar cuando se completa un cliente para actualizar automáticamente
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    const handleClientCompleted = (data: any) => {
      console.log('🔔 [GESTIONES DIA] Cliente completado, recargando lista...', data);
      cargarGestionesDia();
    };

    socket.on('CLIENT_COMPLETED', handleClientCompleted);

    return () => {
      socket.off('CLIENT_COMPLETED', handleClientCompleted);
    };
  }, [cargarGestionesDia]);

  // Calcular métricas
  const totalGestiones = clientes.length; // Registros únicos
  
  // Usar el total calculado por el backend (con multiplicador de duplicados)
  const gestionesTotales = totalGestionesBackend;
  
  // Clientes que van a Preventa (categorías: "Preventa" o "Preventa completa")
  const clientesAPreventa = clientes.filter((c: ClienteGestion) => 
    c.estatus_comercial_categoria === 'Preventa' || 
    c.estatus_comercial_categoria === 'Preventa completa'
  ).length;
  
  // Clientes que NO van a preventa
  const clientesOtros = totalGestiones - clientesAPreventa;

  // Contar por categoría
  const contarPorCategoria = (categoria: string): number => {
    return clientes.filter((c: ClienteGestion) => c.estatus_comercial_categoria === categoria).length;
  };

  // Filtrar clientes según categoría seleccionada
  const clientesFiltrados = categoriaSeleccionada === 'Todos' 
    ? clientes 
    : clientes.filter((c: ClienteGestion) => c.estatus_comercial_categoria === categoriaSeleccionada);

  // Componente de botón de categoría con colores pasteles
  const CategoriaButton: React.FC<{ categoria: string }> = ({ categoria }) => {
    const count = contarPorCategoria(categoria);
    const isActive = categoriaSeleccionada === categoria;
    const colors = CATEGORIA_COLORS[categoria] || { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280', hover: '#e5e7eb' };
    
    return (
      <Paper 
        sx={{ 
          p: 2, 
          textAlign: 'center',
          cursor: 'pointer',
          border: isActive ? `2px solid ${colors.border}` : '1px solid #e5e7eb',
          bgcolor: isActive ? colors.bg : 'white',
          borderRadius: 3,
          boxShadow: isActive ? `0 4px 12px ${colors.border}40` : '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: colors.hover,
            transform: 'translateY(-2px)',
            boxShadow: `0 4px 12px ${colors.border}40`
          }
        }}
        onClick={() => setCategoriaSeleccionada(categoria)}
      >
        <Typography variant="body2" sx={{ mb: 0.5, color: colors.text, fontWeight: 600 }}>
          {categoria}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.text }}>
          {count}
        </Typography>
        {isActive && (
          <Typography variant="caption" sx={{ color: colors.text, fontWeight: 600 }}>
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

      {/* 4 Cards superiores con tema moderno */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Paper 
          sx={{ 
            p: 2, 
            textAlign: 'center', 
            bgcolor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-4px)'
            }
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#6b7280', fontWeight: 600, mb: 1 }}>Clientes únicos hoy</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#111827' }}>{totalGestiones}</Typography>
        </Paper>

        <Paper 
          sx={{ 
            p: 2, 
            textAlign: 'center', 
            bgcolor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-4px)'
            }
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#6b7280', fontWeight: 600, mb: 1 }}>Gestiones totales</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#111827' }}>{gestionesTotales}</Typography>
          {gestionesTotales > totalGestiones && (
            <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 600 }}>
              (incluye duplicados ×{Math.round(gestionesTotales / totalGestiones * 10) / 10})
            </Typography>
          )}
        </Paper>

        <Paper 
          sx={{ 
            p: 2, 
            textAlign: 'center', 
            bgcolor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-4px)'
            }
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#6b7280', fontWeight: 600, mb: 1 }}>Otros</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#111827' }}>{clientesOtros}</Typography>
        </Paper>

        <Paper 
          sx={{ 
            p: 2, 
            textAlign: 'center', 
            bgcolor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-4px)'
            }
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#6b7280', fontWeight: 600, mb: 1 }}>A Preventa</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#111827' }}>{clientesAPreventa}</Typography>
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
              border: categoriaSeleccionada === 'Todos' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              bgcolor: categoriaSeleccionada === 'Todos' ? '#dbeafe' : 'white',
              borderRadius: 3,
              boxShadow: categoriaSeleccionada === 'Todos' ? '0 4px 12px #3b82f640' : '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: categoriaSeleccionada === 'Todos' ? '#dbeafe' : '#f9fafb',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px #3b82f640'
              }
            }}
            onClick={() => setCategoriaSeleccionada('Todos')}
          >
            <Typography variant="body2" sx={{ mb: 0.5, color: '#3b82f6', fontWeight: 600 }}>
              Todos
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#3b82f6' }}>
              {totalGestiones}
            </Typography>
            {categoriaSeleccionada === 'Todos' && (
              <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                ✓ Activo
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Tabla de Clientes Gestionados Filtrados */}
      <Paper 
        sx={{ 
          p: 3,
          bgcolor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#111827' }}>
          Clientes Gestionados - {categoriaSeleccionada} ({clientesFiltrados.length})
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f9fafb', color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Fecha de Cierre</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f9fafb', color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f9fafb', color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Categoría Final</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f9fafb', color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Seguimiento</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f9fafb', color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Derivado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#6b7280', fontSize: '0.875rem', borderBottom: '1px solid #e5e7eb' }}>
                    No hay clientes gestionados en esta categoría hoy
                  </TableCell>
                </TableRow>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <TableRow 
                    key={cliente.id} 
                    sx={{
                      '&:hover': { bgcolor: '#f9fafb' },
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    <TableCell sx={{ fontSize: '0.875rem', color: '#111827' }}>
                      {cliente.fecha_wizard_completado 
                        ? new Date(cliente.fecha_wizard_completado).toLocaleString('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontWeight: 600, color: '#3b82f6', fontSize: '0.875rem' }}>{cliente.nombre}</span>
                        {cliente.cantidad_duplicados && cliente.cantidad_duplicados > 1 && (
                          <Chip 
                            label={`×${cliente.cantidad_duplicados}`}
                            size="small"
                            sx={{ 
                              bgcolor: '#fef3c7',
                              color: '#ca8a04',
                              fontWeight: 700, 
                              fontSize: '0.75rem', 
                              height: '22px',
                              border: '1px solid #fcd34d'
                            }}
                            title={`Este número ingresó ${cliente.cantidad_duplicados} veces - cuenta como ${cliente.cantidad_duplicados} gestiones`}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const categoria = cliente.estatus_comercial_categoria || 'Sin categoría';
                        const colors = CATEGORIA_COLORS[categoria] || { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' };
                        return (
                          <Chip 
                            label={categoria}
                            size="small"
                            sx={{
                              bgcolor: colors.bg,
                              color: colors.text,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              border: `1px solid ${colors.border}`
                            }}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = cliente.seguimiento_status || 'gestionado';
                        const colors = SEGUIMIENTO_COLORS[status] || { bg: '#dcfce7', border: '#86efac', text: '#16a34a' };
                        // Mapeo de valores técnicos a etiquetas legibles
                        const labels: Record<string, string> = {
                          'gestionado': 'Gestionado',
                          'derivado': 'Derivado',
                          'en_gestion': 'En Gestión',
                          'no_contactado': 'No Contactado',
                          'reagendado': 'Reagendado',
                          'en_seguimiento': 'En Seguimiento'
                        };
                        return (
                          <Chip 
                            label={labels[status] || status}
                            size="small"
                            sx={{
                              bgcolor: colors.bg,
                              color: colors.text,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              border: `1px solid ${colors.border}`
                            }}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', color: '#111827' }}>
                      {cliente.seguimiento_status === 'derivado' ? (
                        <Chip 
                          label="Sí"
                          size="small"
                          sx={{
                            bgcolor: '#dbeafe',
                            color: '#2563eb',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            border: '1px solid #93c5fd'
                          }}
                        />
                      ) : (
                        <span style={{ color: '#6b7280' }}>-</span>
                      )}
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
