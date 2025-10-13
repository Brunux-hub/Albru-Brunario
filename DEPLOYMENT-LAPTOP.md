# Guía de Despliegue en Laptop Corporativa

Esta guía te ayudará a configurar y ejecutar la aplicación Albru en una laptop que funcionará como servidor para la red local.

## Requisitos Previos

- Docker Desktop instalado y ejecutándose
- PowerShell (Windows) con permisos de administrador
- Acceso a la red Wi-Fi corporativa
- Puerto 3001, 5173 y 8080 disponibles

## Configuración Paso a Paso

### 1. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basado en `.env.example`:

```powershell
# Copia el archivo de ejemplo
Copy-Item .env.example .env

# Edita el .env con tus valores reales
notepad .env
```

**Variables importantes a configurar:**

```bash
# Base de datos (usa las credenciales reales)
DB_PASSWORD=A1Br1@2025
DB_USER=albru
DB_NAME=albru

# Seguridad (OBLIGATORIO cambiar)
JWT_SECRET=tu_clave_jwt_muy_larga_y_segura_aqui

# Entorno
NODE_ENV=production
```

### 2. Proteger el Archivo .env

```powershell
# Restringir permisos del archivo .env (solo tu usuario)
icacls .env /inheritance:r
icacls .env /grant:r "$env:USERNAME:(R,W)"
icacls .env /remove Users
```

### 3. Configurar Firewall para Acceso LAN

Ejecuta el script como administrador para permitir acceso desde la red local:

```powershell
# Abre PowerShell como Administrador y ejecuta:
cd C:\ruta\a\proyecto
.\scripts\configure-firewall-lan.ps1

# Para usar una subred específica:
.\scripts\configure-firewall-lan.ps1 -LanSubnet "192.168.1.0/24"
```

### 4. Levantar los Servicios

```powershell
# Desde la carpeta del proyecto
docker compose --env-file .env up -d --build

# Verificar que los contenedores están corriendo
docker compose ps

# Ver logs del backend
docker compose logs -f backend
```

### 5. Verificar la Configuración

**En la laptop (local):**
```powershell
# Verificar puertos activos
Get-NetTCPConnection -LocalPort 3001
netstat -ano | Select-String ":3001"

# Probar conexión local
curl http://localhost:3001/
```

**Desde otra máquina en la red:**
```bash
# Reemplaza con la IP real de la laptop
curl http://198.168.1.10:3001/

# O desde navegador
http://198.168.1.10:5173  # Frontend
http://198.168.1.10:8080  # Adminer (admin BD)
```

### 6. Configurar Auto-inicio (Opcional)

Para que la aplicación se inicie automáticamente al arrancar la laptop:

1. Abrir **Programador de tareas** (Task Scheduler)
2. Crear tarea básica:
   - **Nombre:** Albru Docker Startup
   - **Desencadenador:** Al iniciar el equipo
   - **Acción:** Iniciar programa
   - **Programa:** `powershell.exe`
   - **Argumentos:** `-c "cd 'C:\ruta\a\proyecto'; docker compose --env-file .env up -d"`

## Solución de Problemas

### Error de conexión a la base de datos
```powershell
# Verificar logs de la BD
docker compose logs db

# Reiniciar solo el servicio backend
docker compose restart backend
```

### Puerto ocupado
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :3001

# Cambiar puerto en .env si es necesario
# BACKEND_PORT=3002
```

### Firewall bloqueando conexiones
```powershell
# Verificar reglas activas
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Albru*"}

# Reconfigurar firewall
.\scripts\configure-firewall-lan.ps1 -Remove
.\scripts\configure-firewall-lan.ps1
```

## Comandos Útiles

```powershell
# Ver estado de servicios
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Reiniciar servicios
docker compose restart

# Parar servicios
docker compose down

# Parar y eliminar volúmenes (CUIDADO: borra datos)
docker compose down -v

# Actualizar imagen y reiniciar
docker compose up -d --build
```

## Seguridad

- El archivo `.env` nunca se sube al repositorio
- Solo dispositivos en la red local pueden acceder
- Usar contraseñas fuertes para JWT_SECRET y DB_PASSWORD
- Considerar VPN para acceso remoto fuera de la oficina

## Puertos de la Aplicación

- **3001:** Backend API
- **5173:** Frontend web
- **8080:** Adminer (administrador de base de datos)
- **3307:** MySQL (solo acceso local a la BD)