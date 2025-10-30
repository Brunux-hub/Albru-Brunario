# 📊 COMPARACIÓN: Tabla CLIENTES (BD) vs CSV - Análisis Completo

**Fecha:** 22 de octubre de 2025  
**Objetivo:** Identificar diferencias, campos faltantes y mejoras necesarias

---

## 📋 RESUMEN EJECUTIVO

| Categoría | BD Actual | CSV | Acción Requerida |
|-----------|-----------|-----|------------------|
| **Total campos** | 46 columnas | 34 columnas | ✅ BD más completa |
| **Campos en CSV que NO están en BD** | 0 | 11 | ⚠️ Requiere análisis |
| **Campos en BD que NO están en CSV** | 12 | 0 | ✅ BD tiene más info |
| **Campos que coinciden** | 23 | 23 | ✅ Mapeo directo |

---

## 🔴 CAMPOS DEL CSV QUE **NO EXISTEN** EN LA BD ACTUAL

Estos campos del CSV **NO tienen columna** en la tabla `clientes`:

| # | Campo CSV | Descripción | Propuesta |
|---|-----------|-------------|-----------|
| 1 | **TIPO BASE** | Clasificación de base de datos origen | 💡 Agregar como `tipo_base VARCHAR(100)` o guardar en `notas` |
| 2 | **LEADS** | Número de teléfono del lead original | ⚠️ **MAPEAR A `telefono`** (campo principal) |
| 3 | **CAMPAÑA** | Nombre de campaña de marketing | 💡 Agregar como `campana VARCHAR(100)` |
| 4 | **CANAL** | Canal de adquisición (web, presencial, etc.) | 💡 Agregar como `canal_adquisicion VARCHAR(50)` |
| 5 | **SALA** | Sala de ventas asignada | 💡 Agregar como `sala_asignada VARCHAR(50)` |
| 6 | **COMPAÑIA** | Compañía asociada | 💡 Agregar como `compania VARCHAR(100)` |
| 7 | **BACK** | Información de back office | 💡 Guardar en `notas` o crear `back_office TEXT` |
| 8 | **TIPIFICACION BACK** | Tipificación del back office | 💡 Agregar como `tipificacion_back VARCHAR(100)` |
| 9 | **DATOS LEADS** | Datos adicionales del lead | ⚠️ **MAPEAR A `nombre`** si está vacío |
| 10 | **COMENTARIOS BACK** | Comentarios del back office | 💡 Guardar en `observaciones_asesor` |
| 11 | **ULTIMA FECHA GESTION** | Última fecha de gestión | ⚠️ **MAPEAR A `fecha_ultimo_contacto`** |

---

## ✅ CAMPOS QUE **SÍ EXISTEN** Y COINCIDEN

Estos campos del CSV tienen su equivalente directo en la BD:

| # | Campo CSV | Campo BD | Tipo BD | Notas |
|---|-----------|----------|---------|-------|
| 1 | `created_at` | `created_at` | timestamp | ✅ Convertir formato DD/MM/YYYY a YYYY-MM-DD |
| 2 | `updated_at` | `updated_at` | timestamp | ✅ Convertir formato DD/MM/YYYY a YYYY-MM-DD |
| 3 | `tipo_cliente_wizard` | `tipo_cliente_wizard` | enum('nuevo','antiguo') | ✅ Mapeo directo |
| 4 | `lead_score` | `lead_score` | varchar(10) | ✅ Mapeo directo |
| 5 | `telefono_registro` | `telefono_registro` | varchar(20) | ✅ Mapeo directo |
| 6 | `fecha_nacimiento` | `fecha_nacimiento` | date | ✅ Convertir DD/MM/YYYY a YYYY-MM-DD |
| 7 | `dni_nombre_titular` | `dni_nombre_titular` | varchar(150) | ✅ Mapeo directo |
| 8 | `parentesco_titular` | `parentesco_titular` | varchar(50) | ✅ Mapeo directo |
| 9 | `telefono_referencia_wizard` | `telefono_referencia_wizard` | varchar(20) | ✅ Mapeo directo |
| 10 | `telefono_grabacion_wizard` | `telefono_grabacion_wizard` | varchar(20) | ✅ Mapeo directo |
| 11 | `direccion_completa` | `direccion_completa` | text | ✅ Mapeo directo |
| 12 | `numero_piso_wizard` | `numero_piso_wizard` | varchar(20) | ✅ Mapeo directo |
| 13 | `tipo_plan` | `tipo_plan` | varchar(50) | ✅ Mapeo directo |
| 14 | `servicio_contratado` | `servicio_contratado` | text | ✅ Mapeo directo |
| 15 | `velocidad_contratada` | `velocidad_contratada` | varchar(50) | ✅ Mapeo directo |
| 16 | `precio_plan` | `precio_plan` | decimal(10,2) | ✅ Convertir texto a número |
| 17 | `dispositivos_adicionales_wizard` | `dispositivos_adicionales_wizard` | text | ✅ Mapeo directo |
| 18 | `plataforma_digital_wizard` | `plataforma_digital_wizard` | text | ✅ Mapeo directo |
| 19 | `pago_adelanto_instalacion_wizard` | `pago_adelanto_instalacion_wizard` | enum('SI','NO') | ✅ Normalizar SI/NO |
| 20 | `wizard_completado` | `wizard_completado` | tinyint(1) | ✅ Convertir 1/0 o SI/NO |
| 21 | `fecha_wizard_completado` | `fecha_wizard_completado` | timestamp | ✅ Convertir formato |
| 22 | `wizard_data_json` | `wizard_data_json` | json | ✅ Ya viene en formato JSON |

---

## 🟢 CAMPOS DE LA BD QUE **NO ESTÁN EN EL CSV**

Estos campos existen en la BD pero NO vienen en el CSV (se dejan NULL o con valores default):

| # | Campo BD | Tipo | Default | Descripción |
|---|----------|------|---------|-------------|
| 1 | `apellidos` | varchar(100) | NULL | Apellidos del cliente |
| 2 | `email` | varchar(100) | NULL | Email del cliente |
| 3 | `dni` | varchar(20) | NULL | DNI/documento del cliente |
| 4 | `edad` | int | NULL | Edad del cliente |
| 5 | `genero` | enum | NULL | Género del cliente |
| 6 | `estado_civil` | enum | NULL | Estado civil |
| 7 | `ocupacion` | varchar(100) | NULL | Ocupación |
| 8 | `ingresos_mensuales` | decimal(10,2) | NULL | Ingresos mensuales |
| 9 | `dependientes_economicos` | int | 0 | Cantidad de dependientes |
| 10 | `direccion` | text | NULL | Dirección (campo viejo, usar `direccion_completa`) |
| 11 | `ciudad` | varchar(50) | NULL | Ciudad |
| 12 | `horario_preferido_contacto` | varchar(50) | NULL | Horario preferido |
| 13 | `medio_contacto_preferido` | enum | NULL | Medio de contacto preferido |
| 14 | `asesor_asignado` | int | NULL | ID del asesor asignado |
| 15 | `estado` | enum | 'nuevo' | Estado del lead/cliente |
| 16 | `prioridad` | enum | 'media' | Prioridad del lead |
| 17 | `fecha_primer_contacto` | datetime | NULL | Primera vez contactado |
| 18 | `fecha_cierre_estimada` | date | NULL | Fecha estimada de cierre |
| 19 | `observaciones_asesor` | text | NULL | Observaciones del asesor |

---

## 🎯 PROPUESTA DE MEJORAS - PASO A PASO

### **MEJORA 1: Agregar campos de Marketing/Campaña** 📢

**Problema:** El CSV tiene datos de campaña, canal, sala que NO se pueden guardar.

**Solución:** Agregar columnas nuevas en la BD.

```sql
-- Agregar campos de marketing y campaña
ALTER TABLE clientes
  ADD COLUMN tipo_base VARCHAR(100) NULL COMMENT 'Tipo de base de datos origen' AFTER wizard_data_json,
  ADD COLUMN campana VARCHAR(100) NULL COMMENT 'Nombre de campaña marketing' AFTER tipo_base,
  ADD COLUMN canal_adquisicion VARCHAR(50) NULL COMMENT 'Canal de adquisición del lead' AFTER campana,
  ADD COLUMN sala_asignada VARCHAR(50) NULL COMMENT 'Sala de ventas asignada' AFTER canal_adquisicion,
  ADD COLUMN compania VARCHAR(100) NULL COMMENT 'Compañía asociada' AFTER sala_asignada,
  ADD COLUMN tipificacion_back VARCHAR(100) NULL COMMENT 'Tipificación del back office' AFTER compania,
  ADD COLUMN back_office_info TEXT NULL COMMENT 'Información adicional de back office' AFTER tipificacion_back;

-- Crear índice para búsquedas por campaña
CREATE INDEX idx_campana ON clientes(campana);
CREATE INDEX idx_canal ON clientes(canal_adquisicion);
```

**Impacto:** ✅ Permite importar TODOS los datos del CSV sin pérdida de información.

---

### **MEJORA 2: Normalizar campo `nombre` (hacerlo nullable)** ⚠️

**Problema:** `nombre` es NOT NULL, pero el CSV puede tener este campo vacío.

**Solución:** Cambiar a nullable con fallback automático.

```sql
-- Modificar campo nombre para permitir NULL temporalmente
ALTER TABLE clientes 
  MODIFY COLUMN nombre VARCHAR(100) NULL;

-- Opcional: Agregar trigger para auto-rellenar nombre si está vacío
DELIMITER $$
CREATE TRIGGER before_insert_clientes_nombre
BEFORE INSERT ON clientes
FOR EACH ROW
BEGIN
  IF NEW.nombre IS NULL OR NEW.nombre = '' THEN
    SET NEW.nombre = COALESCE(NEW.telefono, NEW.telefono_registro, 'PENDIENTE');
  END IF;
END$$
DELIMITER ;
```

**Impacto:** ✅ Evita errores al importar registros sin nombre.

---

### **MEJORA 3: Agregar campo `origen_lead`** 📍

**Problema:** No hay forma de distinguir leads importados de CSV vs creados manualmente.

**Solución:** Agregar campo de tracking.

```sql
ALTER TABLE clientes
  ADD COLUMN origen_lead ENUM('manual', 'importacion_csv', 'formulario_web', 'campana', 'referido') 
  DEFAULT 'manual' 
  COMMENT 'Origen del lead' 
  AFTER compania;

-- Marcar todos los registros actuales como manuales
UPDATE clientes SET origen_lead = 'manual' WHERE origen_lead IS NULL;
```

**Impacto:** ✅ Mejor trazabilidad y reporting.

---

### **MEJORA 4: Optimizar índices para búsquedas** 🚀

**Problema:** Búsquedas lentas por teléfono, DNI, email.

**Solución:** Agregar índices compuestos.

```sql
-- Índices para búsquedas frecuentes
CREATE INDEX idx_telefono_estado ON clientes(telefono, estado);
CREATE INDEX idx_email_estado ON clientes(email, estado);
CREATE INDEX idx_dni_estado ON clientes(dni, estado);
CREATE INDEX idx_asesor_estado ON clientes(asesor_asignado, estado);
CREATE INDEX idx_campana_estado ON clientes(campana, estado);

-- Índice para wizard
CREATE INDEX idx_wizard_completado ON clientes(wizard_completado, fecha_wizard_completado);
```

**Impacto:** ✅ Consultas hasta 10x más rápidas.

---

### **MEJORA 5: Agregar campo `lugar_nacimiento`** 🌍

**Problema:** El `wizard_data_json` del CSV incluye `lugarNacimiento` pero no hay campo dedicado.

**Solución:** Extraer a columna separada para búsquedas.

```sql
ALTER TABLE clientes
  ADD COLUMN lugar_nacimiento VARCHAR(100) NULL COMMENT 'Lugar de nacimiento' AFTER fecha_nacimiento;
```

**Impacto:** ✅ Mejor segmentación geográfica.

---

### **MEJORA 6: Agregar auditoría de cambios** 📝

**Problema:** No se sabe quién modificó qué y cuándo.

**Solución:** Agregar campos de auditoría.

```sql
ALTER TABLE clientes
  ADD COLUMN usuario_creacion INT NULL COMMENT 'ID usuario que creó el registro' AFTER created_at,
  ADD COLUMN usuario_modificacion INT NULL COMMENT 'ID usuario que modificó el registro' AFTER updated_at,
  ADD FOREIGN KEY (usuario_creacion) REFERENCES usuarios(id),
  ADD FOREIGN KEY (usuario_modificacion) REFERENCES usuarios(id);
```

**Impacto:** ✅ Trazabilidad completa de cambios.

---

## 📊 PLAN DE EJECUCIÓN RECOMENDADO

### **FASE 1: Preparación (SIN RIESGO)** ✅
1. ✅ Backup de la BD actual
2. ✅ Aplicar **MEJORA 1** (campos marketing)
3. ✅ Aplicar **MEJORA 2** (nombre nullable)
4. ✅ Aplicar **MEJORA 3** (origen_lead)

### **FASE 2: Optimización** 🚀
1. Aplicar **MEJORA 4** (índices)
2. Aplicar **MEJORA 5** (lugar_nacimiento)
3. Probar velocidad de consultas

### **FASE 3: Auditoría (OPCIONAL)** 📝
1. Aplicar **MEJORA 6** (auditoría)
2. Actualizar código backend para llenar campos de auditoría

---

## 🎯 SIGUIENTE PASO RECOMENDADO

**¿Qué quieres hacer primero?**

**A)** Aplicar todas las mejoras ahora (RECOMENDADO)  
**B)** Aplicar solo MEJORA 1 y 2 (mínimo para importar CSV)  
**C)** Revisar mejora por mejora y decidir cuáles aplicar  

---

## 📋 CHECKLIST DE VALIDACIÓN POST-MEJORAS

Después de aplicar las mejoras, verificar:

- [ ] ✅ Todos los campos del CSV tienen destino en BD
- [ ] ✅ No hay pérdida de información al importar
- [ ] ✅ Búsquedas son rápidas (< 100ms)
- [ ] ✅ Script de importación SQL ejecuta sin errores
- [ ] ✅ Datos importados son correctos (verificar 10 registros)
- [ ] ✅ Frontend muestra correctamente los nuevos campos
- [ ] ✅ Backend devuelve todos los campos en el API

---

**Generado:** 22/10/2025  
**Última actualización:** Ahora mismo 🚀
