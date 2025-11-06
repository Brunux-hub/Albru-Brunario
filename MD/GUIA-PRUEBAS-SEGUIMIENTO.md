# 🧪 Guía de Pruebas - Seguimiento Automático

**Fecha:** 4 de noviembre de 2025  
**Estado:** ✅ Docker corriendo - Listo para pruebas

---

## 📦 Estado de los Contenedores

```bash
✅ albru-backend         - Puerto 3001 (API REST + WebSocket)
✅ albru-frontend-dev    - Puerto 5174 → 5173 (Vite dev)
✅ albru-frontend        - Puerto 5173 → 80 (Nginx prod)
✅ albru-base            - MySQL 8.0
✅ albru-adminer         - Puerto 8080
```

---

## 🧪 Pruebas Manuales

### **Prueba 1: Persistencia en GTR al Recargar**

1. Abrir panel GTR:
   ```
   http://localhost:5174/dashboard/gtr
   ```

2. Asignar un cliente a un asesor:
   - Click en botón **"REASIGNAR"** de cualquier cliente disponible
   - Seleccionar un asesor
   - Click en **"Derivar"**

3. Verificar que aparece chip azul **"Derivado"**

4. **Recargar la página (F5)**

5. ✅ **VERIFICAR:** El chip "Derivado" debe seguir visible después de recargar

---

### **Prueba 2: Cambio Automático a "En Gestión"**

1. Abrir panel GTR en una pestaña:
   ```
   http://localhost:5174/dashboard/gtr
   ```

2. Abrir panel Asesor en otra pestaña:
   ```
   http://localhost:5174/dashboard/asesor
   ```
   - Login con credenciales de asesor (ej: usuario `4`, password según BD)

3. En **GTR**: Asignar un cliente al asesor conectado
   - Debe aparecer chip **"Derivado"**

4. En **Asesor**: 
   - Verificar que el cliente aparece en la lista con chip **"Derivado"**
   - Click en botón **"VER"** del cliente

5. ✅ **VERIFICAR en GTR:** 
   - El chip debe cambiar automáticamente de "Derivado" → **"En Gestión"**
   - Puede tomar 1-2 segundos (WebSocket en tiempo real)

6. ✅ **VERIFICAR en Asesor:**
   - Se abre el wizard/formulario
   - En la tabla principal, el chip debe mostrar **"En Gestión"**

---

### **Prueba 3: Timeout de 5 Minutos**

1. Seguir pasos de **Prueba 2** hasta abrir el wizard

2. **Cerrar el wizard** (sin guardar, solo cerrar)

3. Esperar 5 minutos (300 segundos)
   - El worker `seguimientoWorker.js` corre cada 30 segundos
   - Debe detectar que pasaron 5 min desde `opened_at`

4. ✅ **VERIFICAR en GTR:**
   - El cliente regresa con chip **"Gestionado"**
   - Ya no aparece asignado a ningún asesor

5. ✅ **VERIFICAR en Asesor:**
   - El cliente desaparece de la lista del asesor

---

## 🤖 Prueba Automatizada

### **Script Completo del Flujo**

```powershell
.\scripts\test-seguimiento-complete-flow.ps1
```

**Validaciones automáticas:**
- ✅ GTR asigna → seguimiento = "derivado"
- ✅ Persistencia GTR → mantiene "derivado" al recargar
- ✅ Lista asesor → muestra "derivado"
- ✅ Abre wizard → cambia a "en_gestion"
- ✅ Persistencia final → mantiene "en_gestion"

---

## 📊 Verificación en Base de Datos

### Ver estado de un cliente específico

```sql
SELECT 
  id,
  nombre,
  telefono,
  seguimiento_status,
  derivado_at,
  opened_at,
  asesor_asignado
FROM clientes
WHERE id = 2447;
```

### Ver todos los clientes en seguimiento

```sql
SELECT 
  c.id,
  c.nombre,
  c.seguimiento_status,
  c.asesor_asignado,
  u.nombre as asesor_nombre,
  c.derivado_at,
  c.opened_at
FROM clientes c
LEFT JOIN usuarios u ON c.asesor_asignado = u.id
WHERE c.seguimiento_status IS NOT NULL
ORDER BY c.derivado_at DESC;
```

---

## 🐛 Resolución de Problemas

### El chip no aparece en GTR

**Solución:**
```powershell
# Limpiar caché del navegador
Ctrl + Shift + Delete → Borrar caché

# O usar modo incógnito
Ctrl + Shift + N
```

### El seguimiento no cambia a "en_gestion"

**Verificar logs del backend:**
```powershell
docker-compose logs -f backend | Select-String "open-wizard"
```

**Debe mostrar:**
```
✅ Cliente 2447 cambiado a "en_gestion" al abrir wizard
```

### El worker no está corriendo

**Verificar logs del worker:**
```powershell
docker-compose logs -f backend | Select-String "seguimientoWorker"
```

**Debe mostrar:**
```
🕵️‍♂️ Iniciando seguimientoWorker (poll cada 30000ms) with timeout 300s
⏱️ [SeguimientoWorker] Revisando timeouts...
```

---

## 🔄 Reiniciar Servicios

### Reiniciar todo
```powershell
docker-compose restart
```

### Solo backend
```powershell
docker-compose restart backend
```

### Solo frontend
```powershell
docker-compose restart frontend-dev
```

### Ver logs en tiempo real
```powershell
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend-dev

# Ambos
docker-compose logs -f backend frontend-dev
```

---

## 📝 URLs de Acceso

- **Frontend Dev:** http://localhost:5174
- **GTR Panel:** http://localhost:5174/dashboard/gtr
- **Asesor Panel:** http://localhost:5174/dashboard/asesor
- **API Backend:** http://localhost:3001/api
- **Adminer (BD):** http://localhost:8080
  - Sistema: MySQL
  - Servidor: db
  - Usuario: root
  - Contraseña: rootpassword
  - Base de datos: albru

---

## ✅ Checklist de Validación

Antes de considerar completa la feature, verificar:

- [ ] Panel GTR muestra chips de seguimiento
- [ ] Chips persisten al recargar (F5)
- [ ] Panel Asesor muestra clientes derivados
- [ ] Abrir wizard cambia automáticamente a "en_gestion"
- [ ] Cambio se refleja en GTR en tiempo real (WebSocket)
- [ ] Worker de timeout funciona (5 min)
- [ ] Cliente regresa a GTR después del timeout
- [ ] Historial se registra correctamente en BD
- [ ] Script automatizado pasa todas las pruebas

---

**Estado Actual:** ✅ Todos los contenedores corriendo y listos para pruebas
