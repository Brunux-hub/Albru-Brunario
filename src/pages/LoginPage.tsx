import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { users } from '../data/users';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, ingresa usuario y contraseña.');
      return;
    }
    const user = users.find(
      u => u.username === username && u.password === password
    );
    if (!user) {
      setError('Usuario o contraseña incorrectos.');
      return;
    }
    setError('');
    
    // Redirigir según el rol
    switch (user.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'gtr':
        navigate('/gtr');
        break;
      case 'supervisor':
        navigate('/supervisor');
        break;
      case 'asesor':
        navigate('/asesor');
        break;
      case 'calidad':
        navigate('/calidad');
        break;
      default:
        setError('Rol no reconocido.');
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
          <Button type="submit" variant="contained" color="primary" size="large" sx={{ mt: 1 }} fullWidth>
            Entrar
          </Button>
        </Box>
      </form>
    </MainLayout>
  );
};

export default LoginPage;
