import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
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

interface HistorialGestion {
  id: number;
  paso: number;
  asesor_nombre: string;
  asesor_nombre_completo?: string;
  categoria: string | null;
  subcategoria: string | null;
  tipo_contacto: string | null;
  resultado: string | null;
  observaciones: string | null;
  comentario: string | null;
  fecha_gestion: string | null;
  created_at: string;
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
  const [historialGestiones, setHistorialGestiones] = useState<HistorialGestion[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

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

      // 🆕 Cargar historial de gestiones
      if (clientData.id) {
        setLoadingHistorial(true);
        fetch(`/api/clientes/${clientData.id}/historial-gestiones`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.gestiones) {
              setHistorialGestiones(data.gestiones);
            }
          })
          .catch(err => {
            console.error('Error cargando historial de gestiones:', err);
          })
          .finally(() => {
            setLoadingHistorial(false);
          });
      }
    }
  }, [clientData]);

  if (!clientData) return null;

  // Filtrar duplicados del historial antiguo (mismo asesor + misma fecha/hora)
  const historialFiltrado = clientData.historial ? clientData.historial.filter((item, index, arr) => {
    // Buscar si hay otro item con el mismo asesor y fecha muy cercana (menos de 1 minuto)
    const duplicado = arr.findIndex((other, otherIndex) => {
      if (index === otherIndex) return false;
      if (item.asesor !== other.asesor) return false;
      
      // Comparar fechas (permitir máximo 1 minuto de diferencia)
      const fecha1 = new Date(item.fecha).getTime();
      const fecha2 = new Date(other.fecha).getTime();
      return Math.abs(fecha1 - fecha2) < 60000; // 60 segundos
    });
    
    // Mantener solo el primero de los duplicados
    return duplicado === -1 || duplicado > index;
  }) : [];

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

        {/* Proceso de Conversión - Stepper */}
        {(historialGestiones.length > 0 || historialFiltrado.length > 0) && (
          <>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
              Proceso de Conversión
            </Typography>
            
            {loadingHistorial ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc' }}>
                <Typography color="text.secondary">Cargando historial...</Typography>
              </Paper>
            ) : (
              <>
                {/* Stepper horizontal */}
                <Box sx={{ 
                  mb: 4, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  position: 'relative',
                  px: 2
                }}>
                  {/* Línea de conexión */}
                  <Box sx={{
                    position: 'absolute',
                    top: '20px',
                    left: '10%',
                    right: '10%',
                    height: '3px',
                    backgroundColor: '#22c55e',
                    zIndex: 0
                  }} />
                  
                  {/* Usar historialGestiones si existe, sino usar historial antiguo filtrado */}
                  {(historialGestiones.length > 0 ? historialGestiones : historialFiltrado).map((item, index) => {
                    const isGestion = 'paso' in item;
                    const paso = isGestion ? item.paso : index + 1;
                    const categoria = isGestion ? item.categoria : (item.categoria || item.accion);
                    const fecha = isGestion ? (item.fecha_gestion || item.created_at) : item.fecha;
                    
                    return (
                      <Box 
                        key={isGestion ? item.id : `${item.fecha}-${index}`}
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          flex: 1,
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        {/* Círculo con check */}
                        <Box sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          backgroundColor: '#22c55e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1,
                          boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                        }}>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Box>
                        
                        {/* Título */}
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: index === (historialGestiones.length || historialFiltrado.length || 0) - 1 ? '#3b82f6' : '#1e293b',
                            fontSize: '13px',
                            textAlign: 'center',
                            mb: 0.5,
                            maxWidth: '120px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {categoria || `Paso ${paso}`}
                        </Typography>
                        
                        {/* Fecha */}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#64748b',
                            fontSize: '11px',
                            textAlign: 'center'
                          }}
                        >
                          {fecha ? (typeof fecha === 'string' && fecha.includes('/') 
                            ? fecha.split(',')[0] 
                            : new Date(fecha).toLocaleDateString('es-PE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                          ) : 'Sin fecha'}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#64748b',
                            fontSize: '11px'
                          }}
                        >
                          {fecha ? (typeof fecha === 'string' && fecha.includes(',')
                            ? fecha.split(',')[1]?.trim()
                            : new Date(fecha).toLocaleTimeString('es-PE', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                          ) : ''}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                {/* Cards de pasos */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                  {(historialGestiones.length > 0 ? historialGestiones : historialFiltrado).map((item, index) => {
                    const isGestion = 'paso' in item;
                    const paso = isGestion ? item.paso : index + 1;
                    const titulo = isGestion ? (item.categoria || item.subcategoria || `Gestión ${paso}`) : item.accion;
                    const asesor = isGestion ? (item.asesor_nombre_completo || item.asesor_nombre) : item.asesor;
                    const fecha = isGestion ? (item.fecha_gestion || item.created_at) : item.fecha;
                    
                    return (
                      <Paper
                        key={isGestion ? item.id : `${item.fecha}-${index}`}
                        sx={{
                          p: 3,
                          backgroundColor: 'white',
                          borderRadius: 3,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        {/* Header del card */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          {/* Badge de paso */}
                          <Box sx={{
                            minWidth: 80,
                            height: 32,
                            borderRadius: 2,
                            backgroundColor: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5
                          }}>
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                              <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <Typography sx={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>
                              Paso {paso}
                            </Typography>
                          </Box>
                          
                          {/* Título */}
                          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px', color: '#1e293b', flex: 1 }}>
                            {titulo}
                          </Typography>
                          
                          {/* Checkmark verde */}
                          <Box sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                              <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </Box>
                        </Box>

                        {/* Fecha y hora */}
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#64748b',
                            fontSize: '13px',
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {fecha || 'Sin fecha'}
                        </Typography>

                        {/* Asesor */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                          <Avatar sx={{ 
                            width: 32, 
                            height: 32, 
                            backgroundColor: '#3b82f6',
                            fontSize: '14px',
                            fontWeight: 600
                          }}>
                            {(asesor || 'SA').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>
                              {asesor || 'Sin asesor'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '12px' }}>
                              Asesor
                            </Typography>
                          </Box>
                        </Box>

                        {/* Acciones */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#1e293b' }}>
                          Acciones:
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {isGestion ? (
                            <>
                              {item.subcategoria && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#22c55e" style={{ marginTop: '2px', flexShrink: 0 }}>
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px', lineHeight: 1.5 }}>
                                    {item.subcategoria}
                                  </Typography>
                                </Box>
                              )}
                              
                              {item.tipo_contacto && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#22c55e" style={{ marginTop: '2px', flexShrink: 0 }}>
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px', lineHeight: 1.5 }}>
                                    Contacto {item.tipo_contacto}
                                  </Typography>
                                </Box>
                              )}
                              
                              {item.resultado && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#22c55e" style={{ marginTop: '2px', flexShrink: 0 }}>
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px', lineHeight: 1.5 }}>
                                    {item.resultado.charAt(0).toUpperCase() + item.resultado.slice(1).replace('_', ' ')}
                                  </Typography>
                                </Box>
                              )}
                              
                              {(item.observaciones || item.comentario) && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#22c55e" style={{ marginTop: '2px', flexShrink: 0 }}>
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px', lineHeight: 1.5, fontStyle: 'italic' }}>
                                    {item.observaciones || item.comentario}
                                  </Typography>
                                </Box>
                              )}
                            </>
                          ) : (
                            <>
                              {/* Para historial antiguo */}
                              {item.categoria && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#22c55e" style={{ marginTop: '2px', flexShrink: 0 }}>
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px', lineHeight: 1.5 }}>
                                    <strong>Categoría:</strong> {item.categoria}
                                  </Typography>
                                </Box>
                              )}
                              
                              {item.subcategoria && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#22c55e" style={{ marginTop: '2px', flexShrink: 0 }}>
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px', lineHeight: 1.5 }}>
                                    <strong>Subcategoría:</strong> {item.subcategoria}
                                  </Typography>
                                </Box>
                              )}
                              
                              {item.seguimiento_status && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#22c55e" style={{ marginTop: '2px', flexShrink: 0 }}>
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px', lineHeight: 1.5 }}>
                                    <strong>Seguimiento:</strong> {item.seguimiento_status}
                                  </Typography>
                                </Box>
                              )}
                              
                              {item.estadoNuevo && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#22c55e" style={{ marginTop: '2px', flexShrink: 0 }}>
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px', lineHeight: 1.5 }}>
                                    <strong>Estado:</strong> {item.estadoNuevo}
                                  </Typography>
                                </Box>
                              )}
                              
                              {item.comentarios && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#22c55e" style={{ marginTop: '2px', flexShrink: 0 }}>
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px', lineHeight: 1.5, fontStyle: 'italic' }}>
                                    {item.comentarios}
                                  </Typography>
                                </Box>
                              )}
                            </>
                          )}
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              </>
            )}

            <Divider sx={{ my: 3 }} />
          </>
        )}

        {/* Mensaje si no hay historial */}
        {(!historialGestiones || historialGestiones.length === 0) && historialFiltrado.length === 0 && (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc' }}>
            <Typography color="text.secondary">
              No hay eventos en el historial de este cliente
            </Typography>
          </Paper>
        )}
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
