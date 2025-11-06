# Limpieza de Clientes Derivados - Resumen

**Fecha:** 4 de noviembre de 2025  
**Operación:** Reset completo del sistema de seguimiento automático

---

## ✅ Limpieza Ejecutada

### Datos Limpiados:
- ✅ **2,451 clientes** reseteados
- ✅ `seguimiento_status` → NULL
- ✅ `derivado_at` → NULL
- ✅ `opened_at` → NULL
- ✅ `asesor_asignado` → NULL
- ✅ Todos los locks de `cliente_locks` eliminados

---

## 📊 Estado Actual

```
Total Clientes:     2,451
Sin seguimiento:    2,451 (100%)
Derivados:          0
En gestión:         0
Gestionados:        0
Sin asesor:         2,451 (100%)
```

**Todos los clientes están disponibles para ser asignados desde cero.**

---

## 🧪 Scripts Disponibles

### 1. Script PowerShell Interactivo
```powershell
.\scripts\limpiar-seguimiento.ps1
```

**Características:**
- Pide confirmación antes de ejecutar
- Muestra estadísticas después de la limpieza
- Lista clientes disponibles para pruebas
- Salida coloreada y formateada

### 2. Script SQL Directo
```sql
-- Archivo: scripts/limpiar-clientes-derivados.sql
UPDATE clientes 
SET 
  seguimiento_status = NULL,
  derivado_at = NULL,
  opened_at = NULL,
  asesor_asignado = NULL,
  updated_at = NOW()
WHERE seguimiento_status IS NOT NULL;

DELETE FROM cliente_locks;
```

### 3. Comando Directo
```bash
docker exec -i albru-base sh -c 'mysql -uroot -proot_password_here albru -e "
  UPDATE clientes 
  SET seguimiento_status = NULL, derivado_at = NULL, 
      opened_at = NULL, asesor_asignado = NULL, 
      updated_at = NOW() 
  WHERE seguimiento_status IS NOT NULL;
  DELETE FROM cliente_locks;
"'
```

---

## 🎯 Clientes Disponibles para Pruebas

Los siguientes IDs de cliente están disponibles y listos para probar:

```
ID: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...
```

**Todos sin:**
- Asesor asignado
- Seguimiento activo
- Locks

---

## 🧪 Flujo de Prueba Recomendado

### 1. Prueba Manual Básica
```
1. GTR asigna cliente 1 a asesor 4
   → Verificar chip "Derivado" en GTR
   
2. Asesor 4 abre wizard del cliente 1
   → Verificar cambio a "En Gestión" en tiempo real
   
3. Esperar 5 minutos (o cerrar wizard)
   → Verificar que vuelve a GTR como "Gestionado"
```

### 2. Prueba con Script Automatizado
```powershell
# Prueba completa del flujo
.\scripts\test-seguimiento-complete-flow.ps1 -ClienteId 1 -AsesorId 4

# Prueba de tiempo real
.\scripts\test-realtime-seguimiento.ps1 -ClienteId 2 -AsesorId 4

# Prueba de persistencia GTR
.\scripts\test-gtr-seguimiento-persistence.ps1 -ClienteId 3 -AsesorId 4
```

### 3. Prueba de Múltiples Clientes
```powershell
# Asignar varios clientes a diferentes asesores
$clientes = 1..5
$asesores = @(4, 5, 6)

foreach ($clienteId in $clientes) {
    $asesorId = $asesores[$clienteId % $asesores.Length]
    # Asignar cliente a asesor
    # Ver comportamiento en GTR con múltiples asignaciones
}
```

---

## 🔄 Credenciales MySQL

**Para futuras referencias:**
```
Host:          localhost (dentro del contenedor)
Puerto:        3308 (host) → 3306 (contenedor)
Base de datos: albru
Usuario root:  root
Password root: root_password_here
Usuario app:   albru
Password app:  albru12345
```

**Acceso directo:**
```bash
# Dentro del contenedor
docker exec -it albru-base mysql -uroot -proot_password_here albru

# Desde Adminer (navegador)
http://localhost:8080
Sistema: MySQL
Servidor: db
Usuario: root
Contraseña: root_password_here
Base de datos: albru
```

---

## 📝 Verificaciones Post-Limpieza

### Verificar en Base de Datos
```sql
-- Ver estado de seguimiento
SELECT 
  seguimiento_status,
  COUNT(*) as total
FROM clientes
GROUP BY seguimiento_status;

-- Ver clientes con asesor asignado
SELECT COUNT(*) FROM clientes WHERE asesor_asignado IS NOT NULL;

-- Ver locks activos
SELECT COUNT(*) FROM cliente_locks;
```

**Resultado esperado:**
- Todos con `seguimiento_status = NULL`
- Ninguno con `asesor_asignado`
- Sin locks en `cliente_locks`

### Verificar en Frontend
```
1. Abrir GTR: http://localhost:5174/dashboard/gtr
   → Todos los clientes deben mostrar "Disponible"
   → Columna "Seguimiento" debe estar vacía o mostrar "-"

2. Abrir Asesor: http://localhost:5174/dashboard/asesor
   → Lista de clientes debe estar vacía (sin asignaciones)
```

---

## ✅ Checklist de Limpieza Completada

- [x] Clientes sin seguimiento_status
- [x] Clientes sin derivado_at
- [x] Clientes sin opened_at
- [x] Clientes sin asesor_asignado
- [x] Locks eliminados de cliente_locks
- [x] Script PowerShell creado para futuras limpiezas
- [x] Script SQL documentado
- [x] Clientes disponibles verificados

---

**Estado:** ✅ Sistema listo para pruebas desde cero  
**Total de clientes disponibles:** 2,451  
**Próximo paso:** Ejecutar pruebas de seguimiento automático
