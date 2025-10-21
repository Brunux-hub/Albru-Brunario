import React from 'react';
import { Button } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

const EmergencyLogout: React.FC = () => {
  const { logout } = useAuth();

  const handleEmergencyLogout = () => {
    // Logout forzado
    localStorage.clear();
    sessionStorage.clear();
    
    // Usar el logout del contexto
    logout();
    
    // Forzar redirección
    window.location.href = '/login';
  };

  return (
    <Button
      onClick={handleEmergencyLogout}
      variant="contained"
      color="error"
      size="small"
      sx={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 9999,
        bgcolor: '#dc2626',
        '&:hover': { bgcolor: '#b91c1c' }
      }}
    >
      🚨 LOGOUT FORZADO
    </Button>
  );
};

export default EmergencyLogout;