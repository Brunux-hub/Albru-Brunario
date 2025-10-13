import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, ingresa usuario y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      
      if (success) {
        // El AuthContext maneja la redirección basada en el rol
        // Por ahora, redirigimos a una página genérica y luego el contexto decide
        navigate('/dashboard');
      } else {
        setError('Usuario o contraseña incorrectos, o acceso no autorizado.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <MainLayout>
      <Typography variant="h5" mb={1} align="center" fontWeight="bold" color="primary.main">
        ¡Bienvenido a ALBRU!
      </Typography>
      <Typography variant="body1" mb={3} align="center" color="text.secondary">
        Ingresa tus credenciales para acceder a la plataforma
      </Typography>
      <form onSubmit={handleLogin} style={{ width: '100%' }}>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
            variant="outlined"
            fullWidth
            size="medium"
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            variant="outlined"
            fullWidth
            size="medium"
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            size="large" 
            sx={{ mt: 1 }} 
            fullWidth
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Iniciando...' : 'Entrar'}
          </Button>
        </Box>
      </form>
    </MainLayout>
  );
};

export default LoginPage;
