# Documentación para IAs - Proyecto Albru-Brunario

## 📋 Índice
1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Base de Datos](#base-de-datos)
4. [Backend (Node.js)](#backend-nodejs)
5. [Frontend (React + Vite)](#frontend-react--vite)
6. [Docker y Servicios](#docker-y-servicios)
7. [Scripts de Administración](#scripts-de-administración)
8. [Tareas Comunes](#tareas-comunes)
9. [Problemas Conocidos y Soluciones](#problemas-conocidos-y-soluciones)
10. [Historial de Cambios Recientes](#historial-de-cambios-recientes)

---

## Descripción del Proyecto

**Albru-Brunario** es un sistema CRM (Customer Relationship Management) para gestión de leads y asesores comerciales de telecomunicaciones. El sistema permite:

- **GTR (Gestión de Tráfico)**: Administrar y asignar leads a asesores
- **Asesores**: Gestionar sus clientes asignados mediante un wizard de ventas
- **Validadores**: Validar información de clientes
- **Administradores**: Gestión completa del sistema

---

## Arquitectura del Sistema

### Tecnologías Principales
- **Frontend**: React 18 + TypeScript + Vite 7.1.7 + Material-UI 5
- **Backend**: Node.js + Express + Socket.io (WebSocket)
- **Base de Datos**: MySQL 8.0 (Docker container: `albru-base`)
- **Contenedores**: Docker + docker-compose
- **Web Server**: nginx (puerto 5173 para desarrollo)

### Estructura de Carpetas
```
Albru-Brunario/
├── backend/               # API Node.js + Express
│   ├── server.js         # Servidor principal
│   ├── config/           # Configuración de DB
│   ├── controllers/      # Lógica de negocio
│   ├── routes/           # Rutas de API
│   ├── services/         # Servicios (WebSocket, etc)
│   └── scripts/          # Scripts Python de administración
├── src/                  # Frontend React
│   ├── components/       # Componentes reutilizables
│   ├── pages/           # Páginas principales
│   ├── context/         # Context API
│   └── services/        # Servicios frontend
├── public/              # Archivos estáticos
├── scripts/             # Scripts PowerShell de despliegue
└── docker-compose.yml   # Configuración de contenedores
```

---

## Base de Datos

### Información de Conexión
- **Host**: `localhost:3308` (mapeado a puerto 3306 interno del contenedor)
- **Container**: `albru-base`
- **Database**: `albru`
- **Usuario**: `root`
- **Password**: `Prueba`

### Tablas Principales

#### `usuarios`
- **Propósito**: Información de usuarios del sistema (asesores, GTR, admin, etc)
- **Columnas clave**:
  - `id` (INT, PK)
  - `nombre` (VARCHAR)
  - `email` (VARCHAR)
  - `username` (VARCHAR)
  - `password` (VARCHAR, bcrypt hash)
  - `telefono` (INT)
  - `tipo` (ENUM: 'admin', 'gtr', 'asesor', 'supervisor', 'validador')
  - `estado` (ENUM: 'activo', 'inactivo')
  - `created_at`, `updated_at` (TIMESTAMP)

#### `asesores`
- **Propósito**: Información adicional de asesores (relación 1:1 con usuarios)
- **Columnas clave**:
  - `id` (INT, PK)
  - `usuario_id` (INT, FK → usuarios.id)
  - `meta_mensual` (DECIMAL)
  - `comision_porcentaje` (DECIMAL)
  - `created_at`, `updated_at` (TIMESTAMP)

#### `clientes`
- **Propósito**: Leads/clientes del sistema
- **Columnas clave**:
  - `id` (INT, PK)
  - `created_at` (TIMESTAMP) - Fecha de ingreso al sistema
  - **`fecha_asignacion`** (TIMESTAMP) - **Fecha en que se asignó el lead a un asesor** ⚠️
  - `asesor_asignado` (INT, FK → usuarios.id)
  - `seguimiento_status` (ENUM: 'nuevo', 'en_gestion', 'derivado', 'gestionado', 'no_gestionado')
  - `leads_original_telefono` (VARCHAR)
  - `telefono` (VARCHAR)
  - `nombre` (VARCHAR)
  - `dni` (VARCHAR)
  - `direccion` (TEXT)
  - `distrito` (VARCHAR)
  - `departamento` (VARCHAR)
  - `campana` (VARCHAR)
  - `canal_adquisicion` (VARCHAR)
  - `sala_asignada` (VARCHAR)
  - `compania` (VARCHAR)
  - `estatus_comercial_categoria` (VARCHAR)
  - `estatus_comercial_subcategoria` (VARCHAR)
  - `wizard_completado` (BOOLEAN)
  - `wizard_data_json` (JSON) - Datos del wizard de ventas

#### `historial`
- **Propósito**: Registro de acciones sobre clientes
- **Columnas clave**:
  - `id` (INT, PK)
  - `cliente_id` (INT, FK → clientes.id)
  - `usuario_id` (INT, FK → usuarios.id)
  - `accion` (VARCHAR) - Ejemplo: 'reasignacion', 'wizard_completado', 'moved_to_gtr'
  - `descripcion` (TEXT)
  - `fecha_accion` (TIMESTAMP)
  - `created_at` (TIMESTAMP)

---

## Backend (Node.js)

### Servidor Principal: `backend/server.js`
Puerto: **3001**

### Endpoints Importantes

#### Clientes
- `GET /api/clientes` - Lista clientes con filtros (fecha, estado, etc)
- `POST /api/clientes` - Crear nuevo cliente
- `PUT /api/clientes/:id` - Actualizar cliente
- `POST /api/clientes/:clienteId/reasignar` - Reasignar cliente a asesor
  - **⚠️ IMPORTANTE**: Este endpoint actualiza `fecha_asignacion = NOW()` cuando se asigna
- `POST /api/clientes/:id/lock` - Bloquear cliente para edición
- `POST /api/clientes/:id/unlock` - Desbloquear cliente
- `POST /api/clientes/:id/heartbeat` - Mantener lock activo

#### Asesores
- `GET /api/asesores` - Lista asesores con estadísticas
- `POST /api/asesores` - Crear nuevo asesor (desde scripts)

#### Historial
- `GET /api/historial` - Obtener historial de gestiones

### WebSocket (Socket.io)
El sistema usa WebSocket para notificaciones en tiempo real:

**Eventos principales**:
- `CLIENT_REASSIGNED` - Cliente reasignado a nuevo asesor
- `CLIENT_LOCKED` - Cliente bloqueado por asesor
- `CLIENT_UNLOCKED` - Cliente desbloqueado
- `CLIENT_UPDATED` - Cliente actualizado
- `CLIENT_OCUPADO` - Cliente marcado como ocupado
- `HISTORIAL_UPDATED` - Nuevo registro en historial

**Implementación**: `backend/services/WebSocketService.js`

---

## Frontend (React + Vite)

### Páginas Principales

#### 1. `GtrDashboard.tsx`
- **Ruta**: `/gtr`
- **Propósito**: Panel GTR para gestión de leads
- **Características**:
  - Lista clientes con paginación (50 por página)
  - Filtros por fecha y estado
  - Reasignación de clientes
  - Zoom 85% en contenido (mejora UX)
  - **Muestra `fecha_asignacion` como "Fecha Asignación"** (línea 326)

#### 2. `AsesorDashboard.tsx`
- **Ruta**: `/asesor`
- **Propósito**: Panel de asesor para gestionar clientes asignados
- **Características**:
  - Wizard de ventas completo (4 pasos)
  - Cierre rápido para categorías específicas
  - Lock de clientes (300 segundos)

#### 3. `AdminDashboard.tsx`
- **Ruta**: `/admin`
- **Propósito**: Panel administrativo
- **Características**:
  - Dashboard general
  - Gestión de asesores
  - Base de datos
  - Finanzas

#### 4. `ValidacionesDashboard.tsx`
- **Ruta**: `/validaciones`
- **Propósito**: Panel de validador
- **Características**:
  - Búsqueda y validación de clientes

### Componentes Clave

#### `GtrClientsTable.tsx`
- Tabla principal de clientes en GTR
- Paginación MUI (siblingCount=2, boundaryCount=2)
- Filtros de búsqueda

#### `ReassignDialog.tsx`
- Dialog para reasignar clientes a asesores
- Envía petición a `/api/clientes/:id/reasignar`

#### Context API: `ClientesContext.tsx`
- Gestión global de estado de clientes
- Sincronización con WebSocket

---

## Docker y Servicios

### Servicios Docker

#### MySQL Container (`albru-base`)
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: albru-base
    ports:
      - "3308:3306"
    environment:
      MYSQL_ROOT_PASSWORD: Prueba
      MYSQL_DATABASE: albru
```

### Comandos Docker Útiles

```powershell
# Levantar servicios
docker-compose up -d

# Ver logs
docker logs albru-base

# Entrar a MySQL
docker exec -it albru-base mysql -uroot -pPrueba albru

# Detener servicios
docker-compose down

# Reiniciar MySQL
docker restart albru-base
```

---

## Scripts de Administración

### Scripts Python (backend/scripts/)

#### `agregar_asesor.py`
**Propósito**: Agregar nuevos asesores al sistema

**Características**:
- Auto-genera email formato: `{inicial_nombre}{apellido_paterno}{inicial_apellido_materno}@albru.pe`
- Ejemplo: "Sebastián Aguirre Fiestas" → `saguirref@albru.pe`
- Normaliza caracteres especiales (á→a, ñ→n)
- Contraseña por defecto: `albru123` (bcrypt hash)
- Crea registros en `usuarios` y `asesores`

**Uso**:
```powershell
# Ejecutar desde backend/
python scripts/agregar_asesor.py

# Ingresar datos cuando se soliciten
# Nombre completo: Sebastián Antonio André Aguirre Fiestas
# DNI: 72048710
```

#### `cambiar_rol.py`
**Propósito**: Cambiar rol de usuario existente

**Características**:
- Roles válidos: admin, gtr, asesor, supervisor, validador
- Auto-crea registro en `asesores` si se cambia a rol 'asesor'
- Soporta búsqueda por: id, username, email, teléfono

**Uso**:
```powershell
# Ejecutar desde backend/
python scripts/cambiar_rol.py

# Opción 1: Listar usuarios
# Opción 2: Cambiar rol
# ID/username/email del usuario: ROXANA
# Nuevo rol: asesor
```

#### `agregar_asesores_faltantes.py`
**Propósito**: Importar múltiples asesores de una lista

### Scripts PowerShell (scripts/)

#### `import_mysql.ps1`
**Propósito**: Importar CSV de clientes a MySQL

**Características**:
- Parsea fechas formato YYYY/MM/DD
- Reemplazo atómico de tabla (RENAME TABLE)
- Validación de duplicados

**Uso**:
```powershell
.\scripts\import_mysql.ps1
```

---

## Tareas Comunes

### 1. Agregar un Asesor
```powershell
cd backend
python scripts/agregar_asesor.py
```

### 2. Cambiar Rol de Usuario
```powershell
cd backend
python scripts/cambiar_rol.py
# Opción: 2 (Cambiar rol)
# Usuario: nombre/email/id
# Nuevo rol: asesor/gtr/admin/validador
```

### 3. Importar CSV de Clientes
```powershell
.\scripts\import_mysql.ps1
# Asegúrate que el CSV esté en el path correcto
```

### 4. Build del Frontend
```powershell
npm run build
# Salida: dist/
# Tiempo promedio: 1m 7s
```

### 5. Levantar Entorno de Desarrollo
```powershell
# Terminal 1: Backend
cd backend
node server.js

# Terminal 2: Frontend
npm run dev
```

### 6. Verificar Datos en MySQL
```powershell
docker exec -it albru-base mysql -uroot -pPrueba albru

# Queries útiles:
SELECT COUNT(*) FROM clientes;
SELECT * FROM usuarios WHERE tipo = 'asesor';
SELECT * FROM asesores;
SELECT id, nombre, email, telefono FROM usuarios WHERE tipo = 'asesor';
```

---

## Problemas Conocidos y Soluciones

### 1. **CSV Import - Formato de Fecha Incorrecto**
**Problema**: CSV usa YYYY/MM/DD pero MySQL espera YYYY-MM-DD

**Solución**: Script `import_mysql.ps1` parsea y convierte automáticamente:
```javascript
const partes = fechaOriginal.split('/');
const fechaFormateada = `${partes[0]}-${partes[1]}-${partes[2]} 00:00:00`;
```

### 2. **Frontend Muestra Solo Algunos Clientes**
**Problema**: Filtro de fecha por defecto (thisMonth) limitaba resultados

**Solución**: Cambiar a `dateRangeType: 'custom'` con fechas vacías:
```typescript
const [dateRangeType, setDateRangeType] = useState<'thisMonth' | 'lastMonth' | 'custom'>('custom');
const [customStartDate, setCustomStartDate] = useState('');
const [customEndDate, setCustomEndDate] = useState('');
```

### 3. **Sidebar Descolocado con Zoom**
**Problema**: Al aplicar zoom 85%, el sidebar se desalineaba

**Solución**: Aplicar zoom solo al contenido, no al contenedor principal:
```tsx
// GtrDashboard.tsx línea 781
<Box sx={{ 
  flex: 1, 
  p: { xs: 2, sm: 3 },
  marginLeft: { xs: 0, md: '220px' },
  minHeight: '100vh',
  width: { xs: '100%', md: 'calc(100% - 220px)' },
  zoom: 0.85  // ← Solo aquí, no en el container padre
}}>
```

### 4. **Duplicados al Agregar Asesores**
**Problema**: Script agregaba asesores sin verificar duplicados

**Solución**: Verificar existencia antes de INSERT:
```python
cursor.execute("SELECT id FROM usuarios WHERE username = %s OR email = %s", (username, email))
if cursor.fetchone():
    print(f"❌ Usuario {username} ya existe")
    return
```

### 5. **Username NULL en Lista de Usuarios**
**Problema**: Algunos usuarios sin username causaban TypeError

**Solución**: Validar NULL antes de usar:
```python
username = u['username'] if u['username'] else '-'
```

### 6. **fecha_asignacion Mostraba Fecha Incorrecta**
**Problema**: Frontend mostraba `created_at` (fecha de ingreso) en lugar de `fecha_asignacion` (fecha de asignación a asesor)

**Solución**: 
- **Backend** (`server.js` línea 240): Agregar `fecha_asignacion = NOW()` en UPDATE de reasignación
- **Frontend** (`GtrDashboard.tsx` línea 326): Priorizar `fecha_asignacion` sobre `created_at`:
```typescript
fecha: new Date(cliente.fecha_asignacion || cliente.created_at || Date.now()).toLocaleDateString('es-ES')
```

---

## Historial de Cambios Recientes

### 2025-01-XX (Últimas sesiones)

1. ✅ **CSV Import Completo**
   - Importados 16,162 registros desde CSV
   - Corregido formato de fechas (YYYY/MM/DD → YYYY-MM-DD)
   - Implementado reemplazo atómico de tabla

2. ✅ **Frontend Fixes**
   - Cambiado filtro de fecha de 'thisMonth' a 'custom' con fechas vacías
   - Aplicado zoom 0.85 solo a áreas de contenido (no sidebars)
   - Implementada paginación MUI con 50 registros/página (324 páginas totales)
   - Eliminados botones "Cargar 500 más"

3. ✅ **Gestión de Usuarios**
   - Agregados 4 asesores nuevos:
     - Sebastián Aguirre (saguirref@albru.pe)
     - Giner Loayza (gloayzag@albru.pe)
     - Cristhian Vasquez (cvasquezs@albru.pe)
     - Roxana Villar (rvillarb@albru.pe, cambiada de validador → asesor)
   - Creados scripts Python para gestión:
     - `agregar_asesor.py` - Auto-genera emails
     - `cambiar_rol.py` - Cambio de roles con auto-creación de registros

4. ✅ **Fix fecha_asignacion**
   - **Backend**: Actualizado endpoint de reasignación para setear `fecha_asignacion = NOW()`
   - **Frontend**: Cambiada prioridad de display para mostrar fecha de asignación real
   - **Impacto**: Ahora GTR puede ver cuándo se asignó cada lead a cada asesor (no solo cuándo llegó al sistema)

5. ✅ **Documentación AI Handoff**
   - Creado `AI_HANDOFF.md` con toda la información del proyecto
   - Incluye arquitectura, base de datos, endpoints, scripts, problemas comunes
   - Permite continuidad con otras IAs gratuitas

---

## Notas Adicionales

### Formato de Email de Asesores
```
Formato: {inicial_nombre}{apellido_paterno}{inicial_apellido_materno}@albru.pe

Ejemplos:
- Sebastián Aguirre Fiestas → saguirref@albru.pe
- Giner Alexander Loayza Gonzaga → gloayzag@albru.pe
- Roxana Gisela Villar Bazan → rvillarb@albru.pe
```

### Passwords por Defecto
- Nuevos asesores: `albru123` (bcrypt hash)
- Se recomienda cambiar en primer login

### Flujo de Reasignación
1. GTR selecciona cliente y asesor
2. Frontend llama `POST /api/clientes/:id/reasignar`
3. Backend actualiza:
   - `asesor_asignado` = nuevo_usuario_id
   - `seguimiento_status` = 'derivado'
   - `derivado_at` = NOW()
   - **`fecha_asignacion` = NOW()** ⚠️ Importante
   - `updated_at` = NOW()
4. Backend emite evento WebSocket `CLIENT_REASSIGNED`
5. Frontend de asesor recibe notificación y recarga clientes

### Niveles de Zoom Aplicados
- **Sidebars**: 100% (sin zoom)
- **Áreas de contenido**: 85% zoom
  - GtrDashboard
  - AdminPanel
  - AsesorPanel
  - ValidacionesDashboard

---

## Contacto y Soporte

Para continuar trabajando en este proyecto con otra IA:

1. **Leer este documento completo**
2. **Verificar estado de Docker**: `docker ps`
3. **Verificar conexión MySQL**: `docker exec -it albru-base mysql -uroot -pPrueba albru`
4. **Verificar frontend**: `npm run dev`
5. **Verificar backend**: `cd backend && node server.js`

**Última actualización**: 2025-01-XX

---

## Comandos Rápidos de Referencia

```powershell
# Docker
docker-compose up -d                                    # Levantar servicios
docker logs albru-base                                  # Ver logs MySQL
docker exec -it albru-base mysql -uroot -pPrueba albru # Conectar a MySQL

# Frontend
npm run dev                                             # Desarrollo
npm run build                                           # Build producción

# Backend
cd backend && node server.js                            # Levantar API

# Scripts Python
cd backend && python scripts/agregar_asesor.py          # Agregar asesor
cd backend && python scripts/cambiar_rol.py             # Cambiar rol

# MySQL Queries Útiles
SELECT COUNT(*) FROM clientes;                          # Total clientes
SELECT * FROM usuarios WHERE tipo = 'asesor';          # Ver asesores
SELECT id, nombre, email FROM usuarios;                # Listar usuarios
SELECT COUNT(*) FROM clientes WHERE asesor_asignado IS NOT NULL; # Asignados
```

---

**FIN DEL DOCUMENTO**
