# 🚀 GUÍA DE DESPLIEGUE EN SERVIDOR LOCAL

## 📋 Requisitos Previos en el Servidor

- ✅ Docker Desktop instalado y corriendo
- ✅ Conexión por AnyDesk establecida
- ⚠️ Firewall configurado (lo haremos en el paso 6)

---

## 🔧 PASO 1: Preparar Archivos en tu PC

### Archivos que DEBES copiar al servidor:

```
Albru-Brunario/
├── docker-compose.yml          ← CRÍTICO: Orquestación de contenedores
├── .env.servidor               ← CRÍTICO: Variables de entorno (crear)
├── backend/                    ← Backend completo
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── index.js
│   └── [todos los archivos del backend]
├── src/                        ← Frontend completo
├── public/
├── nginx.conf                  ← Configuración nginx
├── Dockerfile                  ← Frontend Dockerfile
├── package.json
├── vite.config.ts
├── tsconfig.json
└── database/
    └── init.sql                ← Dump de la base de datos
```

---

## 🔧 PASO 2: Crear .env.servidor

Crea este archivo en tu PC (lo copiarás al servidor como `.env`):

```env
# CONFIGURACIÓN DEL SERVIDOR
NODE_ENV=production

# Base de datos
DB_HOST=albru-base
DB_USER=albru
DB_PASSWORD=albru12345
DB_NAME=albru
DB_ROOT_PASSWORD=root_password_here

# JWT
JWT_SECRET=albru_jwt_secret_key_2025_secure_production

# Puertos
BACKEND_PORT=3001
FRONTEND_PORT=80

# URLs - AJUSTAR CON LA IP DEL SERVIDOR
# Reemplaza 192.168.1.XXX con la IP real del servidor
VITE_API_URL=http://192.168.1.XXX:3001
VITE_BACKEND_URL=http://192.168.1.XXX:3001
VITE_WS_URL=http://192.168.1.XXX:3001

# CORS - Permitir acceso desde la red local
CORS_ORIGINS=http://192.168.1.XXX:5173,http://192.168.1.XXX,http://localhost:5173,http://localhost:3001,http://localhost
```

---

## 🔧 PASO 3: Exportar Base de Datos

En tu PC, ejecuta:

```powershell
# Exportar la base de datos actual
docker exec albru-base mysqldump -u albru -palbru12345 albru > database\init.sql

# Verificar que se creó el archivo
ls database\init.sql
```

---

## 📦 PASO 4: Comprimir Proyecto

```powershell
# Crear carpeta limpia para el servidor
New-Item -ItemType Directory -Force -Path .\deploy-servidor

# Copiar archivos necesarios
Copy-Item -Recurse -Force `
  docker-compose.yml, `
  nginx.conf, `
  Dockerfile, `
  package.json, `
  vite.config.ts, `
  tsconfig.json, `
  tsconfig.app.json, `
  tsconfig.node.json, `
  postcss.config.js, `
  tailwind.config.js, `
  eslint.config.js, `
  index.html, `
  backend, `
  src, `
  public, `
  database `
  -Destination .\deploy-servidor\

# Copiar .env.servidor como .env
Copy-Item .env.servidor .\deploy-servidor\.env
```

---

## 🌐 PASO 5: Transferir al Servidor (por AnyDesk)

### Opción A: Compartir Carpeta (Recomendado)
1. En AnyDesk: File Transfer → Copiar carpeta `deploy-servidor`
2. Pegar en el servidor en: `C:\AlbruApp\` (crear carpeta si no existe)

### Opción B: Comprimir y Copiar
```powershell
# En tu PC: Comprimir
Compress-Archive -Path .\deploy-servidor\* -DestinationPath .\albru-deploy.zip

# Copiar albru-deploy.zip por AnyDesk
# En el servidor: Descomprimir en C:\AlbruApp\
```

---

## 🔧 PASO 6: En el Servidor - Configurar IP

1. **Obtener IP del servidor:**
```powershell
# En el servidor, ejecutar:
ipconfig

# Buscar la IPv4 de tu red local (ejemplo: 192.168.1.100)
```

2. **Editar .env con la IP correcta:**
```powershell
# Abrir .env en el servidor
notepad C:\AlbruApp\.env

# Reemplazar TODAS las apariciones de 192.168.1.XXX con la IP real
# Ejemplo: Si IP es 192.168.1.100
VITE_API_URL=http://192.168.1.100:3001
VITE_BACKEND_URL=http://192.168.1.100:3001
VITE_WS_URL=http://192.168.1.100:3001
CORS_ORIGINS=http://192.168.1.100:5173,http://192.168.1.100,http://localhost:5173,http://localhost:3001,http://localhost
```

---

## 🚀 PASO 7: Levantar Docker en el Servidor

```powershell
# En el servidor:
cd C:\AlbruApp

# Verificar que Docker está corriendo
docker --version
docker ps

# Construir y levantar todos los servicios
docker compose up -d --build

# Ver logs para verificar que todo inició bien
docker compose logs -f

# Presiona Ctrl+C para salir de los logs
```

---

## 🗄️ PASO 8: Importar Base de Datos

```powershell
# En el servidor:
cd C:\AlbruApp

# Esperar 10 segundos a que MySQL esté listo
Start-Sleep -Seconds 10

# Importar el dump de la base de datos
Get-Content database\init.sql | docker exec -i albru-base mysql -u albru -palbru12345 albru

# Verificar que se importó correctamente
docker exec albru-base mysql -u albru -palbru12345 -e "SELECT COUNT(*) as total_usuarios FROM albru.usuarios;"
```

---

## 🔥 PASO 9: Configurar Firewall del Servidor

```powershell
# En el servidor (como Administrador):

# Permitir puerto 80 (Frontend)
New-NetFirewallRule -DisplayName "Albru Frontend" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Permitir puerto 3001 (Backend API)
New-NetFirewallRule -DisplayName "Albru Backend API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow

# Opcional: Puerto 3306 solo si quieres acceso directo a MySQL desde fuera
# New-NetFirewallRule -DisplayName "Albru MySQL" -Direction Inbound -Protocol TCP -LocalPort 3306 -Action Allow
```

---

## ✅ PASO 10: Verificar desde tu PC

1. **Obtener IP del servidor** (ejemplo: 192.168.1.100)

2. **Probar frontend:**
   ```
   http://192.168.1.100
   ```

3. **Probar backend API:**
   ```
   http://192.168.1.100:3001/health
   ```

4. **Login con credenciales:**
   - Admin: `admin@albru.com` / `admin123`
   - GTR: `mcaceresv@albru.pe` / `password`

---

## 🐛 Troubleshooting

### Problema: No puedo acceder desde mi PC
```powershell
# En el servidor, verificar que los contenedores están corriendo:
docker ps

# Deberías ver:
# - albru-frontend (puerto 80)
# - albru-backend (puerto 3001)
# - albru-base (MySQL)

# Verificar logs de errores:
docker compose logs backend
docker compose logs frontend
```

### Problema: Error de CORS
```powershell
# Verificar que las URLs en .env son correctas
Get-Content .env | Select-String "VITE_|CORS"

# Reconstruir frontend si cambiaste URLs:
docker compose up -d --build frontend
```

### Problema: Base de datos vacía
```powershell
# Reimportar la base de datos:
Get-Content database\init.sql | docker exec -i albru-base mysql -u albru -palbru12345 albru

# Verificar usuarios:
docker exec albru-base mysql -u albru -palbru12345 -e "SELECT id, nombre, email, tipo FROM albru.usuarios LIMIT 5;"
```

### Problema: Contenedores no inician
```powershell
# Ver logs detallados:
docker compose logs

# Reiniciar todo:
docker compose down
docker compose up -d --build
```

---

## 📱 Comandos Útiles en el Servidor

```powershell
# Ver estado de contenedores
docker ps -a

# Ver logs en tiempo real
docker compose logs -f

# Reiniciar un servicio específico
docker compose restart backend
docker compose restart frontend

# Detener todo
docker compose down

# Iniciar todo
docker compose up -d

# Ver uso de recursos
docker stats

# Limpiar imágenes antiguas (liberar espacio)
docker system prune -a
```

---

## 🎯 Checklist Final

- [ ] Docker instalado y corriendo en el servidor
- [ ] Archivos copiados a `C:\AlbruApp`
- [ ] Archivo `.env` configurado con IP correcta del servidor
- [ ] Base de datos exportada (`database\init.sql`)
- [ ] Contenedores levantados con `docker compose up -d --build`
- [ ] Base de datos importada correctamente
- [ ] Firewall configurado (puertos 80 y 3001)
- [ ] Acceso verificado desde tu PC: `http://IP_SERVIDOR`
- [ ] Login funciona correctamente

---

## 📞 Notas Importantes

1. **IP del servidor**: Anota la IP que uses (ejemplo: 192.168.1.100)
2. **Credenciales admin**: `admin@albru.com` / `admin123`
3. **Puertos usados**: 
   - Frontend: 80 (HTTP)
   - Backend: 3001 (API)
   - MySQL: 3306 (interno)
4. **Backups**: Guarda el archivo `database\init.sql` como backup
5. **Actualizaciones**: Para actualizar código, copia nuevos archivos y ejecuta `docker compose up -d --build`

---

¡Listo! 🎉 El sistema debería estar completamente funcional en el servidor.
