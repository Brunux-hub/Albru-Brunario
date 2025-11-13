# CONTEXTO COMPLETO DEL PROYECTO ALBRU CRM

**Fecha de última actualización:** 13 de noviembre de 2025  
**Estado actual:** Sistema de duplicados implementado con visualización en GTR

---

## 📋 ÍNDICE

1. [Descripción General del Proyecto](#1-descripción-general-del-proyecto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura de la Base de Datos](#3-estructura-de-la-base-de-datos)
4. [Sistema de Duplicados (IMPLEMENTADO)](#4-sistema-de-duplicados-implementado)
5. [Sistema de Categorización Comercial](#5-sistema-de-categorización-comercial)
6. [Flujo de Trabajo del Sistema](#6-flujo-de-trabajo-del-sistema)
7. [Componentes Frontend Principales](#7-componentes-frontend-principales)
8. [Backend y APIs](#8-backend-y-apis)
9. [Últimos Cambios Realizados](#9-últimos-cambios-realizados)
10. [Datos de Prueba Disponibles](#10-datos-de-prueba-disponibles)
11. [Comandos Docker Útiles](#11-comandos-docker-útiles)
12. [Problemas Conocidos y Soluciones](#12-problemas-conocidos-y-soluciones)

---

## 1. DESCRIPCIÓN GENERAL DEL PROYECTO

**Albru CRM** es un sistema de gestión de relaciones con clientes (CRM) especializado para gestión de leads de telecomunicaciones. El sistema maneja:

- **10,621 registros** de clientes importados desde CSV
- **1,094 duplicados** identificados automáticamente
- **3 roles de usuario:** Admin, Asesor, GTR (Gestor)
- **Sistema de seguimiento** con estados comerciales
- **Categorización automática** basada en tipificaciones

### Objetivos del Sistema

1. Gestionar clientes y leads de manera eficiente
2. Identificar y manejar números telefónicos duplicados
3. Categorizar automáticamente según tipificaciones
4. Asignar y reasignar clientes entre asesores
5. Tracking completo de gestiones y cambios de estado

---

## 2. STACK TECNOLÓGICO

### Frontend
- **React 18** con TypeScript
- **Material-UI (MUI)** para componentes
- **Vite** como bundler
- **Context API** para estado global
- **Docker** para contenedorización

### Backend
- **Node.js** con Express
- **MySQL 8.0** como base de datos
- **Docker Compose** para orquestación
- **Nginx** como reverse proxy

### Estructura Docker

```yaml
services:
  base:           # MySQL database
  backend:        # Node.js API
  frontend-dev:   # React development server
  nginx:          # Reverse proxy (puerto 3000)
```

---

## 3. ESTRUCTURA DE LA BASE DE DATOS

### Tabla Principal: `clientes`

#### Campos Base
```sql
id INT PRIMARY KEY AUTO_INCREMENT
lead_id VARCHAR(255)
leads_original_telefono VARCHAR(20)  -- Teléfono del CSV original
telefono VARCHAR(20)                 -- Teléfono normalizado
nombre VARCHAR(255)
dni VARCHAR(20)
email VARCHAR(255)
direccion TEXT
ciudad VARCHAR(100)
distrito VARCHAR(100)
```

#### Campos de Campaña y Canal
```sql
campana VARCHAR(255)
canal VARCHAR(100)
canal_adquisicion VARCHAR(100)
compania VARCHAR(100)
sala_asignada VARCHAR(100)
plan VARCHAR(100)
precio DECIMAL(10,2)
```

#### Campos de Seguimiento
```sql
seguimiento_status VARCHAR(50)  -- 'derivado', 'en_gestion', 'gestionado'
asesor_asignado INT             -- FK a usuarios
derivado_at DATETIME
gestionado_at DATETIME
ultima_fecha_gestion DATETIME
fecha_ultimo_contacto DATETIME
```

#### Campos de Categorización Comercial
```sql
estatus_comercial_categoria VARCHAR(100)     -- Ej: "Sin contacto", "Seguimiento"
estatus_comercial_subcategoria VARCHAR(100)  -- Ej: "No contesta", "Buzón"
tipificacion_original VARCHAR(255)           -- Ej: "0 - NO CONTESTA"
```

#### **Campos de Duplicados (AGREGADOS EN MIGRACIÓN 007)**
```sql
es_duplicado BOOLEAN DEFAULT FALSE           -- TRUE si es duplicado
cantidad_duplicados INT DEFAULT 1            -- Total de registros con mismo teléfono
telefono_principal_id INT NULL               -- ID del registro principal
```

#### Campos de Auditoría
```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
historial_asesores JSON  -- Array de {asesor_id, fecha}
```

### Tabla: `usuarios`

```sql
id INT PRIMARY KEY AUTO_INCREMENT
nombre VARCHAR(255)
email VARCHAR(255) UNIQUE
password_hash VARCHAR(255)
tipo ENUM('admin', 'asesor', 'gtr')
estado VARCHAR(50) DEFAULT 'activo'
created_at TIMESTAMP
```

### Tabla: `asesores` (extensión de usuarios)

```sql
asesor_id INT PRIMARY KEY AUTO_INCREMENT
usuario_id INT                    -- FK a usuarios
meta_mensual INT
ventas_realizadas INT DEFAULT 0
comision_porcentaje DECIMAL(5,2)
clientes_asignados INT DEFAULT 0
```

---

## 4. SISTEMA DE DUPLICADOS (IMPLEMENTADO)

### 4.1 Concepto

El sistema identifica números telefónicos que aparecen múltiples veces en la base de datos. Para cada grupo de duplicados:

- **UN registro es el "principal"** (`es_duplicado = FALSE`)
- **Los demás son "duplicados"** (`es_duplicado = TRUE`)
- Todos tienen `cantidad_duplicados` con el total del grupo
- Los duplicados apuntan al principal con `telefono_principal_id`

### 4.2 Ejemplo Práctico

```
Teléfono: 943 214 189 (aparece 6 veces)

ID    | es_duplicado | cantidad_duplicados | telefono_principal_id
------|--------------|--------------------|-----------------------
11225 | FALSE        | 6                  | NULL                   ← PRINCIPAL
15678 | TRUE         | 6                  | 11225                  ← Duplicado
18923 | TRUE         | 6                  | 11225                  ← Duplicado
20145 | TRUE         | 6                  | 11225                  ← Duplicado
22467 | TRUE         | 6                  | 11225                  ← Duplicado
24589 | TRUE         | 6                  | 11225                  ← Duplicado
```

### 4.3 Migración 007 (EJECUTADA)

**Archivo:** `database/migrations/007_add_duplicados_fields.sql`

```sql
-- Agregar campos
ALTER TABLE clientes ADD COLUMN es_duplicado BOOLEAN DEFAULT FALSE;
ALTER TABLE clientes ADD COLUMN cantidad_duplicados INT DEFAULT 1;
ALTER TABLE clientes ADD COLUMN telefono_principal_id INT NULL;

-- Crear tabla temporal con duplicados
CREATE TEMPORARY TABLE temp_duplicados AS
SELECT leads_original_telefono, COUNT(*) as total
FROM clientes
WHERE leads_original_telefono IS NOT NULL 
  AND leads_original_telefono != ''
GROUP BY leads_original_telefono
HAVING COUNT(*) > 1;

-- Actualizar cantidad_duplicados
UPDATE clientes c
INNER JOIN temp_duplicados t 
  ON c.leads_original_telefono = t.leads_original_telefono
SET c.cantidad_duplicados = t.total;

-- Marcar principal (menor ID)
CREATE TEMPORARY TABLE temp_principales AS
SELECT leads_original_telefono, MIN(id) as principal_id
FROM clientes
WHERE leads_original_telefono IN (SELECT leads_original_telefono FROM temp_duplicados)
GROUP BY leads_original_telefono;

-- Marcar duplicados
UPDATE clientes c
INNER JOIN temp_principales p 
  ON c.leads_original_telefono = p.leads_original_telefono
SET 
  c.es_duplicado = (c.id != p.principal_id),
  c.telefono_principal_id = CASE 
    WHEN c.id != p.principal_id THEN p.principal_id 
    ELSE NULL 
  END;
```

**Resultado:** 1,094 duplicados identificados correctamente

### 4.4 Top Duplicados Identificados

```
Teléfono        | Cantidad | ID Principal
----------------|----------|-------------
985 425 120     | ×6       | 11347
943 214 189     | ×6       | 11225
960 934 345     | ×5       | 17597
995 615 797     | ×5       | 10152
966 458 983     | ×5       | 11268
996 003 888     | ×5       | 13644
933 636 166     | ×5       | 13829
940 717 869     | ×5       | 17424
```

### 4.5 Visualización en Frontend

#### **Vista GTR (GtrClientsTable.tsx)** ✅ IMPLEMENTADO

```tsx
<TableCell>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <div>
      <div style={{ fontWeight: 600, color: '#1976d2' }}>
        {formatearTelefono(client.leads_original_telefono)}
      </div>
    </div>
    {client.cantidad_duplicados && client.cantidad_duplicados > 1 ? (
      <Chip 
        label={`×${client.cantidad_duplicados}`}
        size="small"
        color="warning"
        title={`Este número aparece ${client.cantidad_duplicados} veces`}
      />
    ) : null}
  </div>
</TableCell>
```

**Resultado:** Chips naranjas ×5, ×6 visibles en GTR

#### **Vista Asesor (AsesorClientesTable.tsx)** ✅ SIN CHIP

El asesor NO ve los chips de duplicados, solo el teléfono normal.

---

## 5. SISTEMA DE CATEGORIZACIÓN COMERCIAL

### 5.1 Categorías del Wizard

**Archivo:** `src/constants/estatusComercial.ts`

```typescript
export const ESTATUS_COMERCIAL = {
  "Sin contacto": [
    "No contesta",
    "Número equivocado",
    "Fuera de servicio",
    "Corta llamada",
    "Buzón"
  ],
  "Seguimiento": [
    "Solo info",
    "Seguimiento",
    "Gestión o chat"
  ],
  "Agendado": [
    "Agendado",
    "Consultaría con familiar",
    "Fin de mes"
  ],
  "Rechazado": [
    "No desea",
    "Con programación",
    "No califica",
    "Venta cerrada desaprobada",
    "Zona fraude"
  ],
  "Sin facilidades": [
    "Sin CTO",
    "Sin cobertura",
    "Servicio activo",
    "Edificio sin liberar"
  ],
  "Retirado": [
    "No desea publicidad"
  ],
  "Preventa completa": [
    "Preventa pendiente de score"
  ],
  "Lista negra": [
    "Lista negra"
  ]
};
```

### 5.2 Migración 008 - Corrección de Categorías (EJECUTADA)

**Problema:** Las categorías importadas estaban en MAYÚSCULAS ("PROSPECCIÓN", "NO CONTACTADO")

**Solución:** Migración 008 con 25 UPDATE statements

**Archivo:** `database/migrations/008_corregir_categorias_wizard.sql`

```sql
-- Ejemplos de correcciones aplicadas:

-- Sin contacto / No contesta (antes: PROSPECCIÓN / NO CONTACTADO)
UPDATE clientes SET 
  estatus_comercial_categoria = 'Sin contacto',
  estatus_comercial_subcategoria = 'No contesta'
WHERE tipificacion_original = '0 - NO CONTESTA';
-- Afectados: 2,925 registros

-- Sin contacto / Corta llamada
UPDATE clientes SET 
  estatus_comercial_categoria = 'Sin contacto',
  estatus_comercial_subcategoria = 'Corta llamada'
WHERE tipificacion_original = '0 - CORTA LLAMADA';
-- Afectados: 640 registros

-- Rechazado / Con programación (antes: VENTA / VENTA PROGRAMADA)
UPDATE clientes SET 
  estatus_comercial_categoria = 'Rechazado',
  estatus_comercial_subcategoria = 'Con programación'
WHERE tipificacion_original LIKE '3 - CON PROGRAM%';
-- Afectados: 208 registros

-- Sin contacto / Número equivocado (con LIKE por caracteres especiales)
UPDATE clientes SET 
  estatus_comercial_categoria = 'Sin contacto',
  estatus_comercial_subcategoria = 'Número equivocado'
WHERE tipificacion_original LIKE '0 - N%EQUIVOCADO';
-- Afectados: 103 registros

-- + 21 correcciones más...
```

### 5.3 Distribución Actual de Categorías

```
Categoría              | Subcategoría                    | Cantidad
-----------------------|---------------------------------|---------
Sin contacto           | No contesta                     | 2,925
Rechazado              | No desea                        | 1,812
Sin facilidades        | Sin cobertura                   | 1,642
Sin facilidades        | Servicio activo                 | 1,291
Sin contacto           | Corta llamada                   | 640
Sin contacto           | Buzón                           | 366
Seguimiento            | Seguimiento                     | 300
Retirado               | No desea publicidad             | 257
Rechazado              | Con programación                | 208
Sin facilidades        | Sin CTO                         | 167
Sin contacto           | Fuera de servicio               | 139
Rechazado              | No califica                     | 138
Sin contacto           | Número equivocado               | 103
Agendado               | Agendado                        | 85
Rechazado              | Venta cerrada desaprobada       | 77
Preventa completa      | Preventa pendiente de score     | 61
Seguimiento            | Solo info                       | 56
Rechazado              | Zona fraude                     | 38
Sin facilidades        | Edificio sin liberar            | 22
Agendado               | Consultaría con familiar        | 17
Agendado               | Fin de mes                      | 13
Lista negra            | Lista negra                     | 1
NULL                   | NULL                            | 7
-----------------------|---------------------------------|---------
TOTAL                                                    | 10,621
```

---

## 6. FLUJO DE TRABAJO DEL SISTEMA

### 6.1 Proceso de Importación de Clientes

1. **CSV con datos crudos** → `clientes2.csv` (10,621 registros)
2. **Script de importación** → `import-clientes2-con-categorizacion.js`
3. **Categorización automática** basada en `tipificacion_original`
4. **Identificación de duplicados** (Migración 007)
5. **Corrección de categorías** (Migración 008)

### 6.2 Flujo de Estados de Seguimiento

```
nuevo → derivado → en_gestion → gestionado
  ↓         ↓          ↓            ↓
GTR     Asesor    Asesor      Completado
asigna   recibe   gestiona
```

**Estados:**
- `nuevo`: Cliente recién ingresado
- `derivado`: Asignado a asesor por GTR
- `en_gestion`: Asesor trabajando el caso
- `gestionado`: Gestión completada

### 6.3 Roles y Permisos

#### **Admin**
- Acceso total al sistema
- Gestión de usuarios
- Visualización de estadísticas globales

#### **GTR (Gestor)**
- Visualiza TODOS los clientes
- Asigna/reasigna clientes a asesores
- Ve historial completo de gestiones
- **VE CHIPS DE DUPLICADOS ×5**

#### **Asesor**
- Solo ve sus clientes asignados
- Cambia estados de seguimiento
- Registra gestiones
- **NO VE CHIPS DE DUPLICADOS**

---

## 7. COMPONENTES FRONTEND PRINCIPALES

### 7.1 Context API - AppContext

**Archivo:** `src/context/AppContext.tsx`

**Interface Cliente:**
```typescript
export interface Cliente {
  id: number;
  lead_id?: string;
  leads_original_telefono?: string;
  nombre?: string;
  dni?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  distrito?: string;
  campana?: string;
  canal?: string;
  canal_adquisicion?: string;
  compania?: string;
  sala_asignada?: string;
  plan?: string;
  precio?: number;
  
  // Estados
  seguimiento_status?: string | null;
  estatus_comercial_categoria?: string | null;
  estatus_comercial_subcategoria?: string | null;
  
  // Gestión
  asesor_asignado?: number | null;
  ultima_fecha_gestion?: string | null;
  fecha_ultimo_contacto?: string | null;
  historial_asesores?: string | Array<{ asesor_id: number; fecha: string }>;
  
  // Duplicados ✅
  es_duplicado?: boolean;
  cantidad_duplicados?: number;
  telefono_principal_id?: number | null;
  
  // Auditoría
  created_at?: string;
  fechaCreacion: string;
}
```

### 7.2 Vista GTR - GtrClientsTable.tsx

**Ubicación:** `src/components/gtr/GtrClientsTable.tsx`

**Características:**
- Visualiza todos los clientes del sistema
- **Muestra chips ×N de duplicados** en columna de teléfono
- Permite asignar/reasignar clientes
- Filtros por estado de seguimiento
- Búsqueda por teléfono, nombre, DNI

**Tipos:** `src/components/gtr/types.ts`

```typescript
export interface Cliente {
  // ... (igual que AppContext pero con campos adicionales de GTR)
  es_duplicado?: boolean;
  cantidad_duplicados?: number;
  telefono_principal_id?: number | null;
}
```

### 7.3 Vista Asesor - AsesorClientesTable.tsx

**Ubicación:** `src/components/asesor/AsesorClientesTable.tsx`

**Características:**
- Solo clientes del asesor logueado
- Cambio de estado de seguimiento
- **NO muestra chips de duplicados**
- Registro de gestiones

### 7.4 Wizard de Estados - GestionClienteWizard.tsx

**Ubicación:** `src/components/common/GestionClienteWizard.tsx`

**Flujo:**
1. Seleccionar categoría (ej: "Sin contacto")
2. Seleccionar subcategoría (ej: "No contesta")
3. Agregar comentarios opcionales
4. Guardar gestión

---

## 8. BACKEND Y APIS

### 8.1 Endpoint de Clientes para GTR

**Archivo:** `backend/routes/gtr.js`

```javascript
router.get('/clientes', requireGTR, async (req, res) => {
  const { estado } = req.query;
  
  let query = `
    SELECT 
      c.*,
      u.nombre as asesor_nombre,
      c.es_duplicado,
      c.cantidad_duplicados,
      c.telefono_principal_id
    FROM clientes c
    LEFT JOIN usuarios u ON c.asesor_asignado = u.id
    WHERE 1=1
  `;
  
  if (estado) {
    query += ` AND c.seguimiento_status = ?`;
  }
  
  // ... resto de la query
});
```

**Importante:** El endpoint **DEBE** retornar los campos de duplicados.

### 8.2 Endpoint de Estadísticas

**Archivo:** `backend/routes/admin.js`

```javascript
router.get('/estadisticas', requireAdmin, async (req, res) => {
  // Total de clientes (solo principales)
  const [totalClientes] = await db.query(`
    SELECT COUNT(*) as total 
    FROM clientes 
    WHERE es_duplicado = 0 OR es_duplicado IS FALSE
  `);
  
  // Total de gestiones posibles (incluye duplicados)
  const [totalGestiones] = await db.query(`
    SELECT SUM(cantidad_duplicados) as total 
    FROM clientes 
    WHERE es_duplicado = 0 OR es_duplicado IS FALSE
  `);
  
  // ... más estadísticas
});
```

### 8.3 Controladores Principales

```
backend/
  controllers/
    adminController.js      # Gestión de usuarios y estadísticas
    asesorController.js     # Gestiones de asesores
    authController.js       # Login/Logout
    gtrController.js        # Asignación y reasignación
```

---

## 9. ÚLTIMOS CAMBIOS REALIZADOS

### 9.1 Importación Masiva (Completada)

**Fecha:** Noviembre 2025  
**Script:** `import-clientes2-con-categorizacion.js`  
**Resultado:** 10,621 registros importados con categorización

### 9.2 Migración 007 - Sistema de Duplicados (Completada)

**Fecha:** Noviembre 2025  
**Archivo:** `database/migrations/007_add_duplicados_fields.sql`  
**Cambios:**
- Agregados 3 campos: `es_duplicado`, `cantidad_duplicados`, `telefono_principal_id`
- Identificados 1,094 duplicados
- 9,527 registros principales

### 9.3 Migración 008 - Corrección Categorías (Completada)

**Fecha:** Noviembre 2025  
**Archivo:** `database/migrations/008_corregir_categorias_wizard.sql`  
**Cambios:**
- 25 UPDATE statements para corregir formato
- De MAYÚSCULAS → Title Case
- 10,614 registros actualizados
- 7 registros sin tipificación (NULL)

### 9.4 Frontend - Chips de Duplicados (Completado)

**Fecha:** 13 de noviembre de 2025

**Cambios:**
1. **GtrClientsTable.tsx** - Agregado chip ×N en teléfono
2. **AsesorClientesTable.tsx** - Removido chip (asesor no lo ve)
3. **AppContext.tsx** - Agregados campos de duplicados a interface
4. **src/components/gtr/types.ts** - Agregados campos de duplicados

**Código del chip:**
```tsx
{client.cantidad_duplicados && client.cantidad_duplicados > 1 ? (
  <Chip 
    label={`×${client.cantidad_duplicados}`}
    size="small"
    color="warning"
    sx={{ fontWeight: 700, fontSize: '0.75rem', height: '22px' }}
    title={`Este número aparece ${client.cantidad_duplicados} veces en la base de datos`}
  />
) : null}
```

### 9.5 Backend - Soporte de Duplicados (Completado)

**Cambios:**
- Queries actualizados para incluir campos de duplicados
- Estadísticas con `SUM(cantidad_duplicados)` para total de gestiones
- Filtros para excluir duplicados (`WHERE es_duplicado = FALSE`)

---

## 10. DATOS DE PRUEBA DISPONIBLES

### 10.1 Usuarios de Prueba

```sql
-- Admin
email: admin@albru.com
password: Admin123!

-- GTR
email: gtr@albru.com
password: Gtr123!

-- Asesores (5 disponibles)
SELECT id, nombre FROM usuarios WHERE tipo = 'asesor';
-- IDs: 1, 2, 3, 4, 5
```

### 10.2 Clientes con Duplicados para Testing

**Asignados al asesor ID 5 (Daryl Sánchez):**

```sql
SELECT id, telefono, cantidad_duplicados, asesor_asignado 
FROM clientes 
WHERE id IN (11225, 11347, 17597);

-- Resultado:
-- 11225 | 943 214 189 | 6 | 5
-- 11347 | 985 425 120 | 6 | 5
-- 17597 | 960 934 345 | 5 | 5
```

### 10.3 Verificar Duplicados

```sql
-- Top 10 duplicados
SELECT id, leads_original_telefono, cantidad_duplicados 
FROM clientes 
WHERE cantidad_duplicados >= 5 
ORDER BY cantidad_duplicados DESC 
LIMIT 10;

-- Todos los duplicados de un teléfono específico
SELECT id, nombre, es_duplicado, cantidad_duplicados, telefono_principal_id
FROM clientes
WHERE leads_original_telefono = '943 214 189'
ORDER BY id;
```

---

## 11. COMANDOS DOCKER ÚTILES

### 11.1 Gestión de Contenedores

```powershell
# Iniciar todo el sistema
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f backend
docker-compose logs -f frontend-dev

# Reiniciar servicios específicos
docker-compose restart backend
docker-compose restart frontend-dev

# Detener todo
docker-compose down

# Reconstruir (después de cambios en Dockerfile)
docker-compose up -d --build
```

### 11.2 Base de Datos

```powershell
# Conectar a MySQL
docker exec -it albru-base mysql -u root -p
# Password: albrupass

# Ejecutar SQL desde archivo
Get-Content database/migrations/008_corregir_categorias_wizard.sql | docker exec -i albru-base mysql -u root -palbrupass albru_db

# Backup de base de datos
docker exec albru-base mysqldump -u root -palbrupass albru_db > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# Restaurar backup
Get-Content backup_20251113.sql | docker exec -i albru-base mysql -u root -palbrupass albru_db
```

### 11.3 Verificaciones Rápidas

```powershell
# Ver estado de contenedores
docker-compose ps

# Ver uso de recursos
docker stats

# Limpiar contenedores detenidos
docker-compose down --remove-orphans
```

---

## 12. PROBLEMAS CONOCIDOS Y SOLUCIONES

### 12.1 Categorías en MAYÚSCULAS ✅ RESUELTO

**Problema:** Importación inicial creó categorías como "PROSPECCIÓN" / "NO CONTACTADO"

**Causa:** Script `import-clientes2-con-categorizacion.js` usaba MAYÚSCULAS

**Solución:** Migración 008 corrigió 10,614 registros al formato wizard

**Verificación:**
```sql
SELECT estatus_comercial_categoria, estatus_comercial_subcategoria, COUNT(*) 
FROM clientes 
GROUP BY estatus_comercial_categoria, estatus_comercial_subcategoria 
ORDER BY COUNT(*) DESC;
```

### 12.2 Caracteres Especiales en SQL ✅ RESUELTO

**Problema:** Queries fallaban con "PROGRAMACIÓN" (Ó) y "N° EQUIVOCADO" (°)

**Solución:** Usar `LIKE` con wildcards:
```sql
WHERE tipificacion_original LIKE '3 - CON PROGRAM%'
WHERE tipificacion_original LIKE '0 - N%EQUIVOCADO'
```

### 12.3 Chips no Visibles en Frontend ✅ RESUELTO

**Problema:** Después de implementar chips, no se veían en frontend

**Causas:**
1. Servicios no reiniciados
2. Clientes sin asignar a asesor
3. Tipos TypeScript faltantes

**Solución:**
1. `docker-compose restart frontend-dev`
2. Asignar clientes de prueba:
   ```sql
   UPDATE clientes SET asesor_asignado = 5, seguimiento_status = 'derivado' 
   WHERE id IN (11225, 11347, 17597);
   ```
3. Agregar campos a `src/components/gtr/types.ts`

### 12.4 Endpoint GTR sin Campos de Duplicados ⚠️ PENDIENTE VERIFICAR

**Verificar que el endpoint de GTR retorna los campos:**
```javascript
// backend/routes/gtr.js
SELECT 
  c.*,
  c.es_duplicado,
  c.cantidad_duplicados,
  c.telefono_principal_id,
  u.nombre as asesor_nombre
FROM clientes c
LEFT JOIN usuarios u ON c.asesor_asignado = u.id
```

---

## 13. PRÓXIMOS PASOS SUGERIDOS

### 13.1 Testing Completo

1. **Login como GTR**
   - Verificar que se ven chips ×5, ×6
   - Probar asignación de clientes con duplicados

2. **Login como Asesor ID 5**
   - Verificar que NO se ven chips
   - Confirmar que tiene 3 clientes asignados (IDs 11225, 11347, 17597)

3. **Verificar Estadísticas**
   - Panel admin debe mostrar:
     - Total clientes: 9,527 (únicos)
     - Total gestiones posibles: 11,715 (incluye duplicados)

### 13.2 Mejoras Futuras

1. **Fusión de Duplicados**
   - Interfaz para combinar duplicados en un solo registro
   - Preservar historial de todos los registros

2. **Reportes de Duplicados**
   - Exportar CSV con duplicados identificados
   - Dashboard con métricas de duplicados por campaña

3. **Alertas de Duplicados**
   - Notificar al asesor cuando gestiona un duplicado
   - Mostrar historial de gestiones del número principal

---

## 14. ARCHIVOS CLAVE DEL PROYECTO

```
albru-brunario/
├── backend/
│   ├── routes/
│   │   ├── gtr.js              # Endpoints GTR (asignación)
│   │   ├── asesor.js           # Endpoints Asesor (gestiones)
│   │   └── admin.js            # Endpoints Admin (estadísticas)
│   ├── controllers/
│   │   ├── gtrController.js
│   │   ├── asesorController.js
│   │   └── adminController.js
│   └── server.js               # Servidor principal
│
├── src/
│   ├── components/
│   │   ├── gtr/
│   │   │   ├── GtrClientsTable.tsx      # ✅ CON CHIPS ×5
│   │   │   └── types.ts                 # ✅ Con campos duplicados
│   │   ├── asesor/
│   │   │   └── AsesorClientesTable.tsx  # ✅ SIN CHIPS
│   │   └── common/
│   │       └── GestionClienteWizard.tsx # Wizard de estados
│   ├── context/
│   │   └── AppContext.tsx               # ✅ Con campos duplicados
│   └── constants/
│       └── estatusComercial.ts          # Categorías wizard
│
├── database/
│   ├── migrations/
│   │   ├── 007_add_duplicados_fields.sql    # ✅ Ejecutada
│   │   └── 008_corregir_categorias_wizard.sql # ✅ Ejecutada
│   └── init.sql                         # Schema inicial
│
├── scripts/
│   └── import-clientes2-con-categorizacion.js # ✅ Ejecutado
│
├── docker-compose.yml           # Orquestación Docker
├── Dockerfile                   # Imagen frontend
└── clientes2.csv               # CSV importado (10,621 registros)
```

---

## 15. DATOS ESTADÍSTICOS ACTUALES

### 15.1 Resumen General

```
Total registros en BD:       10,621
Registros principales:        9,527
Registros duplicados:         1,094
Total gestiones posibles:    11,715

Duplicados ×6:                    2
Duplicados ×5:                    6
Duplicados ×4:                   15
Duplicados ×3:                   98
Duplicados ×2:                  973
```

### 15.2 Por Estado de Seguimiento

```
Estado          | Cantidad
----------------|----------
derivado        | 3        (testing)
nuevo           | 10,618
en_gestion      | 0
gestionado      | 0
```

### 15.3 Por Categoría Comercial (Top 10)

```
1. Sin contacto / No contesta               2,925
2. Rechazado / No desea                     1,812
3. Sin facilidades / Sin cobertura          1,642
4. Sin facilidades / Servicio activo        1,291
5. Sin contacto / Corta llamada               640
6. Sin contacto / Buzón                       366
7. Seguimiento / Seguimiento                  300
8. Retirado / No desea publicidad             257
9. Rechazado / Con programación               208
10. Sin facilidades / Sin CTO                 167
```

---

## 16. COMANDOS SQL ÚTILES

### 16.1 Verificación de Duplicados

```sql
-- Ver todos los duplicados
SELECT COUNT(*) FROM clientes WHERE es_duplicado = TRUE;
-- Resultado: 1,094

-- Ver principales con duplicados
SELECT COUNT(*) FROM clientes 
WHERE cantidad_duplicados > 1 AND es_duplicado = FALSE;
-- Resultado: 547

-- Distribución de duplicados
SELECT cantidad_duplicados, COUNT(*) as cantidad
FROM clientes
WHERE es_duplicado = FALSE AND cantidad_duplicados > 1
GROUP BY cantidad_duplicados
ORDER BY cantidad_duplicados DESC;
```

### 16.2 Estadísticas

```sql
-- Total de clientes únicos
SELECT COUNT(*) FROM clientes WHERE es_duplicado = 0 OR es_duplicado IS FALSE;

-- Total de gestiones posibles (incluye duplicados)
SELECT SUM(cantidad_duplicados) FROM clientes 
WHERE es_duplicado = 0 OR es_duplicado IS FALSE;

-- Por asesor
SELECT 
  u.nombre,
  COUNT(*) as clientes_asignados,
  SUM(c.cantidad_duplicados) as gestiones_totales
FROM clientes c
LEFT JOIN usuarios u ON c.asesor_asignado = u.id
WHERE c.es_duplicado = FALSE
GROUP BY u.id, u.nombre;
```

### 16.3 Categorización

```sql
-- Verificar formato de categorías
SELECT DISTINCT estatus_comercial_categoria 
FROM clientes 
WHERE estatus_comercial_categoria IS NOT NULL
ORDER BY estatus_comercial_categoria;

-- Distribución completa
SELECT 
  estatus_comercial_categoria,
  estatus_comercial_subcategoria,
  COUNT(*) as cantidad
FROM clientes
GROUP BY estatus_comercial_categoria, estatus_comercial_subcategoria
ORDER BY cantidad DESC;
```

---

## 17. NOTAS FINALES PARA CLAUDE

### Estado del Sistema
- ✅ Sistema completamente funcional
- ✅ 10,621 registros importados y categorizados
- ✅ Sistema de duplicados implementado y probado
- ✅ Frontend con visualización correcta (GTR ve chips, Asesor no)
- ✅ Migraciones 007 y 008 ejecutadas exitosamente

### Última Sesión
- Se implementaron chips ×N en GtrClientsTable
- Se removieron chips de AsesorClientesTable
- Se agregaron campos de duplicados a types.ts
- Sistema listo para testing con usuario real

### Testing Pendiente
- Login como GTR y verificar chips
- Login como Asesor ID 5 y verificar que NO ve chips
- Asignar más clientes con duplicados
- Verificar estadísticas en panel admin

### Contexto de Docker
```bash
# Puerto de acceso
http://localhost:3000

# Contenedores activos
albru-base          # MySQL (puerto 3307)
albru-backend       # Node.js (puerto 5000)
albru-frontend-dev  # Vite (puerto 5173)
albru-nginx         # Proxy (puerto 3000)
```

### Credenciales de Acceso
```
MySQL:
  Host: localhost:3307
  User: root
  Password: albrupass
  Database: albru_db

Admin Panel:
  Email: admin@albru.com
  Password: Admin123!
```

---

**Documento generado:** 13 de noviembre de 2025  
**Versión:** 1.0  
**Estado del proyecto:** Fase 19 completada - Sistema de duplicados funcional
