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
  MenuItem
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface NewClientData {
  cliente: string;
  nombre: string;
  dni: string;
  coordenadas: string;
  campania: string;
  canal: string;
  comentarios: string;
}

const AddClientDialog: React.FC<{ open: boolean; onClose: () => void; onSave: (data: NewClientData) => void }> = ({ 
  open, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState<NewClientData>({
    cliente: '',
    nombre: '',
    dni: '',
    coordenadas: '',
    campania: '',
    canal: '',
    comentarios: ''
  });

  const handleSave = () => {
    onSave(formData);
    setFormData({
      cliente: '',
      nombre: '',
      dni: '',
      coordenadas: '',
      campania: '',
      canal: '',
      comentarios: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
      <DialogContent>
        <Box mt={2}>
          {/* Primera sección: Teléfono/Cliente, Campaña, Canal */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Teléfono/Cliente"
              value={formData.cliente}
              onChange={(e) => {
                let val = e.target.value.replace(/[^\d+]/g, '');
                if (!val.startsWith('+51')) val = '+51';
                if (val.length > 12) val = val.slice(0, 12);
                setFormData({ ...formData, cliente: val });
              }}
              inputProps={{ maxLength: 12, pattern: '\\+51\\d{9}', inputMode: 'numeric' }}
              required
              helperText="Formato: +51 y 9 dígitos"
            />
            <FormControl fullWidth>
              <InputLabel>Campaña</InputLabel>
              <Select
                value={formData.campania}
                label="Campaña"
                onChange={(e) => setFormData({...formData, campania: e.target.value})}
              >
                <MenuItem value="MASIVO">MASIVO</MenuItem>
                <MenuItem value="LEADS">LEADS</MenuItem>
                <MenuItem value="REFERIDOS">REFERIDOS</MenuItem>
                <MenuItem value="CAMPAÑA 08">CAMPAÑA 08</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Canal</InputLabel>
              <Select
                value={formData.canal}
                label="Canal"
                onChange={(e) => setFormData({...formData, canal: e.target.value})}
              >
                <MenuItem value="WSP 1">WSP 1</MenuItem>
                <MenuItem value="WSP 4">WSP 4</MenuItem>
                <MenuItem value="REFERIDO">REFERIDO</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {/* Segunda sección opcional: DNI, Nombre completo, Email */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="DNI (opcional)"
              value={formData.dni}
              onChange={(e) => setFormData({...formData, dni: e.target.value})}
            />
            <TextField
              fullWidth
              label="Nombre completo (opcional)"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            />
            <TextField
              fullWidth
              label="Coordenadas (opcional)"
              value={formData.coordenadas}
              onChange={(e) => setFormData({...formData, coordenadas: e.target.value})}
            />
          </Box>
          {/* Comentarios ocupa todo el ancho */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comentarios iniciales"
            value={formData.comentarios}
            onChange={(e) => setFormData({...formData, comentarios: e.target.value})}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary" startIcon={<CheckIcon />}>
          Registrar Cliente
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddClientDialog;
