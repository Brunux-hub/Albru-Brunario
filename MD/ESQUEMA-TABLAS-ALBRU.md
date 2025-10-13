# 📊 ESQUEMA DE TABLAS - PROYECTO ALBRU

## 🎯 RESUMEN EJECUTIVO
**Total de Tablas**: 5 tablas principales
**Base de Datos**: MySQL 8.0 con charset utf8mb4
**Estado**: Listas para producción (sin datos ficticios)

---

## 📋 TABLAS PRINCIPALES

### 1. 👥 **ASESORES** 
**Propósito**: Gestión de empleados y roles del sistema

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | INT AUTO_INCREMENT | ID único del asesor | PRIMARY KEY |
| `nombre` | VARCHAR(100) | Nombre completo | NOT NULL |
| `email` | VARCHAR(100) | Correo electrónico | UNIQUE, NOT NULL |
| `telefono` | VARCHAR(20) | Número de teléfono | - |
| `tipo` | ENUM | Rol del empleado | asesor, gtr, validador, supervisor |
| `clientes_asignados` | INT | Cantidad de clientes | DEFAULT 0 |
| `estado` | ENUM | Estado del empleado | activo, inactivo, suspendido |
| `created_at` | TIMESTAMP | Fecha de creación | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Última actualización | ON UPDATE CURRENT_TIMESTAMP |

**Índices**: `tipo`, `estado`, `email`

---

### 2. 🏢 **CLIENTES**
**Propósito**: Gestión de leads y clientes del negocio

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | INT AUTO_INCREMENT | ID único del cliente | PRIMARY KEY |
| `lead_id` | VARCHAR(50) | ID externo del lead | UNIQUE |
| `nombre` | VARCHAR(100) | Nombre completo | NOT NULL |
| `telefono` | VARCHAR(20) | Número de teléfono | - |
| `dni` | VARCHAR(20) | Documento de identidad | - |
| `correo_electronico` | VARCHAR(100) | Email del cliente | - |
| `direccion` | TEXT | Dirección completa | - |
| `distrito` | VARCHAR(50) | Distrito de residencia | - |
| `plan_seleccionado` | VARCHAR(100) | Plan de internet elegido | - |
| `precio_final` | DECIMAL(10,2) | Precio acordado | - |
| `estado_cliente` | ENUM | Estado en el proceso | nuevo, contactado, interesado, etc. |
| `asesor_asignado` | INT | ID del asesor responsable | FK → asesores(id) |
| `observaciones_asesor` | TEXT | Comentarios internos | - |
| `fecha_asignacion` | TIMESTAMP | Cuándo se asignó | DEFAULT CURRENT_TIMESTAMP |
| `fecha_cita` | TIMESTAMP | Fecha de cita programada | NULL |
| `fecha_venta` | TIMESTAMP | Fecha de cierre | NULL |
| `created_at` | TIMESTAMP | Fecha de creación | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Última actualización | ON UPDATE CURRENT_TIMESTAMP |

**Índices**: `estado_cliente`, `asesor_asignado`, `lead_id`, `dni`, `fecha_asignacion`

---

### 3. 🔐 **USUARIOS_SISTEMA**
**Propósito**: Autenticación y control de acceso

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | INT AUTO_INCREMENT | ID único del usuario | PRIMARY KEY |
| `asesor_id` | INT | Vinculación con asesor | FK → asesores(id) |
| `username` | VARCHAR(50) | Nombre de usuario | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | Contraseña hasheada (bcrypt) | NOT NULL |
| `role` | ENUM | Rol en el sistema | admin, gtr, asesor, supervisor, validaciones |
| `estado_acceso` | ENUM | Estado de la cuenta | pendiente, activo, suspendido |
| `fecha_creacion` | TIMESTAMP | Cuándo se creó | DEFAULT CURRENT_TIMESTAMP |
| `ultimo_login` | TIMESTAMP | Último acceso | NULL |
| `creado_por` | INT | Quién lo creó | FK → usuarios_sistema(id) |

**Índices**: `role`, `estado_acceso`, `ultimo_login`

---

### 4. 📝 **HISTORIAL_CLIENTE**
**Propósito**: Auditoría y seguimiento de cambios

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | INT AUTO_INCREMENT | ID único del registro | PRIMARY KEY |
| `cliente_id` | INT | Cliente modificado | FK → clientes(id), NOT NULL |
| `usuario_id` | INT | Usuario que hizo el cambio | FK → usuarios_sistema(id) |
| `accion` | VARCHAR(100) | Qué se hizo | NOT NULL |
| `estado_anterior` | VARCHAR(50) | Estado previo | - |
| `estado_nuevo` | VARCHAR(50) | Estado nuevo | - |
| `comentarios` | TEXT | Observaciones | - |
| `fecha_accion` | TIMESTAMP | Cuándo ocurrió | DEFAULT CURRENT_TIMESTAMP |

---

### 5. ✅ **VALIDACIONES**
**Propósito**: Proceso de validación de instalaciones

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | INT AUTO_INCREMENT | ID único de validación | PRIMARY KEY |
| `cliente_id` | INT | Cliente a validar | FK → clientes(id) |
| `validador_id` | INT | Validador asignado | FK → asesores(id) |
| `status` | VARCHAR(20) | Estado de validación | pendiente, en_revision, validado, rechazado |
| `fecha_programacion` | TIMESTAMP | Fecha programada | NULL |
| `fecha_instalacion` | DATE | Fecha de instalación | - |
| `resultado` | VARCHAR(20) | Resultado final | - |
| `motivo_rechazo` | TEXT | Razón del rechazo | - |
| `comentario_validador` | TEXT | Observaciones | - |
| `created_at` | TIMESTAMP | Fecha de creación | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Última actualización | ON UPDATE CURRENT_TIMESTAMP |

**Índices**: `status`, `cliente_id`, `validador_id`, `fecha_programacion`

---

## 🔗 RELACIONES ENTRE TABLAS

```
usuarios_sistema ─┐
                  ├── asesor_id ──→ asesores.id
                  └── creado_por ──→ usuarios_sistema.id

clientes ──────── asesor_asignado ──→ asesores.id

historial_cliente ─┐
                   ├── cliente_id ──→ clientes.id
                   └── usuario_id ──→ usuarios_sistema.id

validaciones ─────┐
                  ├── cliente_id ──→ clientes.id
                  └── validador_id ──→ asesores.id
```

---

## 📊 COMPONENTES QUE USAN CADA TABLA

| Tabla | Componentes Frontend | Endpoints Backend |
|-------|---------------------|-------------------|
| **asesores** | GtrDashboard, AsesorPanel | `/api/asesores` |
| **clientes** | AsesorClientesTable, GtrClientsTable | `/api/clientes` |
| **usuarios_sistema** | LoginPage, Todas (auth) | `/api/auth/login` |
| **historial_cliente** | ClientHistoryDialog | `/api/historial` |
| **validaciones** | ValidacionesDashboard, ValidacionesTable | `/api/validaciones` |

---

## 🚀 DATOS INICIALES

### Usuario Administrador
```sql
username: admin
password: admin123
role: admin
estado: activo
```

### Tablas Vacías (Listas para Datos Reales)
- ✅ `asesores` - Para empleados reales
- ✅ `clientes` - Para leads reales del negocio
- ✅ `historial_cliente` - Se llena automáticamente
- ✅ `validaciones` - Para procesos reales de validación

---

## 🔧 CONFIGURACIÓN DE PRODUCCIÓN

### Comando de Instalación
```bash
mysql -u root -p < src/database/albru_produccion_limpia.sql
```

### Verificación
```sql
USE albru;
SHOW TABLES;
SELECT COUNT(*) FROM usuarios_sistema; -- Debe ser 1 (admin)
SELECT COUNT(*) FROM asesores;         -- Debe ser 0
SELECT COUNT(*) FROM clientes;         -- Debe ser 0
SELECT COUNT(*) FROM validaciones;     -- Debe ser 0
```

---

## ⚡ OPTIMIZACIONES INCLUIDAS

### Índices de Performance
- **Búsquedas por estado**: Todos los campos `estado` indexados
- **Relaciones FK**: Todas las claves foráneas indexadas  
- **Fechas**: Campos de fecha principales indexados
- **Búsquedas únicas**: email, username, lead_id, dni

### Restricciones de Integridad
- **Foreign Keys**: Mantienen consistencia de datos
- **CHECK Constraints**: Validan valores permitidos en ENUMs
- **UNIQUE**: Previenen duplicados en campos clave

**🎉 TODAS LAS TABLAS ESTÁN LISTAS PARA RECIBIR DATOS REALES DE PRODUCCIÓN**