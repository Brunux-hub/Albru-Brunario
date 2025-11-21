/**
 * Script para agregar múltiples asesores de una vez
 * Los 5 asesores solicitados
 */

const { agregarAsesor } = require('./agregar_asesor.js');

const asesores = [
  { nombre: 'Sebastián Antonio André Aguirre Fiestas', dni: '72048710' },
  { nombre: 'Giner Alexander Loayza Gonzaga', dni: '60826335' },
  { nombre: 'Cristhian Alberts Vasquez Santacruz', dni: '74225484' },
  { nombre: 'Roxana Gisela Villar Bazan', dni: '44647864' }
];

async function agregarAsesoresLote() {
  console.log('════════════════════════════════════════════════');
  console.log('  AGREGANDO 4 NUEVOS ASESORES AL SISTEMA');
  console.log('════════════════════════════════════════════════\n');

  for (let i = 0; i < asesores.length; i++) {
    const asesor = asesores[i];
    console.log(`\n[${i + 1}/${asesores.length}] Procesando: ${asesor.nombre}`);
    console.log('─'.repeat(50));
    await agregarAsesor(asesor.nombre, asesor.dni);
    
    // Esperar 1 segundo entre cada inserción
    if (i < asesores.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n════════════════════════════════════════════════');
  console.log('  ✅ PROCESO COMPLETADO');
  console.log('════════════════════════════════════════════════');
}

agregarAsesoresLote();
