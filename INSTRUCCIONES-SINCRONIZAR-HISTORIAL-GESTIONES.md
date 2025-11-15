# 🔄 Instrucciones para Sincronizar Cambios del Sistema de Historial de Gestiones

## 📌 Contexto
Se implementó un nuevo sistema de historial de gestiones paso a paso que registra automáticamente cada cambio de categoría/subcategoría realizado por los asesores. Incluye:
- Nueva tabla `historial_gestiones` en la BD
- Endpoint API `/api/clientes/:id/historial-gestiones`
- Visualización mejorada en el modal de historial con diseño stepper

---

## ⚠️ IMPORTANTE
Estos cambios requieren:
1. ✅ Actualizar código del repositorio
2. ✅ Crear nueva tabla en la base de datos
3. ✅ Rebuild completo de contenedores (backend + frontend)

---

## 🚀 Pasos de Sincronización

### Paso 1: Actualizar Código del Repositorio

```powershell
cd C:\Users\DARIO\Albru-Brunario
git pull origin main
```

**Verificación:**
```powershell
# Debe mostrar archivos actualizados:
# - backend/controllers/clientesController.js
# - backend/routes/clientes.js
# - src/components/gtr/ClientHistoryDialog.tsx
```

---

### Paso 2: Crear Tabla `historial_gestiones` en la Base de Datos

**Opción A: Ejecutar migración SQL directamente**

```powershell
# Conectar a MySQL del contenedor
docker exec -it albru-base mysql -u root -p
```

Cuando pida la contraseña, ingrésala. Luego ejecuta:

```sql
USE albru;

CREATE TABLE IF NOT EXISTS historial_gestiones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  telefono VARCHAR(20),
  paso INT NOT NULL,
  asesor_nombre VARCHAR(255),
  asesor_id INT,
  categoria VARCHAR(100),
  subcategoria VARCHAR(100),
  tipo_contacto VARCHAR(50) DEFAULT 'telefónico',
  resultado ENUM('exitoso','sin_contacto','rechazado','agendado','pendiente','derivado') DEFAULT 'pendiente',
  observaciones TEXT,
  comentario TEXT,
  fecha_gestion DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  INDEX idx_cliente_paso (cliente_id, paso),
  INDEX idx_telefono (telefono),
  INDEX idx_asesor (asesor_id),
  INDEX idx_fecha (fecha_gestion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar que se creó correctamente
DESCRIBE historial_gestiones;

-- Salir
exit
```

**Opción B: Ejecutar archivo de migración (si existe)**

```powershell
docker exec -i albru-base mysql -u root -p albru < database/migrations/008_historial_gestiones.sql
```

---

### Paso 3: Rebuild Completo de Contenedores

**⚠️ CRÍTICO: Usar `--no-cache` para asegurar que cargue el código nuevo**

```powershell
# Detener contenedores
docker-compose stop backend frontend

# Rebuild SIN CACHE (fuerza reconstrucción completa)
docker-compose build --no-cache backend frontend

# Levantar contenedores con código actualizado
docker-compose up -d

# Esperar 10 segundos para que arranquen
timeout /t 10 /nobreak

# Ver logs para confirmar que están corriendo
docker logs --tail 30 albru-backend
```

---

### Paso 4: Verificación de Funcionamiento

#### 4.1 Verificar tabla en BD

```powershell
docker exec albru-base mysql -u root -p albru -e "DESCRIBE historial_gestiones;"
```

**Debe mostrar:** 15 columnas (id, cliente_id, telefono, paso, asesor_nombre, asesor_id, categoria, subcategoria, tipo_contacto, resultado, observaciones, comentario, fecha_gestion, created_at, updated_at)

#### 4.2 Verificar endpoint del backend

```powershell
# Ver logs en tiempo real
docker logs -f albru-backend
```

En otra terminal o después de Ctrl+C:

```powershell
# Probar endpoint (reemplaza 20020 con un ID de cliente real)
curl http://localhost:3006/api/clientes/20020/historial-gestiones
```

**Debe retornar:** `{"success":true,"gestiones":[],"total":0}` (vacío al inicio)

#### 4.3 Prueba completa en la aplicación

1. **Abrir la aplicación** en el navegador: `http://localhost:5173` o `http://localhost`

2. **Realizar una gestión:**
   - Seleccionar un cliente con asesor asignado
   - Cambiar su categoría (ej: Sin facilidades → Rechazado)
   - Guardar cambios

3. **Verificar en logs del backend:**
   ```powershell
   docker logs --tail 50 albru-backend
   ```
   
   **Debe aparecer:**
   ```
   ✅ Historial: Cambio de estatus registrado en historial_cliente e historial_gestiones (paso 1) para cliente 20020
   ```

4. **Abrir modal de historial del cliente:**
   - Debe mostrar:
     - ✅ Stepper horizontal con círculos verdes
     - ✅ Cards expandidas con "Paso 1", "Paso 2", etc.
     - ✅ Información del asesor con avatar
     - ✅ Lista de acciones con checkmarks verdes

5. **Verificar en BD:**
   ```powershell
   docker exec albru-base mysql -u root -p albru -e "SELECT paso, asesor_nombre, categoria, subcategoria, fecha_gestion FROM historial_gestiones WHERE cliente_id = 20020 ORDER BY paso ASC;"
   ```

---

## 🔧 Troubleshooting

### Problema: "Backend ejecuta código viejo"

**Síntoma:** Los logs muestran:
```
✅ Historial: Cambio de estatus comercial registrado para cliente 20020
```
En lugar de:
```
✅ Historial: Cambio de estatus registrado en historial_cliente e historial_gestiones (paso 1)...
```

**Solución:**
```powershell
# Rebuild COMPLETO sin cache
docker-compose stop
docker-compose build --no-cache
docker-compose up -d
```

### Problema: "Tabla no existe"

**Síntoma:** Error: `Table 'albru.historial_gestiones' doesn't exist`

**Solución:** Repetir el Paso 2 (crear tabla)

### Problema: "Frontend no muestra el nuevo diseño"

**Síntoma:** Modal de historial muestra diseño antiguo (azul, sin stepper)

**Solución:**
```powershell
# Limpiar cache del navegador (Ctrl + Shift + R)
# O rebuild del frontend:
docker-compose stop frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Problema: "Endpoint retorna 404"

**Síntoma:** `GET /api/clientes/20020/historial-gestiones` retorna 404

**Solución:** Verificar que `backend/routes/clientes.js` tiene la ruta ANTES de `/:id`:
```javascript
router.get('/:id/historial-gestiones', getHistorialGestiones);
router.get('/:id', getClienteById);  // Esta debe ir DESPUÉS
```

---

## ✅ Comando Todo-en-Uno

Si tienes prisa, ejecuta esto (pero revisa los logs después):

```powershell
cd C:\Users\DARIO\Albru-Brunario && git pull && docker exec -i albru-base mysql -u root -p albru < database/migrations/008_historial_gestiones.sql && docker-compose stop backend frontend && docker-compose build --no-cache backend frontend && docker-compose up -d && timeout /t 10 /nobreak && docker logs --tail 30 albru-backend
```

**Nota:** Te pedirá la contraseña de MySQL cuando ejecute la migración.

---

## 📝 Archivos Modificados

Para referencia, estos son los archivos que cambiaron:

1. **Backend:**
   - `backend/controllers/clientesController.js` (líneas ~700-740, ~1990-2040)
   - `backend/routes/clientes.js` (línea ~44)

2. **Frontend:**
   - `src/components/gtr/ClientHistoryDialog.tsx` (rediseño completo de visualización)

3. **Base de Datos:**
   - Nueva tabla: `historial_gestiones`

---

## 🎯 Resultado Esperado

Después de completar todos los pasos:

✅ Cada cambio de categoría se registra automáticamente
✅ Se genera un "paso" incremental por cliente (1, 2, 3...)
✅ El modal muestra un stepper profesional con diseño verde
✅ Se puede ver el historial completo de gestiones de cada cliente
✅ Los datos persisten en la tabla `historial_gestiones`

---

**¿Dudas?** Revisa los logs con `docker logs -f albru-backend` mientras haces una gestión.
