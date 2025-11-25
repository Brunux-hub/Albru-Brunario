# 🔄 Guía de Migración Completa del CRM

Esta guía te ayudará a migrar el CRM Albru-Brunario a otra PC manteniendo TODOS los datos.

## 📦 Lo que se incluye en el backup

✅ **Base de datos completa**:
- Todos los clientes
- Historial de gestiones de cada asesor
- Usuarios (GTR, Asesores, Admin)
- Campañas y categorías
- Comentarios y observaciones
- Estados de seguimiento
- Duplicados y relaciones
- Locks y sesiones activas
- Configuración del sistema

✅ **Código fuente**:
- Frontend (React + TypeScript)
- Backend (Node.js + Express)
- Scripts y migraciones
- Archivos de configuración

✅ **Configuración**:
- Archivo `.env` con contraseñas
- Docker compose
- Configuración de servicios

✅ **Datos persistentes**:
- Volúmenes Docker (MySQL + Redis)
- Logs del sistema

---

## 🚀 PASO 1: Crear Backup en PC Original

### Opción A: Script Automático (Recomendado)

1. **Ejecutar el script de backup**:
   ```cmd
   backup-crm.bat
   ```

2. **Esperar a que termine** (~2-5 minutos)

3. **Se creará una carpeta**: `C:\Backup-CRM-YYYYMMDD_HHMM\`

4. **Contenido del backup**:
   - `database_backup.sql` - Base de datos completa (SQL dump)
   - `mysql_volume.tar.gz` - Volumen Docker de MySQL
   - `redis_volume.tar.gz` - Volumen Docker de Redis  
   - `Albru-Brunario/` - Código fuente
   - `LEEME.txt` - Información del backup

### Opción B: Manual (Si prefieres hacerlo paso a paso)

```powershell
# 1. Crear directorio de backup
mkdir C:\Backup-CRM
cd C:\Backup-CRM

# 2. Exportar base de datos
docker exec albru-base mysqldump -u albru -palbru_pass albru > database_backup.sql

# 3. Copiar código fuente
xcopy C:\Users\USER\Albru-Brunario Albru-Brunario\ /E /I /H /Y

# 4. Exportar volúmenes Docker (opcional pero recomendado)
docker run --rm -v albru-brunario_db_data:/data -v C:\Backup-CRM:/backup alpine tar czf /backup/mysql_volume.tar.gz -C /data .
docker run --rm -v albru-brunario_redis_data:/data -v C:\Backup-CRM:/backup alpine tar czf /backup/redis_volume.tar.gz -C /data .
```

---

## 📁 PASO 2: Transferir el Backup

### Opciones de transferencia:

**Opción 1: USB** (Recomendado para PCs cercanas)
- Copiar toda la carpeta `Backup-CRM-*` a un USB
- Tamaño aproximado: 500MB - 2GB

**Opción 2: Red local**
- Compartir carpeta en red
- Copiar desde la otra PC

**Opción 3: Nube**
- Subir a Google Drive / OneDrive / Dropbox
- Descargar en la PC nueva

**Opción 4: Cable de red directo**
- Conectar ambas PCs con cable ethernet
- Compartir carpeta y copiar

---

## 💻 PASO 3: Preparar PC Nueva

### Requisitos previos:

1. **Instalar Docker Desktop**:
   - Descargar: https://www.docker.com/products/docker-desktop
   - Instalar y reiniciar PC si es necesario
   - Abrir Docker Desktop y esperar que esté listo

2. **Verificar Docker**:
   ```powershell
   docker --version
   docker ps
   ```

---

## 🔄 PASO 4: Restaurar en PC Nueva

### Opción A: Script Automático (Recomendado)

1. **Copiar la carpeta de backup** a la PC nueva

2. **Abrir PowerShell o CMD** en la carpeta del backup

3. **Ejecutar el script de restauración**:
   ```cmd
   restore-crm.bat
   ```

4. **Seguir las instrucciones** en pantalla

5. **Esperar** (~5-10 minutos):
   - Copia de archivos
   - Creación de volúmenes Docker
   - Inicio de servicios
   - Importación de base de datos

6. **¡Listo!** Acceder a: http://localhost:5173

### Opción B: Manual

```powershell
# 1. Copiar código fuente
xcopy D:\Backup-CRM\Albru-Brunario C:\Users\%USERNAME%\Albru-Brunario /E /I /H /Y
cd C:\Users\%USERNAME%\Albru-Brunario

# 2. Crear volúmenes Docker
docker volume create albru-brunario_db_data
docker volume create albru-brunario_redis_data

# 3. Restaurar volúmenes (si existen los archivos .tar.gz)
docker run --rm -v albru-brunario_db_data:/data -v D:\Backup-CRM:/backup alpine tar xzf /backup/mysql_volume.tar.gz -C /data
docker run --rm -v albru-brunario_redis_data:/data -v D:\Backup-CRM:/backup alpine tar xzf /backup/redis_volume.tar.gz -C /data

# 4. Iniciar servicios
docker-compose up -d

# 5. Esperar 30 segundos
Start-Sleep -Seconds 30

# 6. Importar base de datos
docker exec -i albru-base mysql -u albru -palbru_pass albru < D:\Backup-CRM\database_backup.sql

# 7. Verificar
docker-compose ps
```

---

## ✅ PASO 5: Verificar Migración

### Verificaciones esenciales:

1. **Servicios corriendo**:
   ```powershell
   docker-compose ps
   ```
   Todos deben estar "Up"

2. **Acceder al CRM**: http://localhost:5173

3. **Login con tus credenciales**

4. **Verificar datos**:
   - ✅ Clientes aparecen
   - ✅ Gestiones de asesores visibles
   - ✅ Historial completo
   - ✅ Usuarios existen
   - ✅ Reportes muestran datos

5. **Verificar gestiones recientes**:
   - Panel GTR → Ver clientes gestionados
   - Revisar última fecha de gestión
   - Verificar comentarios de asesores

---

## 🔧 Solución de Problemas

### "No se puede conectar a MySQL"
```powershell
# Esperar más tiempo a que MySQL inicie
docker logs albru-base

# Reintentar importación
docker exec -i albru-base mysql -u albru -palbru_pass albru < database_backup.sql
```

### "Puerto ya en uso"
```powershell
# Ver qué está usando el puerto
netstat -ano | findstr :5173
netstat -ano | findstr :3001

# Detener el proceso o cambiar puerto en .env
```

### "Base de datos vacía después de restaurar"
```powershell
# Verificar que el SQL se importó
docker exec -it albru-base mysql -u albru -palbru_pass albru -e "SELECT COUNT(*) FROM clientes;"

# Si está vacío, reimportar
docker exec -i albru-base mysql -u albru -palbru_pass albru < database_backup.sql
```

### "Error en Docker compose"
```powershell
# Reconstruir imágenes
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 📊 Verificación de Datos Completos

Después de la migración, verifica que TODO esté:

```sql
-- Conectarse a MySQL
docker exec -it albru-base mysql -u albru -palbru_pass albru

-- Verificar clientes
SELECT COUNT(*) as total_clientes FROM clientes;

-- Verificar gestiones
SELECT COUNT(*) as total_gestiones FROM historial_gestiones;

-- Verificar usuarios
SELECT id, nombre, email, tipo FROM usuarios;

-- Verificar última gestión
SELECT MAX(created_at) as ultima_gestion FROM historial_gestiones;

-- Salir
exit;
```

---

## 🎯 Checklist Final

- [ ] Backup creado exitosamente
- [ ] Carpeta de backup copiada a PC nueva
- [ ] Docker Desktop instalado en PC nueva
- [ ] Script de restauración ejecutado
- [ ] Servicios Docker corriendo
- [ ] Base de datos importada
- [ ] Frontend accesible (http://localhost:5173)
- [ ] Login funciona
- [ ] Clientes visibles
- [ ] Gestiones de asesores presentes
- [ ] Historial completo
- [ ] Usuarios existen
- [ ] Reportes con datos

---

## 💡 Consejos

1. **Hacer backup regularmente** (semanal recomendado)
2. **Guardar backups en múltiples ubicaciones** (USB + nube)
3. **Verificar el backup antes de apagar la PC original**
4. **Documentar usuarios y contraseñas** por seguridad
5. **Probar el backup en otra PC antes de desinstalar original**

---

## 🆘 Soporte

Si algo sale mal:

1. Revisa la sección "Solución de Problemas"
2. Verifica los logs: `docker-compose logs`
3. Consulta el archivo `LEEME.txt` en el backup
4. No borres la PC original hasta verificar que todo funciona

---

**¡Tu CRM estará completamente migrado con todos los datos intactos!** 🚀
