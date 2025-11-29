import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Fade } from '@mui/material';
import { getBackendUrl } from '../../utils/getBackendUrl';
import { StatusBadge } from '../common/StatusBadge';
import { getSeguimientoStatus, formatSeguimientoText } from '../common/statusHelpers';
import { colors, typography } from '../../theme/designTokens';

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

// Todas las categorías disponibles (sin "Seleccionar categoría" y "Preventa")
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
const CATEGORIA_COLORS: Record<string, { bg: string, border: string, text: string, hover: string }> = {
  'Lista negra': { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626', hover: '#fecaca' },
  'Preventa completa': { bg: '#dcfce7', border: '#86efac', text: '#16a34a', hover: '#bbf7d0' },
  'Sin facilidades': { bg: '#fef3c7', border: '#fcd34d', text: '#ca8a04', hover: '#fde68a' },
  'Retirado': { bg: '#e0e7ff', border: '#a5b4fc', text: '#4f46e5', hover: '#c7d2fe' },
  'Rechazado': { bg: '#ffe4e6', border: '#fda4af', text: '#e11d48', hover: '#fecdd3' },
  'Agendado': { bg: '#ddd6fe', border: '#c4b5fd', text: '#7c3aed', hover: '#e9d5ff' },
  'Seguimiento': { bg: '#dbeafe', border: '#93c5fd', text: '#2563eb', hover: '#bfdbfe' },
  'Sin contacto': { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280', hover: '#e5e7eb' }
};

const DayManagementPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [clientesGestionadosHoy, setClientesGestionadosHoy] = useState<ClienteGestionado[]>([]);
  const [campanaStatsMap, setCampanaStatsMap] = useState<Record<string, { total_ingresados_hoy: number; total_validaciones_hoy: number; porcentaje?: number }>>({});
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
        
        // Cargar estadísticas por campaña (ingresados hoy vs validaciones)
        try {
          console.log('🔍 Fetching campana-stats-hoy from:', `${backendUrl}/api/clientes/campana-stats-hoy`);
          const respStats = await fetch(`${backendUrl}/api/clientes/campana-stats-hoy`);
          console.log('📊 Response status:', respStats.status);
          const jStats = await respStats.json();
          console.log('📊 Response data:', jStats);
          if (jStats && jStats.success && Array.isArray(jStats.stats)) {
            const map: Record<string, { total_ingresados_hoy: number; total_validaciones_hoy: number; porcentaje?: number }> = {};
            jStats.stats.forEach((s: { campana: string; total_ingresados_hoy: number; total_validaciones_hoy: number; porcentaje?: number }) => {
              map[s.campana] = {
                total_ingresados_hoy: s.total_ingresados_hoy,
                total_validaciones_hoy: s.total_validaciones_hoy,
                porcentaje: s.porcentaje
              };
            });
            console.log('📊 CampanaStatsMap:', map);
            setCampanaStatsMap(map);
          }
        } catch (e) {
          console.error('❌ Error cargando campana-stats-hoy', e);
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

  // Contar por categoría
  const contarPorCategoria = (categoria: string): number => {
    return clientesGestionadosHoy.filter(c => c.estatus_comercial_categoria === categoria).length;
  };

  // Filtrar clientes según categoría seleccionada
  const clientesFiltrados = categoriaSeleccionada === 'Todos' 
    ? clientesGestionadosHoy 
    : clientesGestionadosHoy.filter(c => c.estatus_comercial_categoria === categoriaSeleccionada);

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
          border: isActive ? `2px solid ${colors.border}` : `1px solid ${colors.border}`,
          bgcolor: isActive ? colors.bg : '#ffffff',
          transition: 'all 0.2s',
          boxShadow: isActive ? `0 4px 12px ${colors.border}40` : '0 1px 3px rgba(0,0,0,0.1)',
          '&:hover': {
            bgcolor: colors.hover,
            transform: 'translateY(-2px)',
            boxShadow: `0 4px 12px ${colors.border}60`
          }
        }}
        onClick={() => setCategoriaSeleccionada(categoria)}
      >
        <Typography variant="body2" sx={{ mb: 0.5, color: colors.text, fontWeight: 600, fontSize: '0.75rem' }}>
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

  return (
    <Box>
      <Fade in timeout={600}>
        <Typography variant="h5" sx={{ 
          mb: 4, 
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          fontSize: typography.fontSize['2xl']
        }}>
          Gestión del día
        </Typography>
      </Fade>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} sx={{ color: colors.primary[500] }} />
          <Typography sx={{ color: colors.text.secondary }}>Cargando datos...</Typography>
        </Box>
      ) : (
        <>
          {/* LEADS DEL DÍA x ASESOR */}
          <Box sx={{ 
            bgcolor: 'white', 
            borderRadius: 3, 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            mb: 4
          }}>
            <Box sx={{ 
              p: 2.5, 
              borderBottom: '1px solid #e5e7eb',
              bgcolor: '#f9fafb'
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                color: '#111827',
                fontSize: '1.125rem'
              }}>
                LEADS DEL DÍA x ASESOR
              </Typography>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      py: 2,
                      fontSize: '0.875rem'
                    }}>
                      ASESOR
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 700, 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      py: 2,
                      fontSize: '0.875rem'
                    }}>
                      TOTAL
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 700, 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      py: 2,
                      fontSize: '0.875rem'
                    }}>
                      PREVENTAS
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    // Agrupar por asesor
                    const asesorStats = clientesGestionadosHoy.reduce((acc, cliente) => {
                      const asesorNombre = cliente.asesor_nombre || 'Sin asignar';
                      if (!acc[asesorNombre]) {
                        acc[asesorNombre] = { total: 0, preventas: 0 };
                      }
                      acc[asesorNombre].total += 1;
                      
                      // Contar preventas
                      if (cliente.estatus_comercial_categoria === 'Preventa' || 
                          cliente.estatus_comercial_categoria === 'Preventa completa') {
                        acc[asesorNombre].preventas += 1;
                      }
                      
                      return acc;
                    }, {} as Record<string, { total: number; preventas: number }>);

                    // Convertir a array y ordenar por total descendente
                    const asesorArray = Object.entries(asesorStats)
                      .map(([nombre, stats]) => ({ nombre, ...stats }))
                      .sort((a, b) => b.total - a.total);

                    if (asesorArray.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 4, color: colors.text.secondary }}>
                            No hay gestiones registradas hoy
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return asesorArray.map((asesor) => (
                      <TableRow 
                        key={asesor.nombre}
                        sx={{
                          '&:hover': { 
                            backgroundColor: '#f9fafb',
                            transition: 'background-color 0.2s ease'
                          },
                          borderBottom: '1px solid #e5e7eb'
                        }}
                      >
                        <TableCell sx={{ 
                          py: 2,
                          fontWeight: 600,
                          color: '#111827',
                          fontSize: '0.875rem'
                        }}>
                          {asesor.nombre}
                        </TableCell>
                        <TableCell align="center" sx={{ 
                          py: 2,
                          fontWeight: 700,
                          color: '#3b82f6',
                          fontSize: '1.125rem'
                        }}>
                          {asesor.total}
                        </TableCell>
                        <TableCell align="center" sx={{ 
                          py: 2,
                          fontWeight: 700,
                          color: asesor.preventas > 0 ? '#10b981' : '#9ca3af',
                          fontSize: '1.125rem'
                        }}>
                          {asesor.preventas}
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </Box>
          </Box>

          {/* GESTIÓN x CAMPAÑA */}
          <Box sx={{ 
            bgcolor: 'white', 
            borderRadius: 3, 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            mb: 4
          }}>
            <Box sx={{ 
              p: 2.5, 
              borderBottom: '1px solid #e5e7eb',
              bgcolor: '#f9fafb'
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                color: '#111827',
                fontSize: '1.125rem'
              }}>
                GESTIÓN x CAMPAÑA
              </Typography>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              {(() => {
                console.log('🔍 GESTIÓN x CAMPAÑA - Clientes:', clientesGestionadosHoy.length);
                // Obtener todas las campañas únicas
                const campanas = Array.from(new Set(clientesGestionadosHoy.map(c => c.campana || 'Sin campaña')));
                console.log('🔍 Campañas encontradas:', campanas);
                console.log('🔍 CampanaStatsMap:', campanaStatsMap);
                
                // Usar clientes INGRESADOS HOY como base del porcentaje (del backend)
                const totalPorCampana = campanas.reduce((acc, camp) => {
                  const backendTotal = campanaStatsMap[camp]?.total_ingresados_hoy;
                  console.log(`🔍 Campaña "${camp}": backend total =`, backendTotal);
                  acc[camp] = typeof backendTotal === 'number' && backendTotal > 0
                    ? backendTotal
                    : 0; // Si no hay datos del backend, mostrar 0
                  return acc;
                }, {} as Record<string, number>);
                console.log('🔍 Total por campaña:', totalPorCampana);

                // Obtener todas las categorías con al menos 1 cliente
                const categoriasConDatos = Array.from(new Set(
                  clientesGestionadosHoy.map(c => c.estatus_comercial_categoria || 'Sin categoría')
                )).sort();

                // Calcular datos por categoría y campaña
                const datosPorCategoria = categoriasConDatos.map(categoria => {
                  const totalCategoria = clientesGestionadosHoy.filter(
                    c => (c.estatus_comercial_categoria || 'Sin categoría') === categoria
                  ).length;

                  const porCampana = campanas.reduce((acc, campana) => {
                    const count = clientesGestionadosHoy.filter(
                      c => (c.estatus_comercial_categoria || 'Sin categoría') === categoria && 
                           (c.campana || 'Sin campaña') === campana
                    ).length;
                    
                    // Calcular porcentaje para TODAS las categorías
                    // Porcentaje = (clientes de esta categoría en esta campaña / total ingresados hoy en esta campaña) × 100
                    const porcentaje = totalPorCampana[campana] > 0
                      ? ((count / totalPorCampana[campana]) * 100).toFixed(2)
                      : '0.00';
                    
                    acc[campana] = { count, porcentaje };
                    return acc;
                  }, {} as Record<string, { count: number; porcentaje: string }>);

                  return { categoria, totalCategoria, porCampana };
                });

                // Determinar color de la categoría
                const getCategoriaColor = (cat: string) => {
                  if (cat.toLowerCase().includes('preventa') || cat.toLowerCase().includes('venta')) {
                    return '#e8f5e9'; // Verde claro
                  }
                  return 'transparent';
                };

                const getCategoriaTextColor = (cat: string) => {
                  if (cat.toLowerCase().includes('preventa') || cat.toLowerCase().includes('venta')) {
                    return '#2e7d32'; // Verde oscuro
                  }
                  return colors.text.primary;
                };

                return (
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                        <TableCell sx={{ 
                          fontWeight: 700,
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb',
                          py: 2,
                          minWidth: 200,
                          fontSize: '0.875rem'
                        }}>
                          TIPIFICACIÓN
                        </TableCell>
                        <TableCell align="center" sx={{ 
                          fontWeight: 700,
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb',
                          py: 2,
                          fontSize: '0.875rem'
                        }}>
                          TOTAL
                        </TableCell>
                        {campanas.map(campana => (
                          <TableCell 
                            key={campana}
                            colSpan={2}
                            align="center"
                            sx={{ 
                              fontWeight: 700,
                              color: '#374151',
                              borderBottom: '1px solid #e5e7eb',
                              py: 2,
                              borderLeft: '1px solid #e5e7eb',
                              fontSize: '0.875rem'
                            }}
                          >
                            {campana.toUpperCase()}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
                        <TableCell sx={{ 
                          borderBottom: '1px solid #e5e7eb',
                          py: 1
                        }}></TableCell>
                        <TableCell sx={{ 
                          borderBottom: '1px solid #e5e7eb',
                          py: 1
                        }}></TableCell>
                        {campanas.map(campana => (
                          <>
                            <TableCell 
                              key={`${campana}-count`}
                              align="center"
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                borderBottom: '1px solid #e5e7eb',
                                borderLeft: '1px solid #e5e7eb',
                                py: 1
                              }}
                            >
                              #{totalPorCampana[campana]}
                            </TableCell>
                            <TableCell 
                              key={`${campana}-pct`}
                              align="center"
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                borderBottom: '1px solid #e5e7eb',
                                py: 1
                              }}
                            >
                              %
                            </TableCell>
                          </>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {datosPorCategoria.map((dato) => (
                        <TableRow 
                          key={dato.categoria}
                          sx={{
                            '&:hover': { backgroundColor: '#f9fafb' },
                            borderBottom: '1px solid #e5e7eb'
                          }}
                        >
                          <TableCell sx={{ 
                            py: 2,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            backgroundColor: getCategoriaColor(dato.categoria),
                            color: getCategoriaTextColor(dato.categoria)
                          }}>
                            {dato.categoria}
                          </TableCell>
                          <TableCell align="center" sx={{ 
                            py: 2,
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: '#111827'
                          }}>
                            {dato.totalCategoria}
                          </TableCell>
                          {campanas.map(campana => {
                            const data = dato.porCampana[campana];
                            return (
                              <>
                                <TableCell 
                                  key={`${campana}-count`}
                                  align="center"
                                  sx={{ 
                                    py: 2,
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    borderLeft: '1px solid #e5e7eb',
                                    color: data.count > 0 ? '#111827' : '#9ca3af'
                                  }}
                                >
                                  {data.count}
                                </TableCell>
                                <TableCell 
                                  key={`${campana}-pct`}
                                  align="center"
                                  sx={{ 
                                    py: 2,
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    color: parseFloat(data.porcentaje) > 0 ? '#3b82f6' : '#9ca3af'
                                  }}
                                >
                                  {data.porcentaje}%
                                </TableCell>
                              </>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );
              })()}
            </Box>
          </Box>

          {/* Desglose por Categoría Comercial */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>
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
          <Box sx={{ 
            bgcolor: 'white', 
            borderRadius: 3, 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              p: 2.5, 
              borderBottom: '1px solid #e5e7eb',
              bgcolor: '#f9fafb'
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                color: '#111827',
                fontSize: '1.125rem'
              }}>
                Clientes Gestionados - {categoriaSeleccionada} ({clientesFiltrados.length})
              </Typography>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      py: 2,
                      fontSize: '0.875rem'
                    }}>Lead</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      py: 2,
                      fontSize: '0.875rem'
                    }}>Campaña</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      py: 2,
                      fontSize: '0.875rem'
                    }}>Canal</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      py: 2,
                      fontSize: '0.875rem'
                    }}>Sala</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      py: 2,
                      fontSize: '0.875rem'
                    }}>Categoría</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      py: 2,
                      fontSize: '0.875rem'
                    }}>Subcategoría</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      py: 2,
                      fontSize: '0.875rem'
                    }}>Asesor</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      py: 2,
                      fontSize: '0.875rem'
                    }}>Seguimiento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientesFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, color: colors.text.secondary }}>
                        <Typography variant="body2">
                          No hay clientes gestionados en esta categoría hoy
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientesFiltrados.map((cliente) => (
                      <TableRow 
                        key={cliente.id} 
                        sx={{
                          '&:hover': { 
                            backgroundColor: '#f9fafb',
                            transition: 'background-color 0.2s ease'
                          },
                          borderBottom: '1px solid #e5e7eb'
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Typography sx={{ 
                            fontWeight: 600, 
                            color: '#3b82f6',
                            fontSize: '0.875rem'
                          }}>
                            {cliente.leads_original_telefono || cliente.telefono || 'Sin teléfono'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2, color: '#6b7280', fontSize: '0.875rem' }}>{cliente.campana || '-'}</TableCell>
                        <TableCell sx={{ py: 2, color: '#6b7280', fontSize: '0.875rem' }}>{cliente.canal || '-'}</TableCell>
                        <TableCell sx={{ py: 2, color: '#6b7280', fontSize: '0.875rem' }}>{cliente.sala_asignada || '-'}</TableCell>
                        <TableCell sx={{ py: 2 }}>
                          {cliente.estatus_comercial_categoria ? (
                            <Typography sx={{ 
                              fontWeight: 600, 
                              fontSize: '0.875rem',
                              color: '#111827'
                            }}>
                              {cliente.estatus_comercial_categoria}
                            </Typography>
                          ) : (
                            <Typography sx={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.875rem' }}>
                              Sin categoría
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          {cliente.estatus_comercial_subcategoria ? (
                            <Typography sx={{ 
                              fontSize: '0.875rem', 
                              color: '#6b7280',
                              fontWeight: 500
                            }}>
                              {cliente.estatus_comercial_subcategoria}
                            </Typography>
                          ) : (
                            <Typography sx={{ color: '#9ca3af' }}>-</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 2, color: '#6b7280', fontSize: '0.875rem' }}>{cliente.asesor_nombre || 'Disponible'}</TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <StatusBadge
                            status={getSeguimientoStatus(cliente.seguimiento_status || 'gestionado')}
                            label={formatSeguimientoText(cliente.seguimiento_status || 'gestionado')}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DayManagementPanel;
