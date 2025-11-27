# 📖 MANUAL DE USUARIO - SISTEMA CRM ALBRU-BRUNARIO

## 🎯 GUÍA RÁPIDA DE USO DIARIO

**Para:** Usuario administrador del sistema
**Propósito:** Operación diaria y mantenimiento básico
**Última actualización:** 26 de noviembre de 2024

---

## 📋 ÍNDICE

1. [Inicio Rápido](#inicio-rápido)
2. [Sistema CRUD Python](#sistema-crud-python)
3. [Backups y Restauración](#backups-y-restauración)
4. [Panel Web - Validaciones](#panel-web---validaciones)
5. [Nuevo: Contador de Reasignaciones](#nuevo-contador-de-reasignaciones)
6. [Comandos Útiles](#comandos-útiles)
7. [Solución de Problemas](#solución-de-problemas)

---

## 🚀 INICIO RÁPIDO

### Iniciar el Sistema

```powershell
# 1. Abrir PowerShell en la carpeta del proyecto
cd C:\Users\USER\Albru-Brunario

# 2. Iniciar Docker (si no está corriendo)
docker-compose up -d

# 3. Verificar que todo esté corriendo
docker ps
```

**Debes ver 5 contenedores activos** ✅

### Acceder al Sistema Web

```
URL: http://localhost:5173
Usuario: tu_email@albru.com
Contraseña: tu_contraseña
```

### Detener el Sistema

```powershell
# Detener contenedores (sin borrar datos)
docker-compose down

# Detener y limpiar todo (⚠️ borra datos temporales)
docker-compose down -v
```

---

## 🐍 SISTEMA CRUD PYTHON

### ¿Qué es?

Sistema de **consola interactivo** para gestionar clientes directamente desde la base de datos.

### ¿Cuándo usarlo?

- Búsquedas rápidas de clientes
- Correcciones masivas de datos
- Exportar datos a Excel
- Sincronizar con frontend

### Iniciar el Sistema

```powershell
# Ejecutar
python scripts/crud_clientes_sistema.py
```

### Menú Principal

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

### Opción 1: Buscar Cliente 🔍

**Puedes buscar por:**
- Teléfono (con o sin +51)
- DNI
- ID del cliente
- Nombre completo o parcial

**Ejemplo:**
```
Buscar Cliente
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ingrese criterio (teléfono/DNI/ID/nombre): 945123456

✅ Cliente encontrado:

┌─────────────────────────────────────────────────────┐
│ ID: 1234                                            │
│ Nombre: JUAN PÉREZ GARCÍA                          │
│ DNI: 12345678                                       │
│ Teléfono: +51945123456                             │
│ Asesor: Andrea Yanel                               │
│ Estado: Gestionado                                 │
│ Plan: Fibra 300 Mbps                               │
│ Precio: S/. 89.90                                  │
│ Reasignaciones: 2 veces                            │
└─────────────────────────────────────────────────────┘

Historial de Gestiones:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 20/11/2024 14:30 - Completó wizard (Andrea)
📅 18/11/2024 10:15 - Reasignado a Andrea (Sistema)
📅 15/11/2024 09:00 - Primer contacto (Carlos)
```

### Opción 2: Crear Cliente ➕

**Datos requeridos:**
- Nombre completo
- DNI
- Teléfono
- Asesor asignado

**El sistema automáticamente:**
- Valida que no exista el DNI/teléfono
- Normaliza el teléfono a formato +51XXXXXXXXX
- Inicializa contador de reasignaciones en 0
- Registra en historial

### Opción 3: Editar Cliente ✏️

**Puedes editar:**
- Datos personales (nombre, DNI, teléfono)
- Asesor asignado (incrementa contador)
- Plan y precio
- Estado del cliente

**⚠️ IMPORTANTE:** 
Al cambiar de asesor, el **contador de reasignaciones** se incrementa automáticamente.

### Opción 4: Eliminar Cliente 🗑️

**Solo para casos extremos:**
- Datos de prueba
- Duplicados confirmados
- Clientes erróneos

**⚠️ CUIDADO:** Esta acción **NO se puede deshacer**.

### Opción 5: Sincronizar Frontend 🔄

**¿Qué hace?**
Exporta todos los datos a archivos JSON que usa el frontend web.

**Archivos generados:**
- `backend/public/clientes.json`
- `backend/public/asesores.json`
- `backend/public/usuarios.json`
- `backend/public/gestiones.json`

**Cuándo usar:**
- Después de hacer cambios masivos
- Si el frontend muestra datos desactualizados
- Después de importar clientes nuevos

### Opción 6: Exportar Excel 💾

**Genera:**
Archivo Excel con **5 pestañas:**
1. Clientes (datos completos)
2. Historial de Gestiones
3. Asesores
4. Estadísticas Diarias
5. Resumen General

**Ubicación:**
`exports/export_clientes_YYYYMMDD_HHMMSS.xlsx`

**Ideal para:**
- Análisis externo
- Reportes para gerencia
- Backup en formato legible

---

## 💾 BACKUPS Y RESTAURACIÓN

### Crear Backup Completo

```powershell
# Opción 1: Usar script Python (RECOMENDADO)
python scripts/backup_y_diagnostico.py
```

**¿Qué incluye el backup?**
- ✅ Base de datos completa (SQL)
- ✅ Todos los JSON del sistema
- ✅ Código fuente (backend + frontend)
- ✅ Archivos de configuración (.env)
- ✅ Logs y diagnósticos

**Resultado:**
Archivo ZIP en `backups/backup_completo_YYYYMMDD_HHMMSS.zip`

### Backup SQL Manual

```powershell
# Solo la base de datos
docker exec albru-base mysqldump -ualbru -palbru12345 --no-tablespaces --single-transaction albru > "backups\backup_manual_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
```

### Restaurar Backup en Otra PC

```powershell
# 1. Copiar el ZIP a la nueva PC en carpeta backups/

# 2. Ejecutar script de restauración
python scripts/restaurar_backup.py

# 3. Seguir las instrucciones en pantalla
```

El script **automáticamente**:
- Extrae el backup
- Restaura archivos del proyecto
- Restaura la base de datos
- Verifica que todo esté correcto

---

## 🌐 PANEL WEB - VALIDACIONES

### Acceder al Panel

1. Login en http://localhost:5173
2. Ir a **Panel de Validaciones**

### Nueva Columna: Reasignaciones

Ahora verás una nueva columna con badges de colores:

| Badge | Color | Significado |
|-------|-------|-------------|
| **Original** | 🟢 Verde | Cliente con su primer asesor (0 reasignaciones) |
| **1x**, **2x** | 🟡 Amarillo | Cliente reasignado 1-2 veces |
| **3x**, **4x+** | 🔴 Rojo | Cliente reasignado 3 o más veces |

### Interpretación

- **Verde (Original):** ✅ Cliente estable, nunca reasignado
- **Amarillo (1-2x):** ⚠️ Precaución, ha sido reasignado
- **Rojo (3x+):** 🚫 **EVITAR REASIGNAR** - Ya pasó por muchos asesores

### Uso Práctico

**Antes de reasignar un cliente, verifica:**
1. ¿Cuántas veces ha sido reasignado?
2. Si tiene badge rojo, **evitar** reasignarlo nuevamente
3. Investigar por qué ha pasado por tantos asesores

**Consulta útil:**
```sql
-- Ver clientes con más reasignaciones
SELECT 
    id, nombre, telefono, 
    asesor_asignado,
    contador_reasignaciones,
    fecha_wizard_completado
FROM clientes
WHERE contador_reasignaciones > 0
ORDER BY contador_reasignaciones DESC
LIMIT 20;
```

---

## 🆕 NUEVO: CONTADOR DE REASIGNACIONES

### ¿Qué es?

Campo automático que cuenta cuántas veces un cliente ha sido **reasignado** entre asesores.

### ¿Cómo funciona?

**Automático:**
- Se inicializa en **0** para clientes nuevos
- Se **incrementa +1** cada vez que cambias el asesor
- Se calcula desde el historial existente

**Manual (si es necesario):**
```sql
-- Recalcular contador para un cliente
UPDATE clientes 
SET contador_reasignaciones = (
    SELECT COUNT(*) 
    FROM historial_estados 
    WHERE cliente_id = 1234 
    AND tipo = 'reasignacion'
)
WHERE id = 1234;
```

### ¿Para qué sirve?

**1. Priorización de asignaciones**
- Mantener clientes estables con el mismo asesor
- Identificar clientes problemáticos

**2. Métricas de calidad**
- Medir estabilidad de asignaciones
- Evaluar necesidad de capacitación

**3. Alertas tempranas**
- Cliente con 3+ reasignaciones = posible problema
- Requiere atención especial

### Reportes Útiles

**Estadísticas generales:**
```sql
SELECT 
    CASE 
        WHEN contador_reasignaciones = 0 THEN '0 reasignaciones'
        WHEN contador_reasignaciones BETWEEN 1 AND 2 THEN '1-2 reasignaciones'
        WHEN contador_reasignaciones BETWEEN 3 AND 5 THEN '3-5 reasignaciones'
        ELSE '6+ reasignaciones'
    END as categoria,
    COUNT(*) as cantidad
FROM clientes
GROUP BY categoria;
```

**Por asesor:**
```sql
SELECT 
    u.nombre as asesor,
    COUNT(c.id) as total_clientes,
    SUM(CASE WHEN c.contador_reasignaciones = 0 THEN 1 ELSE 0 END) as originales,
    SUM(CASE WHEN c.contador_reasignaciones > 0 THEN 1 ELSE 0 END) as reasignados,
    ROUND(AVG(c.contador_reasignaciones), 2) as promedio
FROM usuarios u
LEFT JOIN clientes c ON c.asesor_asignado = u.id
WHERE u.tipo = 'asesor' AND c.wizard_completado = 1
GROUP BY u.id, u.nombre
ORDER BY promedio DESC;
```

---

## 🛠️ COMANDOS ÚTILES

### Verificar Estado del Sistema

```powershell
# Ver contenedores
docker ps

# Ver logs en tiempo real
docker logs -f albru-backend
docker logs -f albru-frontend

# Reiniciar un contenedor
docker restart albru-backend
```

### Base de Datos

```powershell
# Acceder a MySQL
docker exec -it albru-base mysql -ualbru -palbru12345 albru

# Dentro de MySQL:
SHOW TABLES;
SELECT COUNT(*) FROM clientes;
SELECT COUNT(*) FROM usuarios WHERE tipo = 'asesor';
exit
```

### Verificar Nuevo Campo

```powershell
# Ver estructura de tabla clientes
docker exec -i albru-base mysql -ualbru -palbru12345 -e "DESCRIBE clientes;" albru | Select-String "contador"

# Ver clientes con reasignaciones
docker exec -i albru-base mysql -ualbru -palbru12345 -e "SELECT id, nombre, contador_reasignaciones FROM clientes WHERE contador_reasignaciones > 0 LIMIT 10;" albru
```

### Limpiar Sistema

```powershell
# Limpiar logs antiguos
Remove-Item "logs\*.log" -Force

# Limpiar exports antiguos
Remove-Item "exports\*.xlsx" -Exclude "*$(Get-Date -Format 'yyyyMMdd')*"

# Limpiar backups antiguos (dejar últimos 5)
Get-ChildItem "backups\backup_completo_*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 5 | Remove-Item -Force
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Problema: No puedo acceder al sistema web

**Solución:**
```powershell
# 1. Verificar que frontend esté corriendo
docker ps | Select-String "albru-frontend"

# 2. Ver logs del frontend
docker logs albru-frontend

# 3. Reiniciar frontend
docker restart albru-frontend

# 4. Esperar 10 segundos y abrir navegador
Start-Sleep -Seconds 10
start http://localhost:5173
```

### Problema: Script Python da error

**Solución:**
```powershell
# 1. Verificar Python
python --version

# 2. Reinstalar dependencias
pip install -r scripts/requirements.txt

# 3. Verificar conexión a BD
docker ps | Select-String "albru-base"

# 4. Si persiste, revisar .env
Get-Content .env | Select-String "DB_"
```

### Problema: Backend no responde

**Solución:**
```powershell
# 1. Ver logs del backend
docker logs albru-backend

# 2. Verificar que BD esté corriendo
docker ps | Select-String "albru-base"

# 3. Reiniciar backend
docker restart albru-backend

# 4. Verificar health
curl http://localhost:3001/api/health
```

### Problema: No veo la columna "Reasignaciones"

**Solución:**
```powershell
# 1. Verificar que se aplicó la migración
docker exec -i albru-base mysql -ualbru -palbru12345 -e "DESCRIBE clientes;" albru | Select-String "contador"

# 2. Si no aparece, aplicar migración
Get-Content "backend\migrations\20241126_agregar_contador_reasignaciones.sql" | docker exec -i albru-base mysql -ualbru -palbru12345 albru

# 3. Reiniciar backend y frontend
docker restart albru-backend albru-frontend

# 4. Limpiar caché del navegador (Ctrl + Shift + R)
```

---

## 📞 SOPORTE TÉCNICO

### Documentación Completa

- **📘 Instrucciones para Grok:** `manuales/INSTRUCCIONES-PARA-GROK-MIGRACION-COMPLETA.md`
- **📗 Guía de Backup:** `GUIA-BACKUP-Y-MIGRACION.md`
- **📙 Scripts Python:** `scripts/README.md`
- **📕 Diagnóstico GTR:** `docs/DIAGNOSTICO-GTR-GESTIONES.md`

### Logs Importantes

```powershell
# Ver todos los logs
Get-ChildItem logs\

# Ver log más reciente
Get-Content (Get-ChildItem logs\ | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
```

### Backup de Emergencia

```powershell
# Crear backup inmediato
python scripts/backup_y_diagnostico.py

# O manual
docker exec albru-base mysqldump -ualbru -palbru12345 --no-tablespaces albru > "backups\emergencia_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
```

---

## ✅ CHECKLIST DIARIO

### Inicio del día
- [ ] Verificar que Docker esté corriendo
- [ ] Verificar que los 5 contenedores estén activos
- [ ] Hacer login en el sistema web
- [ ] Verificar que el backend responde

### Fin del día
- [ ] Crear backup si hubo cambios importantes
- [ ] Revisar logs por errores
- [ ] Limpiar archivos temporales si es necesario

### Semanal
- [ ] Crear backup completo
- [ ] Revisar métricas de reasignaciones
- [ ] Limpiar backups antiguos (dejar últimos 5)
- [ ] Exportar reporte Excel para gerencia

---

## 🎯 TIPS Y MEJORES PRÁCTICAS

### Gestión de Clientes

1. **Antes de reasignar**, verifica el contador de reasignaciones
2. **Clientes con badge rojo**, requieren atención especial
3. **Usa el sistema CRUD** para búsquedas rápidas
4. **Sincroniza frontend** después de cambios masivos

### Backups

1. **Crea backup semanal** mínimo
2. **Antes de migración**, crea backup completo
3. **Guarda backups en USB/nube** además del servidor
4. **Prueba restauración** al menos una vez al mes

### Performance

1. **Reinicia contenedores** semanalmente
2. **Limpia logs antiguos** mensualmente
3. **Actualiza dependencias** cuando sea necesario
4. **Monitorea uso de disco** en Docker

---

**Última actualización:** 26 de noviembre de 2024
**Versión del sistema:** 3.0 con contador de reasignaciones
**Preparado por:** Claude (Anthropic) para equipo Albru-Brunario

---

¿Necesitas ayuda? Consulta la documentación completa en `manuales/` o contacta al administrador del sistema.
