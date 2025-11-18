# 🚀 Pasos para Importar CSV con Sistema de Duplicados

## ✅ Paso 1: Eliminar datos actuales (YA HECHO desde Adminer)

Ejecutado desde Adminer:
```sql
DELETE FROM clientes;
```

## ✅ Paso 2: Ejecutar Migración 007 (Agregar campos de duplicados)

```powershell
docker exec albru-base mysql -u albru -palbru12345 albru < database/migrations/007_sistema_duplicados.sql
```

**Verificar que se crearon los campos**:
```powershell
docker exec albru-base mysql -u albru -palbru12345 albru -e "SHOW COLUMNS FROM clientes LIKE '%duplicado%';"
```

Deberías ver:
- `es_duplicado` (tinyint)
- `cantidad_duplicados` (int)
- `telefono_principal_id` (int)
- `tipificacion_original` (varchar)

## ✅ Paso 3: Ejecutar Script de Importación del CSV

```powershell
node import-clientes2-con-categorizacion.js
```

**Resultado esperado**:
```
✅ Insertados: 10,622 registros
✅ Tipificaciones mapeadas: 25 categorías
✅ Duplicados identificados automáticamente
✅ Categorías asignadas correctamente
```

## ✅ Paso 4: Verificar Duplicados Identificados

```powershell
docker exec albru-base mysql -u albru -palbru12345 albru -e "
SELECT 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN es_duplicado = FALSE OR es_duplicado IS NULL THEN 1 END) as principales,
  COUNT(CASE WHEN es_duplicado = TRUE THEN 1 END) as duplicados,
  SUM(CASE WHEN es_duplicado = FALSE OR es_duplicado IS NULL THEN cantidad_duplicados ELSE 0 END) as gestiones_totales_posibles
FROM clientes;
"
```

## ✅ Paso 5: Ver Ejemplos de Duplicados

```powershell
docker exec albru-base mysql -u albru -palbru12345 albru -e "
SELECT 
  telefono,
  COUNT(*) as cantidad,
  GROUP_CONCAT(id ORDER BY created_at) as ids,
  MIN(created_at) as fecha_primer_registro
FROM clientes
GROUP BY telefono
HAVING COUNT(*) > 1
ORDER BY cantidad DESC
LIMIT 10;
"
```

## ✅ Paso 6: Verificar Categorización

```powershell
docker exec albru-base mysql -u albru -palbru12345 albru -e "
SELECT 
  estatus_comercial_categoria as categoria,
  estatus_comercial_subcategoria as subcategoria,
  COUNT(*) as cantidad
FROM clientes
GROUP BY estatus_comercial_categoria, estatus_comercial_subcategoria
ORDER BY cantidad DESC
LIMIT 20;
"
```

## ✅ Paso 7: Reiniciar Backend

```powershell
docker-compose restart albru-backend
```

Verificar logs:
```powershell
docker logs -f albru-backend
```

## ✅ Paso 8: Testing en Frontend

1. **Abrir navegador**: http://localhost:5173
2. **Login como asesor**
3. **Ir a "Mis Clientes Asignados"**
4. **Verificar**:
   - ✅ Chip `×5` aparece en teléfonos duplicados
   - ✅ Lista muestra solo registros principales
5. **Ir a "Gestiones del Día"**
6. **Verificar**:
   - ✅ Card "Clientes únicos hoy"
   - ✅ Card "Gestiones totales" (con duplicados)

## 🎯 Resultado Esperado

### Vista de Lista de Clientes:
```
┌────────────┬──────────────┬────────────────────┬───────────────┐
│ Fecha      │ Nombre       │ Teléfono           │ Acción        │
├────────────┼──────────────┼────────────────────┼───────────────┤
│ 07/06/2025 │ Juan Pérez   │ 923 718 973  [×3]  │ [GESTIONAR]   │
│ 09/06/2025 │ María López  │ 942 889 024        │ [GESTIONAR]   │
│ 13/06/2025 │ Carlos Gómez │ 920 308 546  [×2]  │ [GESTIONAR]   │
└────────────┴──────────────┴────────────────────┴───────────────┘
```

### Vista de Estadísticas:
```
┌──────────────────────┐  ┌──────────────────────┐
│ Clientes únicos hoy  │  │ Gestiones totales    │
│         3            │  │         6            │
└──────────────────────┘  └──────────────────────┘
                          (incluye duplicados ×2.0)
```

---

**¡Todo listo!** El sistema ahora:
- ✅ Muestra `×5` en teléfonos duplicados
- ✅ Cuenta correctamente gestiones totales
- ✅ Categoriza automáticamente según tipificaciones
- ✅ Preserva fechas reales del CSV
