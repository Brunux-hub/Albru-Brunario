-- ============================================================
-- SCRIPT DE CONSOLIDACIÓN: usuarios + usuarios_sistema → usuarios
-- Fecha: 21 de octubre de 2025
-- Propósito: Unificar autenticación en una sola tabla
-- ============================================================

USE albru;

-- ============================================================
-- PASO 1: AGREGAR CAMPOS FALTANTES A LA TABLA usuarios
-- ============================================================

-- Agregar campo username (único, para login alternativo)
ALTER TABLE usuarios 
ADD COLUMN username VARCHAR(50) NULL UNIQUE AFTER email;

-- Agregar campo ultimo_acceso
ALTER TABLE usuarios 
ADD COLUMN ultimo_acceso TIMESTAMP NULL AFTER updated_at;

-- ============================================================
-- PASO 2: MIGRAR DATOS DE usuarios_sistema → usuarios
-- ============================================================

-- Actualizar username desde usuarios_sistema
UPDATE usuarios u
INNER JOIN usuarios_sistema us ON u.id = us.usuario_id
SET u.username = us.username,
    u.ultimo_acceso = us.ultimo_acceso;

-- ============================================================
-- PASO 3: REGENERAR TODAS LAS CONTRASEÑAS CON HASH CONOCIDO
-- Hash de 'password' generado con bcrypt (10 rounds)
-- ============================================================

-- Este hash corresponde a la contraseña: 'password'
-- Generado con: bcrypt.hash('password', 10)
SET @password_hash = '$2b$10$YourGeneratedHashWillGoHere';

-- Actualizaremos esto desde Node.js para tener el hash correcto

-- ============================================================
-- PASO 4: ELIMINAR FOREIGN KEYS QUE REFERENCIAN usuarios_sistema
-- ============================================================

-- Verificar foreign keys existentes
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'albru' 
  AND REFERENCED_TABLE_NAME = 'usuarios_sistema';

-- Si hay FKs, se eliminarán aquí (ajustar según resultado de la query anterior)
-- ALTER TABLE [tabla] DROP FOREIGN KEY [constraint_name];

-- ============================================================
-- PASO 5: ELIMINAR TABLA usuarios_sistema
-- ============================================================

-- Esta línea se ejecutará DESPUÉS de confirmar que todo funciona
-- DROP TABLE IF EXISTS usuarios_sistema;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

-- Verificar estructura actualizada
DESCRIBE usuarios;

-- Verificar datos migrados
SELECT 
    id, 
    nombre, 
    email, 
    username,
    LEFT(password, 30) as password_inicio,
    tipo, 
    estado,
    ultimo_acceso
FROM usuarios 
LIMIT 10;

-- Contar usuarios activos
SELECT COUNT(*) as total_usuarios_activos 
FROM usuarios 
WHERE estado = 'activo';

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- 1. El hash de password se regenerará desde Node.js
-- 2. La tabla usuarios_sistema se eliminará DESPUÉS de verificar
-- 3. Todos los usuarios tendrán password = 'password' temporalmente
-- 4. Se recomienda forzar cambio de contraseña en primer login
-- ============================================================
