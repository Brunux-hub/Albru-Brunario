# 🚀 Despliegue con Docker - Albru-Brunario

Este proyecto incluye configuración completa de Docker para levantar el backend de Node.js, MySQL y Adminer de forma automática.

## Requisitos previos

- ✅ **Docker Desktop** instalado y corriendo
- ✅ **Git** para clonar/actualizar el repositorio
- ✅ **Windows** con WSL2 habilitado (para Docker Desktop)

## 🎯 Despliegue automático (recomendado)

### Paso 1: Actualizar el repositorio
```powershell
git pull origin main
```

### Paso 2: Ejecutar script de despliegue
```powershell
# Desde la raíz del proyecto (donde está docker-compose.yml)
.\deploy-docker.ps1
```

El script automáticamente:
- ✅ Verifica que Docker esté instalado
- ✅ Crea el archivo `.env` desde `.env.example`
- ✅ Detecta conflictos de puerto (MySQL local)
- ✅ Limpia contenedores previos
- ✅ Levanta MySQL, Backend y Adminer
- ✅ Importa la base de datos automáticamente
- ✅ Verifica que todo funcione

## 📋 Despliegue manual

Si prefieres ejecutar los comandos paso a paso:

```powershell
# 1. Crear archivo de configuración
Copy-Item .env.example .env
# (Edita .env si necesitas cambiar credenciales)

# 2. Limpiar y levantar servicios
docker compose down -v
docker compose up --build -d

# 3. Verificar estado
docker compose ps
docker compose logs -f
```

## 🌐 Acceso a los servicios

Una vez desplegado, tendrás acceso a:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Backend API** | http://localhost:3001 | API REST con endpoints de clientes y asesores |
| **Adminer** | http://localhost:8080 | Interfaz web para gestionar la base de datos |
| **MySQL** | localhost:3306 | Base de datos (acceso directo desde apps externas) |

### 🔧 Credenciales para Adminer
- **Servidor:** `db`
- **Usuario:** `root` (o `albru`)
- **Contraseña:** Ver archivo `.env` (DB_ROOT_PASSWORD o DB_PASSWORD)
- **Base de datos:** `albru`

## 🧪 Probar los endpoints

```powershell
# Obtener cliente por ID
Invoke-RestMethod -Uri "http://localhost:3001/api/clientes/1" -Method GET

# Buscar cliente por DNI
Invoke-RestMethod -Uri "http://localhost:3001/api/clientes/dni/12345678" -Method GET

# Buscar cliente por LEAD
Invoke-RestMethod -Uri "http://localhost:3001/api/clientes/lead/LEAD001" -Method GET

# Buscar clientes
Invoke-RestMethod -Uri "http://localhost:3001/api/clientes/search?q=juan" -Method GET
```

## 🛠️ Comandos útiles

```powershell
# Ver estado de contenedores
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs específicos
docker compose logs backend --tail 50
docker compose logs db --tail 50

# Parar servicios (mantiene datos)
docker compose down

# Parar y limpiar todo (borra datos)
docker compose down -v

# Reiniciar solo un servicio
docker compose restart backend
```

## 🔧 Solución de problemas comunes

### Puerto 3306 ocupado
Si tienes MySQL instalado localmente:
```powershell
# Detener MySQL local temporalmente
Stop-Service MySQL80

# Después del desarrollo, reiniciarlo
Start-Service MySQL80
```

### Backend no se conecta a la base de datos
```powershell
# Ver logs del backend
docker compose logs backend

# Verificar conectividad a MySQL desde el contenedor
docker exec -it albru-backend sh -c 'ping db'
```

### Importación de base de datos falló
```powershell
# Importar manualmente
docker exec -i albru-base sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" albru' < src/database/albru_completo_mysql.sql
```

### Empezar completamente desde cero
```powershell
# Borrar todo y empezar limpio
docker compose down -v
docker system prune -f
.\deploy-docker.ps1
```

## 📁 Estructura del proyecto

```
Albru-Brunario/
├── docker-compose.yml      # Configuración de servicios
├── .env.example           # Plantilla de variables de entorno
├── deploy-docker.ps1      # Script de despliegue automático
├── backend/
│   ├── Dockerfile         # Imagen del backend
│   ├── server.js          # Servidor Express
│   └── ...
└── src/database/
    └── albru_completo_mysql.sql  # Datos iniciales
```

## 🚀 Desarrollo

Para desarrollo activo con recarga automática:
```powershell
# Backend en modo desarrollo (fuera de Docker)
cd backend
npm run dev

# Base de datos en Docker
docker compose up db adminer -d
```

## 📞 Soporte

Si encuentras problemas:
1. Ejecuta `docker compose logs` y comparte la salida
2. Verifica que Docker Desktop esté corriendo
3. Asegúrate de estar en la raíz del proyecto
4. Revisa que no haya conflictos de puertos