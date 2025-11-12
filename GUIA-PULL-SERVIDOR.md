# 🚀 Guía Rápida: Pull en Servidor de Producción

**Fecha**: 12 de noviembre de 2025  
**Commit**: `b184b5b` - Sistema de Validaciones + Estadísticas Diarias  
**Archivos**: 18 archivos modificados (1,864 inserciones)

---

## ⚠️ ANTES DE EMPEZAR

### ✅ Lo que se va a actualizar:
- Sistema de Validaciones (backend + frontend)
- Sistema de Estadísticas Diarias
- Correcciones TypeScript
- Nuevas rutas y endpoints
- Migraciones SQL (triggers automáticos)

### 🛡️ Lo que NO se tocará:
- ✅ 13,260 registros de clientes (intactos)
- ✅ Fechas reales de creación (preservadas)
- ✅ Datos de producción (seguros)

---

## 📝 PASOS EN EL SERVIDOR

### **PASO 1: Crear Backup de Seguridad** ⚠️ CRÍTICO

```bash
# Backup COMPLETO de la base de datos (incluye los 13,260 registros)
docker exec albru-mysql mysqldump -u root -prootpassword albru_db > backup_servidor_$(date +%Y%m%d_%H%M%S).sql

# Verificar que se creó correctamente
ls -lh backup_servidor_*.sql

# Debe mostrar algo como:
# -rw-r--r-- 1 user user 25M Nov 12 10:30 backup_servidor_20251112_103045.sql

# Comprimir backup (opcional, ahorra espacio)
gzip backup_servidor_*.sql
```

**✅ VERIFICACIÓN**: Debes ver el archivo de backup con tamaño > 20 MB

---

### **PASO 2: Crear Branch de Respaldo**

```bash
# Crear branch de respaldo del código actual
git branch backup-servidor-$(date +%Y%m%d-%H%M%S)

# Verificar que se creó
git branch

# Debe mostrar algo como:
# * main
#   backup-servidor-20251112-103045
```

**✅ VERIFICACIÓN**: Debes ver el nuevo branch en la lista

---

### **PASO 3: Guardar Cambios Locales (Si Existen)**

```bash
# Ver si hay cambios sin commitear
git status

# Si muestra archivos modificados (como scripts CSV), guardarlos:
git stash save "Scripts CSV y cambios locales servidor - $(date +%Y%m%d)"

# Si NO hay cambios, verás:
# "nothing to commit, working tree clean"
```

---

### **PASO 4: Hacer Pull de GitHub**

```bash
# Traer los cambios del repositorio
git pull origin main

# Deberías ver:
# Updating 820ac99..b184b5b
# Fast-forward
#  18 files changed, 1864 insertions(+), 125 deletions(-)
#  create mode 100644 PLAN-SINCRONIZACION-SEGURA.md
#  create mode 100644 backend/controllers/validadoresController.js
#  create mode 100644 backend/migrations/006_sistema_validaciones.sql
#  ... etc
```

**✅ VERIFICACIÓN**: Debes ver "18 files changed"

---

### **PASO 5: Verificar Archivos Descargados**

```bash
# Ver qué se actualizó
git log --stat -1

# Verificar que existen los archivos nuevos
ls -la backend/controllers/validadoresController.js
ls -la backend/routes/validadores.js
ls -la backend/migrations/006_sistema_validaciones.sql
ls -la PLAN-SINCRONIZACION-SEGURA.md

# Todos deben existir
```

---

### **PASO 6: Verificar Base de Datos ANTES de Migraciones**

```bash
# Contar clientes (debe ser 13,260)
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SELECT COUNT(*) as total FROM clientes;"

# Verificar fechas (deben existir)
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SELECT COUNT(*) as con_fechas FROM clientes WHERE created_at IS NOT NULL;"

# Ver rango de fechas
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SELECT MIN(created_at) as primera, MAX(created_at) as ultima FROM clientes;"
```

**✅ RESULTADO ESPERADO**:
```
total: 13260
con_fechas: 13260
primera: 2025-01-29
ultima: 2025-09-30
```

---

### **PASO 7: Verificar si Migraciones Ya Están Aplicadas**

```bash
# Verificar tabla asesor_stats_daily
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SHOW TABLES LIKE 'asesor_stats_daily';"

# Verificar tabla validador_stats_daily
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SHOW TABLES LIKE 'validador_stats_daily';"

# Verificar triggers
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SHOW TRIGGERS LIKE 'clientes';"
```

**Si las tablas NO existen**, continúa con PASO 8.  
**Si YA existen**, salta al PASO 9.

---

### **PASO 8: Aplicar Migraciones SQL** (SOLO SI NO EXISTEN)

```bash
# Aplicar migración 005 (estadísticas diarias asesores)
docker exec -i albru-mysql mysql -u root -prootpassword albru_db < backend/migrations/005_add_asesor_stats_daily.sql

# Verificar que se creó
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "DESCRIBE asesor_stats_daily;"

# Aplicar migración 006 (sistema validaciones)
docker exec -i albru-mysql mysql -u root -prootpassword albru_db < backend/migrations/006_sistema_validaciones.sql

# Verificar que se creó
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "DESCRIBE validador_stats_daily;"

# Verificar triggers
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SHOW TRIGGERS;"
```

**✅ RESULTADO ESPERADO**: Debes ver 2 triggers:
- `auto_asignar_validador`
- `actualizar_stats_validacion`

---

### **PASO 9: Reinstalar Dependencias del Backend**

```bash
# Verificar si package.json cambió
git diff HEAD~1 backend/package.json

# Si cambió, reinstalar:
docker exec albru-backend npm install

# Si NO cambió, puedes saltarte este paso
```

---

### **PASO 10: Reiniciar Servicios**

```bash
# Opción A: Reinicio suave (recomendado)
docker compose restart backend

# Esperar 5-10 segundos

# Verificar logs (no debe haber errores)
docker compose logs --tail=50 backend

# Deberías ver:
# ✓ Servidor corriendo en puerto 3001
# ✓ Conexión a base de datos exitosa
# ✓ Rutas cargadas: /api/validadores
```

**Si hay errores**, usa Opción B:

```bash
# Opción B: Rebuild completo
docker compose down
docker compose up -d --build

# Verificar logs
docker compose logs -f backend
```

---

### **PASO 11: Verificar Datos DESPUÉS de Migraciones**

```bash
# Contar clientes (debe seguir siendo 13,260)
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SELECT COUNT(*) FROM clientes;"

# Verificar fechas intactas
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SELECT COUNT(*) FROM clientes WHERE created_at IS NOT NULL;"

# Verificar que NO se duplicaron registros
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SELECT MAX(id) as ultimo_id FROM clientes;"
```

**✅ RESULTADO ESPERADO**:
```
COUNT(*): 13260
con_fechas: 13260
ultimo_id: 13260
```

**⚠️ SI LOS NÚMEROS NO COINCIDEN**: Ejecuta rollback (ver PASO 15)

---

### **PASO 12: Verificar Nuevas Tablas Creadas**

```bash
# Ver todas las tablas
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SHOW TABLES;"

# Deberías ver (entre otras):
# - asesor_stats_daily
# - validador_stats_daily
# - clientes
# - usuarios
# - historial_estados

# Ver estructura de tabla validador_stats_daily
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "DESCRIBE validador_stats_daily;"
```

---

### **PASO 13: Testing de Endpoints Backend**

```bash
# Login como validador para obtener token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"npalacioss@albru.pe","password":"TU_PASSWORD_AQUI"}' \
  | jq

# Guardar el token que retorna
# Luego probar endpoint de estadísticas:

curl -H "Authorization: Bearer TU_TOKEN_AQUI" \
  http://localhost:3001/api/validadores/mis-estadisticas \
  | jq

# Debe retornar:
# {
#   "success": true,
#   "estadisticas": {
#     "clientes_asignados": 0,
#     "clientes_validados": 0,
#     "pendientes": 0,
#     "clientes_aprobados": 0,
#     "clientes_rechazados": 0
#   }
# }
```

---

### **PASO 14: Testing de Frontend**

```bash
# 1. Abrir navegador en IP del servidor
http://TU_IP_SERVIDOR

# 2. Login con usuario validador:
Email: npalacioss@albru.pe
Password: [tu password]

# 3. Verificar redirección automática a:
/dashboard/validaciones

# 4. Deberías ver:
- ✅ 6 tarjetas de estadísticas (todas en 0)
- ✅ Tabla vacía (aún no hay clientes PREVENTA COMPLETA)
- ✅ Sin errores en consola del navegador (F12)

# 5. Probar asignación automática:
```

```bash
# En terminal del servidor, marcar un cliente como PREVENTA COMPLETA
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "
UPDATE clientes 
SET estatus_comercial_subcategoria = 'PREVENTA COMPLETA' 
WHERE id = 1;
"

# Verificar que se asignó validador automáticamente (trigger)
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "
SELECT id, nombre, validador_asignado, fecha_asignacion_validador 
FROM clientes WHERE id = 1;
"

# Debe mostrar:
# validador_asignado: 15 o 16 (ID del validador)
# fecha_asignacion_validador: 2025-11-12 [hora actual]
```

```bash
# 6. Refrescar página /dashboard/validaciones
# Deberías ver:
- ✅ Estadística "Asignados Hoy" aumentó a 1
- ✅ Estadística "Pendientes" aumentó a 1
- ✅ Cliente aparece en la tabla
- ✅ Se muestra tipo de plan y monto
- ✅ Botones de aprobar/rechazar funcionan
```

---

## ✅ CHECKLIST FINAL

Marca cada ítem al completarlo:

### Base de Datos:
- [ ] Backup creado (archivo > 20 MB)
- [ ] Clientes = 13,260
- [ ] Fechas intactas (13,260 con created_at)
- [ ] Tablas nuevas creadas (asesor_stats_daily, validador_stats_daily)
- [ ] Triggers creados (auto_asignar_validador, actualizar_stats_validacion)

### Backend:
- [ ] Pull ejecutado sin errores
- [ ] Migraciones aplicadas
- [ ] Servicios reiniciados
- [ ] Logs sin errores
- [ ] Endpoint /api/validadores/mis-estadisticas funciona
- [ ] Endpoint /api/validadores/mis-clientes funciona

### Frontend:
- [ ] Login validador funciona
- [ ] Redirección a /dashboard/validaciones OK
- [ ] Dashboard carga sin errores
- [ ] Estadísticas se muestran
- [ ] Tabla se carga
- [ ] Cliente de prueba aparece (después de UPDATE)
- [ ] Botones aprobar/rechazar funcionan

---

## 🆘 ROLLBACK (Si Algo Sale Mal)

### Si los datos se corrompieron:

```bash
# PASO 1: Restaurar base de datos
gunzip backup_servidor_YYYYMMDD_HHMMSS.sql.gz  # Si lo comprimiste
docker exec -i albru-mysql mysql -u root -prootpassword albru_db < backup_servidor_YYYYMMDD_HHMMSS.sql

# PASO 2: Verificar restauración
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "SELECT COUNT(*) FROM clientes;"

# PASO 3: Volver código anterior
git reset --hard backup-servidor-YYYYMMDD-HHMMSS

# PASO 4: Reiniciar servicios
docker compose restart

# PASO 5: Verificar
docker compose logs backend
```

### Si solo el backend tiene errores:

```bash
# Ver logs detallados
docker compose logs --tail=100 backend

# Reiniciar solo backend
docker compose restart backend

# Si persiste, rebuild:
docker compose up -d --build backend
```

---

## 📊 COMANDOS ÚTILES DE VERIFICACIÓN

### Ver estadísticas completas:
```bash
docker exec albru-mysql mysql -u root -prootpassword albru_db -e "
SELECT 
  (SELECT COUNT(*) FROM clientes) as total_clientes,
  (SELECT COUNT(*) FROM clientes WHERE created_at IS NOT NULL) as con_fechas,
  (SELECT COUNT(*) FROM usuarios WHERE tipo='validador') as validadores,
  (SELECT COUNT(*) FROM clientes WHERE validador_asignado IS NOT NULL) as asignados,
  (SELECT COUNT(*) FROM clientes WHERE estatus_comercial_subcategoria='PREVENTA COMPLETA') as pendientes;
"
```

### Ver logs en tiempo real:
```bash
docker compose logs -f backend
```

### Ver procesos:
```bash
docker compose ps
```

### Ver uso de recursos:
```bash
docker stats
```

---

## 🎯 RESULTADO ESPERADO FINAL

Después de completar todos los pasos:

✅ **Base de Datos**:
- 13,260 clientes con fechas reales (preservadas)
- 2 tablas nuevas (stats_daily)
- 2 triggers automáticos funcionando

✅ **Backend**:
- Sistema de validaciones activo
- Endpoints /api/validadores/* funcionando
- WebSocket notifications activas
- Stats diarias reiniciando a medianoche

✅ **Frontend**:
- Dashboard validaciones funcionando
- Login validador → redirección automática
- Aprobar/Rechazar clientes operativo
- Estadísticas en tiempo real

✅ **Código**:
- Sincronizado con GitHub
- 0 errores TypeScript
- Documentación actualizada

---

## 📞 SOPORTE

Si tienes problemas:

1. **Verifica logs**: `docker compose logs backend`
2. **Revisa checklist**: ¿Falta algún paso?
3. **Consulta backup**: Siempre puedes hacer rollback
4. **Verifica datos**: Los 13,260 registros deben estar intactos

---

## 📝 NOTAS IMPORTANTES

- ⚠️ **NUNCA** ejecutes los scripts `import-csv-*.js` en el servidor (ya están ejecutados)
- ⚠️ **SIEMPRE** crea backup antes de cualquier cambio en producción
- ✅ Las migraciones SQL son **idempotentes** (se pueden ejecutar múltiples veces)
- ✅ Los datos CSV están excluidos del repositorio (.gitignore)

---

**Autor**: GitHub Copilot  
**Proyecto**: Albru-Brunario CRM  
**Versión**: Sistema de Validaciones v1.0  
**Commit**: b184b5b
