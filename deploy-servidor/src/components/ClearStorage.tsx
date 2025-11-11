import React, { useEffect } from 'react';

const ClearStorage: React.FC = () => {
  useEffect(() => {
    console.log('🧹 Limpiando completamente el almacenamiento...');
    
    // Limpiar localStorage
    localStorage.clear();
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    // Limpiar cookies si existen
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    console.log('✅ Almacenamiento limpiado completamente');
    
    // Redireccionar después de limpiar
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      backgroundColor: '#f5f5f5'
    }}>
      <h2>🧹 Limpiando datos de sesión...</h2>
      <p>Redirigiendo al login...</p>
    </div>
  );
};

export default ClearStorage;