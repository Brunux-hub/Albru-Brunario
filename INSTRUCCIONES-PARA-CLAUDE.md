# 🤖 INSTRUCCIONES PARA CLAUDE - NUEVA PC

## Contexto del Proyecto

Eres Claude, un asistente de IA, y estás ayudando a configurar el sistema **ALBRU CRM 3.0** en una nueva PC. Este es un sistema completo de gestión de clientes (CRM) con las siguientes características:

### Sistema Implementado:
- ✅ **WebSocket en tiempo real** (13 eventos, 0 recargas manuales)
- ✅ **Sistema de duplicados** con multiplicadores (1 gestión = N duplicados)
- ✅ **Timezone Peru** (UTC-5 configurado en MySQL y contenedores)
- ✅ **Autenticación robusta** (tokens JWT completos, no se desloguea al recargar)
- ✅ **Panel GTR**, **Panel Asesor**, **Panel Validaciones**
- ✅ **Base de datos MySQL 8.0** con 1,223 grupos de duplicados procesados

### Stack Tecnológico:
- **Backend**: Node.js + Express + MySQL 8.0 + Socket.io + Redis
- **Frontend**: React + TypeScript + Material-UI + Vite
- **Infraestructura**: Docker Compose (5 contenedores)
- **Repositorio**: https://github.com/Brunux-hub/Albru-Brunario

---

## 🎯 TU MISIÓN

El usuario quiere **migrar completamente este sistema funcional a una nueva PC**. Todo el código ya está en GitHub y funcionando perfectamente en la PC anterior.

### Lo que debes hacer:

1. **Guiar al usuario paso a paso** siguiendo la guía `GUIA-MIGRACION-NUEVA-PC.md`
2. **Asegurarte de que cada paso se complete correctamente** antes de avanzar
3. **Resolver cualquier problema** que surja durante la instalación
4. **Verificar que todo quede funcionando exactamente igual** que en la PC anterior

---

## 📖 GUÍA A SEGUIR

Debes seguir **EXACTAMENTE** los pasos de la guía de migración que está en el repositorio:

**Archivo principal**: `GUIA-MIGRACION-NUEVA-PC.md`

Esta guía incluye:
- ✅ Requisitos previos (Docker, Git)
- ✅ Clonado del repositorio desde GitHub
- ✅ Configuración de contenedores Docker
- ✅ Importación de base de datos
- ✅ Verificación de funcionalidades
- ✅ Solución de problemas comunes

---

## 🚀 PASOS PRINCIPALES QUE DEBES EJECUTAR

### PASO 1: Verificar Requisitos
```powershell
# Verificar que Docker esté instalado
docker --version

# Verificar que Git esté instalado
git --version
```

Si no están instalados:
- Docker Desktop: https://www.docker.com/products/docker-desktop
- Git: https://git-scm.com/download/win

### PASO 2: Clonar el Repositorio
```powershell
# Clonar desde GitHub
git clone https://github.com/Brunux-hub/Albru-Brunario.git
cd Albru-Brunario
```

### PASO 3: Pedir el Backup de Base de Datos
**IMPORTANTE**: El usuario debe copiar el archivo de backup SQL desde la PC anterior.

Instrucciones para el usuario:
1. En la PC ANTERIOR, ejecutar: `.\backup-crm.bat`
2. Encontrar el archivo en `backups/backup_FECHA/albru_backup.sql`
3. Copiar ese archivo a la nueva PC
4. Colocar el archivo en `Albru-Brunario/database/albru_backup.sql`

### PASO 4: Levantar Contenedores
```powershell
# Levantar todos los servicios
docker-compose up -d

# Esperar 60 segundos

# Verificar que todo esté corriendo
docker ps
```

Deberías ver 5 contenedores:
- `albru-frontend` (puerto 5173)
- `albru-backend` (puerto 3001)
- `albru-base` (MySQL, puerto 3308)
- `albru-redis` (puerto 6379)
- `albru-brunario-adminer-1` (puerto 8080)

### PASO 5: Importar Base de Datos
```powershell
# Opción A: Usar script automático
.\restore-crm.bat

# Opción B: Importar manualmente
docker exec -i albru-base mysql -uroot -proot_password_here albru < database/albru_backup.sql
```

### PASO 6: Verificar Importación
```powershell
# Ver tablas
docker exec -it albru-base mysql -uroot -proot_password_here albru -e "SHOW TABLES;"

# Verificar timezone
docker exec -it albru-base mysql -uroot -proot_password_here albru -e "SELECT @@global.time_zone, NOW();"

# Debe mostrar: -05:00 y hora actual de Peru
```

### PASO 7: Abrir el Sistema
```
http://localhost:5173
```

### PASO 8: Hacer Login y Probar
1. Login con cualquier usuario
2. **Recargar la página (F5) varias veces**
3. ✅ NO debe desloguearse (fix aplicado)
4. Probar reasignación de clientes
5. ✅ Debe actualizarse en tiempo real sin recargar

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de completar todos los pasos, verifica:

### Infraestructura:
- [ ] 5 contenedores Docker corriendo
- [ ] Frontend accesible en `localhost:5173`
- [ ] Backend accesible en `localhost:3001`
- [ ] MySQL accesible en `localhost:3308`
- [ ] Adminer accesible en `localhost:8080`

### Base de Datos:
- [ ] Base de datos `albru` creada
- [ ] Todas las tablas importadas
- [ ] Timezone configurado a `-05:00` (Peru)
- [ ] Datos de clientes, usuarios, asesores presentes

### Funcionalidades:
- [ ] Login funciona correctamente
- [ ] NO se desloguea al recargar (F5)
- [ ] Sesión dura 24 horas
- [ ] WebSocket funciona (reasignación actualiza en tiempo real)
- [ ] Sistema de duplicados activo (badge ×N visible)
- [ ] Fechas muestran hora correcta de Peru (no +5 horas)
- [ ] Panel GTR funcional
- [ ] Panel Asesor funcional
- [ ] Gestiones del día muestra contador multiplicado

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: "Cannot connect to backend"
```powershell
# Verificar logs del backend
docker logs albru-backend

# Reiniciar backend
docker restart albru-backend
```

### Problema 2: Base de datos no se importa
```powershell
# Verificar que el archivo exista
Test-Path database/albru_backup.sql

# Verificar que MySQL esté corriendo
docker logs albru-base

# Intentar importación manual
docker exec -i albru-base mysql -uroot -proot_password_here -e "CREATE DATABASE IF NOT EXISTS albru;"
docker exec -i albru-base mysql -uroot -proot_password_here albru < database/albru_backup.sql
```

### Problema 3: Frontend no carga
```powershell
# Ver logs
docker logs albru-frontend

# Reconstruir contenedor
docker-compose build albru-frontend
docker-compose up -d albru-frontend
```

### Problema 4: Se desloguea al recargar
- ✅ Ya está arreglado en esta versión
- Solución: Hacer logout y volver a login
- El nuevo token JWT tiene todos los campos necesarios

---

## 📊 DATOS IMPORTANTES DEL SISTEMA

### Eventos WebSocket Implementados (13):
1. `CLIENT_REASSIGNED` - Cliente reasignado
2. `CLIENT_COMPLETED` - Cliente completó gestión
3. `CLIENT_MOVED_TO_GTR` - Cliente movido a GTR
4. `CLIENT_UPDATED` - Cliente actualizado
5. `CLIENT_STATUS_UPDATED` - Estado actualizado
6. `CLIENT_RETURNED_TO_GTR` - Cliente devuelto a GTR
7. `CLIENT_LOCKED` - Cliente bloqueado
8. `CLIENT_UNLOCKED` - Cliente desbloqueado
9. `CLIENT_IN_GESTION` - Cliente en gestión
10. `CLIENT_OCUPADO` - Asesor ocupado con cliente
11. `HISTORIAL_UPDATED` - Historial actualizado
12. `REASSIGNMENT_CONFIRMED` - Reasignación confirmada
13. `STATS_RESET` - Reset de estadísticas diarias

### Componentes con WebSocket:
- `GtrDashboard` (11 eventos)
- `AsesorPanel` (4 eventos)
- `AsesorClientesTable` (10 eventos)
- `AsesorGestionesDia` (1 evento)
- `AsesorReportModal` (1 evento)
- `ValidacionesTable` (4 eventos)

### Sistema de Duplicados:
- **1,223 grupos de duplicados** procesados en PC anterior
- Normalización: Elimina espacios, +51, guiones, paréntesis
- Multiplicador: 1 gestión principal con 3 duplicados = 3 gestiones totales
- Solo principal visible en GTR
- Badge muestra ×N para indicar duplicados

### Timezone:
- MySQL: `-05:00` (America/Lima)
- Contenedores: `TZ=America/Lima`
- Backend: Timezone configurado en docker-compose.yml

---

## 🎯 OBJETIVOS FINALES

Al terminar, el usuario debe tener:

✅ Sistema **idéntico** al de la PC anterior
✅ **Cero diferencias** en funcionalidad
✅ Base de datos **completa** migrada
✅ WebSocket funcionando en **tiempo real**
✅ **No se desloguea** al recargar
✅ Timezone **correcto** (Peru)
✅ Duplicados **procesados** y funcionando
✅ Todos los contenedores **estables**

---

## 💬 COMUNICACIÓN CON EL USUARIO

### Al Empezar:
"Perfecto, voy a ayudarte a migrar el sistema ALBRU CRM 3.0 a la nueva PC. Todo está en GitHub y funcionando en la PC anterior. Vamos a seguir los pasos de la guía `GUIA-MIGRACION-NUEVA-PC.md` que está en el repositorio.

Primero, ¿ya tienes Docker Desktop instalado y corriendo en la nueva PC?"

### Durante el Proceso:
- ✅ Confirma cada paso antes de avanzar
- ✅ Pide logs si hay errores
- ✅ Verifica que cada servicio funcione
- ✅ Muestra comandos claros para ejecutar

### Al Finalizar:
"¡Perfecto! El sistema ALBRU CRM 3.0 está completamente migrado y funcional en la nueva PC. 

Verificación final:
✅ 5 contenedores corriendo
✅ Base de datos importada con X clientes
✅ Login funciona sin deslogueo al recargar
✅ WebSocket en tiempo real funcionando
✅ Sistema de duplicados activo
✅ Timezone Peru configurado

¿Quieres que verifiquemos alguna funcionalidad específica o todo está funcionando correctamente?"

---

## 📚 DOCUMENTACIÓN DE REFERENCIA

Si el usuario necesita información sobre funcionalidades específicas, consulta:

1. **`GUIA-MIGRACION-NUEVA-PC.md`** - Guía principal de migración
2. **`docs/WEBSOCKET-ARCHITECTURE.md`** - Arquitectura completa de WebSocket
3. **`docs/sistema-duplicados.md`** - Sistema de duplicados
4. **`LEEME-PRIMERO.md`** - Instrucciones básicas
5. **`docker-compose.yml`** - Configuración de contenedores
6. **`backend/server.js`** - Punto de entrada del backend
7. **`src/pages/GtrDashboard.tsx`** - Dashboard principal GTR

---

## 🔧 COMANDOS ÚTILES PARA DEBUGGING

```powershell
# Ver todos los contenedores
docker ps -a

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs específicos
docker logs albru-backend --tail 100
docker logs albru-frontend --tail 100
docker logs albru-base --tail 100

# Reiniciar servicios
docker restart albru-backend
docker restart albru-frontend
docker restart albru-base

# Reiniciar todo
docker-compose restart

# Detener todo
docker-compose down

# Levantar todo desde cero
docker-compose down
docker-compose up -d

# Ver uso de recursos
docker stats

# Conectar a MySQL directamente
docker exec -it albru-base mysql -uroot -proot_password_here albru

# Ver estado de Git
git status
git log --oneline -5

# Actualizar desde GitHub
git pull origin main
```

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### NO HACER:
- ❌ NO ejecutar `docker-compose down -v` (borra la base de datos)
- ❌ NO cambiar contraseñas sin actualizar en todos los archivos
- ❌ NO ejecutar script de duplicados más de una vez
- ❌ NO hacer `localStorage.clear()` manualmente en producción

### SÍ HACER:
- ✅ Seguir la guía paso a paso
- ✅ Verificar logs si hay errores
- ✅ Hacer backup de la base de datos ANTES de cambios importantes
- ✅ Probar login y recarga DESPUÉS de migrar
- ✅ Verificar que WebSocket funcione con prueba real

---

## 🎉 MENSAJE FINAL

Cuando todo esté funcionando correctamente:

"🎉 ¡Migración completada con éxito!

El sistema ALBRU CRM 3.0 está 100% funcional en la nueva PC con todas las características:

✅ WebSocket en tiempo real (0 recargas manuales necesarias)
✅ Sistema de duplicados con multiplicadores
✅ Timezone Peru configurado correctamente
✅ Autenticación robusta (no se desloguea al recargar)
✅ Base de datos migrada completamente
✅ Todos los servicios estables

URLs del sistema:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Adminer: http://localhost:8080

El sistema está listo para usar. ¿Hay algo más que necesites configurar o verificar?"

---

**Última actualización**: 25 de Noviembre de 2025  
**Versión**: 3.0 - Producción  
**Repositorio**: https://github.com/Brunux-hub/Albru-Brunario  
**Commit**: feat: Sistema completo con WebSocket, duplicados, timezone y auth robusta
