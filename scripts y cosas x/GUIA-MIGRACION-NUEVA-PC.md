# 🚀 GUÍA COMPLETA DE MIGRACIÓN - ALBRU CRM 3.0
## Instalación en Nueva PC desde GitHub

> **Fecha de migración**: 25 de Noviembre de 2025  
> **Repositorio**: https://github.com/Brunux-hub/Albru-Brunario  
> **Versión**: 3.0 - Sistema completo con WebSocket, Duplicados y Timezone Peru

---

## 📋 REQUISITOS PREVIOS

Antes de empezar, asegúrate de tener instalado:

1. **Docker Desktop** (versión 4.x o superior)
   - Descargar de: https://www.docker.com/products/docker-desktop
   - Después de instalar, asegúrate de que Docker esté corriendo

2. **Git** (para clonar el repositorio)
   - Descargar de: https://git-scm.com/download/win
   - O usar GitHub Desktop: https://desktop.github.com/

3. **Visual Studio Code** (recomendado)
   - Descargar de: https://code.visualstudio.com/

---

## 🎯 PASO 1: CLONAR EL REPOSITORIO

### Opción A: Con Git Bash o Terminal
```bash
# Navegar a donde quieres instalar (ej: C:\Users\TuUsuario\)
cd C:\Users\TuUsuario

# Clonar el repositorio
git clone https://github.com/Brunux-hub/Albru-Brunario.git

# Entrar al directorio
cd Albru-Brunario
```

### Opción B: Con GitHub Desktop
1. Abrir GitHub Desktop
2. File → Clone Repository
3. URL: `https://github.com/Brunux-hub/Albru-Brunario`
4. Elegir carpeta de destino
5. Click en "Clone"

---

## 🐳 PASO 2: VERIFICAR DOCKER

Abre PowerShell o CMD y ejecuta:

```powershell
# Verificar que Docker está corriendo
docker --version

# Debería mostrar algo como: Docker version 24.x.x
```

Si Docker no está corriendo:
- Abre Docker Desktop
- Espera a que diga "Docker Desktop is running"

---

## 🗄️ PASO 3: RESTAURAR BASE DE DATOS

### 3.1 El Backup Ya Está en GitHub ✅

**¡BUENAS NOTICIAS!** El backup actualizado ya está incluido en el repositorio:

**Archivo**: `database/albru_backup_latest.sql`

**Datos incluidos** (actualizado: 25/11/2025 14:03):
- ✅ **14,234 clientes** totales
- ✅ **45 clientes** creados hoy
- ✅ **1,466 duplicados** procesados
- ✅ **1,512 clientes principales** con duplicados
- ✅ **21 usuarios** del sistema
- ✅ **17 asesores** activos
- ✅ **Timezone Peru** configurado (-05:00)
- ✅ **Todas las tablas** y estructura completa

**Tamaño del backup**: 31.69 MB

### 3.2 NO Necesitas Copiar Nada Manualmente

Cuando clones el repositorio, el backup ya estará en:
```
Albru-Brunario/
  database/
    albru_backup_latest.sql   ← Ya incluido en Git
```

**Solo necesitas importarlo** (ver Paso 5)

---

## 🚀 PASO 4: LEVANTAR LOS CONTENEDORES

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
# Asegúrate de estar en la carpeta correcta
cd C:\Users\TuUsuario\Albru-Brunario

# Levantar todos los contenedores
docker-compose up -d

# Esto levantará:
# - MySQL (albru-base)
# - Backend Node.js (albru-backend)
# - Frontend React (albru-frontend)
# - Redis (albru-redis)
# - Adminer (albru-brunario-adminer-1)
```

**Espera 30-60 segundos** para que todos los contenedores inicien correctamente.

### Verificar que todo esté corriendo:

```powershell
docker ps

# Deberías ver algo como:
# CONTAINER ID   IMAGE          STATUS        PORTS
# xxxxxxxxxxxx   albru-frontend Up 2 minutes  0.0.0.0:5173->80/tcp
# xxxxxxxxxxxx   albru-backend  Up 2 minutes  0.0.0.0:3001->3001/tcp
# xxxxxxxxxxxx   mysql:8.0      Up 2 minutes  0.0.0.0:3308->3306/tcp
# xxxxxxxxxxxx   redis:7        Up 2 minutes  0.0.0.0:6379->6379/tcp
# xxxxxxxxxxxx   adminer        Up 2 minutes  0.0.0.0:8080->8080/tcp
```

---

## 📊 PASO 5: IMPORTAR LA BASE DE DATOS

### 5.1 Importar el Backup (YA INCLUIDO EN GIT)

El backup `albru_backup_latest.sql` ya está en el repositorio, solo importarlo:

```powershell
# Importar el backup actualizado a MySQL
docker exec -i albru-base mysql -uroot -proot_password_here -e "CREATE DATABASE IF NOT EXISTS albru;"
docker exec -i albru-base mysql -uroot -proot_password_here albru < database/albru_backup_latest.sql
```

**Esto importará**:
- ✅ 14,234 clientes (incluye 45 de hoy)
- ✅ 1,466 duplicados ya procesados
- ✅ 21 usuarios y 17 asesores
- ✅ Todas las tablas y datos actualizados
- ✅ Timezone Peru configurado

### 5.2 Verificar Importación Exitosa

```powershell
# Ver resumen de registros importados
docker exec -it albru-base mysql -uroot -proot_password_here albru -e "SELECT 'Clientes' as tabla, COUNT(*) as total FROM clientes UNION ALL SELECT 'Usuarios', COUNT(*) FROM usuarios UNION ALL SELECT 'Asesores', COUNT(*) FROM asesores;"

# Deberías ver:
# Clientes:  14234
# Usuarios:     21
# Asesores:     17
```

### 5.3 Verificar la Importación

```powershell
# Verificar que las tablas existen
docker exec -it albru-base mysql -uroot -proot_password_here albru -e "SHOW TABLES;"

# Verificar timezone (debe mostrar -05:00)
docker exec -it albru-base mysql -uroot -proot_password_here albru -e "SELECT @@global.time_zone, NOW();"
```

---

## 🔧 PASO 6: CONFIGURAR VARIABLES DE ENTORNO (OPCIONAL)

Si necesitas cambiar configuraciones, edita el archivo `.env` en la raíz del proyecto:

```env
# Backend
DB_HOST=albru-base
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root_password_here
DB_NAME=albru

# JWT
JWT_SECRET=albru_jwt_secret_key_2025_secure_production
JWT_EXPIRES_IN=24h

# Timezone
TZ=America/Lima
```

**Después de cambiar `.env`, reinicia los contenedores:**
```powershell
docker-compose restart
```

---

## 🌐 PASO 7: ACCEDER AL SISTEMA

### URLs del Sistema:

1. **Frontend (Aplicación Principal)**
   ```
   http://localhost:5173
   ```
   - Panel de Login
   - Dashboard GTR
   - Panel de Asesores
   - Panel de Validaciones

2. **Backend API**
   ```
   http://localhost:3001
   ```
   - Endpoints REST
   - WebSocket (Socket.io)

3. **Adminer (Gestión de Base de Datos)**
   ```
   http://localhost:8080
   ```
   - Sistema: MySQL
   - Servidor: albru-base
   - Usuario: root
   - Contraseña: root_password_here
   - Base de datos: albru

---

## 👤 PASO 8: PROBAR EL LOGIN

### Usuarios de Prueba (si no tienes otros):

**GTR (Gestor)**:
- Usuario: `gtr_maria` o usa email del usuario real
- Contraseña: La contraseña configurada

**Asesor**:
- Usuario: `asesor_carlos` o usa email del usuario real
- Contraseña: La contraseña configurada

### Primera Prueba:
1. Abre `http://localhost:5173`
2. Haz login con cualquier usuario
3. **Recarga la página (F5)** varias veces
4. ✅ **NO deberías desloguearte** (fix aplicado)

---

## ✅ PASO 9: VERIFICAR QUE TODO FUNCIONE

### Checklist de Funcionalidades:

#### 🔌 WebSocket en Tiempo Real
- [ ] GTR reasigna un cliente → Asesor recibe notificación instantánea
- [ ] Asesor completa gestión → Dashboard GTR se actualiza automáticamente
- [ ] No hay que recargar páginas manualmente

#### 📱 Sistema de Duplicados
- [ ] Clientes con números similares se detectan (906 604 170, +51906604170)
- [ ] Solo el cliente principal aparece en listado GTR
- [ ] Al gestionar 1 cliente con 3 duplicados, cuenta como 3 gestiones
- [ ] Badge muestra "×3" en clientes con duplicados

#### 🕐 Timezone Peru
- [ ] Fechas muestran hora correcta de Peru (UTC-5)
- [ ] No hay diferencia de 5 horas
- [ ] Timestamps en base de datos son correctos

#### 🔐 Autenticación Robusta
- [ ] Login funciona correctamente
- [ ] Al recargar la página NO se desloguea
- [ ] Sesión dura 24 horas
- [ ] Logout funciona correctamente

---

## 📊 PASO 10: EJECUTAR SCRIPT DE DUPLICADOS (OPCIONAL)

Si importaste una base de datos antigua que NO tiene los duplicados procesados:

```powershell
# Ejecutar script de unificación de duplicados
docker exec -it albru-backend node /app/scripts/unificar-duplicados.cjs
```

Este script:
- ✅ Detecta duplicados por teléfono normalizado
- ✅ Marca el más antiguo como principal
- ✅ Actualiza `cantidad_duplicados`
- ✅ Consolida `campanas_asociadas`

**Solo ejecutar UNA VEZ** - ya procesado en la PC antigua.

---

## 🔧 COMANDOS ÚTILES

### Docker

```powershell
# Ver contenedores corriendo
docker ps

# Ver logs de un contenedor
docker logs albru-backend
docker logs albru-frontend
docker logs albru-base

# Reiniciar un contenedor
docker restart albru-backend
docker restart albru-frontend

# Reiniciar todo
docker-compose restart

# Detener todo
docker-compose down

# Detener y eliminar todo (incluye volúmenes)
docker-compose down -v

# Ver uso de recursos
docker stats
```

### Base de Datos

```powershell
# Conectar a MySQL
docker exec -it albru-base mysql -uroot -proot_password_here albru

# Backup manual
docker exec albru-base mysqldump -uroot -proot_password_here albru > backup_manual.sql

# Ver duplicados
docker exec -it albru-base mysql -uroot -proot_password_here albru -e "SELECT COUNT(*) as total, COUNT(CASE WHEN es_duplicado=1 THEN 1 END) as duplicados FROM clientes;"
```

### Git

```powershell
# Ver estado actual
git status

# Actualizar desde GitHub (si hay nuevos cambios)
git pull origin main

# Ver últimos commits
git log --oneline -10
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Problema: Docker no inicia los contenedores

**Solución**:
```powershell
# Detener todo
docker-compose down

# Limpiar volúmenes (CUIDADO: borra datos)
docker-compose down -v

# Volver a levantar
docker-compose up -d
```

### Problema: Error al conectar a la base de datos

**Solución**:
```powershell
# Verificar que MySQL esté corriendo
docker ps | Select-String "albru-base"

# Ver logs de MySQL
docker logs albru-base

# Reiniciar MySQL
docker restart albru-base
```

### Problema: Frontend no carga

**Solución**:
```powershell
# Ver logs del frontend
docker logs albru-frontend

# Reconstruir frontend
docker-compose build albru-frontend
docker-compose up -d albru-frontend
```

### Problema: "Cannot connect to backend"

**Solución**:
```powershell
# Verificar que backend esté corriendo
docker logs albru-backend

# Verificar conectividad
curl http://localhost:3001/api/health

# Reiniciar backend
docker restart albru-backend
```

### Problema: Se desloguea al recargar

**Solución**:
- ✅ Ya está arreglado en esta versión
- Hacer logout y volver a login para obtener nuevo token
- El nuevo token JWT incluye todos los campos necesarios

---

## 📁 ESTRUCTURA DEL PROYECTO

```
Albru-Brunario/
├── backend/                  # Backend Node.js + Express
│   ├── controllers/         # Lógica de negocio
│   ├── routes/              # Rutas API
│   ├── services/            # Servicios (WebSocket, etc.)
│   ├── middleware/          # Middlewares (auth, etc.)
│   └── server.js            # Punto de entrada
├── src/                     # Frontend React + TypeScript
│   ├── components/          # Componentes React
│   │   ├── asesor/         # Componentes del Asesor
│   │   ├── gtr/            # Componentes del GTR
│   │   └── validaciones/   # Componentes de Validaciones
│   ├── pages/              # Páginas principales
│   ├── context/            # Context API (Auth, etc.)
│   └── hooks/              # Custom hooks
├── database/               # Scripts SQL y migraciones
├── docs/                   # Documentación
│   ├── WEBSOCKET-ARCHITECTURE.md
│   └── sistema-duplicados.md
├── scripts/               # Scripts utilitarios
│   └── unificar-duplicados.cjs
├── docker-compose.yml     # Configuración Docker
├── Dockerfile             # Frontend Dockerfile
└── backup-crm.bat        # Script de backup
```

---

## 🎉 FUNCIONALIDADES PRINCIPALES

### 1. Sistema de Gestión de Clientes (CRM)
- ✅ Creación y edición de clientes
- ✅ Asignación de clientes a asesores
- ✅ Seguimiento de estado (Nuevo, En gestión, Gestionado)
- ✅ Historial completo de acciones

### 2. Panel GTR (Gestor)
- ✅ Vista completa de todos los clientes
- ✅ Reasignación de clientes entre asesores
- ✅ Estadísticas en tiempo real
- ✅ Reportes por asesor
- ✅ Chat/comentarios con asesores

### 3. Panel Asesor
- ✅ Lista de clientes asignados
- ✅ Wizard de gestión completo
- ✅ Gestiones del día (con multiplicador de duplicados)
- ✅ Notificaciones en tiempo real
- ✅ Historial de gestiones

### 4. WebSocket en Tiempo Real
- ✅ 13 eventos diferentes
- ✅ Actualizaciones automáticas sin recargar
- ✅ Notificaciones instantáneas
- ✅ Sincronización entre usuarios

### 5. Sistema de Duplicados
- ✅ Detección automática (normalización de teléfonos)
- ✅ Unificación inteligente
- ✅ Contador multiplicador (1 gestión = N duplicados)
- ✅ Solo principal visible en GTR

### 6. Validaciones
- ✅ Panel de validación de ventas
- ✅ Actualización en tiempo real
- ✅ Filtros y búsquedas

---

## 📞 SOPORTE Y DOCUMENTACIÓN

### Documentación Incluida:
- `docs/WEBSOCKET-ARCHITECTURE.md` - Arquitectura completa de WebSocket
- `docs/sistema-duplicados.md` - Documentación del sistema de duplicados
- `GUIA-MIGRACION.md` - Guía de migración original
- `LEEME-PRIMERO.md` - Instrucciones iniciales

### Logs y Debugging:
- Todos los eventos WebSocket tienen logs en consola del navegador
- Formato: `🔔 [COMPONENTE] Evento NOMBRE_EVENTO recibido`
- Backend logs: `docker logs albru-backend`
- Frontend logs: Consola del navegador (F12)

---

## ✅ CHECKLIST FINAL

Antes de considerar la migración completa:

- [ ] Docker Desktop instalado y corriendo
- [ ] Repositorio clonado desde GitHub
- [ ] Contenedores levantados (`docker ps` muestra 5 contenedores)
- [ ] Base de datos importada exitosamente
- [ ] Timezone configurado a Peru (-05:00)
- [ ] Login funciona correctamente
- [ ] NO se desloguea al recargar (F5)
- [ ] WebSocket funciona (reasignación actualiza en tiempo real)
- [ ] Sistema de duplicados activo (×N en badges)
- [ ] Fechas muestran hora correcta de Peru

---

## 🎯 RESUMEN DE PASOS RÁPIDOS

```powershell
# 1. Clonar repositorio
git clone https://github.com/Brunux-hub/Albru-Brunario.git
cd Albru-Brunario

# 2. Copiar backup SQL a database/
# (Copiar manualmente el archivo .sql)

# 3. Levantar contenedores
docker-compose up -d

# 4. Esperar 1 minuto

# 5. Restaurar base de datos
.\restore-crm.bat

# 6. Abrir navegador
# http://localhost:5173

# 7. ¡LISTO! 🎉
```

---

## 🔐 CREDENCIALES IMPORTANTES

**Base de Datos MySQL**:
- Host: `localhost:3308` (desde PC) o `albru-base:3306` (desde contenedores)
- Usuario: `root`
- Contraseña: `root_password_here`
- Database: `albru`

**Adminer**:
- URL: `http://localhost:8080`
- Sistema: MySQL
- Servidor: `albru-base`
- Usuario: `root`
- Contraseña: `root_password_here`

**JWT Secret**:
- `albru_jwt_secret_key_2025_secure_production`
- Tokens duran 24 horas

---

## 📈 ESTADÍSTICAS DEL SISTEMA

Sistema completo desarrollado con:
- **Backend**: Node.js + Express + MySQL
- **Frontend**: React + TypeScript + Material-UI
- **WebSocket**: Socket.io
- **Cache**: Redis
- **Contenedores**: 5 servicios Docker
- **Base de datos**: MySQL 8.0 con timezone Peru
- **Archivos modificados en última actualización**: 34 archivos
- **Líneas de código agregadas**: +4,290 líneas
- **Eventos WebSocket**: 13 eventos diferentes
- **Componentes principales**: 15+ componentes

---

## 🚀 MIGRACIÓN COMPLETADA

Si llegaste hasta aquí y todo funciona:

**¡FELICIDADES! 🎉**

El sistema ALBRU CRM 3.0 está completamente funcional en la nueva PC con:
- ✅ WebSocket en tiempo real
- ✅ Sistema de duplicados con multiplicadores
- ✅ Timezone Peru configurado
- ✅ Autenticación robusta
- ✅ Base de datos migrada
- ✅ Todos los servicios corriendo

---

**Última actualización**: 25 de Noviembre de 2025  
**Versión**: 3.0 - Producción  
**Repositorio**: https://github.com/Brunux-hub/Albru-Brunario
