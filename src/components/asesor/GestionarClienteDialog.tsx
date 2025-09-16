import React, { useState } from 'react';
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
  Typography
} from '@mui/material';

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
  });

  const [gestionData, setGestionData] = useState<GestionData>({
    fechaContacto: new Date().toISOString().slice(0, 16),
    tipoContacto: '',
    resultado: '',
    nuevoEstado: '',
    proximoSeguimiento: '',
    observaciones: ''
  });

  React.useEffect(() => {
    if (cliente) {
      setClienteData({ ...cliente });
      setGestionData(prev => ({
        ...prev,
        nuevoEstado: cliente.estado
      }));
    }
  }, [cliente]);

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
              <TextField
                fullWidth
                label="Nombre completo"
                value={clienteData.nombre}
                onChange={(e) => setClienteData({ ...clienteData, nombre: e.target.value })}
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="DNI"
                value={clienteData.dni}
                onChange={(e) => setClienteData({ ...clienteData, dni: e.target.value })}
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="Teléfono"
                value={clienteData.telefono}
                onChange={(e) => setClienteData({ ...clienteData, telefono: e.target.value })}
                variant="outlined"
                size="small"
                disabled
              />
              <TextField
                fullWidth
                label="Dirección"
                value={clienteData.direccion}
                onChange={(e) => setClienteData({ ...clienteData, direccion: e.target.value })}
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="Coordenadas"
                value={clienteData.coordenadas}
                onChange={(e) => setClienteData({ ...clienteData, coordenadas: e.target.value })}
                variant="outlined"
                size="small"
              />
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Servicio</InputLabel>
                <Select
                  value={clienteData.servicio}
                  label="Tipo de Servicio"
                  onChange={(e) => setClienteData({ ...clienteData, servicio: e.target.value })}
                >
                  <MenuItem value="Fibra Óptica">Fibra Óptica</MenuItem>
                  <MenuItem value="Combo">Combo</MenuItem>
                  <MenuItem value="Internet">Internet</MenuItem>
                  <MenuItem value="Cable TV">Cable TV</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de casa</InputLabel>
                <Select
                  value={clienteData.tipoCasa || ''}
                  label="Tipo de casa"
                  onChange={(e) => setClienteData({ ...clienteData, tipoCasa: e.target.value })}
                >
                  <MenuItem value="Casa">Casa</MenuItem>
                  <MenuItem value="Departamento">Departamento</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de vía</InputLabel>
                <Select
                  value={clienteData.tipoVia || ''}
                  label="Tipo de vía"
                  onChange={(e) => setClienteData({ ...clienteData, tipoVia: e.target.value })}
                >
                  <MenuItem value="Avenida">Avenida</MenuItem>
                  <MenuItem value="Calle">Calle</MenuItem>
                  <MenuItem value="Jirón">Jirón</MenuItem>
                  <MenuItem value="Pasaje">Pasaje</MenuItem>
                  <MenuItem value="Carretera">Carretera</MenuItem>
                </Select>
              </FormControl>
              {clienteData.comentariosIniciales && (
                <TextField
                  fullWidth
                  label="Comentarios iniciales (GTR)"
                  value={clienteData.comentariosIniciales}
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2}
                  disabled
                />
              )}
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