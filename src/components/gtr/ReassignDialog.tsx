import React, { useState, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

import type { Asesor } from './types';

interface ReassignDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newAdvisor: string) => void;
  asesores: Asesor[]; // Lista de asesores dinámicos
}

const ReassignDialog: React.FC<ReassignDialogProps> = ({ open, onClose, onConfirm, asesores }) => {
  const [newAdvisor, setNewAdvisor] = useState('');

  // Filtrar solo asesores activos y memoizar el resultado para evitar recomputes
  const asesoresActivos = useMemo(() => {
    return (asesores || []).filter(asesor =>
      asesor.estado === 'activo' || asesor.estado === 'Activo' || asesor.estado === 'Ocupado'
    );
  }, [asesores]);

  const handleConfirm = () => {
    if (newAdvisor && newAdvisor.trim() !== '') {
      onConfirm(newAdvisor);
      setNewAdvisor('');
    } else {
      console.error('❌ ReassignDialog: No se ha seleccionado un asesor válido');
      alert('Por favor selecciona un asesor válido');
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
              asesoresActivos.map((asesor) => {
                // Siempre usar asesor_id como valor - nunca el nombre
                const value = String(asesor.asesor_id);
                return (
                  <MenuItem key={asesor.asesor_id} value={value}>
                    {asesor.nombre} - {asesor.estado}
                  </MenuItem>
                );
              })
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
