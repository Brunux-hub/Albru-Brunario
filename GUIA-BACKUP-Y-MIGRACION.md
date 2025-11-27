# 📦 GUÍA COMPLETA DE BACKUP Y MIGRACIÓN

## Sistema de Backup y Migración - Albru Brunario CRM

Esta guía explica cómo realizar un backup completo del sistema y cómo migrar a otra PC de forma segura y completa.

---

## 📋 TABLA DE CONTENIDO

1. [Requisitos Previos](#requisitos-previos)
2. [Cómo Hacer un Backup Completo](#cómo-hacer-un-backup-completo)
3. [Qué Incluye el Backup](#qué-incluye-el-backup)
4. [Diagnóstico Inteligente](#diagnóstico-inteligente)
5. [Cómo Migrar a Otra PC](#cómo-migrar-a-otra-pc)
6. [Resolución de Problemas](#resolución-de-problemas)
7. [Verificación Post-Migración](#verificación-post-migración)

---

## 🎯 REQUISITOS PREVIOS

### En la PC Original (donde está el CRM actualmente):

- **Docker Desktop** instalado y en ejecución
- **Python 3.8+** instalado
- Librerías Python requeridas:
  ```bash
  pip install mysql-connector-python pandas rich openpyxl
  ```
- Acceso a la base de datos MySQL
- Espacio en disco: Mínimo 2 GB libre

### En la PC Nueva (destino de la migración):

- **Docker Desktop** instalado
- **Node.js 16+** instalado
- **Python 3.8+** instalado (opcional, para scripts de mantenimiento)
- Espacio en disco: Mínimo 5 GB libre
- Conexión a Internet para descargar dependencias

---

## 💾 CÓMO HACER UN BACKUP COMPLETO

### Método 1: Script Python con Diagnóstico Inteligente (RECOMENDADO)

Este método incluye verificación automática de integridad y diagnóstico completo.

#### Paso 1: Abrir PowerShell

Abre PowerShell en la carpeta del proyecto:

```powershell
cd C:\Users\USER\Albru-Brunario
```

#### Paso 2: Ejecutar el Script de Backup

```powershell
python scripts/backup_y_diagnostico.py
```

#### Paso 3: Esperar a que Termine

El script realizará automáticamente:

1. ✅ Conexión a la base de datos
2. ✅ Generación del dump SQL completo
3. ✅ Exportación de datos a JSON
4. ✅ Copia de archivos del proyecto
5. ✅ Empaquetado en archivo ZIP
6. ✅ Diagnóstico inteligente completo
7. ✅ Reporte de verificación

**Duración estimada**: 2-5 minutos dependiendo del tamaño de la BD.

#### Paso 4: Verificar el Resultado

Al finalizar verás un reporte completo como este:

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║                   📋 REPORTE FINAL DEL DIAGNÓSTICO                    ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────┐
│ ✅ BACKUP COMPLETAMENTE FUNCIONAL       │
│                                         │
│ El backup está perfectamente preparado  │
│ para migración.                         │
│ Todos los componentes han sido          │
│ verificados y están en orden.           │
│ Puede proceder con confianza a migrar   │
│ a otra PC.                              │
└─────────────────────────────────────────┘
```

#### Paso 5: Ubicar el Backup

El backup se guarda en:

```
C:\Users\USER\Albru-Brunario\backups\backup_completo_YYYYMMDD_HHMMSS.zip
```

**Ejemplo**: `backup_completo_20251126_153045.zip`

---

### Método 2: Backup Manual con Docker (Alternativo)

Si el script Python falla, puedes hacer backup manual:

#### Opción A: Usar el BAT existente

```powershell
.\backup-crm.bat
```

#### Opción B: Comandos manuales

```powershell
# 1. Crear carpeta de backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "C:\Backup-CRM-$timestamp"
New-Item -ItemType Directory -Path $backupDir

# 2. Exportar base de datos
docker exec albru-base mysqldump -u albru -palbru_pass albru > "$backupDir\database_backup.sql"

# 3. Copiar código fuente
Copy-Item -Path "C:\Users\USER\Albru-Brunario\*" -Destination "$backupDir\Albru-Brunario\" -Recurse -Exclude node_modules,dist,build,.git

# 4. Abrir carpeta
explorer $backupDir
```

---

## 📦 QUÉ INCLUYE EL BACKUP

### Estructura del Backup Completo:

```
backup_completo_YYYYMMDD_HHMMSS.zip
│
├── backup_YYYYMMDD_HHMMSS/
│   │
│   ├── database/
│   │   └── albru_backup.sql          # Dump SQL completo
│   │
│   ├── json_data/
│   │   ├── clientes.json             # Todos los clientes
│   │   ├── usuarios.json             # Usuarios y asesores
│   │   ├── historial_estados.json    # Historial de cambios
│   │   ├── historial_gestiones.json  # Historial de gestiones
│   │   ├── asesores.json             # Datos de asesores
│   │   └── gtr.json                  # Datos de GTRs
│   │
│   ├── project_files/
│   │   ├── .env                      # Configuración (IMPORTANTE)
│   │   ├── docker-compose.yml
│   │   ├── package.json
│   │   ├── backend/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── config/
│   │   │   └── middleware/
│   │   ├── src/
│   │   ├── public/
│   │   └── scripts/
│   │
│   ├── logs/
│   │
│   └── REPORTE_DIAGNOSTICO.txt       # Reporte completo
│
└── README_BACKUP.txt
```

### Tamaños Aproximados:

- **Dump SQL**: 50-500 MB (depende de datos)
- **JSON Data**: 10-100 MB
- **Código Fuente**: 50-200 MB
- **Total Comprimido**: 100-800 MB

---

## 🔍 DIAGNÓSTICO INTELIGENTE

El script verifica automáticamente:

### 1. ✅ Estructura de Base de Datos

- Existencia de todas las tablas requeridas
- Presencia de columnas esenciales
- Relaciones entre tablas

**Tablas Verificadas**:
- `clientes` (columnas: id, nombre, telefono, dni, asesor_asignado, etc.)
- `usuarios` (columnas: id, nombre, email, password, tipo, estado)
- `asesores` (columnas: id, usuario_id, gtr_asignado, clientes_asignados)
- `historial_estados` (columnas: id, cliente_id, usuario_id, estado_anterior, estado_nuevo)
- `historial_gestiones` (columnas: id, cliente_id, paso, asesor_id, categoria, subcategoria)
- `gtr`, `asesor_stats_daily`, `cliente_locks`

### 2. ✅ Integridad de Datos

- Clientes sin nombre o teléfono
- Clientes con asesor inexistente
- Usuarios sin tipo definido
- Historial huérfano (sin cliente)
- Duplicados de teléfono

### 3. ✅ Archivos JSON

- Validez de sintaxis JSON
- Estructura correcta (arrays)
- Cantidad de registros

### 4. ✅ Estructura del Proyecto

- Directorios críticos presentes
- Archivos de configuración
- Código fuente completo

### 5. ✅ Configuración

- Variables de entorno esenciales
- Configuración de base de datos
- Secrets y tokens

---

## 🚚 CÓMO MIGRAR A OTRA PC

### PASO 1: Preparar la PC Nueva

#### 1.1 Instalar Docker Desktop

1. Descargar desde: https://www.docker.com/products/docker-desktop
2. Instalar y reiniciar la PC
3. Abrir Docker Desktop y esperar a que inicie
4. Verificar que está corriendo:
   ```powershell
   docker --version
   ```

#### 1.2 Instalar Node.js

1. Descargar desde: https://nodejs.org (versión LTS)
2. Instalar con configuración por defecto
3. Verificar:
   ```powershell
   node --version
   npm --version
   ```

#### 1.3 (Opcional) Instalar Python

Solo si vas a usar los scripts de mantenimiento:

```powershell
# Verificar si ya está instalado
python --version

# Si no está, descargar desde: https://www.python.org
```

### PASO 2: Transferir el Backup

#### Opción A: USB

1. Copiar el archivo `backup_completo_YYYYMMDD_HHMMSS.zip` a USB
2. Conectar USB en la PC nueva
3. Copiar a `C:\Backup-CRM\`

#### Opción B: Nube (Google Drive, OneDrive, Dropbox)

1. Subir el ZIP a la nube
2. Descargar en la PC nueva
3. Guardar en `C:\Backup-CRM\`

#### Opción C: Red Local

```powershell
# En la PC original, compartir la carpeta de backup
# En la PC nueva:
Copy-Item "\\PC-ORIGINAL\Backup\backup_completo_*.zip" -Destination "C:\Backup-CRM\"
```

### PASO 3: Extraer el Backup

```powershell
# Crear directorio de trabajo
New-Item -ItemType Directory -Path "C:\Albru-Brunario" -Force

# Extraer backup
Expand-Archive -Path "C:\Backup-CRM\backup_completo_*.zip" -DestinationPath "C:\Temp-Extract"

# Copiar archivos del proyecto
Copy-Item -Path "C:\Temp-Extract\backup_*\project_files\*" -Destination "C:\Albru-Brunario\" -Recurse -Force
```

### PASO 4: Configurar el Entorno

#### 4.1 Verificar archivo .env

```powershell
cd C:\Albru-Brunario
notepad .env
```

Asegurarse de que contiene:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=albru
DB_PASSWORD=albru_pass
DB_NAME=albru

# JWT
JWT_SECRET=tu_secret_aqui
JWT_EXPIRES_IN=1d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Backend
BACKEND_PORT=5000
NODE_ENV=production

# Frontend
VITE_API_URL=http://localhost:5000
```

#### 4.2 Iniciar Docker Compose

```powershell
cd C:\Albru-Brunario

# Iniciar contenedores
docker-compose up -d

# Verificar que están corriendo
docker ps
```

Deberías ver:
- `albru-base` (MySQL)
- `albru-redis` (Redis)
- `albru-backend` (Node.js)

### PASO 5: Restaurar la Base de Datos

#### Opción A: Desde el dump SQL

```powershell
# Esperar a que MySQL esté listo (30 segundos)
Start-Sleep -Seconds 30

# Restaurar base de datos
Get-Content "C:\Temp-Extract\backup_*\database\albru_backup.sql" | docker exec -i albru-base mysql -u albru -palbru_pass albru
```

#### Opción B: Usando el script de restore (si existe)

```powershell
.\restore-crm.bat
```

### PASO 6: Instalar Dependencias

#### Backend

```powershell
cd C:\Albru-Brunario\backend
npm install
```

#### Frontend

```powershell
cd C:\Albru-Brunario
npm install
```

### PASO 7: Iniciar el Sistema

#### Opción A: Modo Producción

```powershell
# Backend
cd C:\Albru-Brunario\backend
npm start

# En otra terminal - Frontend
cd C:\Albru-Brunario
npm run build
npm run preview
```

#### Opción B: Modo Desarrollo

```powershell
# Backend
cd C:\Albru-Brunario\backend
npm run dev

# Frontend
cd C:\Albru-Brunario
npm run dev
```

### PASO 8: Verificar el Acceso

Abrir navegador en:

- **Frontend**: http://localhost:5173 (dev) o http://localhost:4173 (prod)
- **Backend API**: http://localhost:5000/api/health

**Credenciales por defecto** (cambiar después):
- Usuario: admin@albru.com
- Contraseña: (la que tengas configurada)

---

## 🔧 RESOLUCIÓN DE PROBLEMAS

### Problema 1: Docker no inicia

**Síntomas**:
```
Error response from daemon: driver failed programming external connectivity
```

**Solución**:
```powershell
# Reiniciar Docker Desktop
# O cambiar puertos en docker-compose.yml
```

### Problema 2: Base de datos vacía después de restaurar

**Síntomas**: No hay clientes, usuarios aparecen vacíos

**Solución**:
```powershell
# Verificar que el SQL se importó correctamente
docker exec -it albru-base mysql -u albru -palbru_pass -e "USE albru; SHOW TABLES;"

# Si está vacío, reimportar:
docker exec -i albru-base mysql -u albru -palbru_pass albru < C:\Temp-Extract\backup_*\database\albru_backup.sql
```

### Problema 3: Error de conexión a BD

**Síntomas**:
```
ECONNREFUSED 127.0.0.1:3306
```

**Solución**:
```powershell
# Verificar que MySQL está corriendo
docker ps

# Verificar logs
docker logs albru-base

# Reiniciar contenedor
docker restart albru-base
```

### Problema 4: Puerto ya en uso

**Síntomas**:
```
Port 5000 is already in use
```

**Solución**:
```powershell
# Opción 1: Cambiar puerto en .env
# BACKEND_PORT=5001

# Opción 2: Detener proceso que usa el puerto
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### Problema 5: node_modules faltantes

**Síntomas**:
```
Cannot find module 'express'
```

**Solución**:
```powershell
# Reinstalar dependencias
cd C:\Albru-Brunario\backend
Remove-Item -Recurse -Force node_modules
npm install

cd C:\Albru-Brunario
Remove-Item -Recurse -Force node_modules
npm install
```

### Problema 6: Error de permisos en Docker

**Síntomas**:
```
permission denied while trying to connect to Docker daemon
```

**Solución**:
1. Ejecutar PowerShell como Administrador
2. O agregar tu usuario al grupo docker-users

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

### Checklist de Verificación:

#### 1. ✅ Base de Datos

```powershell
# Verificar tablas
docker exec -it albru-base mysql -u albru -palbru_pass -e "USE albru; SHOW TABLES;"

# Verificar cantidad de clientes
docker exec -it albru-base mysql -u albru -palbru_pass -e "USE albru; SELECT COUNT(*) FROM clientes;"

# Verificar usuarios
docker exec -it albru-base mysql -u albru -palbru_pass -e "USE albru; SELECT id, nombre, email, tipo FROM usuarios;"
```

#### 2. ✅ Contenedores Docker

```powershell
docker ps

# Deberías ver:
# - albru-base (MySQL) - healthy
# - albru-redis (Redis) - healthy  
# - albru-backend (Node) - healthy
```

#### 3. ✅ Backend API

```powershell
# Test endpoint de salud
curl http://localhost:5000/api/health

# Debería responder: {"status":"ok","database":"connected"}
```

#### 4. ✅ Frontend

Abrir http://localhost:5173 y verificar:
- Login funciona
- Listado de clientes se carga
- Panel de asesores funciona
- Panel GTR funciona

#### 5. ✅ Funcionalidades Críticas

- [ ] Login con usuario existente
- [ ] Ver lista de clientes
- [ ] Buscar clientes
- [ ] Ver detalle de un cliente
- [ ] Ver historial de gestiones
- [ ] Panel de asesor funciona
- [ ] Panel GTR muestra asesores
- [ ] Panel GTR muestra gestiones de cada asesor

---

## 📞 SOPORTE Y AYUDA

### Si algo no funciona:

1. **Revisar logs de Docker**:
   ```powershell
   docker logs albru-base
   docker logs albru-backend
   ```

2. **Revisar el reporte de diagnóstico**:
   ```
   C:\Temp-Extract\backup_*\REPORTE_DIAGNOSTICO.txt
   ```

3. **Ejecutar diagnóstico manual**:
   ```powershell
   python scripts/backup_y_diagnostico.py
   ```

4. **Verificar archivo .env**:
   ```powershell
   notepad C:\Albru-Brunario\.env
   ```

---

## 📝 NOTAS IMPORTANTES

### ⚠️ SEGURIDAD

- **NUNCA** compartas el archivo .env públicamente
- Cambia las contraseñas después de migrar
- Actualiza JWT_SECRET con un valor único
- Usa contraseñas fuertes para usuarios

### 💡 MEJORES PRÁCTICAS

1. **Hacer backups regularmente** (diario o semanal)
2. **Guardar backups en múltiples ubicaciones** (local + nube)
3. **Probar la restauración periódicamente**
4. **Documentar cambios importantes**
5. **Mantener un backup antes de actualizaciones mayores**

### 🔄 AUTOMATIZACIÓN

Puedes programar backups automáticos con Tareas Programadas de Windows:

```powershell
# Crear tarea que ejecute el backup diariamente a las 2 AM
$action = New-ScheduledTaskAction -Execute "python" -Argument "C:\Albru-Brunario\scripts\backup_y_diagnostico.py"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "Backup Albru CRM" -Description "Backup automático diario del CRM"
```

---

## 🎉 ¡LISTO!

Si seguiste todos los pasos, tu sistema CRM debería estar completamente migrado y funcionando en la nueva PC.

**¿Problemas?** Revisa la sección de [Resolución de Problemas](#resolución-de-problemas) o ejecuta el diagnóstico inteligente.

---

**Versión**: 1.0  
**Fecha**: Noviembre 2025  
**Autor**: Sistema Albru Brunario CRM
