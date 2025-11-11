# 🚀 GUÍA RÁPIDA: QUÉ HACER EN EL SERVIDOR

## 📍 Situación Actual

✅ **En tu PC (donde estás ahora):**
- Código actualizado y subido a Git
- Base de datos exportada (2.94 MB)
- Scripts de instalación listos
- Todo commitado y pusheado

✅ **En el servidor (por AnyDesk):**
- Docker instalado
- Git conectado al repositorio

---

## 🎯 LO QUE DEBES HACER AHORA

### OPCIÓN 1: Que Claude del Servidor lo Haga Todo (RECOMENDADO) 🤖

1. **Abre Claude en el servidor** (por AnyDesk)

2. **Copia y pega este mensaje a Claude del servidor:**

```
Hola Claude! Necesito que despliegues el sistema Albru CRM en este servidor.

El repositorio es: https://github.com/Brunux-hub/Albru-Brunario.git

Por favor:
1. Haz git pull para actualizar el código
2. Lee el archivo README-CLAUDE-SERVIDOR.md
3. Sigue las instrucciones en INSTRUCCIONES-PARA-CLAUDE-SERVIDOR.md
4. Ejecuta el script deploy-servidor/instalar-servidor.ps1 como Administrador

Todo debe funcionar automáticamente. Reporta la IP del servidor y verifica que el sistema funciona.
```

3. **Claude del servidor hará TODO automáticamente** ✨

---

### OPCIÓN 2: Hacerlo Manualmente (Si no tienes Claude en el servidor)

1. **En el servidor, abrir PowerShell como Administrador:**
   - Click derecho en Inicio → PowerShell (Admin)

2. **Navegar al proyecto:**
   ```powershell
   cd C:\Users\[USUARIO]\Albru-Brunario
   # Si no existe, clonar: git clone https://github.com/Brunux-hub/Albru-Brunario.git
   ```

3. **Actualizar código:**
   ```powershell
   git pull origin main
   ```

4. **Ejecutar script de instalación:**
   ```powershell
   .\deploy-servidor\instalar-servidor.ps1
   ```

5. **Esperar 5-10 minutos** mientras se construyen los contenedores

6. **Al finalizar, verás la IP del servidor y las URLs de acceso**

---

## 📋 ¿Qué Hace el Script Automáticamente?

El script `instalar-servidor.ps1` hace TODO por ti:

1. ✅ Detecta la IP del servidor (ejemplo: 192.168.1.100)
2. ✅ Crea archivo `.env` con la IP correcta
3. ✅ Verifica que Docker esté corriendo
4. ✅ Construye los 3 contenedores:
   - Frontend (React + Nginx) → Puerto 80
   - Backend (Node.js + Express) → Puerto 3001
   - MySQL 8.0 → Puerto 3306
5. ✅ Importa la base de datos completa (database/init.sql)
6. ✅ Configura el Firewall de Windows (puertos 80 y 3001)
7. ✅ Verifica que todo funciona
8. ✅ Te muestra la IP y credenciales

**Tiempo estimado:** 5-10 minutos (la primera vez)

---

## ✅ Resultado Esperado

Al finalizar verás algo así:

```
========================================
✅ DESPLIEGUE COMPLETADO
========================================

🌐 URLs DE ACCESO:
  • Frontend:     http://192.168.1.100
  • Backend API:  http://192.168.1.100:3001
  • Health Check: http://192.168.1.100:3001/health

🔑 CREDENCIALES DE ACCESO:
  • Admin:  admin@albru.com / admin123
  • GTR:    mcaceresv@albru.pe / password
  • Asesor: jvenancioo@albru.pe / password

CONTAINER NAME         STATUS          PORTS
albru-frontend         Up 2 minutes    0.0.0.0:80->80/tcp
albru-backend          Up 2 minutes    0.0.0.0:3001->3001/tcp
albru-base            Up 2 minutes    3306/tcp

🎉 ¡Sistema listo para usar!

💡 Prueba accediendo desde cualquier PC en la red:
   http://192.168.1.100
```

---

## 🌐 Verificar desde Tu PC

Una vez que el script termine en el servidor:

1. **Anota la IP que te muestre** (ejemplo: 192.168.1.100)

2. **En tu PC, abre tu navegador:**
   ```
   http://192.168.1.100
   ```

3. **Login con credenciales admin:**
   ```
   Email: admin@albru.com
   Password: admin123
   ```

4. **¡Deberías entrar al sistema!** 🎉

---

## 🐛 Si Algo Sale Mal

### En el servidor, ejecutar:

```powershell
# Ver estado de contenedores
docker ps

# Ver logs si hay errores
docker compose logs -f

# Reiniciar todo si es necesario
docker compose down
docker compose up -d --build
```

### Si el Firewall está bloqueando:

```powershell
# Abrir puertos manualmente (como Admin):
New-NetFirewallRule -DisplayName "Albru Frontend" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Albru Backend API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

---

## 📁 Archivos Importantes en el Servidor

Después del `git pull`, estos archivos estarán disponibles:

```
Albru-Brunario/
├── README-CLAUDE-SERVIDOR.md               ← Resumen rápido para Claude
├── INSTRUCCIONES-PARA-CLAUDE-SERVIDOR.md   ← Instrucciones detalladas
├── DEPLOY-SERVIDOR.md                      ← Documentación completa
├── deploy-servidor/
│   ├── instalar-servidor.ps1              ← SCRIPT MÁGICO ⭐
│   ├── GUIA-VISUAL.md                      ← Guía paso a paso
│   └── README-INSTALACION.md               ← Referencia rápida
├── database/
│   └── init.sql                            ← Base de datos (2.94 MB)
├── docker-compose.yml                      ← Configuración Docker
├── .env.servidor                           ← Template de configuración
└── [resto del código fuente]
```

---

## 📝 Comandos Útiles para el Servidor

```powershell
# Ver contenedores corriendo
docker ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs solo del backend
docker compose logs backend -f

# Reiniciar un servicio
docker compose restart backend

# Detener todo
docker compose down

# Iniciar todo
docker compose up -d

# Ver uso de recursos
docker stats

# Ver IP del servidor
ipconfig
```

---

## 🎯 Checklist Final

- [ ] Git pull ejecutado en el servidor
- [ ] Script `instalar-servidor.ps1` ejecutado como Admin
- [ ] Script terminó sin errores
- [ ] IP del servidor anotada (ej: 192.168.1.100)
- [ ] 3 contenedores corriendo (`docker ps`)
- [ ] Base de datos importada (~23 usuarios)
- [ ] Puedo acceder desde mi PC: `http://IP_SERVIDOR`
- [ ] Login funciona con admin@albru.com / admin123

---

## 💡 Información Técnica

**Contenedores:**
- `albru-frontend` → Nginx + React (Puerto 80)
- `albru-backend` → Node.js + Express (Puerto 3001)
- `albru-base` → MySQL 8.0 (Puerto 3306)

**Base de Datos:**
- Host: albru-base
- Usuario: albru
- Password: albru12345
- Database: albru
- Tamaño: ~3 MB (23+ usuarios, clientes, etc.)

**Usuarios del Sistema:**
- 1 Admin (admin@albru.com)
- 1 GTR (mcaceresv@albru.pe)
- 21+ Asesores

**Características:**
- ✅ Dashboard profesional con Material-UI
- ✅ Sistema de seguimiento en tiempo real
- ✅ Gestión de clientes con validaciones
- ✅ Autenticación con JWT y bcrypt
- ✅ Historial de cambios completo
- ✅ Asignación automática de asesores
- ✅ Categorización con wizard
- ✅ Diseño profesional moderno

---

## 🎉 ¡Listo!

Una vez que el script termine:

1. ✅ El sistema estará disponible 24/7
2. ✅ Accesible desde cualquier PC en la red: `http://IP_SERVIDOR`
3. ✅ Base de datos persistente (no se pierde al reiniciar)
4. ✅ Logs automáticos para debugging
5. ✅ Actualizaciones fáciles (`git pull` + `docker compose up -d --build`)

**¡Disfruta tu CRM desplegado en el servidor!** 🚀

---

## 📞 Próximos Pasos

Después de verificar que todo funciona:

1. **Probar todas las funcionalidades:**
   - Login con diferentes roles (Admin, GTR, Asesor)
   - Crear/editar clientes
   - Asignar asesores
   - Ver historial de cambios

2. **Crear backups regulares:**
   ```powershell
   # Backup de la base de datos
   docker exec albru-base mysqldump -u albru -palbru12345 --no-tablespaces albru > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
   ```

3. **Monitorear logs periódicamente:**
   ```powershell
   docker compose logs --tail=100
   ```

4. **Documentar la IP del servidor** para referencia futura

---

**¿Listo para empezar?** 
**Ve al servidor y ejecuta el script o pídele a Claude que lo haga!** 🎯
