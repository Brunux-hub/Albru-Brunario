/**
 * Script para unificar registros duplicados basándose en números de teléfono normalizados
 * 
 * LÓGICA:
 * 1. Detecta números de teléfono que son el mismo pero escritos de forma diferente
 *    (ej: "906 604 170" y "+51906604170" son el mismo número)
 * 2. Identifica el registro más antiguo como el PRINCIPAL
 * 3. Marca los demás como duplicados del principal
 * 4. Actualiza contadores y estadísticas
 */

const mysql = require('mysql2/promise');

// Normalizar teléfono eliminando espacios, +51, guiones, etc.
function normalizarTelefono(telefono) {
  if (!telefono) return null;
  return String(telefono)
    .replace(/[\s\-\(\)\+]/g, '')
    .replace(/^51/, '');
}

async function main() {
  // Configuración de conexión (usando variables de entorno del contenedor)
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'albru-base',
    user: process.env.DB_USER || 'albru',
    password: process.env.DB_PASSWORD || 'albru12345',
    database: process.env.DB_NAME || 'albru',
    port: parseInt(process.env.DB_PORT || '3306')
  });

  console.log('✅ Conectado a la base de datos\n');

  try {
    // 1. Obtener todos los clientes
    const [clientes] = await connection.query(
      'SELECT id, telefono, created_at, campana, es_duplicado FROM clientes ORDER BY created_at ASC'
    );

    console.log(`📊 Total de registros: ${clientes.length}\n`);

    // 2. Agrupar por teléfono normalizado
    const grupos = new Map();
    
    clientes.forEach(cliente => {
      const telefonoNorm = normalizarTelefono(cliente.telefono);
      if (!telefonoNorm) return;

      if (!grupos.has(telefonoNorm)) {
        grupos.set(telefonoNorm, []);
      }
      grupos.get(telefonoNorm).push(cliente);
    });

    console.log(`📱 Números únicos encontrados: ${grupos.size}\n`);

    // 3. Procesar grupos con duplicados
    let gruposProcesados = 0;
    let duplicadosEncontrados = 0;

    for (const [telefonoNorm, registros] of grupos.entries()) {
      if (registros.length <= 1) continue; // No hay duplicados

      gruposProcesados++;
      duplicadosEncontrados += registros.length - 1;

      // El primero (más antiguo) es el principal
      const principal = registros[0];
      const duplicados = registros.slice(1);

      console.log(`\n🔍 Procesando grupo: ${principal.telefono}`);
      console.log(`   Principal ID: ${principal.id} (creado: ${principal.created_at})`);
      console.log(`   Duplicados encontrados: ${duplicados.length}`);

      // Contar por campaña
      const campañasMap = new Map();
      registros.forEach(reg => {
        const camp = reg.campana || 'SIN_CAMPAÑA';
        campañasMap.set(camp, (campañasMap.get(camp) || 0) + 1);
      });

      const campanasAsociadas = Array.from(campañasMap.entries())
        .map(([camp, count]) => `${camp}×${count}`)
        .join(',');

      // Actualizar principal
      await connection.query(
        `UPDATE clientes 
         SET es_duplicado = 0, 
             telefono_principal_id = NULL,
             cantidad_duplicados = ?,
             campanas_asociadas = ?
         WHERE id = ?`,
        [registros.length, campanasAsociadas, principal.id]
      );

      console.log(`   ✅ Principal actualizado: cantidad=${registros.length}, campañas=${campanasAsociadas}`);

      // Marcar duplicados
      for (const dup of duplicados) {
        await connection.query(
          `UPDATE clientes 
           SET es_duplicado = 1, 
               telefono_principal_id = ?,
               cantidad_duplicados = 0
           WHERE id = ?`,
          [principal.id, dup.id]
        );
        console.log(`   📌 Marcado como duplicado: ID ${dup.id}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ RESUMEN DE UNIFICACIÓN');
    console.log('='.repeat(60));
    console.log(`Grupos con duplicados procesados: ${gruposProcesados}`);
    console.log(`Total de duplicados marcados: ${duplicadosEncontrados}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
    console.log('✅ Conexión cerrada');
  }
}

main();
