// Script de prueba para verificar la funcionalidad de autenticación
// Ejecutar en la consola del navegador en la página de login

const testLogin = async (username, password) => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    
    if (data.success && data.token) {
      console.log('✅ Login exitoso');
      console.log('Token:', data.token);
      console.log('Usuario:', data.user);
      
      // Probar endpoint protegido
      const adminResponse = await fetch('http://localhost:3001/api/admin/asesores', {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      const adminData = await adminResponse.json();
      console.log('Admin endpoint response:', adminData);
      
    } else {
      console.log('❌ Login falló:', data.message);
    }
  } catch (error) {
    console.error('Error en test:', error);
  }
};

// Ejecutar pruebas
console.log('🧪 Iniciando pruebas de autenticación...');
console.log('Prueba con admin:');
testLogin('admin', 'admin123');

setTimeout(() => {
  console.log('\nPrueba con asesor1:');
  testLogin('asesor1', 'user123');
}, 2000);