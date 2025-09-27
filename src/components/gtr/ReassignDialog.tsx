import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface ReassignDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newAdvisor: string) => void;
  asesores: any[]; // Lista de asesores dinámicos
}

const ReassignDialog: React.FC<ReassignDialogProps> = ({ open, onClose, onConfirm, asesores }) => {
  const [newAdvisor, setNewAdvisor] = useState('');

  // Filtrar solo asesores activos
  const asesoresActivos = asesores?.filter(asesor => 
    asesor.estado === 'Activo' || asesor.estado === 'Ocupado'
  ) || [];

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
            disabled={asesoresActivos.length === 0}
          >
            {asesoresActivos.length === 0 ? (
              <MenuItem disabled value="">
                No hay asesores disponibles
              </MenuItem>
            ) : (
              asesoresActivos.map((asesor) => (
                <MenuItem key={asesor.id || asesor.nombre} value={asesor.nombre}>
                  {asesor.nombre} - {asesor.estado}
                </MenuItem>
              ))
            )}
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
