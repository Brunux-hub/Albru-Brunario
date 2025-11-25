import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle,
  TrendingUp,
  Person,
  Phone
} from '@mui/icons-material';
import axios from 'axios';

interface ClienteGestion {
  id: number;
  nombre: string;
  telefono: string;
  dni: string;
  campana: string;
  estatus_comercial_categoria: string;
  estatus_comercial_subcategoria: string;
  fecha_wizard_completado: string;
  wizard_completado: number;
  cantidad_duplicados?: number;
  es_duplicado?: number;
}

interface ResponseGestionesDia {
  success: boolean;
  clientes: ClienteGestion[];
  totalGestiones?: number;
  totalRegistros?: number;
}

interface AsesorReportModalProps {
  open: boolean;
  onClose: () => void;
  asesorId: number;
  asesorNombre: string;
}

const AsesorReportModal: React.FC<AsesorReportModalProps> = ({ 
  open, 
  onClose, 
  asesorId,
  asesorNombre 
}) => {
  const [loading, setLoading] = useState(false);
  const [gestiones, setGestiones] = useState<ClienteGestion[]>([]);
  const [totalGestionesConDuplicados, setTotalGestionesConDuplicados] = useState(0);

  const fetchGestionesDelDia = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/clientes/asesor/${asesorId}/gestiones-dia`);
      if (response.data.success) {
        const data: ResponseGestionesDia = response.data;
        setGestiones(data.clientes || []);
        setTotalGestionesConDuplicados(data.totalGestiones || data.clientes?.length || 0);
      }
    } catch (error) {
      console.error('Error al obtener gestiones del día:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos inicialmente cuando se abre el modal
  useEffect(() => {
    if (open && asesorId) {
      fetchGestionesDelDia();
    }
  }, [open, asesorId]);

  // WebSocket: Escuchar cuando se completa un cliente para actualizar automáticamente
  useEffect(() => {
    if (!open) return;

    const socket = (window as any).socket;
    if (!socket) return;

    const handleClientCompleted = (data: any) => {
      // Solo recargar si es del asesor que estamos viendo
      if (data.asesorId === asesorId || data.asesor_asignado === asesorId) {
        console.log('🔔 [GTR REPORTE] Cliente completado por asesor, recargando...', data);
        fetchGestionesDelDia();
      }
    };

    socket.on('CLIENT_COMPLETED', handleClientCompleted);

    return () => {
      socket.off('CLIENT_COMPLETED', handleClientCompleted);
    };
  }, [open, asesorId]);

  const getCategoriaColor = (categoria: string) => {
    switch(categoria) {
      case 'Lista negra': return { bg: '#1f2937', text: '#ffffff' };
      case 'Preventa completa': return { bg: '#d1fae5', text: '#059669' };
      case 'Preventa incompleta': return { bg: '#fef3c7', text: '#d97706' };
      case 'Sin facilidades': return { bg: '#fef3c7', text: '#d97706' };
      case 'Retirado': return { bg: '#fee2e2', text: '#dc2626' };
      case 'Rechazado': return { bg: '#fecaca', text: '#b91c1c' };
      case 'Agendado': return { bg: '#e0e7ff', text: '#4f46e5' };
      case 'Seguimiento': return { bg: '#dbeafe', text: '#2563eb' };
      case 'Sin contacto': return { bg: '#f3f4f6', text: '#6b7280' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { date: '-', time: '-' };
    try {
      const fecha = new Date(dateStr);
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const anio = fecha.getFullYear();
      const hora = String(fecha.getHours()).padStart(2, '0');
      const minuto = String(fecha.getMinutes()).padStart(2, '0');
      
      return {
        date: `${dia}/${mes}/${anio}`,
        time: `${hora}:${minuto}`
      };
    } catch {
      return { date: dateStr, time: '-' };
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '600px'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        pb: 2
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person /> Reporte de {asesorNombre}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Gestiones realizadas hoy
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Resumen de estadísticas */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                        {totalGestionesConDuplicados}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Gestiones
                      </Typography>
                      {totalGestionesConDuplicados > gestiones.length && (
                        <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                          ({gestiones.length} registros únicos)
                        </Typography>
                      )}
                    </Box>
                    <CheckCircle sx={{ fontSize: 50, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                        {gestiones.filter(g => g.estatus_comercial_categoria === 'Preventa completa').length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Preventas Completas
                      </Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 50, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                        {gestiones.filter(g => g.estatus_comercial_categoria === 'Agendado').length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Agendados
                      </Typography>
                    </Box>
                    <CheckCircle sx={{ fontSize: 50, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Lista detallada de gestiones */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#111827' }}>
              Detalle de Gestiones ({gestiones.length})
            </Typography>

            {gestiones.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  No hay gestiones registradas para hoy
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Fecha/Hora</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Cliente</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Teléfono (Lead)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Campaña</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Categoría</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Subcategoría</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gestiones.map((gestion, index) => {
                      const { date, time } = formatDateTime(gestion.fecha_wizard_completado);
                      const colors = getCategoriaColor(gestion.estatus_comercial_categoria);
                      
                      return (
                        <TableRow 
                          key={gestion.id}
                          sx={{ 
                            '&:hover': { backgroundColor: '#f9fafb' },
                            borderBottom: '1px solid #e5e7eb'
                          }}
                        >
                          <TableCell sx={{ fontWeight: 'bold', color: '#6b7280' }}>
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                                {date}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                {time}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                                  {gestion.nombre}
                                </Typography>
                                {gestion.cantidad_duplicados && gestion.cantidad_duplicados > 1 && (
                                  <Chip 
                                    label={`×${gestion.cantidad_duplicados}`}
                                    size="small"
                                    color="warning"
                                    sx={{ fontWeight: 700, fontSize: '0.7rem', height: '20px' }}
                                    title={`Este número ingresó ${gestion.cantidad_duplicados} veces - cuenta como ${gestion.cantidad_duplicados} gestiones`}
                                  />
                                )}
                              </Box>
                              {gestion.dni && (
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                  DNI: {gestion.dni}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Phone sx={{ fontSize: 14, color: '#6b7280' }} />
                              <Typography variant="body2" sx={{ color: '#111827' }}>
                                {gestion.telefono || '-'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                              {gestion.campana || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={gestion.estatus_comercial_categoria || 'Sin categoría'}
                              size="small"
                              sx={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                                fontWeight: 700,
                                fontSize: '0.7rem'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.8rem' }}>
                              {gestion.estatus_comercial_subcategoria || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AsesorReportModal;
