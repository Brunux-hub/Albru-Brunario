# 🚀 GUÍA DE MIGRACIÓN COMPLETA DEL SISTEMA ALBRU A NUEVA PC

**Fecha de creación**: 24 de Noviembre de 2025  
**Versión**: 1.0  
**Sistema**: ALBRU 3.0 - Sistema de Gestión de Clientes

---

## 📋 ÍNDICE

1. [Requisitos Previos](#requisitos-previos)
2. [Preparación en la PC Actual (Origen)](#preparación-en-la-pc-actual-origen)
3. [Instalación en la Nueva PC (Destino)](#instalación-en-la-nueva-pc-destino)
4. [Restauración de la Base de Datos](#restauración-de-la-base-de-datos)
5. [Configuración Final](#configuración-final)
6. [Verificación del Sistema](#verificación-del-sistema)
7. [Troubleshooting](#troubleshooting)

---

## 📦 REQUISITOS PREVIOS

### En la Nueva PC debes tener instalado:

1. **Git** (para clonar el repositorio)
   - Descargar de: https://git-scm.com/download/win
   - Durante instalación, seleccionar "Git from the command line and also from 3rd-party software"

2. **Docker Desktop** (para contenedores)
   - Descargar de: https://www.docker.com/products/docker-desktop/
   - Requiere Windows 10/11 Pro o Enterprise (con Hyper-V)
   - Asegurarse de que Docker Desktop esté corriendo

3. **Node.js** (opcional, solo si necesitas ejecutar scripts locales)
   - Descargar de: https://nodejs.org/ (versión LTS recomendada)

---

## 🔄 PREPARACIÓN EN LA PC ACTUAL (ORIGEN)

### ✅ YA REALIZADO (No necesitas hacer nada)

El backup de la base de datos con TODOS los datos actuales ya está creado:

```
📁 Archivo: database/backups/backup_migracion_20251124_101330.sql
📏 Tamaño: 15.65 MB
🕐 Fecha: 24/11/2025 10:13:35
```

Este backup incluye:
- ✅ Todos los usuarios y asesores
- ✅ Todos los clientes y gestiones
- ✅ Todo el historial de cambios
- ✅ Configuraciones del sistema
- ✅ Relaciones y datos completos

---

## 🆕 INSTALACIÓN EN LA NUEVA PC (DESTINO)

### PASO 1: Clonar el Repositorio

Abre PowerShell en la nueva PC y ejecuta:

```powershell
# Navegar a donde quieras instalar (ejemplo: Documentos)
cd ~\Documents

# Clonar el repositorio
git clone https://github.com/Brunux-hub/Albru-Brunario.git

# Entrar al directorio
cd Albru-Brunario
```

### PASO 2: Verificar Archivos

Asegúrate de que todos los archivos estén presentes:

```powershell
# Ver estructura
Get-ChildItem -Recurse -Depth 1

# Verificar que exista el backup de BD
Test-Path "database\backups\backup_migracion_20251124_101330.sql"
```

Debe mostrar `True` si el archivo existe.

### PASO 3: Configurar Variables de Entorno

El archivo `.env` ya está incluido en el repositorio con la configuración correcta:

```env
# Base de datos
DB_NAME=albru
DB_USER=albru
DB_PASSWORD=albru12345
DB_HOST=db
DB_PORT=3306

# Puertos
BACKEND_PORT=3001
FRONTEND_PORT=5173
MYSQL_PORT=3308
ADMINER_PORT=8080

# JWT
JWT_SECRET=albru_jwt_secret_key_2025_secure_production

# Node
NODE_ENV=production
```

**⚠️ IMPORTANTE**: Debes actualizar estas líneas con la IP de la nueva PC:

```powershell
# Obtener la IP de tu nueva PC
ipconfig | Select-String "IPv4"
```

Luego edita el archivo `.env` y actualiza:

```env
FRONTEND_URL=http://TU_IP_NUEVA:5173
VITE_BACKEND_URL=http://TU_IP_NUEVA:3001
VITE_WS_URL=http://TU_IP_NUEVA:3001
CORS_ORIGINS=http://TU_IP_NUEVA:5173,http://TU_IP_NUEVA:80,http://TU_IP_NUEVA,http://localhost:5173
```

---

## 💾 RESTAURACIÓN DE LA BASE DE DATOS

### PASO 4: Iniciar Docker sin Base de Datos

Primero, vamos a iniciar solo el contenedor de la base de datos:

```powershell
# Asegurarse de estar en el directorio del proyecto
cd C:\Users\TU_USUARIO\Documents\Albru-Brunario

# Iniciar solo el contenedor de base de datos
docker-compose up -d db
```

Espera unos 30 segundos para que MySQL se inicialice completamente.

### PASO 5: Verificar que MySQL está corriendo

```powershell
# Ver contenedores activos
docker ps

# Verificar logs de MySQL
docker logs albru-base
```

Deberías ver algo como: `mysqld: ready for connections`

### PASO 6: Restaurar el Backup Completo

Este es el paso MÁS IMPORTANTE - restaura TODOS los datos:

```powershell
# Restaurar la base de datos completa
Get-Content database\backups\backup_migracion_20251124_101330.sql | docker exec -i albru-base mysql -ualbru -palbru12345 albru

# Verificar que se restauró correctamente
docker exec albru-base mysql -ualbru -palbru12345 -Dalbru -e "SELECT COUNT(*) as total_clientes FROM clientes;"
docker exec albru-base mysql -ualbru -palbru12345 -Dalbru -e "SELECT COUNT(*) as total_usuarios FROM usuarios;"
docker exec albru-base mysql -ualbru -palbru12345 -Dalbru -e "SELECT COUNT(*) as total_asesores FROM asesores;"
```

Deberías ver los totales de registros que tenías en la PC original.

### PASO 7: Iniciar Todos los Servicios

Ahora que la base de datos está restaurada, inicia todo el sistema:

```powershell
# Construir e iniciar todos los contenedores
docker-compose up -d --build

# Ver el progreso (puede tardar 10-15 minutos la primera vez)
docker-compose logs -f
```

Presiona `Ctrl+C` para salir de los logs cuando veas que todo está corriendo.

---

## ⚙️ CONFIGURACIÓN FINAL

### PASO 8: Verificar que Todos los Contenedores Están Corriendo

```powershell
docker ps
```

Deberías ver estos contenedores en estado "Up":
- ✅ `albru-base` (MySQL)
- ✅ `albru-backend` (Node.js API)
- ✅ `albru-frontend` (Nginx con React)
- ✅ `albru-redis` (Cache)
- ✅ `albru-brunario-adminer-1` (Adminer - Gestor BD)

### PASO 9: Probar Acceso al Sistema

Abre tu navegador y accede a:

1. **Frontend (Sistema Principal)**:
   ```
   http://TU_IP_NUEVA:5173
   ```

2. **Adminer (Gestor de Base de Datos)**:
   ```
   http://TU_IP_NUEVA:8080
   ```
   - Sistema: MySQL
   - Servidor: db
   - Usuario: albru
   - Contraseña: albru12345
   - Base de datos: albru

---

## ✅ VERIFICACIÓN DEL SISTEMA

### PASO 10: Verificar que Todo Funciona

#### 10.1 Verificar Backend

```powershell
# Probar endpoint de asesores
Invoke-RestMethod -Uri "http://localhost:3001/api/asesores" -Method Get | ConvertTo-Json -Depth 2
```

Deberías ver la lista de todos los asesores.

#### 10.2 Verificar Clientes

```powershell
# Verificar total de clientes
Invoke-RestMethod -Uri "http://localhost:3001/api/clientes?limit=1" -Method Get | ConvertTo-Json -Depth 2
```

#### 10.3 Verificar Login

1. Abre el navegador en `http://TU_IP_NUEVA:5173`
2. Intenta hacer login con un usuario existente
3. Verifica que puedas ver los clientes y gestiones

#### 10.4 Verificar Datos Completos

Accede a Adminer (`http://localhost:8080`) y verifica:

- **Tabla `usuarios`**: Debe tener todos los usuarios
- **Tabla `asesores`**: Debe tener todos los asesores
- **Tabla `clientes`**: Debe tener todos los clientes
- **Tabla `historial_gestiones`**: Debe tener todo el historial
- **Tabla `gtr`**: Debe tener los GTR configurados

---

## 🔧 TROUBLESHOOTING

### Problema 1: Docker no inicia

**Error**: "Docker daemon is not running"

**Solución**:
```powershell
# Abrir Docker Desktop manualmente
# Esperar a que inicie completamente (ícono de Docker en la bandeja del sistema)
```

### Problema 2: Puerto 3306 o 3001 en uso

**Error**: "Port already in use"

**Solución**:
```powershell
# Ver qué está usando el puerto
Get-NetTCPConnection -LocalPort 3001 | Select-Object LocalPort, State, OwningProcess
Get-NetTCPConnection -LocalPort 3306 | Select-Object LocalPort, State, OwningProcess

# Detener el proceso o cambiar el puerto en .env
```

### Problema 3: El backup no se restaura

**Error**: "ERROR 1045: Access denied"

**Solución**:
```powershell
# Verificar que MySQL está corriendo
docker ps | Select-String "albru-base"

# Esperar 30-60 segundos más
Start-Sleep -Seconds 60

# Reintentar la restauración
Get-Content database\backups\backup_migracion_20251124_101330.sql | docker exec -i albru-base mysql -ualbru -palbru12345 albru
```

### Problema 4: No se puede acceder desde la red

**Error**: No puedes acceder desde otros dispositivos

**Solución**:
```powershell
# 1. Verificar IP correcta
ipconfig | Select-String "IPv4"

# 2. Abrir puertos en el Firewall de Windows
New-NetFirewallRule -DisplayName "Albru Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Albru Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# 3. Verificar que Docker está exponiendo los puertos
docker ps
```

### Problema 5: Frontend muestra página en blanco

**Solución**:
```powershell
# Limpiar cache y reconstruir
docker-compose down
docker system prune -f
docker-compose up -d --build
```

### Problema 6: Errores de CORS

**Error**: "Access-Control-Allow-Origin"

**Solución**:
Verifica que el archivo `.env` tenga la IP correcta en `CORS_ORIGINS` y `VITE_BACKEND_URL`.

---

## 📝 NOTAS IMPORTANTES

### 🔐 Credenciales por Defecto

Estas son las credenciales incluidas en el sistema:

**Administrador**:
- Usuario: `admin`
- Contraseña: `admin123`

**GTR (Gestor)**:
- Usuario: `gtr_maria`
- Contraseña: `maria123`

**Asesores**:
Los asesores usan su DNI como contraseña (ejemplo: para un asesor con DNI 12345678, su contraseña es `12345678`)

### 💾 Backups Automáticos

El sistema NO hace backups automáticos. Se recomienda:

```powershell
# Crear un script de backup semanal
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
docker exec albru-base mysqldump -ualbru -palbru12345 --single-transaction --routines --triggers albru | Out-File -Encoding utf8 "database\backups\backup_$timestamp.sql"
```

### 🔄 Actualizar el Sistema

Si hay actualizaciones del código:

```powershell
# En el directorio del proyecto
git pull origin main

# Reconstruir contenedores
docker-compose up -d --build
```

### 🛑 Detener el Sistema

```powershell
# Detener todos los contenedores
docker-compose down

# Detener Y eliminar volúmenes (⚠️ CUIDADO: Borra la BD)
docker-compose down -v
```

### 🔍 Ver Logs en Tiempo Real

```powershell
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs solo del backend
docker-compose logs -f backend

# Ver logs solo del frontend
docker-compose logs -f frontend
```

---

## 📞 CONTACTO Y SOPORTE

Si encuentras problemas durante la migración:

1. Verifica los logs: `docker-compose logs -f`
2. Revisa la sección de Troubleshooting
3. Verifica que Docker Desktop esté corriendo
4. Asegúrate de que los puertos no estén en uso

---

## ✨ RESUMEN DE COMANDOS RÁPIDOS

```powershell
# 1. Clonar repositorio
git clone https://github.com/Brunux-hub/Albru-Brunario.git
cd Albru-Brunario

# 2. Actualizar IP en .env (editarlo manualmente)
notepad .env

# 3. Iniciar solo la base de datos
docker-compose up -d db
Start-Sleep -Seconds 30

# 4. Restaurar backup completo
Get-Content database\backups\backup_migracion_20251124_101330.sql | docker exec -i albru-base mysql -ualbru -palbru12345 albru

# 5. Iniciar todo el sistema
docker-compose up -d --build

# 6. Ver logs
docker-compose logs -f

# 7. Verificar contenedores
docker ps

# 8. Acceder al sistema
# http://TU_IP:5173
```

---

## 🎯 CHECKLIST FINAL

Antes de considerar la migración completa, verifica:

- [ ] Todos los contenedores están corriendo (`docker ps`)
- [ ] Puedes acceder al frontend (`http://TU_IP:5173`)
- [ ] Puedes hacer login con usuarios existentes
- [ ] Ves todos los clientes en el sistema
- [ ] Ves todo el historial de gestiones
- [ ] Los asesores aparecen correctamente
- [ ] El sistema responde desde otros dispositivos en la red
- [ ] Adminer muestra todos los datos (`http://localhost:8080`)

---

## 🎉 ¡MIGRACIÓN COMPLETADA!

Si todos los pasos anteriores funcionaron correctamente, tu sistema ALBRU está completamente migrado a la nueva PC con:

✅ Todos los datos históricos  
✅ Todas las gestiones realizadas  
✅ Todos los usuarios y asesores  
✅ Todas las configuraciones  
✅ Todo el sistema funcionando igual que en la PC original  

**¡Disfruta tu nuevo sistema!** 🚀
