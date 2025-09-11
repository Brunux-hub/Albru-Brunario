import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface ReassignDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newAdvisor: string) => void;
}

// Lista de asesores disponibles
const availableAdvisors = [
  'JUAN',
  'SASKYA', 
  'MIA',
  'CARLOS',
  'ANA',
  'LUIS',
  'MARÍA'
];

const ReassignDialog: React.FC<ReassignDialogProps> = ({ open, onClose, onConfirm }) => {
  const [newAdvisor, setNewAdvisor] = useState('');

  const handleConfirm = () => {
    if (newAdvisor) {
      onConfirm(newAdvisor);
      setNewAdvisor('');
    }
  };

  const handleClose = () => {
    setNewAdvisor('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#22223b' }}>
        Reasignar Cliente
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <FormControl fullWidth margin="dense">
          <InputLabel>Nuevo Asesor</InputLabel>
          <Select
            value={newAdvisor}
            label="Nuevo Asesor"
            onChange={(e) => setNewAdvisor(e.target.value as string)}
          >
            {availableAdvisors.map((advisor) => (
              <MenuItem key={advisor} value={advisor}>
                {advisor}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose}
          sx={{ 
            color: '#6b7280',
            border: '1px solid #d1d5db',
            '&:hover': { backgroundColor: '#f3f4f6' }
          }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={!newAdvisor}
          sx={{ 
            backgroundColor: '#111827',
            color: '#fff',
            fontWeight: 700,
            '&:hover': { backgroundColor: '#374151' },
            '&:disabled': { backgroundColor: '#d1d5db', color: '#9ca3af' }
          }}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReassignDialog;
