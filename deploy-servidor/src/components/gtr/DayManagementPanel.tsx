import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Fade, Grow } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getBackendUrl } from '../../utils/getBackendUrl';
import { AnimatedCard } from '../common/AnimatedCard';
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
          {/* 3 Cards superiores mejoradas con animación */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 4 }}>
            <Grow in timeout={400}>
              <AnimatedCard delay={0} sx={{ 
                p: 3, 
                textAlign: 'center', 
                background: `linear-gradient(135deg, ${colors.secondary[50]} 0%, ${colors.secondary[100]} 100%)`,
                border: `1px solid ${colors.secondary[200]}`,
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <AssignmentTurnedInIcon sx={{ fontSize: 32, color: colors.secondary[600] }} />
                </Box>
                <Typography variant="caption" sx={{ 
                  color: colors.secondary[700], 
                  fontWeight: typography.fontWeight.semibold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Gestiones hoy
                </Typography>
                <Typography variant="h2" sx={{ 
                  fontWeight: typography.fontWeight.extrabold, 
                  color: colors.secondary[700],
                  mt: 1 
                }}>
                  {totalGestiones}
                </Typography>
              </AnimatedCard>
            </Grow>

            <Grow in timeout={400} style={{ transformOrigin: '0 0 0' }}>
              <AnimatedCard delay={100} sx={{ 
                p: 3, 
                textAlign: 'center', 
                background: `linear-gradient(135deg, ${colors.warning[50]} 0%, ${colors.warning[100]} 100%)`,
                border: `1px solid ${colors.warning[200]}`,
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 32, color: colors.warning[600] }} />
                </Box>
                <Typography variant="caption" sx={{ 
                  color: colors.warning[700], 
                  fontWeight: typography.fontWeight.semibold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Registrados en GTR
                </Typography>
                <Typography variant="h2" sx={{ 
                  fontWeight: typography.fontWeight.extrabold, 
                  color: colors.warning[700],
                  mt: 1 
                }}>
                  {clientesEnGTR}
                </Typography>
              </AnimatedCard>
            </Grow>

            <Grow in timeout={400} style={{ transformOrigin: '0 0 0' }}>
              <AnimatedCard delay={200} sx={{ 
                p: 3, 
                textAlign: 'center', 
                background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
                border: `1px solid ${colors.primary[200]}`,
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: colors.primary[600] }} />
                </Box>
                <Typography variant="caption" sx={{ 
                  color: colors.primary[700], 
                  fontWeight: typography.fontWeight.semibold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  A Preventa
                </Typography>
                <Typography variant="h2" sx={{ 
                  fontWeight: typography.fontWeight.extrabold, 
                  color: colors.primary[700],
                  mt: 1 
                }}>
                  {clientesAPreventa}
                </Typography>
              </AnimatedCard>
            </Grow>
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
          <AnimatedCard delay={300} sx={{ overflow: 'hidden' }}>
            <Box sx={{ 
              p: 3, 
              borderBottom: `1px solid ${colors.neutral[200]}`,
              background: `linear-gradient(to right, ${colors.background.paper}, ${colors.neutral[50]})`
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary
              }}>
                Clientes Gestionados - {categoriaSeleccionada} ({clientesFiltrados.length})
              </Typography>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: colors.neutral[50] }}>
                    <TableCell sx={{ 
                      fontWeight: typography.fontWeight.bold, 
                      color: colors.text.primary,
                      borderBottom: `2px solid ${colors.neutral[300]}`,
                      py: 2
                    }}>Lead</TableCell>
                    <TableCell sx={{ 
                      fontWeight: typography.fontWeight.bold, 
                      color: colors.text.primary,
                      borderBottom: `2px solid ${colors.neutral[300]}`,
                      py: 2
                    }}>Campaña</TableCell>
                    <TableCell sx={{ 
                      fontWeight: typography.fontWeight.bold, 
                      color: colors.text.primary,
                      borderBottom: `2px solid ${colors.neutral[300]}`,
                      py: 2
                    }}>Canal</TableCell>
                    <TableCell sx={{ 
                      fontWeight: typography.fontWeight.bold, 
                      color: colors.text.primary,
                      borderBottom: `2px solid ${colors.neutral[300]}`,
                      py: 2
                    }}>Sala</TableCell>
                    <TableCell sx={{ 
                      fontWeight: typography.fontWeight.bold, 
                      color: colors.text.primary,
                      borderBottom: `2px solid ${colors.neutral[300]}`,
                      py: 2
                    }}>Categoría</TableCell>
                    <TableCell sx={{ 
                      fontWeight: typography.fontWeight.bold, 
                      color: colors.text.primary,
                      borderBottom: `2px solid ${colors.neutral[300]}`,
                      py: 2
                    }}>Subcategoría</TableCell>
                    <TableCell sx={{ 
                      fontWeight: typography.fontWeight.bold, 
                      color: colors.text.primary,
                      borderBottom: `2px solid ${colors.neutral[300]}`,
                      py: 2
                    }}>Asesor</TableCell>
                    <TableCell sx={{ 
                      fontWeight: typography.fontWeight.bold, 
                      color: colors.text.primary,
                      borderBottom: `2px solid ${colors.neutral[300]}`,
                      py: 2
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
                    clientesFiltrados.map((cliente, index) => (
                      <TableRow 
                        key={cliente.id} 
                        sx={{
                          '&:hover': { 
                            backgroundColor: colors.neutral[50],
                            transition: 'background-color 0.2s ease'
                          },
                          animation: `fadeIn 0.3s ease ${index * 50}ms both`,
                          '@keyframes fadeIn': {
                            from: { opacity: 0, transform: 'translateX(-10px)' },
                            to: { opacity: 1, transform: 'translateX(0)' }
                          }
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Typography sx={{ 
                            fontWeight: typography.fontWeight.semibold, 
                            color: colors.primary[600],
                            fontSize: typography.fontSize.sm
                          }}>
                            {cliente.leads_original_telefono || cliente.telefono || 'Sin teléfono'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2, color: colors.text.secondary }}>{cliente.campana || '-'}</TableCell>
                        <TableCell sx={{ py: 2, color: colors.text.secondary }}>{cliente.canal || '-'}</TableCell>
                        <TableCell sx={{ py: 2, color: colors.text.secondary }}>{cliente.sala_asignada || '-'}</TableCell>
                        <TableCell sx={{ py: 2 }}>
                          {cliente.estatus_comercial_categoria ? (
                            <Typography sx={{ 
                              fontWeight: typography.fontWeight.semibold, 
                              fontSize: typography.fontSize.sm,
                              color: colors.text.primary
                            }}>
                              {cliente.estatus_comercial_categoria}
                            </Typography>
                          ) : (
                            <Typography sx={{ color: colors.text.disabled, fontStyle: 'italic', fontSize: typography.fontSize.sm }}>
                              Sin categoría
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          {cliente.estatus_comercial_subcategoria ? (
                            <Typography sx={{ 
                              fontSize: typography.fontSize.sm, 
                              color: colors.text.secondary,
                              fontWeight: typography.fontWeight.medium
                            }}>
                              {cliente.estatus_comercial_subcategoria}
                            </Typography>
                          ) : (
                            <Typography sx={{ color: colors.text.disabled }}>-</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 2, color: colors.text.secondary }}>{cliente.asesor_nombre || 'Disponible'}</TableCell>
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
          </AnimatedCard>
        </>
      )}
    </Box>
  );
};

export default DayManagementPanel;
