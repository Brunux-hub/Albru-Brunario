# 🤖 INSTRUCCIONES PARA CLAUDE - INSTALACIÓN EN NUEVA PC

**Para**: Claude en la nueva PC  
**Fecha**: 24 de Noviembre de 2025  
**Tarea**: Instalar sistema ALBRU completo con todos los datos

---

## 📦 LO QUE YA ESTÁ LISTO

Todo el código y datos están en GitHub, listos para clonar:

```
Repositorio: https://github.com/Brunux-hub/Albru-Brunario
Branch: main
```

**Archivos clave incluidos**:
- ✅ `MD/GUIA-MIGRACION-NUEVA-PC.md` - Guía completa paso a paso
- ✅ `database/backups/backup_migracion_20251124_101330.sql` - Backup completo (15.65MB)
- ✅ `LEEME-PRIMERO.md` - Inicio rápido
- ✅ `.env` - Variables de entorno configuradas
- ✅ `docker-compose.yml` - Configuración de Docker lista

---

## 🎯 TU TAREA

1. **Verificar requisitos previos**: Docker Desktop, Git instalados
2. **Clonar el repositorio**
3. **Seguir EXACTAMENTE** la guía `MD/GUIA-MIGRACION-NUEVA-PC.md`
4. **Restaurar el backup** de la base de datos
5. **Verificar** que todo funcione correctamente

---

## ⚠️ PUNTOS CRÍTICOS

### 1. Actualizar IP en `.env`

**IMPORTANTE**: El usuario debe actualizar estas líneas con la IP de su nueva PC:

```env
FRONTEND_URL=http://SU_IP_NUEVA:5173
VITE_BACKEND_URL=http://SU_IP_NUEVA:3001
VITE_WS_URL=http://SU_IP_NUEVA:3001
CORS_ORIGINS=http://SU_IP_NUEVA:5173,http://SU_IP_NUEVA:80,...
```

Para obtener la IP:
```powershell
ipconfig | Select-String "IPv4"
```

### 2. Orden de Ejecución

**DEBE seguirse este orden**:

```powershell
# 1. Iniciar SOLO la base de datos
docker-compose up -d db
Start-Sleep -Seconds 30

# 2. Restaurar el backup (CRÍTICO)
Get-Content database\backups\backup_migracion_20251124_101330.sql | docker exec -i albru-base mysql -ualbru -palbru12345 albru

# 3. Verificar restauración
docker exec albru-base mysql -ualbru -palbru12345 -Dalbru -e "SELECT COUNT(*) FROM clientes;"

# 4. Iniciar todo el sistema
docker-compose up -d --build
```

### 3. Verificación Post-Instalación

**Después de instalar, DEBES verificar**:

```powershell
# Backend funcionando
Invoke-RestMethod -Uri "http://localhost:3001/api/asesores" | ConvertTo-Json

# Contenedores corriendo
docker ps

# Acceder al frontend
# http://IP_NUEVA:5173
```

---

## 📖 GUÍA COMPLETA

Todo está documentado en:

```
MD/GUIA-MIGRACION-NUEVA-PC.md
```

Esta guía incluye:
- ✅ Requisitos previos detallados
- ✅ Pasos de instalación completos
- ✅ Comandos exactos para copiar/pegar
- ✅ Sección de troubleshooting
- ✅ Verificación del sistema
- ✅ Comandos de mantenimiento

---

## 🔐 CREDENCIALES

**Administrador**:
- Usuario: `admin`
- Contraseña: `admin123`

**GTR**:
- Usuario: `gtr_maria`
- Contraseña: `maria123`

**Base de Datos**:
- Usuario: `albru`
- Contraseña: `albru12345`
- Base: `albru`

---

## 💾 BACKUP INCLUIDO

```
Archivo: database/backups/backup_migracion_20251124_101330.sql
Tamaño: 15.65 MB
Fecha: 24/11/2025 10:13:30
```

**Contiene**:
- Todos los usuarios (admins, GTR, asesores)
- Todos los clientes registrados
- Todo el historial de gestiones
- Todas las configuraciones del sistema
- Todas las relaciones de datos

---

## 🚀 COMANDOS RÁPIDOS

### Inicio rápido después de clonar:

```powershell
cd Albru-Brunario
docker-compose up -d db
Start-Sleep -Seconds 30
Get-Content database\backups\backup_migracion_20251124_101330.sql | docker exec -i albru-base mysql -ualbru -palbru12345 albru
docker-compose up -d --build
```

### Verificar sistema:

```powershell
docker ps
Invoke-RestMethod -Uri "http://localhost:3001/api/asesores"
```

### Ver logs:

```powershell
docker-compose logs -f
```

### Detener sistema:

```powershell
docker-compose down
```

---

## ❓ TROUBLESHOOTING COMÚN

### Puerto en uso
```powershell
Get-NetTCPConnection -LocalPort 3001
# Cambiar puerto en .env o cerrar proceso
```

### Docker no inicia
- Abrir Docker Desktop manualmente
- Esperar a que inicie completamente

### Backup no se restaura
```powershell
# Esperar más tiempo
Start-Sleep -Seconds 60
# Reintentar restauración
```

### No se puede acceder desde red
```powershell
# Abrir firewall
New-NetFirewallRule -DisplayName "Albru Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Albru Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

---

## ✅ CHECKLIST FINAL

Antes de dar por terminada la instalación:

- [ ] Todos los contenedores corriendo (`docker ps` muestra 5 contenedores)
- [ ] Frontend accesible (`http://IP:5173`)
- [ ] Login funciona con credenciales de administrador
- [ ] Se ven todos los clientes en el sistema
- [ ] Se ve el historial de gestiones
- [ ] Asesores aparecen en el sistema
- [ ] Backend responde (`http://IP:3001/api/asesores`)
- [ ] Adminer funciona (`http://localhost:8080`)
- [ ] Sistema accesible desde otros dispositivos en la red

---

## 📞 SI HAY PROBLEMAS

1. **Revisar logs**: `docker-compose logs -f`
2. **Verificar Docker Desktop**: Debe estar corriendo
3. **Verificar puertos**: No deben estar en uso
4. **Seguir troubleshooting**: En la guía completa
5. **Verificar IP**: Debe estar actualizada en `.env`

---

## 🎉 RESULTADO ESPERADO

Al finalizar, el usuario debe tener:

✅ Sistema ALBRU completamente funcional  
✅ Todos los datos históricos disponibles  
✅ Todas las gestiones preservadas  
✅ Todos los usuarios funcionando  
✅ Sistema accesible desde la red local  
✅ Mismo comportamiento que en PC original  

---

**¡Buena suerte con la instalación!** 🚀

Todo está preparado para que solo sigas la guía paso a paso.
