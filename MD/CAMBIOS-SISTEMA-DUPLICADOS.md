# Cambios Realizados - Sistema de Duplicados ×5

## ✅ COMPLETADO

### 1. Backend - Estadísticas con Gestiones Totales
**Archivo**: `backend/controllers/asesoresController.js`

**Cambios en `getAsesores()`**:
```javascript
// Query agregado para gestiones totales
const [gestionesTotales] = await pool.query(`
  SELECT 
    c.asesor_asignado as asesor_id,
    COUNT(DISTINCT c.id) as clientes_unicos,
    COALESCE(SUM(c.cantidad_duplicados), COUNT(c.id)) as gestiones_totales
  FROM clientes c
  WHERE c.asesor_asignado IS NOT NULL
    AND DATE(c.updated_at) = DATE(NOW())
    AND (c.es_duplicado = FALSE OR c.es_duplicado IS NULL)
  GROUP BY c.asesor_asignado
`);

// Respuesta incluye:
{
  clientes_atendidos_hoy: 10,
  clientes_unicos_hoy: 3,      // ← NUEVO
  gestiones_totales_hoy: 9     // ← NUEVO (si gestionó ×5, ×3, ×1)
}
```

**Cambios en `obtenerDatosClientes()`**:
```javascript
// Campos agregados:
{ col: 'es_duplicado', as: 'es_duplicado' },
{ col: 'cantidad_duplicados', as: 'cantidad_duplicados' },
{ col: 'telefono_principal_id', as: 'telefono_principal_id' },
{ col: 'campana', as: 'campana' }

// Filtro agregado - SOLO principales:
WHERE asesor_asignado = ? 
  AND (es_duplicado = FALSE OR es_duplicado IS NULL)
```

**Nuevo Endpoint**: `obtenerDuplicados()`
```javascript
// GET /api/asesores/clientes/:id/duplicados
// Retorna todos los registros con el mismo teléfono
{
  success: true,
  duplicados: [...],
  total: 5,
  telefono: "933 543 840"
}
```

### 2. Backend - Nueva Ruta
**Archivo**: `backend/routes/asesores.js`

```javascript
router.get('/clientes/:id/duplicados', obtenerDuplicados);
```

### 3. Frontend - Componente Tabla de Clientes
**Archivo**: `src/components/asesor/AsesorClientesTable.tsx`

**Interface actualizada**:
```typescript
type ClienteApi = {
  // ... campos existentes
  es_duplicado?: boolean;
  cantidad_duplicados?: number;
  telefono_principal_id?: number | null;
}
```

**Celda de teléfono con chip ×5**:
```tsx
<TableCell>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <div>
      <div style={{ fontWeight: 600 }}>{cliente.telefono}</div>
    </div>
    {cliente.cantidad_duplicados && cliente.cantidad_duplicados > 1 ? (
      <Chip 
        label={`×${cliente.cantidad_duplicados}`}
        size="small"
        color="warning"
        title={`Este número aparece ${cliente.cantidad_duplicados} veces`}
      />
    ) : null}
  </div>
</TableCell>
```

### 4. Frontend - Estadísticas del Día
**Archivo**: `src/components/asesor/AsesorGestionesDia.tsx`

**Interface actualizada**:
```typescript
interface ClienteGestion {
  // ... campos existentes
  cantidad_duplicados?: number;
}
```

**Cálculo de gestiones totales**:
```typescript
const gestionesTotales = clientes.reduce((acc, cliente) => {
  return acc + (cliente.cantidad_duplicados || 1);
}, 0);
```

**Cards superiores actualizados** (ahora 4 cards):
```tsx
<Paper>
  <Typography>Clientes únicos hoy</Typography>
  <Typography>{totalGestiones}</Typography>
</Paper>

<Paper>
  <Typography>Gestiones totales</Typography>
  <Typography>{gestionesTotales}</Typography>
  {gestionesTotales > totalGestiones && (
    <Typography variant="caption">
      (incluye duplicados ×{promedio})
    </Typography>
  )}
</Paper>

<Paper>Otros: {clientesOtros}</Paper>
<Paper>A Preventa: {clientesAPreventa}</Paper>
```

## 🔄 ARCHIVOS CREADOS PREVIAMENTE (Listos para ejecutar)

### 1. Migración SQL
**Archivo**: `database/migrations/007_sistema_duplicados.sql`

**Contenido**:
- ✅ 4 campos nuevos: `es_duplicado`, `cantidad_duplicados`, `telefono_principal_id`, `tipificacion_original`
- ✅ 3 índices de optimización
- ✅ UPDATE para identificar principales (más antiguos)
- ✅ UPDATE para marcar duplicados
- ✅ Queries de verificación

**Estado**: ⏳ No ejecutado

### 2. Script de Importación
**Archivo**: `import-clientes2-con-categorizacion.js`

**Funcionalidad**:
- ✅ Importa CSV clientes2.csv (10,622 registros)
- ✅ Mapea 25 tipificaciones a categorías automáticamente
- ✅ Convierte fechas DD/MM/YYYY → YYYY-MM-DD
- ✅ Identifica duplicados después de importar
- ✅ Muestra estadísticas detalladas

**Estado**: ⏳ No ejecutado

### 3. Análisis Completo
**Archivo**: `ANALISIS-DOBLE-CLICK-Y-CATEGORIAS.md`

**Contenido**:
- ✅ Estado actual de BD (categorías NULL)
- ✅ Análisis de CSV (tipificaciones)
- ✅ Tabla de mapeo completa (25 tipificaciones)
- ✅ Plan de implementación
- ✅ Ejemplos visuales de resultado

## 📋 PRÓXIMOS PASOS

### Paso 1: Ejecutar Migración 007 (5 minutos)
```bash
# En PC local
docker exec albru-base mysql -u albru -palbru12345 albru < database/migrations/007_sistema_duplicados.sql

# Verificar campos creados
docker exec albru-base mysql -u albru -palbru12345 albru -e "SHOW COLUMNS FROM clientes LIKE '%duplicado%';"

# Resultado esperado:
# ✅ es_duplicado (BOOLEAN)
# ✅ cantidad_duplicados (INT)
# ✅ telefono_principal_id (INT)
# ✅ tipificacion_original (VARCHAR)
```

### Paso 2: Ejecutar Script de Importación (10-15 minutos)
```bash
# Ejecutar importación
node import-clientes2-con-categorizacion.js

# Resultado esperado:
# ✅ Insertados: 10,622 registros
# ✅ Tipificaciones mapeadas: 25
# ✅ Duplicados identificados: ~500-800
# ✅ Categorías asignadas correctamente
```

### Paso 3: Verificar Duplicados en BD (2 minutos)
```sql
-- Ver registros con duplicados
SELECT 
  telefono,
  COUNT(*) as total,
  GROUP_CONCAT(id ORDER BY created_at) as ids
FROM clientes
GROUP BY telefono
HAVING COUNT(*) > 1
ORDER BY total DESC
LIMIT 10;

-- Verificar principales marcados
SELECT 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN es_duplicado = FALSE THEN 1 END) as principales,
  COUNT(CASE WHEN es_duplicado = TRUE THEN 1 END) as duplicados,
  SUM(cantidad_duplicados) as gestiones_totales_posibles
FROM clientes;

-- Ejemplo esperado:
-- total_registros: 23,882 (13,260 + 10,622)
-- principales: 22,800
-- duplicados: 1,082
-- gestiones_totales: 24,964
```

### Paso 4: Reiniciar Backend (1 minuto)
```bash
# Detener contenedor actual
docker stop albru-backend

# Iniciar con nuevos cambios
docker-compose up -d albru-backend

# Verificar logs
docker logs -f albru-backend
```

### Paso 5: Testing en Frontend (10 minutos)

#### 5.1 Login como Asesor
- ✅ Login con usuario asesor
- ✅ Ir a "Mis Clientes Asignados"

#### 5.2 Verificar Lista con ×5
**Esperado**:
```
941 661 704 (×5)  CAMPAÑA 2  [GESTIONAR]
933 555 123 (×3)  CAMPAÑA 1  [GESTIONAR]
912 345 678       CAMPAÑA 3  [GESTIONAR]
```

#### 5.3 Verificar Estadísticas del Día
**Ir a**: "Gestiones del Día"

**Esperado**:
```
┌──────────────────────┐  ┌──────────────────────┐
│ Clientes únicos hoy  │  │ Gestiones totales    │
│         3            │  │         9            │
└──────────────────────┘  └──────────────────────┘
                          (incluye duplicados ×3.0)

┌──────────────────────┐  ┌──────────────────────┐
│ Otros                │  │ A Preventa           │
│         2            │  │         1            │
└──────────────────────┘  └──────────────────────┘
```

#### 5.4 Gestionar Cliente con Duplicados
1. Hacer clic en "GESTIONAR" en cliente con ×5
2. Completar wizard normalmente
3. Verificar que:
   - ✅ Se gestiona SOLO 1 registro (el principal)
   - ✅ Los otros 4 duplicados quedan sin gestionar
   - ✅ Estadísticas incrementan +5 (no +1)

#### 5.5 Probar Endpoint de Duplicados (Opcional)
```bash
# En navegador o Postman
GET http://localhost:5000/api/asesores/clientes/1373/duplicados

# Respuesta esperada:
{
  "success": true,
  "duplicados": [
    { "id": 1373, "telefono": "933 543 840", "es_principal": true, ... },
    { "id": 2779, "telefono": "933 543 840", "es_principal": false, ... },
    { "id": 3358, "telefono": "933 543 840", "es_principal": false, ... },
    { "id": 7940, "telefono": "933 543 840", "es_principal": false, ... },
    { "id": 9123, "telefono": "933 543 840", "es_principal": false, ... }
  ],
  "total": 5,
  "telefono": "933 543 840"
}
```

### Paso 6: Push a GitHub (2 minutos)
```bash
git add .
git commit -m "feat: Sistema completo de duplicados con visualización ×5 y conteo inteligente

- Backend: Estadísticas con gestiones_totales (SUM cantidad_duplicados)
- Backend: Filtro solo principales en lista de clientes
- Backend: Endpoint /duplicados para ver todos los registros
- Frontend: Chip ×5 en tabla de clientes
- Frontend: Card 'Gestiones totales' en estadísticas del día
- Migración 007: Campos es_duplicado, cantidad_duplicados, telefono_principal_id
- Script importación con categorización automática (25 tipificaciones)"

git push origin main
```

## 🎯 RESULTADO FINAL

### Vista de Asesor - Lista de Clientes
```
┌────────────────────────────────────────────────────────────────┐
│ MIS CLIENTES ASIGNADOS                                         │
├────────────┬──────────────┬────────────────────┬───────────────┤
│ Fecha      │ Nombre       │ Teléfono           │ Acción        │
├────────────┼──────────────┼────────────────────┼───────────────┤
│ 07/06/2025 │ Juan Pérez   │ 941 661 704  [×5]  │ [GESTIONAR]   │
│ 05/06/2025 │ María López  │ 933 555 123  [×3]  │ [GESTIONAR]   │
│ 04/06/2025 │ Carlos Gómez │ 912 345 678        │ [GESTIONAR]   │
└────────────┴──────────────┴────────────────────┴───────────────┘

[×5] = Chip naranja (warning) indicando 5 registros con mismo teléfono
```

### Vista de Asesor - Gestiones del Día
```
┌──────────────────────────────────────────────────────────────────┐
│ GESTIONES DEL DÍA                                                │
├──────────────────────┬──────────────────────┬────────────────────┤
│ Clientes únicos hoy  │ Gestiones totales    │ Otros              │
│        3             │        9             │   2                │
│                      │ (incluye dup ×3.0)   │                    │
├──────────────────────┴──────────────────────┴────────────────────┤
│                                                                   │
│ Desglose por Categoría:                                          │
│   [Preventa: 3]  [No desea: 2]  [Sin cobertura: 4]  ...         │
│                                                                   │
│ Tabla de Clientes Gestionados (filtrable)                       │
│   ┌──────────┬──────────────┬─────────────┬─────────────┐      │
│   │ Fecha    │ Cliente      │ Categoría   │ Seguimiento │      │
│   ├──────────┼──────────────┼─────────────┼─────────────┤      │
│   │ 10:30 AM │ Juan Pérez   │ Preventa    │ Gestionado  │      │
│   │ 11:15 AM │ María López  │ No desea    │ Gestionado  │      │
│   └──────────┴──────────────┴─────────────┴─────────────┘      │
└───────────────────────────────────────────────────────────────────┘
```

## 📊 LÓGICA DE DUPLICADOS

### Ejemplo Práctico
```
Teléfono: 933 543 840 (aparece 5 veces en BD)

┌─────────────────────────────────────────────────────────────┐
│ Base de Datos (después de migración 007)                    │
├──────┬────────────────┬────────────────────┬──────────────┤
│ ID   │ es_duplicado   │ cantidad_duplicados│ tel_princ_id │
├──────┼────────────────┼────────────────────┼──────────────┤
│ 1373 │ FALSE          │ 5                  │ NULL         │ ← PRINCIPAL
│ 2779 │ TRUE           │ 1                  │ 1373         │ ← Duplicado
│ 3358 │ TRUE           │ 1                  │ 1373         │ ← Duplicado
│ 7940 │ TRUE           │ 1                  │ 1373         │ ← Duplicado
│ 9123 │ TRUE           │ 1                  │ 1373         │ ← Duplicado
└──────┴────────────────┴────────────────────┴──────────────┘

Backend Query (obtenerDatosClientes):
  WHERE asesor_asignado = 5 
    AND (es_duplicado = FALSE OR es_duplicado IS NULL)
  
  → Retorna SOLO ID 1373 con cantidad_duplicados=5

Frontend Muestra:
  941 661 704 (×5)  CAMPAÑA 2  [GESTIONAR]

Asesor Gestiona:
  - Se abre wizard para ID 1373
  - Se completa gestión normalmente
  - ID 1373 se marca como gestionado
  - IDs 2779, 3358, 7940, 9123 quedan SIN gestionar

Estadísticas del Día:
  - clientes_unicos_hoy: 1
  - gestiones_totales_hoy: 5  (SUM de cantidad_duplicados)
  
Dashboard Muestra:
  Clientes únicos hoy: 1
  Gestiones totales: 5
  (incluye duplicados ×5.0)
```

## 🔧 TROUBLESHOOTING

### Error: "Campo es_duplicado no existe"
**Solución**: Ejecutar migración 007
```bash
docker exec albru-base mysql -u albru -palbru12345 albru < database/migrations/007_sistema_duplicados.sql
```

### Error: "Chip ×5 no aparece"
**Causa**: Backend no retorna campo `cantidad_duplicados`
**Solución**: 
1. Verificar migración ejecutada
2. Verificar logs backend: `docker logs albru-backend`
3. Reiniciar backend: `docker-compose restart albru-backend`

### Error: "Gestiones totales = 0"
**Causa**: Query de gestiones totales no encuentra registros
**Solución**: Verificar que hay clientes gestionados HOY
```sql
SELECT * FROM clientes 
WHERE DATE(updated_at) = CURDATE() 
  AND (es_duplicado = FALSE OR es_duplicado IS NULL);
```

### Error: "Importación falla"
**Causa**: CSV no encontrado o formato incorrecto
**Solución**:
1. Verificar que `clientes2.csv` existe en raíz
2. Verificar formato: delimitador `;`, 50 columnas
3. Ejecutar con logs: `node import-clientes2-con-categorizacion.js 2>&1 | tee import.log`

## 📝 NOTAS IMPORTANTES

1. **Migración 007 es IDEMPOTENTE**: Puede ejecutarse varias veces sin problemas
2. **Script de importación NO es idempotente**: Insertará duplicados si se ejecuta 2 veces
3. **Backup recomendado**: Hacer backup antes de ejecutar importación
4. **Zona horaria**: Queries usan `CONVERT_TZ` para Perú (UTC-5)
5. **Índices**: Migración crea índices para optimizar queries con duplicados

## ✅ CHECKLIST FINAL

- [ ] Ejecutar migración 007
- [ ] Verificar campos creados
- [ ] Ejecutar script importación
- [ ] Verificar duplicados identificados
- [ ] Reiniciar backend
- [ ] Testing lista con ×5
- [ ] Testing estadísticas totales
- [ ] Testing gestión de duplicados
- [ ] Push a GitHub
- [ ] Pull en servidor (después de testing local exitoso)

---

**Fecha**: 2025-01-XX  
**Autor**: Sistema de Duplicados Albru  
**Version**: 1.0  
**Estado**: ✅ Código completado, ⏳ Pendiente ejecución
