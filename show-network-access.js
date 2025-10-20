#!/usr/bin/env node

console.log('\n🌐 === ALBRU - ACCESO PARA TODA LA RED LOCAL ===\n');

const SERVER_IP = '192.168.1.180';

console.log('📋 URL para compartir con todo tu equipo:\n');

console.log(`🖥️  Servidor: ${SERVER_IP}`);
console.log(`   🌐 ALBRU Sistema: http://${SERVER_IP}:5173`);
console.log(`   ⚙️  API Backend:   http://${SERVER_IP}:3001`);
console.log(`   🗄️  Admin Base:    http://${SERVER_IP}:8080`);
console.log('');

console.log('📱 Instrucciones para el equipo:');
console.log(`   1. Abre en cualquier navegador: http://${SERVER_IP}:5173`);
console.log('   2. Funciona desde cualquier PC/tablet/móvil en la red');
console.log('   3. Usa las credenciales:');
console.log('      • Asesor: jvenancioo@albru.pe / password');
console.log('      • Admin:  admin@albru.pe / password');
console.log('      • GTR:    maria.gtr@albru.pe / password');
console.log('');

console.log('🔒 Seguridad:');
console.log('   • Solo accesible desde tu red WiFi/LAN');
console.log('   • No accesible desde internet');
console.log('   • Autenticación requerida');
console.log('');

console.log('🛠️  Para administradores:');
console.log(`   • Base de datos: http://${SERVER_IP}:8080`);
console.log('   • Usuario: root / Password: root_password_here');
console.log('   • Base: albru');
console.log('');