import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SaveIcon from '@mui/icons-material/Save';

interface Cliente {
  id: string;
  nombre: string;
  tipoCliente: string;
  asesorActual: string;
  montoCartera: number;
  estado: 'sin_validar' | 'pendiente' | 'validado' | 'rechazado';
  fechaIngreso: string;
  telefono: string;
  email: string;
  documentos: string[];
}

const ValidacionesProceso: React.FC = () => {
  const [cliente] = useState<Cliente>({
    id: '1',
    nombre: 'María Elena Rodríguez García',
    tipoCliente: 'Premium',
    asesorActual: 'Ana García',
    montoCartera: 250000,
    estado: 'sin_validar',
    fechaIngreso: '2024-01-15',
    telefono: '+52 55 1234-5678',
    email: 'maria.rodriguez@email.com',
    documentos: ['INE', 'Comprobante de ingresos', 'Estados financieros']
  });

  const [validacionData, setValidacionData] = useState({
    documentosRevisados: [] as string[],
    observaciones: '',
    resultado: '',
    requiereDocumentosAdicionales: false,
    documentosFaltantes: ''
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDocumentoCheck = (documento: string) => {
    setValidacionData(prev => ({
      ...prev,
      documentosRevisados: prev.documentosRevisados.includes(documento)
        ? prev.documentosRevisados.filter(d => d !== documento)
        : [...prev.documentosRevisados, documento]
    }));
  };

  const handleSubmitValidacion = () => {
    if (!validacionData.resultado) {
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmarValidacion = () => {
    // Aquí iría la lógica para guardar la validación
    console.log('Validación guardada:', validacionData);
    setShowConfirmDialog(false);
    // Redireccionar o mostrar mensaje de éxito
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getEstadoChip = (estado: string) => {
    const configs = {
      sin_validar: { color: '#dc2626', bgColor: '#fee2e2', label: 'Sin Validar' },
      pendiente: { color: '#d97706', bgColor: '#fef3c7', label: 'Pendiente' },
      validado: { color: '#059669', bgColor: '#d1fae5', label: 'Validado' },
      rechazado: { color: '#dc2626', bgColor: '#fee2e2', label: 'Rechazado' }
    };

    const config = configs[estado as keyof typeof configs];
    
    return (
      <Chip
        label={config.label}
        sx={{
          color: config.color,
          backgroundColor: config.bgColor,
          border: `1px solid ${config.color}`,
          fontWeight: 600
        }}
      />
    );
  };

  return (
    <Box sx={{ 
      flexGrow: 1, 
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      p: 3
    }}>
      <Container maxWidth="xl">
        {/* Encabezado */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#1f2937',
              mb: 1
            }}
          >
            Proceso de Validación
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#6b7280',
              fontSize: 16
            }}
          >
            Valida la información y documentación del cliente seleccionado
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Información del Cliente */}
          <Box sx={{ flex: '0 0 auto', width: { xs: '100%', lg: '33%' } }}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              height: 'fit-content'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 3 }}>
                Información del Cliente
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1f2937', mb: 1 }}>
                  {cliente.nombre}
                </Typography>
                {getEstadoChip(cliente.estado)}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Asesor Actual
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#1f2937', fontWeight: 600 }}>
                  {cliente.asesorActual}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <BusinessIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Tipo Cliente
                  </Typography>
                </Box>
                <Chip
                  label={cliente.tipoCliente}
                  size="small"
                  sx={{
                    backgroundColor: '#dbeafe',
                    color: '#2563eb',
                    fontWeight: 500
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AccountBalanceIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Monto Cartera
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#1f2937', fontWeight: 600 }}>
                  {formatCurrency(cliente.montoCartera)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, mb: 1 }}>
                  Contacto
                </Typography>
                <Typography variant="body2" sx={{ color: '#1f2937', mb: 1 }}>
                  📞 {cliente.telefono}
                </Typography>
                <Typography variant="body2" sx={{ color: '#1f2937' }}>
                  ✉️ {cliente.email}
                </Typography>
              </Box>
            </Paper>
          </Box>
          
          {/* Panel de Validación */}
          <Box sx={{ flex: '1 1 auto', width: { xs: '100%', lg: '67%' } }}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 3 }}>
                Panel de Validación
              </Typography>
              
              {/* Documentos a Revisar */}
              <Card sx={{ mb: 3, border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 2 }}>
                    Documentos a Revisar
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                    {cliente.documentos.map((documento) => (
                        <Box
                          onClick={() => handleDocumentoCheck(documento)}
                          sx={{
                            p: 2,
                            border: '2px solid',
                            borderColor: validacionData.documentosRevisados.includes(documento) 
                              ? '#059669' : '#e5e7eb',
                            borderRadius: 2,
                            cursor: 'pointer',
                            backgroundColor: validacionData.documentosRevisados.includes(documento)
                              ? '#f0fdf4' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            '&:hover': {
                              borderColor: '#059669',
                              backgroundColor: '#f0fdf4'
                            }
                          }}
                        >
                          <Box sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: validacionData.documentosRevisados.includes(documento) 
                              ? '#059669' : '#d1d5db',
                            backgroundColor: validacionData.documentosRevisados.includes(documento)
                              ? '#059669' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {validacionData.documentosRevisados.includes(documento) && (
                              <CheckCircleIcon sx={{ color: 'white', fontSize: 16 }} />
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#1f2937' }}>
                            {documento}
                          </Typography>
                        </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
              
              {/* Observaciones */}
              <Card sx={{ mb: 3, border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 2 }}>
                    Observaciones
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Escribe aquí tus observaciones sobre la validación..."
                    value={validacionData.observaciones}
                    onChange={(e) => setValidacionData(prev => ({
                      ...prev,
                      observaciones: e.target.value
                    }))}
                    sx={{ mb: 2 }}
                  />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <input
                      type="checkbox"
                      checked={validacionData.requiereDocumentosAdicionales}
                      onChange={(e) => setValidacionData(prev => ({
                        ...prev,
                        requiereDocumentosAdicionales: e.target.checked
                      }))}
                    />
                    <Typography variant="body2" sx={{ color: '#1f2937' }}>
                      Requiere documentos adicionales
                    </Typography>
                  </Box>
                  
                  {validacionData.requiereDocumentosAdicionales && (
                    <TextField
                      fullWidth
                      placeholder="Especifica qué documentos adicionales se requieren..."
                      value={validacionData.documentosFaltantes}
                      onChange={(e) => setValidacionData(prev => ({
                        ...prev,
                        documentosFaltantes: e.target.value
                      }))}
                    />
                  )}
                </CardContent>
              </Card>
              
              {/* Resultado de la Validación */}
              <Card sx={{ mb: 3, border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 2 }}>
                    Resultado de la Validación
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Resultado</InputLabel>
                    <Select
                      value={validacionData.resultado}
                      label="Resultado"
                      onChange={(e) => setValidacionData(prev => ({
                        ...prev,
                        resultado: e.target.value
                      }))}
                    >
                      <MenuItem value="validado">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} />
                          Validado - Aprobado
                        </Box>
                      </MenuItem>
                      <MenuItem value="rechazado">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CancelIcon sx={{ color: '#dc2626', fontSize: 20 }} />
                          Rechazado - No cumple requisitos
                        </Box>
                      </MenuItem>
                      <MenuItem value="pendiente">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssignmentIcon sx={{ color: '#d97706', fontSize: 20 }} />
                          Pendiente - Requiere más información
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  
                  {validacionData.resultado && (
                    <Alert 
                      severity={
                        validacionData.resultado === 'validado' ? 'success' :
                        validacionData.resultado === 'rechazado' ? 'error' : 'warning'
                      }
                      sx={{ mb: 2 }}
                    >
                      {validacionData.resultado === 'validado' && 'El cliente cumple con todos los requisitos y será validado.'}
                      {validacionData.resultado === 'rechazado' && 'El cliente no cumple con los requisitos necesarios.'}
                      {validacionData.resultado === 'pendiente' && 'Se requiere información adicional antes de completar la validación.'}
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              {/* Botones de Acción */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  sx={{
                    color: '#6b7280',
                    borderColor: '#d1d5db',
                    '&:hover': {
                      borderColor: '#9ca3af',
                      backgroundColor: '#f9fafb'
                    }
                  }}
                >
                  Cancelar
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmitValidacion}
                  disabled={!validacionData.resultado}
                  sx={{
                    backgroundColor: '#059669',
                    '&:hover': { backgroundColor: '#047857' }
                  }}
                >
                  Guardar Validación
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Dialog de Confirmación */}
        <Dialog
          open={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Confirmar Validación
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              ¿Estás seguro de que deseas guardar esta validación con el resultado: 
              <strong> {validacionData.resultado}</strong>?
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Una vez guardada, esta acción no se puede deshacer fácilmente.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowConfirmDialog(false)}
              sx={{ color: '#6b7280' }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarValidacion}
              variant="contained"
              sx={{
                backgroundColor: '#059669',
                '&:hover': { backgroundColor: '#047857' }
              }}
            >
              Confirmar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ValidacionesProceso;