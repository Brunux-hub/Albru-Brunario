import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography
} from '@mui/material';
import apiClient from '../../config/axios';

interface ClienteData {
  fecha: string;
  nombre: string;
  telefono: string;
  dni: string;
  servicio: string;
  estado: string;
  gestion: string;
  seguimiento: string;
  coordenadas?: string;
  direccion?: string;
  campania?: string;
  canal?: string;
  comentariosIniciales?: string;
  tipoCasa?: string;
  tipoVia?: string;
  // Campos adicionales solicitados
  lead_id?: string;
  plan_seleccionado?: string;
  precio_final?: number;
  fecha_lead?: string;
  numero_registro?: string;
  numero_grabacion?: string;
  numero_referencia?: string;
  tipo_documento?: string;
  fecha_nacimiento?: string;
  lugar_nacimiento?: string;
  correo_electronico?: string;
  titular_linea?: string;
  distrito?: string;
  numero_piso?: string;
  interior?: string;
  tipo_cliente?: string;
  dispositivos_adicionales?: string;
  pago_adelanto_instalacion?: number;
  plataforma_digital?: string;
  asesor_asignado?: number | string;
  fecha_programacion?: string;
  fecha_instalacion?: string;
  score?: number;
}

interface GestionData {
  fechaContacto: string;
  tipoContacto: string;
  resultado: string;
  nuevoEstado: string;
  proximoSeguimiento: string;
  observaciones: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  cliente: ClienteData | null;
  onSave: (clienteActualizado: ClienteData, gestion: GestionData) => void;
}

const GestionarClienteDialog: React.FC<Props> = ({ open, onClose, cliente, onSave }) => {
  const [clienteData, setClienteData] = useState<ClienteData>({
    fecha: '',
    nombre: '',
    telefono: '',
    dni: '',
    servicio: '',
    estado: '',
    gestion: '',
    seguimiento: '',
    coordenadas: '',
    direccion: '',
    campania: '',
    canal: '',
    comentariosIniciales: ''
    ,
    // iniciar nuevos campos vacíos
    lead_id: '',
    plan_seleccionado: '',
    precio_final: undefined,
    fecha_lead: '',
    numero_registro: '',
    numero_grabacion: '',
    numero_referencia: '',
    tipo_documento: '',
    fecha_nacimiento: '',
    lugar_nacimiento: '',
    correo_electronico: '',
    titular_linea: '',
    distrito: '',
    numero_piso: '',
    interior: '',
    tipo_cliente: '',
    dispositivos_adicionales: '',
    pago_adelanto_instalacion: undefined,
    plataforma_digital: '',
    fecha_programacion: '',
    fecha_instalacion: '',
    score: undefined
  });

  const [gestionData, setGestionData] = useState<GestionData>({
    fechaContacto: new Date().toISOString().slice(0, 16),
    tipoContacto: '',
    resultado: '',
    nuevoEstado: '',
    proximoSeguimiento: '',
    observaciones: ''
  });

  useEffect(() => {
    if (cliente) {
      setClienteData({ ...cliente });
      setGestionData(prev => ({
        ...prev,
        nuevoEstado: cliente.estado || ''
      }));
    }
  }, [cliente]);

  const [asesores, setAsesores] = useState<Array<{ id: number; nombre: string }>>([]);

  useEffect(() => {
    if (!open) return;
    const fetchAsesores = async () => {
      try {
        const resp = await apiClient.get('/api/asesores');
        if (resp?.data?.asesores) setAsesores(resp.data.asesores.map((a: any) => ({ id: a.id, nombre: a.nombre })));
      } catch (err) {
        console.error('Error cargando asesores:', err);
        setAsesores([]);
      }
    };
    fetchAsesores();
  }, [open]);

  const handleSave = () => {
    onSave(clienteData, gestionData);
    onClose();
  };

  if (!cliente) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Gestionar Cliente - {cliente.nombre || cliente.telefono}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
          {/* Columna izquierda: Información del Cliente */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Información del Cliente
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip label={clienteData.estado || 'SIN STATUS'} color={clienteData.estado && clienteData.estado.toLowerCase().includes('venta') ? 'success' : 'default'} />
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Tipo Cliente</InputLabel>
                  <Select
                    value={clienteData.tipo_cliente || ''}
                    label="Tipo Cliente"
                    onChange={(e) => setClienteData({ ...clienteData, tipo_cliente: e.target.value })}
                  >
                    <MenuItem value="">--</MenuItem>
                    <MenuItem value="Nuevo">Nuevo</MenuItem>
                    <MenuItem value="Portabilidad">Portabilidad</MenuItem>
                    <MenuItem value="Renovación">Renovación</MenuItem>
                    <MenuItem value="Corporativo">Corporativo</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Score"
                  type="number"
                  size="small"
                  sx={{ width: 120 }}
                  value={clienteData.score ?? ''}
                  onChange={(e) => setClienteData({ ...clienteData, score: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                />
              </Box>

              <FormControl fullWidth size="small">
                <InputLabel>Asesor</InputLabel>
                <Select
                  value={(clienteData.asesor_asignado as any) ?? ''}
                  label="Asesor"
                  onChange={(e) => setClienteData({ ...clienteData, asesor_asignado: e.target.value })}
                >
                  <MenuItem value="">-- Ninguno --</MenuItem>
                  {/* Los asesores se cargan desde el backend cuando se abre el diálogo */}
                  {asesores.map(a => (
                    <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Lead ID"
                value={clienteData.lead_id || ''}
                onChange={(e) => setClienteData({ ...clienteData, lead_id: e.target.value })}
                variant="outlined"
                size="small"
                disabled
              />

              <TextField
                fullWidth
                label="Coordenadas"
                value={clienteData.coordenadas || ''}
                onChange={(e) => setClienteData({ ...clienteData, coordenadas: e.target.value })}
                variant="outlined"
                size="small"
              />

              <FormControl fullWidth size="small">
                <InputLabel>Tipo de documento</InputLabel>
                <Select
                  value={clienteData.tipo_documento || ''}
                  label="Tipo de documento"
                  onChange={(e) => setClienteData({ ...clienteData, tipo_documento: e.target.value })}
                >
                  <MenuItem value="DNI">DNI</MenuItem>
                  <MenuItem value="CE">CE</MenuItem>
                  <MenuItem value="PASAPORTE">Pasaporte</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="N° documento"
                value={clienteData.dni || ''}
                onChange={(e) => setClienteData({ ...clienteData, dni: e.target.value })}
                variant="outlined"
                size="small"
              />

              <TextField
                fullWidth
                label="Nombre completo"
                value={clienteData.nombre || ''}
                onChange={(e) => setClienteData({ ...clienteData, nombre: e.target.value })}
                variant="outlined"
                size="small"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Fecha de nacimiento"
                  type="date"
                  value={clienteData.fecha_nacimiento?.slice(0, 10) || ''}
                  onChange={(e) => setClienteData({ ...clienteData, fecha_nacimiento: e.target.value })}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Lugar de nacimiento"
                  value={clienteData.lugar_nacimiento || ''}
                  onChange={(e) => setClienteData({ ...clienteData, lugar_nacimiento: e.target.value })}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <TextField
                fullWidth
                label="Correo electrónico"
                value={clienteData.correo_electronico || ''}
                onChange={(e) => setClienteData({ ...clienteData, correo_electronico: e.target.value })}
                variant="outlined"
                size="small"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="N° registro"
                  value={clienteData.numero_registro || ''}
                  onChange={(e) => setClienteData({ ...clienteData, numero_registro: e.target.value })}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="N° grabación"
                  value={clienteData.numero_grabacion || ''}
                  onChange={(e) => setClienteData({ ...clienteData, numero_grabacion: e.target.value })}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="N° referencia"
                  value={clienteData.numero_referencia || ''}
                  onChange={(e) => setClienteData({ ...clienteData, numero_referencia: e.target.value })}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <TextField
                fullWidth
                label="Titular de la línea"
                value={clienteData.titular_linea || ''}
                onChange={(e) => setClienteData({ ...clienteData, titular_linea: e.target.value })}
                variant="outlined"
                size="small"
              />

              <TextField
                fullWidth
                label="Distrito"
                value={clienteData.distrito || ''}
                onChange={(e) => setClienteData({ ...clienteData, distrito: e.target.value })}
                variant="outlined"
                size="small"
              />

              <TextField
                fullWidth
                label="Dirección"
                value={clienteData.direccion || ''}
                onChange={(e) => setClienteData({ ...clienteData, direccion: e.target.value })}
                variant="outlined"
                size="small"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Piso"
                  value={clienteData.numero_piso || ''}
                  onChange={(e) => setClienteData({ ...clienteData, numero_piso: e.target.value })}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Interior"
                  value={clienteData.interior || ''}
                  onChange={(e) => setClienteData({ ...clienteData, interior: e.target.value })}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <TextField
                fullWidth
                label="Plan exacto + bono"
                value={clienteData.plan_seleccionado || ''}
                onChange={(e) => setClienteData({ ...clienteData, plan_seleccionado: e.target.value })}
                variant="outlined"
                size="small"
              />

              <TextField
                fullWidth
                label="Precio paquete (S/)"
                type="number"
                value={clienteData.precio_final ?? ''}
                onChange={(e) => setClienteData({ ...clienteData, precio_final: parseFloat(e.target.value) || undefined })}
                variant="outlined"
                size="small"
              />

              <TextField
                fullWidth
                label="Dispositivos adicionales"
                value={clienteData.dispositivos_adicionales || ''}
                onChange={(e) => setClienteData({ ...clienteData, dispositivos_adicionales: e.target.value })}
                variant="outlined"
                size="small"
              />

              <TextField
                fullWidth
                label="Pago adelanto instalación (S/)"
                type="number"
                value={clienteData.pago_adelanto_instalacion ?? ''}
                onChange={(e) => setClienteData({ ...clienteData, pago_adelanto_instalacion: parseFloat(e.target.value) || undefined })}
                variant="outlined"
                size="small"
              />

              <TextField
                fullWidth
                label="Plataforma digital"
                value={clienteData.plataforma_digital || ''}
                onChange={(e) => setClienteData({ ...clienteData, plataforma_digital: e.target.value })}
                variant="outlined"
                size="small"
              />

              <TextField
                fullWidth
                label="Fecha registro"
                type="date"
                value={clienteData.fecha_lead?.slice(0, 10) || ''}
                onChange={(e) => setClienteData({ ...clienteData, fecha_lead: e.target.value })}
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>

          {/* Columna derecha: Registro de Contacto */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Registro de Contacto
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Fecha de contacto"
                type="datetime-local"
                value={gestionData.fechaContacto}
                onChange={(e) => setGestionData({ ...gestionData, fechaContacto: e.target.value })}
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Fecha programación"
                type="datetime-local"
                value={clienteData.fecha_programacion || ''}
                onChange={(e) => setClienteData({ ...clienteData, fecha_programacion: e.target.value })}
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Fecha instalación"
                type="datetime-local"
                value={clienteData.fecha_instalacion || ''}
                onChange={(e) => setClienteData({ ...clienteData, fecha_instalacion: e.target.value })}
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de contacto</InputLabel>
                <Select
                  value={gestionData.tipoContacto}
                  label="Tipo de contacto"
                  onChange={(e) => setGestionData({ ...gestionData, tipoContacto: e.target.value })}
                >
                  <MenuItem value="Llamada">Llamada</MenuItem>
                  <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                  <MenuItem value="Visita">Visita</MenuItem>
                  <MenuItem value="Email">Email</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Resultado</InputLabel>
                <Select
                  value={gestionData.resultado}
                  label="Resultado"
                  onChange={(e) => setGestionData({ ...gestionData, resultado: e.target.value })}
                >
                  <MenuItem value="Contacto exitoso">Contacto exitoso</MenuItem>
                  <MenuItem value="No contesta">No contesta</MenuItem>
                  <MenuItem value="Número equivocado">Número equivocado</MenuItem>
                  <MenuItem value="Interesado">Interesado</MenuItem>
                  <MenuItem value="No interesado">No interesado</MenuItem>
                  <MenuItem value="Venta realizada">Venta realizada</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Próximo seguimiento"
                type="datetime-local"
                value={gestionData.proximoSeguimiento}
                onChange={(e) => setGestionData({ ...gestionData, proximoSeguimiento: e.target.value })}
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Observaciones"
                value={gestionData.observaciones}
                onChange={(e) => setGestionData({ ...gestionData, observaciones: e.target.value })}
                variant="outlined"
                size="small"
                multiline
                rows={4}
                placeholder="Detalles del contacto, interés del cliente, próximos pasos..."
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={
            !gestionData.tipoContacto || 
            !gestionData.resultado || 
            !gestionData.nuevoEstado || 
            !gestionData.fechaContacto || 
            !gestionData.proximoSeguimiento
          }
        >
          Guardar Gestión
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GestionarClienteDialog;