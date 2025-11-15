# 📊 Datos de Ejemplo - Historial de Gestiones

## Estructura de Datos por Cliente

### Cliente 1: Rodrigo Rodriguez

| Paso | Asesor | Categoría | Subcategoría | Tipo Contacto | Resultado | Fecha | Observaciones |
|------|--------|-----------|--------------|---------------|-----------|-------|---------------|
| **PASO 1** | Carlos López | Sin facilidades | No tiene servicio | Telefónico | ✅ Exitoso | 10-Nov | Cliente atendido correctamente. Primera gestión: cliente muestra interés |
| **PASO 2** | Carlos López | Preventa abierta | Interesado en paquete básico | Telefónico | 📅 Agendado | 11-Nov | Cliente quiere más información. Agendamos llamada para presentar opciones |
| **PASO 3** | Carlos López | Preventa abierta | Interesado en paquete básico | Presencial | ✅ Exitoso | 13-Nov | Se realizó presentación de producto. Cliente mostró buena recepción |
| **PASO 4** | Carlos López | Preventa en negociación | Esperando aprobación de gerencia | Telefónico | ⏳ Pendiente | 14-Nov | Negocios en trámite. Presentada propuesta económica |
| **PASO 5** | Carlos López | Preventa cerrada | Contrato firmado | Telefónico | ✅ Exitoso | 15-Nov | Venta confirmada. Cliente firmó contrato hoy |

---

## Estructura en Formato JSON (Endpoint API)

```json
{
  "success": true,
  "gestiones": [
    {
      "id": 1,
      "cliente_id": 1,
      "paso": 1,
      "asesor_nombre": "Carlos López",
      "asesor_id": 1,
      "categoria": "Sin facilidades",
      "subcategoria": "No tiene servicio",
      "tipo_contacto": "telefónico",
      "resultado": "exitoso",
      "observaciones": "Cliente atendido correctamente",
      "comentario": "Primera gestión: cliente muestra interés",
      "fecha_gestion": "2025-11-10T15:43:27.000Z"
    },
    {
      "id": 2,
      "cliente_id": 1,
      "paso": 2,
      "asesor_nombre": "Carlos López",
      "asesor_id": 1,
      "categoria": "Preventa abierta",
      "subcategoria": "Interesado en paquete básico",
      "tipo_contacto": "telefónico",
      "resultado": "agendado",
      "observaciones": "Cliente quiere más información",
      "comentario": "Agendamos llamada para presentar opciones",
      "fecha_gestion": "2025-11-11T15:43:27.000Z"
    },
    {
      "id": 3,
      "cliente_id": 1,
      "paso": 3,
      "asesor_nombre": "Carlos López",
      "asesor_id": 1,
      "categoria": "Preventa abierta",
      "subcategoria": "Interesado en paquete básico",
      "tipo_contacto": "presencial",
      "resultado": "exitoso",
      "observaciones": "Se realizó presentación de producto",
      "comentario": "Cliente mostró buena recepción",
      "fecha_gestion": "2025-11-13T15:43:27.000Z"
    },
    {
      "id": 4,
      "cliente_id": 1,
      "paso": 4,
      "asesor_nombre": "Carlos López",
      "asesor_id": 1,
      "categoria": "Preventa en negociación",
      "subcategoria": "Esperando aprobación de gerencia",
      "tipo_contacto": "telefónico",
      "resultado": "pendiente",
      "observaciones": "Negocios en trámite",
      "comentario": "Presentada propuesta económica",
      "fecha_gestion": "2025-11-14T15:43:27.000Z"
    },
    {
      "id": 5,
      "cliente_id": 1,
      "paso": 5,
      "asesor_nombre": "Carlos López",
      "asesor_id": 1,
      "categoria": "Preventa cerrada",
      "subcategoria": "Contrato firmado",
      "tipo_contacto": "telefónico",
      "resultado": "exitoso",
      "observaciones": "Venta confirmada",
      "comentario": "Cliente firmó contrato hoy",
      "fecha_gestion": "2025-11-15T15:43:27.000Z"
    }
  ],
  "total": 5
}
```

---

## Resumen de Progresión

```
Cliente: Rodrigo Rodriguez (ID: 1)
Teléfono: +34 600123456
Asesor: Carlos López (ID: 1)
DNI: (desde BD clientes)

Progresión de Estados:
1️⃣ Sin facilidades → 2️⃣ Preventa abierta → 3️⃣ Preventa abierta → 4️⃣ Preventa en negociación → 5️⃣ Preventa cerrada

Resultados:
- Paso 1: ✅ Exitoso (Telefónico)
- Paso 2: 📅 Agendado (Telefónico)
- Paso 3: ✅ Exitoso (Presencial)
- Paso 4: ⏳ Pendiente (Telefónico)
- Paso 5: ✅ Exitoso (Telefónico) - VENTA CERRADA

Duración Total: 5 días (10-Nov a 15-Nov)
```

---

## Cómo Ver en la Interfaz

1. Abre `http://localhost:5173` en el navegador
2. Busca el cliente "Rodrigo Rodriguez"
3. Abre el modal de historial
4. Verás un **stepper con 5 pasos** donde cada paso muestra:
   - Círculo numerado (1, 2, 3, 4, 5)
   - Categoría y subcategoría del paso
   - Asesor responsable
   - Tipo de contacto (Telefónico/Presencial)
   - Resultado (Exitoso/Agendado/Pendiente)
   - Observaciones y comentarios
   - Fecha y hora exacta

---

## Estructura de Tabla en Base de Datos

```sql
CREATE TABLE historial_gestiones (
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
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);
```

---

## Agregar Más Datos de Ejemplo

Si necesitas agregar más registros o clientes con historial, usa:

```sql
-- Agregar más pasos para el cliente 1
INSERT INTO historial_gestiones 
(cliente_id, telefono, paso, asesor_nombre, asesor_id, categoria, subcategoria, tipo_contacto, resultado, observaciones, comentario, fecha_gestion) 
VALUES 
(1, '+34 600123456', 6, 'Carlos López', 1, 'Cliente activo', 'Servicio activo', 'telefónico', 'exitoso', 'Follow-up post-venta', 'Cliente satisfecho', NOW());

-- Agregar para otro cliente (si existe cliente_id 2)
INSERT INTO historial_gestiones 
(cliente_id, telefono, paso, asesor_nombre, asesor_id, categoria, subcategoria, tipo_contacto, resultado, observaciones, comentario, fecha_gestion) 
VALUES 
(2, '+34 600654321', 1, 'María García', 2, 'Sin facilidades', 'No accesible', 'telefónico', 'sin_contacto', 'Número no disponible', 'Intentar más tarde', NOW() - INTERVAL 3 DAY),
(2, '+34 600654321', 2, 'María García', 2, 'Sin facilidades', 'No disponible', 'telefónico', 'rechazado', 'Cliente rechazó oferta', 'No interesado en el producto', NOW());
```

---

## Endpoint API

**GET** `http://localhost:3001/api/clientes/:id/historial-gestiones`

**Parámetros:**
- `:id` - ID del cliente (ejemplo: 1)

**Respuesta:**
```json
{
  "success": true,
  "gestiones": [...],
  "total": 5
}
```

**Uso en PowerShell:**
```powershell
Invoke-RestMethod -Uri 'http://localhost:3001/api/clientes/1/historial-gestiones' -Method GET
```

---

**Última actualización:** 15 de Noviembre de 2025
