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

interface NewClientData {
  cliente: string;
  nombre: string;
  dni: string;
  email: string;
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
    email: '',
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
      email: '',
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Teléfono/Cliente"
                value={formData.cliente}
                onChange={(e) => setFormData({...formData, cliente: e.target.value})}
              />
              <TextField
                fullWidth
                label="Nombre completo"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="DNI"
                value={formData.dni}
                onChange={(e) => setFormData({...formData, dni: e.target.value})}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
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
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Comentarios iniciales"
              value={formData.comentarios}
              onChange={(e) => setFormData({...formData, comentarios: e.target.value})}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">Guardar Cliente</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddClientDialog;
