# 🚀 GUÍA VISUAL PASO A PASO - DESPLIEGUE AL SERVIDOR

## 📍 TU SITUACIÓN ACTUAL
- ✅ Estás en tu PC conectado por AnyDesk al servidor
- ✅ El servidor tiene Docker instalado
- ✅ Carpeta `deploy-servidor` lista con 11,715 archivos (306 MB)

---

## 🎯 PASOS SIMPLES

### PASO 1️⃣: Copiar Archivos al Servidor 📂

**En tu PC (donde estás ahora):**

1. Abre File Explorer
2. Ve a: `C:\Users\DARIO\Albru-Brunario\deploy-servidor`
3. Selecciona TODA la carpeta `deploy-servidor`

**Opciones para copiar:**

#### **Opción A: AnyDesk File Transfer (MÁS RÁPIDO)** ⭐
```
1. En AnyDesk, click en el ícono de carpeta 📁
2. Navega en TU PC a: C:\Users\DARIO\Albru-Brunario\
3. Arrastra la carpeta "deploy-servidor" al panel del SERVIDOR
4. Pegar en el servidor en: C:\AlbruApp\
```

#### **Opción B: Copiar/Pegar por Portapapeles**
```
1. Botón derecho en "deploy-servidor" → Copiar
2. En AnyDesk, click en la ventana del servidor
3. En el servidor: Abrir File Explorer → C:\
4. Crear carpeta: C:\AlbruApp\
5. Pegar (Ctrl+V) - Tardará ~5-10 minutos
```

**Al finalizar deberías tener:**
```
C:\AlbruApp\
├── backend\
├── src\
├── database\
│   └── init.sql  ← Base de datos (2.94 MB)
├── docker-compose.yml
├── .env  ← Configuración
├── instalar-servidor.ps1  ← Script mágico
└── ...más archivos
```

---

### PASO 2️⃣: Ejecutar Script de Instalación 🚀

**En el servidor (por AnyDesk):**

1. **Abrir PowerShell como Administrador:**
   ```
   Click en Inicio (Windows)
   Buscar: "PowerShell"
   Click derecho → "Ejecutar como administrador"
   ```

2. **Navegar a la carpeta:**
   ```powershell
   cd C:\AlbruApp
   ```

3. **Ejecutar el script mágico:**
   ```powershell
   .\instalar-servidor.ps1
   ```

**¿Qué hace el script automáticamente?**
- ✅ Detecta la IP del servidor
- ✅ Configura el archivo .env con la IP correcta
- ✅ Verifica que Docker esté instalado
- ✅ Construye los contenedores (Frontend, Backend, MySQL)
- ✅ Importa la base de datos completa
- ✅ Configura el Firewall de Windows
- ✅ Verifica que todo esté funcionando

**Tiempo estimado:** 5-10 minutos (la primera vez)

---

### PASO 3️⃣: Probar desde tu PC 🎉

**En tu PC (no en el servidor):**

1. **Obtén la IP del servidor:**
   - El script te la mostrará al final
   - O en el servidor ejecuta: `ipconfig` y busca la IPv4

2. **Abre tu navegador:**
   ```
   http://IP_DEL_SERVIDOR
   
   Ejemplo: http://192.168.1.100
   ```

3. **Login con credenciales:**
   ```
   Admin:  admin@albru.com / admin123
   GTR:    mcaceresv@albru.pe / password
   Asesor: jvenancioo@albru.pe / password
   ```

---

## 🐛 ¿Problemas?

### ❌ "No puedo acceder desde mi PC"

**En el servidor, ejecuta:**
```powershell
# Ver estado de los contenedores
docker ps

# Deberías ver 3 contenedores corriendo:
# - albru-frontend (puerto 80)
# - albru-backend (puerto 3001)
# - albru-base (MySQL)

# Si alguno no está, ver logs:
docker compose logs
```

### ❌ "Error al importar base de datos"

**En el servidor:**
```powershell
cd C:\AlbruApp

# Reimportar manualmente:
Get-Content database\init.sql | docker exec -i albru-base mysql -u albru -palbru12345 albru

# Verificar que se importó:
docker exec albru-base mysql -u albru -palbru12345 -e "SELECT COUNT(*) FROM albru.usuarios;"
# Debería mostrar: 23 usuarios
```

### ❌ "Firewall bloqueando"

**En el servidor (como Administrador):**
```powershell
# Abrir puerto 80 (Frontend)
New-NetFirewallRule -DisplayName "Albru Frontend" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Abrir puerto 3001 (Backend)
New-NetFirewallRule -DisplayName "Albru Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

### ❌ "Docker no inicia contenedores"

**En el servidor:**
```powershell
# Limpiar y reiniciar:
docker compose down
docker compose up -d --build

# Ver logs en tiempo real:
docker compose logs -f
# (Presiona Ctrl+C para salir)
```

---

## 📱 Comandos Útiles en el Servidor

```powershell
# Ver estado de contenedores
docker ps

# Ver logs de todos los servicios
docker compose logs

# Ver logs solo del backend
docker compose logs backend

# Reiniciar un servicio
docker compose restart backend

# Detener todo
docker compose down

# Iniciar todo
docker compose up -d

# Ver uso de recursos
docker stats
```

---

## 🎯 Checklist de Verificación

- [ ] Carpeta copiada a C:\AlbruApp en el servidor
- [ ] Script `instalar-servidor.ps1` ejecutado sin errores
- [ ] IP del servidor detectada correctamente
- [ ] 3 contenedores corriendo (`docker ps`)
- [ ] Base de datos importada (23 usuarios)
- [ ] Firewall configurado (puertos 80 y 3001)
- [ ] Puedo acceder desde mi PC: `http://IP_SERVIDOR`
- [ ] Login funciona correctamente

---

## 💡 Información Importante

### 🌐 URLs de Acceso
```
Frontend:     http://IP_SERVIDOR
Backend API:  http://IP_SERVIDOR:3001
Health Check: http://IP_SERVIDOR:3001/health
```

### 🔑 Credenciales
```
Admin:  admin@albru.com / admin123
GTR:    mcaceresv@albru.pe / password
Asesor: jvenancioo@albru.pe / password
```

### 📊 Información Técnica
```
Contenedores:
- albru-frontend → Puerto 80 (Nginx + React)
- albru-backend → Puerto 3001 (Node.js + Express)
- albru-base → Puerto 3306 (MySQL 8.0)

Base de Datos:
- Host: albru-base
- Usuario: albru
- Password: albru12345
- Database: albru
```

### 🔄 Actualizar el Sistema
```powershell
# Si necesitas actualizar código:
1. Copiar nuevos archivos a C:\AlbruApp
2. cd C:\AlbruApp
3. docker compose up -d --build
```

---

## 🎉 ¡Todo Listo!

Una vez completados todos los pasos:

1. ✅ El servidor estará corriendo 24/7 (mientras esté encendido)
2. ✅ Cualquier PC en la red puede acceder: `http://IP_SERVIDOR`
3. ✅ La base de datos persiste incluso si reinicias los contenedores
4. ✅ Los logs se guardan automáticamente

**¡Disfruta tu sistema CRM desplegado! 🚀**

---

## 📞 Soporte

Si tienes algún problema:
1. Revisa los logs: `docker compose logs`
2. Verifica el estado: `docker ps`
3. Revisa esta guía: `DEPLOY-SERVIDOR.md`
