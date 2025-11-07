import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Paper,
  Divider,
  Avatar,
  TextField
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

import type { ClientHistoryData, Cliente } from './types';
import { useApp } from '../../context/AppContext';

interface ClientHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  clientData: ClientHistoryData | null;
  // onSave: recibe el cliente actualizado retornado por el backend
  onSave?: (updatedClient: Partial<Cliente> & { leads_original_telefono?: string }) => void;
}

const ClientHistoryDialog: React.FC<ClientHistoryDialogProps> = ({ open, onClose, clientData, onSave }) => {
  const { user } = useApp();
  const isGtr = user?.tipo === 'gtr';

  const [form, setForm] = useState({
    leads_original_telefono: '',
    dni: '',
    email: '',
    campana: '',
    canal: '',
    sala: '',
    compania: '',
    nombre: '',
    coordenadas: '',
    estado: ''
  });
  const [originalForm, setOriginalForm] = useState<typeof form | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (clientData) {
      setForm({
        leads_original_telefono: clientData.cliente || '',
        dni: clientData.dni || '',
        email: clientData.email || '',
        campana: clientData.campana || '',
        canal: clientData.canal || '',
        sala: '', // Se llenará desde el cliente
        compania: '', // Se llenará desde el cliente
        nombre: clientData.nombre || '',
        coordenadas: '', // Se llenará desde el cliente
        estado: clientData.estado || ''
      });
      // guardar snapshot para poder cancelar edición
      setOriginalForm({
        leads_original_telefono: clientData.cliente || '',
        dni: clientData.dni || '',
        email: clientData.email || '',
        campana: clientData.campana || '',
        canal: clientData.canal || '',
        sala: '',
        compania: '',
        nombre: clientData.nombre || '',
        coordenadas: '',
        estado: clientData.estado || ''
      });
      setIsEditing(false);
    }
  }, [clientData]);

  if (!clientData) return null;

  type FormKey = 'leads_original_telefono' | 'dni' | 'email' | 'campana' | 'canal' | 'sala' | 'compania' | 'nombre' | 'coordenadas' | 'estado';
  const handleChange = (key: FormKey, value: string | null) => setForm(f => ({ ...f, [key]: value }));

  const handleStartEdit = () => {
    if (!isGtr) return;
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // revertir al snapshot
    if (originalForm) setForm(originalForm);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const payload: Record<string, unknown> = {
        nombre: form.nombre || undefined,
        dni: form.dni || undefined,
        leads_original_telefono: form.leads_original_telefono || undefined,
        campana: form.campana || undefined,
        canal_adquisicion: form.canal || undefined,
        sala_asignada: form.sala || undefined,
        compania: form.compania || undefined,
        coordenadas: form.coordenadas || undefined,
        // estado column may be called 'estado' in DB, update via campo existente
        estado: form.estado || undefined
      };

      // Añadir usuario_id y flag para que el backend registre la gestión en historial
      try {
        const userData = window.localStorage.getItem('albru_user') || window.localStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData) as unknown;
          if (parsed && typeof parsed === 'object' && 'id' in (parsed as object)) {
            const id = (parsed as { id?: string | number }).id;
            if (id !== undefined) payload.usuario_id = Number(id);
          }
        } else if (user && typeof user === 'object' && 'id' in (user as object)) {
          const uid = (user as { id?: string | number }).id;
          if (uid !== undefined) payload.usuario_id = Number(uid);
        }
      } catch {
        // noop
      }

      // Pedimos al backend que inserte un registro en historial_cliente
      payload.registrar_historial = true;

      const response = await fetch(`/api/clientes/${clientData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        try {
          const j = JSON.parse(text);
          alert(`Error al guardar: ${j.message || text}`);
        } catch {
          alert(`Error al guardar cliente: ${response.status}`);
        }
        return;
      }

      const result = await response.json();
      // Resultado esperado: { success: true, cliente: { ... } }
      const updated = result.cliente || result;

      // Llamar callback local para actualizar UI del padre
      if (onSave) onSave(updated);

      alert('✅ Cambios guardados');
      onClose();
    } catch (e) {
      console.error('Error guardando cliente desde GTR:', e);
      alert('Error al guardar cliente. Revisa la consola.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Historial del Cliente
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {/* Información del Cliente - editable solo para GTR */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8fafc' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ backgroundColor: '#3b82f6', mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {form.nombre || clientData.nombre}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: 15, fontWeight: 400, mt: 0.5 }}>
                Cliente desde: {clientData.fechaCreacion}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Lead (Teléfono)</Typography>
              <TextField fullWidth size="small" value={form.leads_original_telefono} onChange={(e) => handleChange('leads_original_telefono', e.target.value)} disabled={!isEditing || !isGtr} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">DNI</Typography>
              <TextField fullWidth size="small" value={form.dni} onChange={(e) => handleChange('dni', e.target.value)} disabled={!isEditing || !isGtr} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <TextField fullWidth size="small" value={form.email} onChange={(e) => handleChange('email', e.target.value)} disabled={!isEditing || !isGtr} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Campaña</Typography>
              <TextField fullWidth size="small" value={form.campana} onChange={(e) => handleChange('campana', e.target.value)} disabled={!isEditing || !isGtr} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Canal</Typography>
              <TextField fullWidth size="small" value={form.canal} onChange={(e) => handleChange('canal', e.target.value)} disabled={!isEditing || !isGtr} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Sala</Typography>
              <TextField fullWidth size="small" value={form.sala} onChange={(e) => handleChange('sala', e.target.value)} disabled={!isEditing || !isGtr} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Compañía</Typography>
              <TextField fullWidth size="small" value={form.compania} onChange={(e) => handleChange('compania', e.target.value)} disabled={!isEditing || !isGtr} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Estado Actual</Typography>
              <TextField fullWidth size="small" value={form.estado} onChange={(e) => handleChange('estado', e.target.value)} disabled={!isEditing || !isGtr} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Nombre completo</Typography>
              <TextField fullWidth size="small" value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} disabled={!isEditing || !isGtr} />
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">Coordenadas</Typography>
            <TextField 
              fullWidth 
              size="small" 
              value={form.coordenadas} 
              onChange={(e) => handleChange('coordenadas', e.target.value)} 
              disabled={!isEditing || !isGtr}
              multiline
              rows={2}
            />
          </Box>
        </Paper>

        <Divider sx={{ my: 2 }} />

        {/* Historial de Gestión */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Historial de Gestión
        </Typography>
        
        {/* Vista de tarjetas del historial */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {clientData.historial.map((evento, index) => (
            <Paper
              key={`${evento.fecha}-${index}`}
              sx={{
                p: 3,
                backgroundColor: '#f8fafc',
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {/* Hora */}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#64748b',
                  fontSize: '11px',
                  fontWeight: 500,
                  mb: 1,
                  display: 'block'
                }}
              >
                {evento.fecha}
              </Typography>

              {/* Título de la acción */}
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  color: '#1e293b',
                  mb: 1,
                  fontSize: '16px'
                }}
              >
                {evento.accion}
              </Typography>

              {/* Asesor asignado */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PersonIcon sx={{ fontSize: 16, color: '#64748b' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#475569',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '13px'
                  }}
                >
                  {evento.asesor}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#94a3b8',
                    fontSize: '11px'
                  }}
                >
                  • 30 min
                </Typography>
              </Box>

              {/* Información de reasignación */}
              {evento.accion === 'Reasignación' && evento.estadoNuevo && (
                <Box sx={{ mb: 1 }}>
                  <Chip 
                    label="Reasignado"
                    size="small"
                    sx={{ 
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      fontSize: '10px',
                      height: 18,
                      mr: 1
                    }}
                  />
                  <Typography 
                    variant="caption"
                    sx={{ 
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    → {evento.estadoNuevo}
                  </Typography>
                </Box>
              )}

              {/* Descripción */}
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b',
                  fontSize: '13px',
                  fontStyle: 'italic',
                  lineHeight: 1.5
                }}
              >
                {evento.comentarios}
              </Typography>
            </Paper>
          ))}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={() => { setIsEditing(false); onClose(); }} variant="outlined">
          Cerrar
        </Button>
        {isGtr && !isEditing && (
          <Button onClick={handleStartEdit} variant="contained" color="secondary">
            Editar
          </Button>
        )}
        {isGtr && isEditing && (
          <>
            <Button onClick={handleCancelEdit} variant="outlined" color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="contained" color="primary">
              Guardar cambios
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ClientHistoryDialog;
