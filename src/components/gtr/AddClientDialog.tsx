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
  tipo_base?: string;
  leads_original_telefono: string; // teléfono / lead id
  campana?: string;
  canal_adquisicion?: string;
  sala_asignada?: string;
  compania?: string;
  back_office_info?: string;
  tipificacion_back?: string;
  datos_leads?: string;
  comentarios_back?: string;
  ultima_fecha_gestion?: string; // ISO datetime
  nombre?: string;
  dni?: string;
  coordenadas?: string;
}

const AddClientDialog: React.FC<{ open: boolean; onClose: () => void; onSave: (data: NewClientData) => void }> = ({
  open,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<NewClientData>({
    tipo_base: 'LEADS',
    leads_original_telefono: '',
    campana: '',
    canal_adquisicion: '',
    sala_asignada: '',
    compania: '',
    back_office_info: '',
    tipificacion_back: '',
    datos_leads: '',
    comentarios_back: '',
    ultima_fecha_gestion: '' ,
    nombre: '',
    dni: '',
    coordenadas: ''
  });

  const [errors, setErrors] = useState<{ leads_original_telefono?: string }>({});

  const handleSave = () => {
    // Validar teléfono: formato +51 seguido de 9 dígitos
    const telefono = formData.leads_original_telefono || '';
    const telefonoRegex = /^\+51\d{9}$/;
    if (!telefonoRegex.test(telefono)) {
      setErrors({ leads_original_telefono: 'Formato inválido. Debe ser +51 y 9 dígitos, ej: +51987654321' });
      return;
    }

    if (telefono && telefono.trim()) {
      const payload: NewClientData = {
        tipo_base: formData.tipo_base,
        leads_original_telefono: formData.leads_original_telefono,
        campana: formData.campana,
        canal_adquisicion: formData.canal_adquisicion || '',
        sala_asignada: formData.sala_asignada || '',
        compania: formData.compania || '',
        back_office_info: formData.back_office_info || '',
        tipificacion_back: formData.tipificacion_back || '',
        datos_leads: formData.datos_leads || '',
        comentarios_back: formData.comentarios_back || '',
        ultima_fecha_gestion: formData.ultima_fecha_gestion || '',
        nombre: formData.nombre,
        dni: formData.dni,
        coordenadas: formData.coordenadas
      };

      onSave(payload);
      setFormData({
        tipo_base: 'LEADS',
        leads_original_telefono: '',
        campana: '',
        canal_adquisicion: '',
        sala_asignada: '',
        compania: '',
        back_office_info: '',
        tipificacion_back: '',
        datos_leads: '',
        comentarios_back: '',
        ultima_fecha_gestion: '' ,
        nombre: '',
        dni: '',
        coordenadas: ''
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
      <DialogContent>
        <Box mt={2}>
          {/* Primera sección: Lead ID (Teléfono), Campaña, Canal */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo Base</InputLabel>
              <Select
                value={formData.tipo_base}
                label="Tipo Base"
                onChange={(e) => setFormData({...formData, tipo_base: e.target.value})}
              >
                <MenuItem value="LEADS">LEADS</MenuItem>
                <MenuItem value="MASIVO">MASIVO</MenuItem>
                <MenuItem value="FACEBOOK">FACEBOOK</MenuItem>
                <MenuItem value="REFERIDO">REFERIDO</MenuItem>
                <MenuItem value="SEG LEAD">SEG LEAD</MenuItem>
                <MenuItem value="PREDICTIVO">PREDICTIVO</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Leads (Teléfono)"
              value={formData.leads_original_telefono}
              onChange={(e) => {
                let val = e.target.value.replace(/[^\d+]/g, '');
                if (val && !val.startsWith('+51')) val = '+51' + val.replace(/^\+?51?/, '');
                if (val.length > 12) val = val.slice(0, 12);
                setFormData({ ...formData, leads_original_telefono: val });
                // limpiar error si ahora es válido
                const telefonoRegex = /^\+51\d{9}$/;
                if (telefonoRegex.test(val)) setErrors({});
              }}
              inputProps={{ maxLength: 12, pattern: '\\+51\\d{9}', inputMode: 'numeric' }}
              required
              helperText={errors.leads_original_telefono ? errors.leads_original_telefono : ''}
              error={!!errors.leads_original_telefono}
              placeholder="+51987654321"
            />
            <FormControl fullWidth>
              <InputLabel>Campaña</InputLabel>
              <Select
                value={formData.campana}
                label="Campaña"
                onChange={(e) => setFormData({...formData, campana: e.target.value})}
              >
                <MenuItem value="BASE">BASE</MenuItem>
                <MenuItem value="CAMPAÑA 01">CAMPAÑA 01</MenuItem>
                <MenuItem value="CAMPAÑA 02">CAMPAÑA 02</MenuItem>
                <MenuItem value="CAMPAÑA 03">CAMPAÑA 03</MenuItem>
                <MenuItem value="CAMPAÑA 04">CAMPAÑA 04</MenuItem>
                <MenuItem value="CAMPAÑA 05">CAMPAÑA 05</MenuItem>
                <MenuItem value="CAMPAÑA 06">CAMPAÑA 06</MenuItem>
                <MenuItem value="CAMPAÑA 07">CAMPAÑA 07</MenuItem>
                <MenuItem value="CAMPAÑA 08">CAMPAÑA 08</MenuItem>
                <MenuItem value="CAMPAÑA 09">CAMPAÑA 09</MenuItem>
                <MenuItem value="CAMPAÑA 10">CAMPAÑA 10</MenuItem>
                <MenuItem value="CAMPAÑA 11">CAMPAÑA 11</MenuItem>
                <MenuItem value="CAMPAÑA 12">CAMPAÑA 12</MenuItem>
                <MenuItem value="CAMPAÑA 13">CAMPAÑA 13</MenuItem>
                <MenuItem value="CAMPAÑA 14">CAMPAÑA 14</MenuItem>
                <MenuItem value="CAMPAÑA 15">CAMPAÑA 15</MenuItem>
                <MenuItem value="CAMPAÑA 16">CAMPAÑA 16</MenuItem>
                <MenuItem value="CAMPAÑA 17">CAMPAÑA 17</MenuItem>
                <MenuItem value="CAMPAÑA 18">CAMPAÑA 18</MenuItem>
                <MenuItem value="CAMPAÑA 19">CAMPAÑA 19</MenuItem>
                <MenuItem value="CAMPAÑA 20">CAMPAÑA 20</MenuItem>
                <MenuItem value="FACEBOOK">FACEBOOK</MenuItem>
                <MenuItem value="GOOGLE">GOOGLE</MenuItem>
                <MenuItem value="MASIVO">MASIVO</MenuItem>
                <MenuItem value="PROVINCIA 01">PROVINCIA 01</MenuItem>
                <MenuItem value="PROVINCIA 02">PROVINCIA 02</MenuItem>
                <MenuItem value="PROVINCIA 03">PROVINCIA 03</MenuItem>
                <MenuItem value="REFERIDOS">REFERIDOS</MenuItem>

              </Select>
            </FormControl>
          </Box>
          {/* Canal / Sala / Compañía */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Canal</InputLabel>
              <Select
                value={formData.canal_adquisicion}
                label="Canal"
                onChange={(e) => setFormData({...formData, canal_adquisicion: e.target.value})}
              >
                <MenuItem value="MSN">MSN</MenuItem>
                <MenuItem value="WSP 1">WSP 1</MenuItem>
                <MenuItem value="WSP 2">WSP 2</MenuItem>
                <MenuItem value="WSP 3">WSP 3</MenuItem>
                <MenuItem value="WSP 4">WSP 4</MenuItem>
                <MenuItem value="WSP 5">WSP 5</MenuItem>
                <MenuItem value="REFERIDO">REFERIDO</MenuItem>

              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Sala</InputLabel>
              <Select
                value={formData.sala_asignada}
                label="Sala asignada"
                onChange={(e) => setFormData({ ...formData, sala_asignada: e.target.value })}
              >
                <MenuItem value="SALA 1">SALA 1</MenuItem>
                <MenuItem value="SALA 2">SALA 2</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Compañía</InputLabel>
              <Select
                value={formData.compania}
                label="Compañía"
                onChange={(e) => setFormData({ ...formData, compania: e.target.value })}
              >
                <MenuItem value="WIN">WIN</MenuItem>
                <MenuItem value="PERÚ FIBRA">PERÚ FIBRA</MenuItem>
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
            label="Comentarios"
            value={formData.comentarios_back}
            onChange={(e) => setFormData({...formData, comentarios_back: e.target.value})}
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
