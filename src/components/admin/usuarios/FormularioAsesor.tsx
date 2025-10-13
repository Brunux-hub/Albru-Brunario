import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Divider
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';

interface FormularioAsesorProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AsesorData {
  nombre: string;
  email: string;
  telefono: string;
  tipo: 'gtr' | 'asesor' | 'validador';
  username: string;
  password: string;
  role: 'admin' | 'gtr' | 'asesor' | 'supervisor' | 'validaciones';
}

const FormularioAsesor: React.FC<FormularioAsesorProps> = ({ open, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<AsesorData>({
    nombre: '',
    email: '',
    telefono: '',
    tipo: 'asesor',
    username: '',
    password: '',
    role: 'asesor'
  });

  const handleChange = (field: keyof AsesorData) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.email || !formData.username || !formData.password) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/admin/crear-asesor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Asesor creado exitosamente');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        setError(data.message || 'Error al crear asesor');
      }
    } catch (error) {
      console.error('Error creating asesor:', error);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      tipo: 'asesor',
      username: '',
      password: '',
      role: 'asesor'
    });
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Crear Nuevo Asesor
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3}>
            
            {/* Información Personal */}
            <Box>
              <Typography variant="subtitle1" gutterBottom color="primary" fontWeight="bold">
                Información Personal
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Nombre Completo *"
                  value={formData.nombre}
                  onChange={handleChange('nombre')}
                  fullWidth
                  variant="outlined"
                />
                
                <TextField
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  fullWidth
                  variant="outlined"
                />
                
                <TextField
                  label="Teléfono"
                  value={formData.telefono}
                  onChange={handleChange('telefono')}
                  fullWidth
                  variant="outlined"
                />
              </Box>
            </Box>

            {/* Configuración del Sistema */}
            <Box>
              <Typography variant="subtitle1" gutterBottom color="primary" fontWeight="bold">
                Configuración del Sistema
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Asesor</InputLabel>
                  <Select
                    value={formData.tipo}
                    label="Tipo de Asesor"
                    onChange={handleChange('tipo')}
                  >
                    <MenuItem value="asesor">Asesor</MenuItem>
                    <MenuItem value="gtr">GTR</MenuItem>
                    <MenuItem value="validador">Validador</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Rol del Sistema</InputLabel>
                  <Select
                    value={formData.role}
                    label="Rol del Sistema"
                    onChange={handleChange('role')}
                  >
                    <MenuItem value="asesor">Asesor</MenuItem>
                    <MenuItem value="gtr">GTR</MenuItem>
                    <MenuItem value="supervisor">Supervisor</MenuItem>
                    <MenuItem value="validaciones">Validaciones</MenuItem>
                    <MenuItem value="admin">Administrador</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Nombre de Usuario *"
                  value={formData.username}
                  onChange={handleChange('username')}
                  fullWidth
                  variant="outlined"
                  helperText="Será usado para iniciar sesión"
                />
                
                <TextField
                  label="Contraseña Temporal *"
                  type="password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  fullWidth
                  variant="outlined"
                  helperText="Mínimo 6 caracteres. El asesor puede cambiarla después."
                />
              </Box>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creando...' : 'Crear Asesor'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FormularioAsesor;