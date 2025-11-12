# Plan de Sincronización Segura PC Local ↔ Servidor

**Fecha**: 12 de noviembre de 2025  
**Objetivo**: Sincronizar código del sistema de validaciones sin perder datos de producción

---

## 📋 RESUMEN DE CAMBIOS

### Código Nuevo en PC Local (Seguro para push):
1. ✅ Sistema de Validaciones (Phase 16-17)
2. ✅ Sistema de Estadísticas Diarias (Phase 15)
3. ✅ Correcciones TypeScript
4. ✅ Configuración Docker actualizada

### Datos en Servidor Producción (NO tocar):
- ⚠️ 13,260 registros de clientes con fechas reales
- ⚠️ Scripts de importación CSV ejecutados
- ⚠️ Base de datos poblada

---

## 🎯 ESTRATEGIA: Push Código + Pull Selectivo

### VENTAJAS:
✅ No perderás los datos del servidor
✅ El servidor obtendrá las nuevas funcionalidades
✅ Sincronización bidireccional segura
✅ Rollback fácil si hay problemas

---

## 📝 PASOS DETALLADOS

### **FASE 1: En PC Local (Donde Desarrollaste)**

#### Paso 1.1: Verificar Estado Git
```powershell
# Ver archivos modificados
git status

# Ver cambios en detalle
git diff
```

#### Paso 1.2: Crear Backup Local (Seguridad)
```powershell
# Crear backup de la base de datos local
docker exec albru-mysql mysqldump -u root -prootpassword albru_db > backup_local_pre_sync_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# Crear backup del código
git branch backup-local-$(Get-Date -Format 'yyyyMMdd-HHmmss')
```

#### Paso 1.3: Commit de Cambios Locales
```powershell
# Agregar SOLO archivos de código (NO archivos de datos)
git add backend/controllers/validadoresController.js
git add backend/routes/validadores.js
git add backend/migrations/006_sistema_validaciones.sql
git add backend/services/dailyStatsResetService.js
git add backend/migrations/005_add_asesor_stats_daily.sql
git add backend/controllers/asesoresController.js
git add src/components/validaciones/ValidacionesSummary.tsx
git add src/components/validaciones/ValidacionesTable.tsx
git add src/routes/ProfessionalRoutes.tsx
git add src/components/gtr/GtrAsesoresTable.tsx
git add backend/server.js
git add docker-compose.yml

# Ver qué se va a commitear
git status

# Commit con mensaje descriptivo
git commit -m "feat: Sistema de Validaciones + Estadísticas Diarias

- Sistema de validaciones automático con asignación round-robin
- Endpoints /api/validadores/* con autenticación JWT
- Dashboard de validaciones con aprobar/rechazar clientes
- Sistema de estadísticas diarias para asesores
- Triggers SQL para auto-asignación de validadores
- Correcciones TypeScript en componentes
- WebSocket notifications para cambios de estado

Phase 16-17: Sistema de Validaciones
Phase 15: Estadísticas Diarias"
```

#### Paso 1.4: Push al Repositorio
```powershell
# Subir cambios a GitHub
git push origin main

# Verificar que se subió correctamente
git log --oneline -5
```

---

### **FASE 2: En Servidor Producción**

**⚠️ IMPORTANTE**: Ejecutar estos comandos conectado por SSH/RDP al servidor.

#### Paso 2.1: Backup del Servidor (CRÍTICO)
```bash
# Crear backup COMPLETO de la base de datos (incluye los 13,260 registros)
docker exec albru-mysql mysqldump -u root -prootpassword albru_db > backup_servidor_pre_sync_$(date +%Y%m%d_%H%M%S).sql

# Verificar tamaño del backup
ls -lh backup_servidor_*.sql

# Comprimir backup (opcional)
gzip backup_servidor_*.sql

# Crear backup de código actual
git branch backup-servidor-$(date +%Y%m%d-%H%M%S)
```

#### Paso 2.2: Verificar Estado Actual
```bash
# Ver si hay cambios locales en servidor
git status

# Si hay archivos sin commitear (como scripts CSV), guardarlos
git stash save "Scripts CSV y cambios locales servidor"
```

#### Paso 2.3: Pull de Cambios (Código Nuevo)
```bash
# Traer código nuevo desde GitHub
git pull origin main

# Verificar qué archivos se actualizaron
git log --stat -1
```

#### Paso 2.4: Aplicar Migraciones SQL (SOLO SI NO EXISTEN)
```bash
# Verificar si las migraciones ya se aplicaron
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SHOW TABLES LIKE 'asesor_stats_daily';"
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SHOW TABLES LIKE 'validador_stats_daily';"

# Si NO existen, aplicar migraciones:
docker exec -i albru-mysql mysql -u root -prootpassword albru_db < backend/migrations/005_add_asesor_stats_daily.sql
docker exec -i albru-mysql mysql -u root -prootpassword albru_db < backend/migrations/006_sistema_validaciones.sql

# Verificar triggers creados
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SHOW TRIGGERS LIKE 'clientes';"
```

#### Paso 2.5: Reinstalar Dependencias (Si Cambiaron)
```bash
# Ver si package.json cambió
git diff HEAD~1 backend/package.json

# Si cambió, reinstalar dependencias en contenedor
docker exec albru-backend npm install
```

#### Paso 2.6: Reiniciar Servicios
```bash
# Opción A: Reinicio suave (solo backend)
docker compose restart backend

# Opción B: Rebuild completo (si cambiaron Dockerfiles)
docker compose down
docker compose up -d --build

# Verificar logs
docker compose logs -f backend
```

#### Paso 2.7: Verificar Datos Intactos
```bash
# Contar clientes (debe seguir siendo 13,260)
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SELECT COUNT(*) AS total_clientes FROM clientes;"

# Verificar fechas (deben existir)
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SELECT COUNT(*) AS con_fechas FROM clientes WHERE created_at IS NOT NULL;"

# Ver rango de fechas
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SELECT MIN(created_at) AS primera_fecha, MAX(created_at) AS ultima_fecha FROM clientes;"
```

---

### **FASE 3: Testing Funcionalidad Nueva en Servidor**

#### Paso 3.1: Probar Endpoints Backend
```bash
# Obtener token de validador
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"npalacioss@albru.pe","password":"PASSWORD"}' \
  | jq -r '.token')

# Probar endpoint de estadísticas
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/validadores/mis-estadisticas

# Probar endpoint de clientes
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/validadores/mis-clientes
```

#### Paso 3.2: Probar Frontend
```
1. Abrir navegador: http://IP_SERVIDOR
2. Login como validador: npalacioss@albru.pe
3. Verificar redirección a /dashboard/validaciones
4. Verificar que carguen estadísticas
5. Verificar que cargue tabla vacía (aún no hay clientes PREVENTA COMPLETA)
```

#### Paso 3.3: Probar Asignación Automática
```bash
# Marcar un cliente como PREVENTA COMPLETA
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "
UPDATE clientes 
SET estatus_comercial_subcategoria = 'PREVENTA COMPLETA' 
WHERE id = 1;
"

# Verificar asignación automática (trigger)
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "
SELECT id, nombre, validador_asignado, fecha_asignacion_validador 
FROM clientes WHERE id = 1;
"

# Verificar stats actualizadas
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "
SELECT * FROM validador_stats_daily WHERE fecha = CURDATE();
"
```

---

## ✅ CHECKLIST FINAL

### En PC Local:
- [ ] Backup local creado
- [ ] Cambios commiteados
- [ ] Push exitoso a GitHub
- [ ] Verificado en GitHub.com que los archivos están

### En Servidor:
- [ ] Backup servidor creado (13,260 registros)
- [ ] Git pull exitoso
- [ ] Migraciones SQL aplicadas
- [ ] Servicios reiniciados
- [ ] Logs sin errores
- [ ] Datos verificados (COUNT = 13,260)
- [ ] Fechas intactas
- [ ] Login validador funciona
- [ ] Dashboard validaciones carga
- [ ] Trigger asignación funciona

---

## 🆘 ROLLBACK (Si Algo Sale Mal)

### En Servidor:
```bash
# PASO 1: Volver código anterior
git reset --hard backup-servidor-YYYYMMDD-HHMMSS

# PASO 2: Restaurar base de datos (si se corrompió)
docker exec -i albru-mysql mysql -u root -prootpassword albru_db < backup_servidor_pre_sync_YYYYMMDD_HHMMSS.sql

# PASO 3: Reiniciar servicios
docker compose restart

# PASO 4: Verificar datos
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SELECT COUNT(*) FROM clientes;"
```

---

## 📊 VERIFICACIÓN POST-SINCRONIZACIÓN

### Comandos de Verificación Rápida:
```bash
# Ver versión del código
git log --oneline -1

# Ver cantidad de clientes
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SELECT COUNT(*) FROM clientes;"

# Ver tablas nuevas
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SHOW TABLES LIKE '%stats_daily';"

# Ver triggers
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SHOW TRIGGERS;"

# Ver logs backend
docker compose logs --tail=50 backend
```

---

## 🎯 RESULTADO ESPERADO

Después de ejecutar este plan:

✅ **Servidor tendrá**:
- Sistema de Validaciones funcionando
- Sistema de Estadísticas Diarias activo
- **13,260 registros de clientes intactos**
- Fechas reales preservadas
- Nuevos endpoints API
- Triggers automáticos funcionando

✅ **PC Local tendrá**:
- Código sincronizado con servidor
- Posibilidad de hacer pull en el futuro
- Backup de seguridad

---

## ⚠️ ADVERTENCIAS IMPORTANTES

1. **NUNCA** ejecutar scripts de importación CSV en local si ya están en servidor
2. **SIEMPRE** hacer backup antes de pull/push
3. **VERIFICAR** que git pull no sobrescriba archivos de datos (.sql, .csv)
4. **EXCLUIR** archivos de datos del repositorio (agregar a .gitignore)

---

## 📝 NOTAS ADICIONALES

### Archivos que NO deben estar en Git:
```
# Agregar a .gitignore
*.csv
import-csv-*.js
import-clientes-*.js
backup_*.sql
clientes_*.txt
```

### Comandos Útiles:
```bash
# Ver diferencias entre local y remoto
git fetch
git diff origin/main

# Ver qué archivos cambiarán con pull
git fetch
git diff --name-only origin/main

# Ver estadísticas del servidor
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "
SELECT 
  (SELECT COUNT(*) FROM clientes) as total_clientes,
  (SELECT COUNT(*) FROM usuarios WHERE tipo='validador') as total_validadores,
  (SELECT COUNT(*) FROM clientes WHERE validador_asignado IS NOT NULL) as clientes_asignados,
  (SELECT COUNT(*) FROM clientes WHERE created_at IS NOT NULL) as clientes_con_fecha;
"
```

---

## 🎓 LECCIONES APRENDIDAS

Para futuras sincronizaciones:

1. **Separar código de datos**: Nunca mezclar scripts de importación con código de aplicación
2. **Usar migraciones SQL**: Las migraciones deben ser idempotentes (se pueden ejecutar múltiples veces sin romper)
3. **Documentar cambios en BD**: Mantener registro de qué migraciones se aplicaron en cada ambiente
4. **Automatizar backups**: Configurar backups automáticos antes de deployments

---

**Autor**: GitHub Copilot  
**Proyecto**: Albru-Brunario CRM  
**Versión**: 1.0 - Sistema de Validaciones
