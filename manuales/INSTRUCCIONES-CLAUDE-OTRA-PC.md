# 🚀 INSTRUCCIONES PARA CLAUDE - RESTAURACIÓN EN OTRA PC

## 📋 **CONTEXTO DEL BACKUP**

**Fecha:** 28 de Noviembre 2025  
**Sistema:** ALBRU CRM - Sistema de Gestión Profesional  
**Estado:** ✅ Completamente funcional con correcciones aplicadas  
**Última corrección:** Contador de reasignaciones funcionando correctamente  

---

## 🎯 **OBJETIVO**
Restaurar exactamente el mismo estado del sistema ALBRU en la nueva PC, incluyendo:
- ✅ Todos los datos de clientes
- ✅ Usuarios y asesores
- ✅ Historial completo de gestiones
- ✅ Configuraciones del sistema
- ✅ Correcciones recientes aplicadas

---

## 📂 **ESTRUCTURA DEL PROYECTO**

```
Albru-Brunario/
├── backend/               # API Node.js + Express
├── src/                  # Frontend React + TypeScript
├── database/             # Scripts SQL
├── backups/              # Backups de BD (incluye el más reciente)
├── docker-compose.yml    # Configuración Docker
├── .env                  # Variables de entorno
└── manuales/            # Este archivo
```

---

## 🔧 **PASOS DE RESTAURACIÓN**

### **1. PREPARACIÓN INICIAL**
```bash
# 1. Clonar el repositorio (si no está clonado)
git clone https://github.com/Brunux-hub/Albru-Brunario.git
cd Albru-Brunario

# 2. Hacer pull de los últimos cambios
git pull origin main

# 3. Verificar que Docker Desktop esté ejecutándose
```

### **2. CONFIGURACIÓN DE VARIABLES**
```bash
# Verificar que existe el archivo .env con la configuración correcta
# Si no existe, copiarlo desde el repositorio o crear uno nuevo
```

**Contenido mínimo del `.env`:**
```env
# Base de datos
DB_ROOT_PASSWORD=root_password_here
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
REDIS_PORT=6379
REDIS_PASSWORD=redis_albru_2025

# JWT
JWT_SECRET=albru_jwt_secret_key_2025_secure_production

# Entorno
NODE_ENV=production

# URLs (ajustar según IP de la nueva PC)
FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```

### **3. RESTAURACIÓN DE BASE DE DATOS**

```bash
# 1. Iniciar solo el servicio de base de datos
docker-compose up db -d

# 2. Esperar que MySQL esté listo (30-60 segundos)
docker-compose logs db

# 3. Buscar el backup más reciente
ls -la backups/

# 4. Restaurar el backup (usar el backup más reciente disponible)
# Ejemplo con el backup del 28/11/2025:
docker exec -i albru-base mysql -u root -p"root_password_here" albru < backups/backup_20251128_141317.sql

# O usar el backup que esté disponible en la carpeta backups/
# Verificar backups disponibles: ls backups/

# 5. Verificar que se restauró correctamente
docker exec albru-base mysql -u root -p"root_password_here" -e "USE albru; SELECT COUNT(*) as total_clientes FROM clientes; SELECT COUNT(*) as total_usuarios FROM usuarios;"
```

### **4. CONSTRUCCIÓN Y DESPLIEGUE**

```bash
# 1. Construir y levantar todos los servicios
docker-compose up --build

# 2. Verificar que todos los contenedores estén corriendo
docker-compose ps
```

### **5. VERIFICACIÓN DEL SISTEMA**

**URLs de acceso:**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Adminer (BD):** http://localhost:8080
- **Health Check:** http://localhost:3001/health

**Usuarios de prueba:**
- **Admin:** admin@albru.com / admin123
- **GTR:** gtr@albru.com / gtr123  
- **Asesor:** (cualquier asesor del sistema)

---

## ✅ **VERIFICACIONES OBLIGATORIAS**

### **1. Base de Datos**
```sql
-- Conectar a Adminer (localhost:8080)
-- Usuario: root, Password: root_password_here, Base: albru

-- Verificar tablas principales
SELECT COUNT(*) FROM clientes;        -- Debe mostrar todos los clientes
SELECT COUNT(*) FROM usuarios;       -- Debe mostrar todos los usuarios  
SELECT COUNT(*) FROM asesores;       -- Debe mostrar todos los asesores
SELECT COUNT(*) FROM historial_cliente; -- Debe mostrar historial completo
```

### **2. Frontend**
- ✅ Login funciona correctamente
- ✅ Dashboard GTR carga la tabla de clientes
- ✅ Dashboard Asesor muestra clientes asignados
- ✅ **IMPORTANTE:** Contador de reasignaciones se muestra correctamente

### **3. Funcionalidades Críticas**
- ✅ Reasignación de clientes funciona
- ✅ Contador de reasignaciones se actualiza
- ✅ Wizard de gestión funciona
- ✅ Socket.io para tiempo real funciona
- ✅ Sesiones de usuario funcionan

---

## 🚨 **SOLUCIÓN DE PROBLEMAS COMUNES**

### **Error: Puerto ya en uso**
```bash
# Detener todos los contenedores
docker-compose down

# Verificar puertos en uso
netstat -ano | findstr :3001
netstat -ano | findstr :5173
netstat -ano | findstr :3308

# Matar procesos si es necesario
taskkill /PID [PID_NUMBER] /F
```

### **Error: Base de datos no se conecta**
```bash
# Verificar logs de MySQL
docker-compose logs db

# Reiniciar solo la base de datos
docker-compose restart db

# Verificar conexión
docker exec albru-base mysql -u root -p"root_password_here" -e "SELECT 1;"
```

### **Error: Frontend no carga**
```bash
# Reconstruir solo el frontend
docker-compose up --build frontend

# Verificar logs
docker-compose logs frontend
```

---

## 📊 **ESTADO ACTUAL DEL SISTEMA**

### **Correcciones Aplicadas:**
- ✅ **Contador de reasignaciones:** Funciona correctamente, se incrementa en cada reasignación
- ✅ **Tipos TypeScript:** Campo `contador_reasignaciones` agregado a interfaces
- ✅ **Backend:** Función `reasignarCliente` actualiza el contador automáticamente
- ✅ **Frontend:** Visualización con colores según número de reasignaciones

### **Funcionalidades Implementadas:**
- 👥 Sistema completo de usuarios (Admin, GTR, Asesores)
- 📊 Dashboard profesional con estadísticas
- 🔄 Sistema de reasignaciones con contador visual
- 📋 Wizard de gestión de clientes
- 🔒 Sistema de sesiones y locks
- 💬 Chat GTR-Asesor en tiempo real
- 📈 Reportes y métricas del día/mes
- 🔍 Sistema de duplicados y validaciones

### **Tecnologías:**
- **Frontend:** React 19 + TypeScript + Material-UI v7 + Vite
- **Backend:** Node.js 18 + Express + Socket.io
- **Base de Datos:** MySQL 8.0
- **Cache:** Redis 7
- **Despliegue:** Docker + Docker Compose

---

## 🎯 **COMANDOS DE VERIFICACIÓN RÁPIDA**

```bash
# Estado de contenedores
docker-compose ps

# Logs de todos los servicios
docker-compose logs

# Logs de un servicio específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Reiniciar un servicio
docker-compose restart backend

# Reconstruir todo
docker-compose down
docker-compose up --build
```

---

## 📞 **CONTACTO DE SOPORTE**

Si tienes problemas durante la restauración:
1. Verifica los logs de Docker
2. Confirma que las variables de entorno están correctas
3. Asegúrate de que Docker Desktop tenga suficientes recursos asignados
4. Verifica que no haya conflictos de puertos

---

**✅ ÉXITO:** Si ves el login del sistema en http://localhost:5173 y puedes iniciar sesión, la restauración fue exitosa.

**🎉 ¡El sistema ALBRU está listo para usar en la nueva PC!**