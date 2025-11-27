# 🤖 INSTRUCCIONES PARA GROK - MIGRACIÓN COMPLETA EN PC NUEVA

## 📋 RESUMEN EJECUTIVO

Este documento contiene **TODAS** las instrucciones paso a paso para configurar el sistema CRM Albru-Brunario en una PC nueva desde cero.

**Destinatario:** Grok (IA)
**Propósito:** Migración completa del sistema
**Tiempo estimado:** 45-60 minutos

---

## 🎯 PRERREQUISITOS

Antes de empezar, asegúrate de que la PC nueva tenga instalado:

1. ✅ **Git** (para clonar repositorio)
2. ✅ **Docker Desktop** (para contenedores)
3. ✅ **Python 3.8+** (para scripts de restauración)
4. ✅ **Node.js 18+** (para frontend/backend)

**Verificar instalaciones:**
```powershell
git --version
docker --version
python --version
node --version
npm --version
```

---

## 📦 PASO 1: CLONAR REPOSITORIO DESDE GITHUB

```powershell
# 1. Navegar a la carpeta donde quieres el proyecto
cd C:\Users\TuUsuario

# 2. Clonar repositorio
git clone https://github.com/Brunux-hub/Albru-Brunario.git

# 3. Entrar al directorio
cd Albru-Brunario

# 4. Verificar que se clonó correctamente
git status
git log --oneline -5
```

**Resultado esperado:**
```
On branch main
Your branch is up to date with 'origin/main'.
```

---

## 🔧 PASO 2: CONFIGURAR ARCHIVO .ENV

El archivo `.env` ya viene en el repositorio, pero debes verificar y ajustar según la red de la nueva PC.

```powershell
# Ver el archivo .env
Get-Content .env
```

**Valores importantes a verificar:**

```dotenv
# Base de datos (NO CAMBIAR)
DB_NAME=albru
DB_USER=albru
DB_PASSWORD=albru12345
DB_HOST=db
DB_PORT=3306

# Puertos (ajustar si hay conflictos)
BACKEND_PORT=3001
FRONTEND_PORT=5173
MYSQL_PORT=3308
ADMINER_PORT=8080

# URL del frontend (CAMBIAR según IP de la nueva PC)
FRONTEND_URL=http://192.168.X.X:5173
```

**Para obtener IP de la nueva PC:**
```powershell
ipconfig | Select-String "IPv4"
```

**Editar .env si es necesario:**
```powershell
notepad .env
```

---

## 🐳 PASO 3: INICIAR DOCKER Y CONTENEDORES

```powershell
# 1. Asegurarse de que Docker Desktop esté corriendo
# (Abrir Docker Desktop manualmente)

# 2. Verificar que Docker funciona
docker ps

# 3. Construir y levantar contenedores
docker-compose up -d --build

# 4. Verificar que todos los contenedores estén corriendo
docker ps
```

**Deberías ver 5 contenedores:**
- ✅ `albru-base` (MySQL 8.0)
- ✅ `albru-backend` (Node.js)
- ✅ `albru-frontend` (Vite/React)
- ✅ `albru-redis` (Redis)
- ✅ `albru-brunario-adminer-1` (Adminer)

**Si algún contenedor no inicia:**
```powershell
# Ver logs del contenedor problemático
docker logs albru-backend
docker logs albru-base

# Reintentar
docker-compose down
docker-compose up -d --build
```

---

## 💾 PASO 4: RESTAURAR BASE DE DATOS DESDE BACKUP

Tienes **DOS OPCIONES** para restaurar la BD:

### OPCIÓN A: Usar Script Python (RECOMENDADO) 🐍

```powershell
# 1. Instalar dependencias Python
pip install -r scripts/requirements.txt

# 2. Copiar archivo ZIP del backup a la carpeta backups/
# (El archivo viene desde la PC antigua, ej: backup_completo_20241126_210000.zip)
Copy-Item "D:\USB\backup_completo_20241126_210000.zip" -Destination "backups\"

# 3. Ejecutar script de restauración
python scripts/restaurar_backup.py
```

**El script te preguntará:**
1. Qué backup quieres restaurar (selecciona el más reciente)
2. Confirmación antes de sobrescribir archivos

**El script hace automáticamente:**
- ✅ Extrae el ZIP
- ✅ Restaura archivos del proyecto
- ✅ Restaura base de datos completa
- ✅ Verifica que todo esté correcto
- ✅ Muestra reporte final

### OPCIÓN B: Restaurar SQL Manualmente 📄

Si el script Python falla, usa este método:

```powershell
# 1. Copiar archivo SQL del backup
Copy-Item "D:\USB\backup_completo_20241126_210000.sql" -Destination "backups\"

# 2. Restaurar SQL en Docker
Get-Content "backups\backup_completo_20241126_210000.sql" | docker exec -i albru-base mysql -ualbru -palbru12345 albru

# 3. Verificar que se restauró
docker exec -i albru-base mysql -ualbru -palbru12345 -e "SELECT COUNT(*) as total_clientes FROM clientes;" albru
```

**Resultado esperado:**
```
total_clientes
14324
```

---

## 🔄 PASO 5: APLICAR MIGRACIÓN DE CONTADOR DE REASIGNACIONES

Esta migración agrega la nueva funcionalidad de contador de reasignaciones.

```powershell
# Aplicar migración SQL
Get-Content "backend\migrations\20241126_agregar_contador_reasignaciones.sql" | docker exec -i albru-base mysql -ualbru -palbru12345 albru

# Verificar que se aplicó
docker exec -i albru-base mysql -ualbru -palbru12345 -e "DESCRIBE clientes;" albru | Select-String "contador"
```

**Resultado esperado:**
```
contador_reasignaciones int     NO              0
```

---

## 🔧 PASO 6: INSTALAR DEPENDENCIAS

### Backend
```powershell
# 1. Entrar al contenedor backend
docker exec -it albru-backend bash

# 2. Instalar dependencias
npm install

# 3. Salir del contenedor
exit

# 4. Reiniciar backend
docker restart albru-backend
```

### Frontend
```powershell
# 1. Entrar al contenedor frontend
docker exec -it albru-frontend sh

# 2. Instalar dependencias
npm install

# 3. Salir del contenedor
exit

# 4. Reiniciar frontend
docker restart albru-frontend
```

---

## ✅ PASO 7: VERIFICAR QUE TODO FUNCIONA

### 1. Verificar Contenedores
```powershell
docker ps
```
Todos deben estar "Up" (corriendo).

### 2. Verificar Backend
```powershell
# Abrir en navegador
start http://localhost:3001/api/health

# O desde PowerShell
curl http://localhost:3001/api/health
```
Debe responder: `{"status":"ok"}`

### 3. Verificar Frontend
```powershell
# Abrir en navegador
start http://localhost:5173
```
Debe abrir la pantalla de login del CRM.

### 4. Verificar Base de Datos
```powershell
# Contar clientes
docker exec -i albru-base mysql -ualbru -palbru12345 -e "SELECT COUNT(*) FROM clientes;" albru

# Ver usuarios
docker exec -i albru-base mysql -ualbru -palbru12345 -e "SELECT id, nombre, email, tipo FROM usuarios LIMIT 5;" albru
```

### 5. Verificar Nuevo Campo
```powershell
# Ver clientes con contador de reasignaciones
docker exec -i albru-base mysql -ualbru -palbru12345 -e "SELECT id, nombre, asesor_asignado, contador_reasignaciones FROM clientes LIMIT 10;" albru
```

---

## 🧪 PASO 8: PROBAR SISTEMA CRUD PYTHON

```powershell
# Ejecutar sistema CRUD
python scripts/crud_clientes_sistema.py
```

**Menú esperado:**
```
╔═══════════════════════════════════════════════════════════╗
║          SISTEMA CRUD CLIENTES - ALBRU BRUNARIO          ║
╚═══════════════════════════════════════════════════════════╝

  [1] 🔍 Buscar Cliente
  [2] ➕ Crear Cliente
  [3] ✏️  Editar Cliente
  [4] 🗑️  Eliminar Cliente
  [5] 🔄 Sincronizar Frontend
  [6] 💾 Exportar Excel
  [0] 🚪 Salir

Opción: _
```

**Prueba básica:**
1. Seleccionar opción [1] (Buscar Cliente)
2. Buscar por teléfono: cualquier número
3. Verificar que muestra datos completos

---

## 🔐 PASO 9: ACCEDER AL SISTEMA

### Login Inicial
```
URL: http://localhost:5173
Usuario: admin@albru.com (o el usuario admin de tu BD)
Contraseña: (la contraseña configurada)
```

### Credenciales de Usuario Admin
Si no recuerdas las credenciales, consulta la BD:
```powershell
docker exec -i albru-base mysql -ualbru -palbru12345 -e "SELECT id, nombre, email, tipo FROM usuarios WHERE tipo='admin' LIMIT 5;" albru
```

### Cambiar Contraseña (Opcional)
```powershell
# Acceder a MySQL
docker exec -it albru-base mysql -ualbru -palbru12345 albru

# Actualizar contraseña (usa bcrypt hash en producción)
UPDATE usuarios SET password = '$2b$10$...' WHERE email = 'admin@albru.com';
exit
```

---

## 📊 PASO 10: VERIFICAR NUEVA FUNCIONALIDAD

### Ver Contador de Reasignaciones en Frontend

1. Login al sistema
2. Ir a **Panel de Validaciones**
3. Verificar que aparece columna **"Reasignaciones"**
4. Los badges deben mostrar:
   - 🟢 Verde "Original" (0 reasignaciones)
   - 🟡 Amarillo "1x", "2x" (1-2 reasignaciones)
   - 🔴 Rojo "3x+" (3+ reasignaciones)

### Probar Reasignación

1. Seleccionar un cliente
2. Reasignarlo a otro asesor
3. Verificar que el contador incrementa automáticamente

```powershell
# Verificar desde SQL
docker exec -i albru-base mysql -ualbru -palbru12345 -e "SELECT id, nombre, contador_reasignaciones FROM clientes WHERE contador_reasignaciones > 0 ORDER BY contador_reasignaciones DESC LIMIT 10;" albru
```

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### Problema: Contenedor no inicia

**Solución:**
```powershell
# Ver logs del contenedor
docker logs albru-backend

# Reiniciar contenedor específico
docker restart albru-backend

# Si persiste, reconstruir
docker-compose down
docker-compose up -d --build
```

### Problema: Error de conexión a BD

**Solución:**
```powershell
# Verificar que MySQL esté corriendo
docker ps | Select-String "albru-base"

# Verificar credenciales en .env
Get-Content .env | Select-String "DB_"

# Reiniciar MySQL
docker restart albru-base

# Esperar 10 segundos y probar conexión
Start-Sleep -Seconds 10
docker exec -i albru-base mysql -ualbru -palbru12345 -e "SELECT 1;" albru
```

### Problema: Frontend no carga

**Solución:**
```powershell
# Ver logs del frontend
docker logs albru-frontend

# Verificar que el puerto no esté ocupado
netstat -ano | Select-String "5173"

# Reconstruir frontend
docker-compose down
docker-compose up -d --build albru-frontend
```

### Problema: Script Python da error

**Solución:**
```powershell
# Reinstalar dependencias
pip uninstall -y mysql-connector-python pandas rich openpyxl
pip install -r scripts/requirements.txt

# Verificar versión Python
python --version
# Debe ser 3.8 o superior

# Probar conexión manual
python -c "import mysql.connector; print('OK')"
```

---

## 📝 COMANDOS ÚTILES DE MANTENIMIENTO

### Ver logs en tiempo real
```powershell
# Backend
docker logs -f albru-backend

# Frontend
docker logs -f albru-frontend

# MySQL
docker logs -f albru-base
```

### Acceder a contenedores
```powershell
# Backend (bash)
docker exec -it albru-backend bash

# Frontend (sh)
docker exec -it albru-frontend sh

# MySQL
docker exec -it albru-base mysql -ualbru -palbru12345 albru
```

### Backup manual
```powershell
# Usando script Python
python scripts/backup_y_diagnostico.py

# SQL manual
docker exec albru-base mysqldump -ualbru -palbru12345 --no-tablespaces --single-transaction albru > "backups\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
```

### Limpiar Docker
```powershell
# Detener todos los contenedores
docker-compose down

# Limpiar volúmenes (⚠️ CUIDADO: Elimina datos)
docker-compose down -v

# Limpiar imágenes no usadas
docker system prune -a
```

---

## 🎯 CHECKLIST FINAL

Antes de dar por completada la migración, verifica:

- [ ] Todos los contenedores están corriendo (`docker ps`)
- [ ] Backend responde en http://localhost:3001/api/health
- [ ] Frontend carga en http://localhost:5173
- [ ] Login funciona con credenciales correctas
- [ ] Panel de Validaciones muestra columna "Reasignaciones"
- [ ] Base de datos tiene los 14,324 clientes (o el número correcto)
- [ ] Campo `contador_reasignaciones` existe en tabla `clientes`
- [ ] Script CRUD Python funciona (`python scripts/crud_clientes_sistema.py`)
- [ ] Script de backup funciona (`python scripts/backup_y_diagnostico.py`)
- [ ] Script de restauración funciona (`python scripts/restaurar_backup.py`)

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **Manual de Usuario:** `manuales/MANUAL-USUARIO-SISTEMA-CRM.md`
- **Guía de Backup:** `GUIA-BACKUP-Y-MIGRACION.md`
- **Resumen de Soluciones:** `RESUMEN-SOLUCIONES.md`
- **Diagnóstico GTR:** `docs/DIAGNOSTICO-GTR-GESTIONES.md`
- **README Scripts Python:** `scripts/README.md`

---

## 🆘 CONTACTO Y SOPORTE

Si algo no funciona después de seguir todos los pasos:

1. Revisar logs de contenedores: `docker logs <container_name>`
2. Verificar archivo .env tiene valores correctos
3. Verificar que Docker Desktop tenga suficiente memoria (mínimo 4GB)
4. Consultar documentación adicional en carpeta `manuales/`

---

## ✅ ¡MIGRACIÓN COMPLETADA!

Si llegaste hasta aquí y todos los checks están ✅, el sistema está **100% operativo** en la nueva PC.

**Próximos pasos:**
1. Configurar usuarios adicionales si es necesario
2. Revisar permisos y roles
3. Configurar backups automáticos
4. Entrenar al equipo en las nuevas funcionalidades

---

**Fecha de este manual:** 26 de noviembre de 2024
**Versión del sistema:** v3.0 con contador de reasignaciones
**Autor:** Claude (Anthropic) bajo supervisión del equipo Albru-Brunario
