# 🧪 PLAN DE PRUEBAS - ESTATUS COMERCIAL CON CIERRE RÁPIDO

## 📋 **OBJETIVO**
Validar que el sistema de categorías/subcategorías y cierre rápido funciona correctamente en el wizard del asesor.

---

## ✅ **PRUEBA 1: Selección en Cascada (Básico)**

### **Objetivo:** Verificar que las subcategorías se actualizan según la categoría

### **Pasos:**
1. Abrir http://localhost:5173
2. Login como asesor (usuario/contraseña de prueba)
3. Click "GESTIONAR" en cualquier cliente
4. Verificar que el wizard abre en Paso 1

### **Validaciones:**
- ✅ Select "CATEGORÍA DE ESTATUS" está visible
- ✅ Select "SUBCATEGORÍA DE ESTATUS" está deshabilitado (gris)
- ✅ Al seleccionar una categoría, el select de subcategoría se habilita
- ✅ Las subcategorías mostradas corresponden a la categoría seleccionada

### **Casos de prueba:**

#### **Caso 1.1: Rechazado**
```
Categoría: Rechazado
Subcategorías esperadas:
  - Zona fraude
  - Venta cerrada desaprobada
  - No desea
  - No califica
  - Con programación
```

#### **Caso 1.2: Sin facilidades**
```
Categoría: Sin facilidades
Subcategorías esperadas:
  - Sin CTO
  - Sin cobertura
  - Servicio activo
  - Edificio sin liberar
```

#### **Caso 1.3: Preventa completa**
```
Categoría: Preventa completa
Subcategorías esperadas:
  - Venta cerrada
  - Venta cerrada mes siguiente
```

#### **Caso 1.4: Sin contacto**
```
Categoría: Sin contacto
Subcategorías esperadas:
  - No contesta
  - Número equivocado
  - Fuera de servicio
  - Corta llamada
  - Buzón
```

### **Resultado esperado:**
✅ Las subcategorías cambian dinámicamente según la categoría seleccionada

---

## ⚡ **PRUEBA 2: Alerta de Cierre Rápido**

### **Objetivo:** Verificar que aparece la alerta amarilla cuando se selecciona categoría de cierre rápido

### **Pasos:**
1. En el wizard, seleccionar una de estas categorías:
   - Rechazado
   - Retirado
   - Sin facilidades

### **Validaciones:**
- ✅ Aparece un recuadro amarillo con borde
- ✅ El recuadro contiene:
  - Título: "⚡ Cierre Rápido Disponible"
  - Texto explicativo sobre guardar sin completar pasos

### **Casos de prueba:**

#### **Caso 2.1: Categoría Rechazado**
```
Categoría: Rechazado
Subcategoría: No desea
Resultado esperado: ✅ Alerta amarilla visible
```

#### **Caso 2.2: Categoría Retirado**
```
Categoría: Retirado
Subcategoría: No desea publicidad
Resultado esperado: ✅ Alerta amarilla visible
```

#### **Caso 2.3: Categoría Sin facilidades**
```
Categoría: Sin facilidades
Subcategoría: Sin CTO
Resultado esperado: ✅ Alerta amarilla visible
```

#### **Caso 2.4: Categoría NO de cierre rápido**
```
Categoría: Preventa completa
Subcategoría: Venta cerrada
Resultado esperado: ❌ Alerta NO debe aparecer
```

### **Resultado esperado:**
✅ La alerta solo aparece para: Rechazado, Retirado, Sin facilidades

---

## 🔘 **PRUEBA 3: Botón "GUARDAR Y CERRAR"**

### **Objetivo:** Verificar que el botón aparece solo cuando corresponde

### **Pasos:**
1. Seleccionar categoría de cierre rápido
2. Seleccionar subcategoría

### **Validaciones:**
- ✅ Botón "⚡ GUARDAR Y CERRAR" aparece
- ✅ El botón es de color naranja (#f59e0b)
- ✅ El botón está a la izquierda del botón "Siguiente"

### **Casos de prueba:**

#### **Caso 3.1: Solo categoría seleccionada**
```
Categoría: Rechazado
Subcategoría: (vacío)
Resultado esperado: ❌ Botón NO aparece (falta subcategoría)
```

#### **Caso 3.2: Categoría + Subcategoría de cierre rápido**
```
Categoría: Rechazado
Subcategoría: No califica
Resultado esperado: ✅ Botón APARECE
```

#### **Caso 3.3: Categoría normal (no cierre rápido)**
```
Categoría: Agendado
Subcategoría: Fin de mes
Resultado esperado: ❌ Botón NO aparece
```

#### **Caso 3.4: En Paso 2, 3 o 4**
```
Navegar a cualquier paso > 1
Resultado esperado: ❌ Botón NO aparece (solo en Paso 1)
```

### **Resultado esperado:**
✅ El botón solo aparece en Paso 1 con categoría de cierre rápido + subcategoría

---

## 💾 **PRUEBA 4: Guardado con Cierre Rápido**

### **Objetivo:** Verificar que se guarda correctamente sin completar el wizard

### **Pasos:**
1. Seleccionar categoría: "Rechazado"
2. Seleccionar subcategoría: "No califica"
3. Click en "⚡ GUARDAR Y CERRAR"

### **Validaciones:**
- ✅ Aparece mensaje de confirmación: "Cliente guardado con estatus: Rechazado - No califica"
- ✅ El modal se cierra
- ✅ El cliente se actualiza en la tabla
- ✅ En base de datos:
  ```sql
  SELECT estatus_comercial_categoria, estatus_comercial_subcategoria, wizard_completado, observaciones_asesor
  FROM clientes WHERE id = [cliente_id];
  
  Resultado esperado:
  estatus_comercial_categoria: "Rechazado"
  estatus_comercial_subcategoria: "No califica"
  wizard_completado: 1
  observaciones_asesor: "Cierre rápido - Rechazado: No califica"
  ```

### **Casos de prueba:**

#### **Caso 4.1: Sin CTO**
```
Categoría: Sin facilidades
Subcategoría: Sin CTO
Acción: Click "GUARDAR Y CERRAR"
Resultado esperado:
  ✅ Guardado exitoso
  ✅ BD actualizada con categoria/subcategoria
```

#### **Caso 4.2: No desea publicidad**
```
Categoría: Retirado
Subcategoría: No desea publicidad
Acción: Click "GUARDAR Y CERRAR"
Resultado esperado:
  ✅ Guardado exitoso
  ✅ Modal cerrado
```

#### **Caso 4.3: Zona fraude**
```
Categoría: Rechazado
Subcategoría: Zona fraude
Acción: Click "GUARDAR Y CERRAR"
Resultado esperado:
  ✅ Guardado exitoso
  ✅ observaciones_asesor contiene "Cierre rápido - Rechazado: Zona fraude"
```

### **Verificar en BD:**
```sql
-- Conectar a MySQL
docker exec -it albru-base mysql -u albru -palbru12345 albru

-- Ver último cliente actualizado
SELECT id, nombre, estatus_comercial_categoria, estatus_comercial_subcategoria, 
       wizard_completado, observaciones_asesor, updated_at
FROM clientes 
ORDER BY updated_at DESC 
LIMIT 5;
```

### **Resultado esperado:**
✅ Cliente guardado con solo categoría/subcategoría, wizard_completado=1

---

## 🔄 **PRUEBA 5: Wizard Completo (NO Cierre Rápido)**

### **Objetivo:** Verificar que categorías normales requieren completar todos los pasos

### **Pasos:**
1. Seleccionar categoría: "Preventa completa"
2. Seleccionar subcategoría: "Venta cerrada"
3. Verificar que NO aparece botón de cierre rápido
4. Click "Siguiente" y completar Paso 2, 3, 4
5. Click "Guardar Gestión" en Paso 4

### **Validaciones:**
- ✅ NO aparece botón "⚡ GUARDAR Y CERRAR"
- ✅ Debe completar los 4 pasos
- ✅ En BD se guardan todos los campos del wizard completo

### **Casos de prueba:**

#### **Caso 5.1: Venta cerrada completa**
```
Categoría: Preventa completa
Subcategoría: Venta cerrada
Completar todos los pasos
Resultado esperado:
  ✅ Guardado con todos los campos
  ✅ estatus_comercial_categoria: "Preventa completa"
  ✅ estatus_comercial_subcategoria: "Venta cerrada"
  ✅ wizard_completado: 1
  ✅ Todos los demás campos poblados
```

#### **Caso 5.2: Agendado**
```
Categoría: Agendado
Subcategoría: Fin de mes
Completar todos los pasos
Resultado esperado:
  ✅ Guardado completo
```

### **Resultado esperado:**
✅ Categorías normales requieren wizard completo, pero guardan categoría/subcategoría

---

## 🖥️ **PRUEBA 6: Vista GTR - Mostrar Estatus**

### **Objetivo:** Verificar que GTR muestra correctamente las categorías/subcategorías

### **Pasos:**
1. Login como GTR (usuario gtr/contraseña)
2. Ir al dashboard GTR
3. Ver la tabla de clientes

### **Validaciones:**
- ✅ Columna "Estado" muestra categoría/subcategoría si existen
- ✅ Si NO hay estatus comercial, muestra el estado tradicional (Nuevo, En gestión, etc.)

### **Casos de prueba:**

#### **Caso 6.1: Cliente con cierre rápido**
```
Cliente previamente guardado con:
  Categoría: Rechazado
  Subcategoría: No califica

Resultado esperado en columna "Estado":
  ┌─────────────────┐
  │ Rechazado       │ ← Bold
  │ No califica     │ ← Normal, más chico
  └─────────────────┘
```

#### **Caso 6.2: Cliente sin estatus comercial**
```
Cliente sin estatus_comercial_categoria

Resultado esperado en columna "Estado":
  Chip con estado tradicional (Nuevo, En gestión, etc.)
```

### **Verificar en código:**
```typescript
// En GtrClientsTable.tsx, línea ~270
{client.estatus_comercial_categoria ? (
  <div>
    <div style={{ fontWeight: 700 }}>{client.estatus_comercial_categoria}</div>
    {client.estatus_comercial_subcategoria && (
      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
        {client.estatus_comercial_subcategoria}
      </div>
    )}
  </div>
) : (
  <Chip label={client.estado} ... />
)}
```

### **Resultado esperado:**
✅ GTR ve categoría/subcategoría en columna Estado

---

## 🔍 **PRUEBA 7: Validaciones de Seguridad**

### **Objetivo:** Verificar que el sistema maneja casos edge

### **Casos de prueba:**

#### **Caso 7.1: Click cierre rápido sin subcategoría**
```
Categoría: Rechazado
Subcategoría: (vacío)
Acción: Click "GUARDAR Y CERRAR" (si aparece)
Resultado esperado:
  ⚠️ Alert: "Debes seleccionar tanto la categoría como la subcategoría para guardar."
  ❌ No se guarda en BD
```

#### **Caso 7.2: Cambio de categoría resetea subcategoría**
```
Categoría: Rechazado → Subcategoría: No desea
Cambiar categoría a: Sin facilidades
Resultado esperado:
  ✅ Subcategoría se resetea a vacío
  ✅ Lista de subcategorías se actualiza a las de "Sin facilidades"
```

#### **Caso 7.3: Lock durante guardado**
```
Asesor A abre wizard del cliente X
Asesor B intenta abrir wizard del mismo cliente X
Resultado esperado:
  ⚠️ Asesor B ve mensaje: "Cliente ocupado por otro asesor"
  ❌ No puede editar
```

### **Resultado esperado:**
✅ Sistema maneja validaciones correctamente

---

## 📊 **PRUEBA 8: Logs del Backend**

### **Objetivo:** Verificar que el backend registra correctamente

### **Pasos:**
1. Ver logs del backend en tiempo real:
   ```powershell
   docker compose logs -f backend
   ```

2. Hacer guardado con cierre rápido

### **Validaciones:**
- ✅ Log muestra: "⚡ WIZARD: Guardado rápido - Categoría: Rechazado, Subcategoría: No califica"
- ✅ Log muestra: "🚀 WIZARD: Enviando datos de cierre rápido al backend"
- ✅ Log muestra: "✅ WIZARD: Cierre rápido exitoso"
- ✅ No hay errores SQL

### **Resultado esperado:**
✅ Backend procesa correctamente el guardado rápido

---

## 🐛 **ERRORES COMUNES Y SOLUCIONES**

### **Error 1: Botón no aparece**
```
Problema: Seleccioné categoría de cierre rápido pero no veo el botón

Verificar:
  1. ¿Seleccionaste también la subcategoría?
  2. ¿Estás en Paso 1 del wizard?
  3. ¿La categoría es una de: Rechazado, Retirado, Sin facilidades?

Solución:
  - Recargar página (F5)
  - Verificar en consola del navegador si hay errores JS
```

### **Error 2: No guarda en BD**
```
Problema: Click en GUARDAR Y CERRAR pero no se guarda

Verificar:
  1. Backend logs: docker compose logs backend | Select-String -Pattern "cierre rápido"
  2. Network tab en DevTools: ver si request sale y qué responde
  3. MySQL: SELECT * FROM clientes WHERE id = X;

Solución:
  - Verificar que backend esté corriendo: docker compose ps
  - Ver si hay errores de SQL en backend logs
```

### **Error 3: Subcategorías no cambian**
```
Problema: Cambio categoría pero subcategorías no se actualizan

Verificar:
  - Consola navegador: debe haber re-render
  - useEffect está funcionando

Solución:
  - Limpiar caché: Ctrl+Shift+R
  - Rebuild frontend: npm run build
```

---

## 📝 **CHECKLIST FINAL**

Antes de dar por terminadas las pruebas, verificar:

- [ ] ✅ Select de categoría funciona
- [ ] ✅ Select de subcategoría se actualiza dinámicamente
- [ ] ✅ Alerta amarilla aparece solo para cierre rápido
- [ ] ✅ Botón naranja aparece solo cuando corresponde
- [ ] ✅ Cierre rápido guarda correctamente en BD
- [ ] ✅ Wizard completo también guarda categoría/subcategoría
- [ ] ✅ GTR muestra categoría/subcategoría en columna Estado
- [ ] ✅ Backend logs sin errores
- [ ] ✅ No hay errores en consola del navegador
- [ ] ✅ Validaciones de seguridad funcionan

---

## 🚀 **COMANDOS ÚTILES PARA PRUEBAS**

```powershell
# Ver logs backend en tiempo real
docker compose logs -f backend

# Ver logs frontend
docker compose logs -f frontend

# Conectar a MySQL y ver datos
docker exec -it albru-base mysql -u albru -palbru12345 albru

# Ver últimos clientes actualizados
SELECT id, nombre, estatus_comercial_categoria, estatus_comercial_subcategoria, 
       updated_at 
FROM clientes 
ORDER BY updated_at DESC 
LIMIT 10;

# Limpiar un cliente de prueba
UPDATE clientes 
SET estatus_comercial_categoria = NULL, 
    estatus_comercial_subcategoria = NULL, 
    wizard_completado = 0 
WHERE id = [ID_CLIENTE];

# Restart contenedores si algo falla
docker compose restart backend frontend
```

---

## 📞 **SOPORTE**

Si encuentras algún problema durante las pruebas:
1. Anota el error exacto que aparece
2. Copia los logs del backend
3. Toma screenshot si es un problema visual
4. Dime qué caso de prueba estabas ejecutando

¡Estoy listo para ayudarte! 🎯
