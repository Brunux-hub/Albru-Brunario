# 🔄 Plan de Sincronización PC Local ↔ Servidor

## 📋 Resumen de Cambios

### Cambios en PC Local (Desarrollo - Phase 16-17)
- ✅ Sistema de validaciones automático
- ✅ Sistema de estadísticas diarias de asesores
- ✅ Correcciones TypeScript
- ✅ Triggers SQL nuevos
- ✅ Configuración Docker mejorada

### Datos en Servidor (Producción)
- ⚠️ 13,260 registros de clientes con fechas reales
- ⚠️ Scripts de importación CSV ejecutados

---

## 🎯 OPCIÓN 1: Push Código + Proteger Datos (RECOMENDADA)

### Paso 1: Backup en Servidor (ANTES DE PULL)

**Conectar al servidor vía SSH:**
```bash
ssh usuario@servidor-produccion
cd /ruta/proyecto/Albru-Brunario
```

**Hacer backup de base de datos:**
```bash
# Backup completo de la BD
docker compose exec db mysqldump -u albru -p albru > backup_pre_sync_$(date +%Y%m%d_%H%M%S).sql

# Backup solo tabla clientes (13,260 registros)
docker compose exec db mysqldump -u albru -p albru clientes > backup_clientes_pre_sync_$(date +%Y%m%d_%H%M%S).sql

# Backup de triggers y procedures
docker compose exec db mysqldump -u albru -p albru --routines --triggers --no-data > backup_estructura_pre_sync_$(date +%Y%m%d_%H%M%S).sql
```

**Verificar backups:**
```bash
ls -lh backup_*.sql
```

### Paso 2: Commit y Push desde PC Local

**En tu PC (Windows PowerShell):**
```powershell
# 1. Ver estado actual
git status

# 2. Agregar todos los cambios de código
git add backend/controllers/validadoresController.js
git add backend/routes/validadores.js
git add backend/migrations/006_sistema_validaciones.sql
git add backend/migrations/005_add_asesor_stats_daily.sql
git add backend/services/dailyStatsResetService.js
git add backend/server.js
git add backend/controllers/asesoresController.js
git add src/components/validaciones/
git add src/routes/ProfessionalRoutes.tsx
git add src/components/gtr/
git add docker-compose.yml

# 3. NO agregar scripts de importación CSV (solo están en servidor)
# git add import-csv-fechas.js  ❌ NO
# git add import-clientes-faltantes.js  ❌ NO

# 4. Commit con mensaje descriptivo
git commit -m "feat: Sistema de validaciones automático + Estadísticas diarias asesores

- Backend: Controller y rutas validadores con JWT
- Backend: Triggers SQL asignación automática validadores
- Backend: Sistema de estadísticas diarias (asesor_stats_daily)
- Backend: Service de reset automático de estadísticas
- Frontend: Componentes ValidacionesSummary y ValidacionesTable
- Frontend: Integración con endpoints validadores
- Frontend: Correcciones TypeScript (0 errores)
- Frontend: GtrAsesoresTable con columna reasignaciones
- Docker: Configuración para triggers MySQL
- Migración: 005 y 006 aplicadas"

# 5. Push al repositorio
git push origin main
```

### Paso 3: Pull en Servidor + Verificación

**En servidor:**
```bash
# 1. Verificar estado antes de pull
git status
git log --oneline -5

# 2. Hacer pull (sin perder datos locales)
git pull origin main

# 3. Verificar que NO se perdieron scripts CSV
ls -la import-*.js
```

### Paso 4: Aplicar Migraciones SQL

**Opción A: Docker Compose (Automático)**
```bash
# Las migraciones se aplicarán automáticamente al reiniciar
docker compose down
docker compose up -d

# Ver logs de aplicación de migraciones
docker compose logs backend | grep MIGRATION
docker compose logs db | grep -i "trigger\|function"
```

**Opción B: Manual (Control Total)**
```bash
# Aplicar migración 005
docker compose exec db mysql -u albru -p albru < backend/migrations/005_add_asesor_stats_daily.sql

# Aplicar migración 006
docker compose exec db mysql -u albru -p albru < backend/migrations/006_sistema_validaciones.sql

# Verificar triggers creados
docker compose exec db mysql -u albru -p albru -e "SHOW TRIGGERS FROM albru;"

# Verificar tablas nuevas
docker compose exec db mysql -u albru -p albru -e "SHOW TABLES LIKE '%stats%';"
docker compose exec db mysql -u albru -p albru -e "SHOW TABLES LIKE 'validacion%';"
```

### Paso 5: Verificar Integridad de Datos

```bash
# Verificar cantidad de clientes (debe ser 13,260)
docker compose exec db mysql -u albru -p albru -e "SELECT COUNT(*) FROM clientes;"

# Verificar fechas de creación (deben estar pobladas)
docker compose exec db mysql -u albru -p albru -e "
SELECT 
  COUNT(*) as total,
  COUNT(created_at) as con_fecha,
  MIN(created_at) as fecha_minima,
  MAX(created_at) as fecha_maxima
FROM clientes;"

# Verificar validadores creados
docker compose exec db mysql -u albru -p albru -e "
SELECT id, nombre, email, tipo FROM usuarios WHERE tipo = 'validador';"
```

### Paso 6: Testing Completo

```bash
# 1. Reiniciar backend
docker compose restart backend

# 2. Ver logs en tiempo real
docker compose logs -f backend

# 3. Probar endpoint validadores
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/validadores/mis-clientes

# 4. Probar endpoint estadísticas
curl http://localhost:3001/api/asesores
```

---

## 🔧 OPCIÓN 2: Merge Manual de Archivos (Alternativa)

Si el pull causa conflictos:

### Estrategia de Merge

```bash
# En servidor
git fetch origin main

# Ver diferencias ANTES de mergear
git diff main origin/main

# Merge con estrategia "ours" para archivos específicos
git merge origin/main --no-commit

# Si hay conflictos con scripts CSV, mantener versión local
git checkout --ours import-csv-fechas.js
git checkout --ours import-clientes-faltantes.js

# Agregar cambios resueltos
git add .
git commit -m "merge: Sincronización con desarrollo local - preservando datos de producción"
```

---

## 🛡️ OPCIÓN 3: Copia Selectiva de Archivos (Más Segura)

Si no confías en Git:

### Desde PC Local

**Comprimir solo archivos de código:**
```powershell
# Crear carpeta temporal
New-Item -ItemType Directory -Path "C:\temp\albru-sync"

# Copiar archivos específicos
$archivos = @(
    "backend\controllers\validadoresController.js",
    "backend\routes\validadores.js",
    "backend\migrations\006_sistema_validaciones.sql",
    "backend\migrations\005_add_asesor_stats_daily.sql",
    "backend\services\dailyStatsResetService.js",
    "backend\server.js",
    "backend\controllers\asesoresController.js",
    "docker-compose.yml"
)

foreach ($archivo in $archivos) {
    Copy-Item "c:\Users\DARIO\Albru-Brunario\$archivo" "C:\temp\albru-sync\" -Recurse -Force
}

# Copiar directorios completos
Copy-Item "c:\Users\DARIO\Albru-Brunario\src\components\validaciones" "C:\temp\albru-sync\src\components\" -Recurse
Copy-Item "c:\Users\DARIO\Albru-Brunario\src\routes\ProfessionalRoutes.tsx" "C:\temp\albru-sync\src\routes\"

# Comprimir
Compress-Archive -Path "C:\temp\albru-sync\*" -DestinationPath "C:\temp\albru-sync.zip"
```

**Transferir al servidor:**
```bash
# Opción A: SCP
scp C:\temp\albru-sync.zip usuario@servidor:/tmp/

# Opción B: FTP/SFTP
# Usar FileZilla o similar
```

**En servidor, descomprimir y aplicar:**
```bash
cd /tmp
unzip albru-sync.zip -d albru-sync-files

# Copiar archivos manualmente
cp -r albru-sync-files/backend/* /ruta/proyecto/Albru-Brunario/backend/
cp -r albru-sync-files/src/* /ruta/proyecto/Albru-Brunario/src/

# Reiniciar servicios
cd /ruta/proyecto/Albru-Brunario
docker compose restart backend frontend
```

---

## ✅ Checklist de Verificación Post-Sincronización

### Backend
- [ ] Backend arranca sin errores: `docker compose logs backend | tail -50`
- [ ] Rutas validadores montadas: Ver "✅ /api/validadores mounted"
- [ ] Triggers SQL creados: `SHOW TRIGGERS FROM albru;`
- [ ] Tablas nuevas existen: `SHOW TABLES LIKE '%stats%';`

### Base de Datos
- [ ] Cantidad de clientes intacta: `SELECT COUNT(*) FROM clientes;` = 13,260
- [ ] Fechas created_at pobladas: `SELECT COUNT(*) FROM clientes WHERE created_at IS NOT NULL;`
- [ ] Validadores creados: `SELECT * FROM usuarios WHERE tipo = 'validador';`
- [ ] Configuración validación: `SELECT * FROM validacion_config;`

### Frontend
- [ ] Build sin errores: `docker compose logs frontend`
- [ ] 0 errores TypeScript: Ver VS Code "Problems"
- [ ] Componentes validaciones renderizados
- [ ] Ruta /dashboard/validaciones accesible

### Funcionalidad
- [ ] Login validador funciona
- [ ] Estadísticas asesores se muestran en GTR
- [ ] Clientes se asignan automáticamente a validadores (probar con UPDATE)
- [ ] Aprobar/Rechazar cliente funciona

---

## 🚨 Plan de Rollback (Si algo falla)

```bash
# Restaurar base de datos
docker compose exec db mysql -u albru -p albru < backup_pre_sync_YYYYMMDD_HHMMSS.sql

# Restaurar código (git)
git reset --hard HEAD~1

# O restaurar archivos (copia manual)
# Descomprimir backup de archivos previo
```

---

## 📝 Notas Importantes

1. **Scripts CSV**: Los archivos `import-csv-fechas.js` y `import-clientes-faltantes.js` son **ONE-TIME SCRIPTS** que ya ejecutaste en servidor. NO necesitas sincronizarlos a tu PC local.

2. **Datos vs Código**: 
   - **Datos** (13,260 clientes) → Solo en BD servidor
   - **Código** (validadores, stats) → Sincronizar bidireccionalmente

3. **Migraciones SQL**: Son **idempotentes** (se pueden ejecutar múltiples veces sin romper nada). Usan `IF NOT EXISTS`.

4. **Docker Compose**: El cambio `--log-bin-trust-function-creators=1` es **necesario** para los triggers SQL.

---

## 🎯 Decisión Recomendada

**USAR OPCIÓN 1** porque:
- ✅ Git maneja la sincronización de código automáticamente
- ✅ Los datos en BD NO se tocan (son independientes del código)
- ✅ Migraciones SQL son seguras e idempotentes
- ✅ Tienes backups antes de cualquier cambio
- ✅ Puedes hacer rollback fácilmente

**Tiempo estimado**: 15-20 minutos

**Riesgo**: ⭐⭐☆☆☆ (Bajo - con backups)
