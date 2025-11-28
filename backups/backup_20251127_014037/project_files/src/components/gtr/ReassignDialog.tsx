import React, { useState, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, DialogContentText } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import type { Asesor } from './types';

interface ReassignDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newAdvisor: string) => void;
  asesores: Asesor[];
  cliente?: {
    id: number;
    historial_asesores?: string | Array<{ asesor_id: number; fecha: string }>;
  };
}

const ReassignDialog: React.FC<ReassignDialogProps> = ({ open, onClose, onConfirm, asesores, cliente }) => {
  const [newAdvisor, setNewAdvisor] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  // Filtrar solo asesores activos y memoizar el resultado para evitar recomputes
  const asesoresActivos = useMemo(() => {
    return (asesores || []).filter(asesor =>
      asesor.estado === 'activo' || asesor.estado === 'Activo' || asesor.estado === 'Ocupado'
    );
  }, [asesores]);

  // Verificar si el asesor ya tuvo al cliente
  const verificarHistorialAsesor = (asesorId: string): boolean => {
    if (!cliente || !cliente.historial_asesores) return false;
    
    try {
      const historial = typeof cliente.historial_asesores === 'string' 
        ? JSON.parse(cliente.historial_asesores)
        : cliente.historial_asesores;
      
      if (!Array.isArray(historial)) return false;
      
      return historial.some((h: { asesor_id: number }) => String(h.asesor_id) === asesorId);
    } catch (error) {
      console.error('Error parsing historial_asesores:', error);
      return false;
    }
  };

  const handleAsesorChange = (asesorId: string) => {
    setNewAdvisor(asesorId);
    
    // Verificar si el asesor ya tuvo al cliente
    const yaLoTuvo = verificarHistorialAsesor(asesorId);
    setShowWarning(yaLoTuvo);
  };

  const handleConfirm = () => {
    if (newAdvisor && newAdvisor.trim() !== '') {
      onConfirm(newAdvisor);
      setNewAdvisor('');
      setShowWarning(false);
    } else {
      console.error('❌ ReassignDialog: No se ha seleccionado un asesor válido');
      alert('Por favor selecciona un asesor válido');
    }
  };

  const handleClose = () => {
    setNewAdvisor('');
    setShowWarning(false);
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
            onChange={(e) => handleAsesorChange(e.target.value as string)}
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
        
        {showWarning && (
          <DialogContentText sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: '#fff3e0', 
            borderRadius: 1,
            border: '1px solid #ff9800',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <WarningAmberIcon sx={{ color: '#f57c00' }} />
            <span style={{ color: '#e65100', fontWeight: 600 }}>
              ¿Estás seguro de que quieres reasignar este cliente al asesor que ya lo tuvo anteriormente?
            </span>
          </DialogContentText>
        )}
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
