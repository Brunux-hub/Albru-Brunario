import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

interface ReassignDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newAdvisor: string) => void;
}

const ReassignDialog: React.FC<ReassignDialogProps> = ({ open, onClose, onConfirm }) => {
  const [newAdvisor, setNewAdvisor] = useState('');

  const handleConfirm = () => {
    onConfirm(newAdvisor);
    setNewAdvisor('');
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Reasignar Cliente</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Nuevo Asesor"
          type="text"
          fullWidth
          value={newAdvisor}
          onChange={(e) => setNewAdvisor(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleConfirm} color="primary">
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReassignDialog;
