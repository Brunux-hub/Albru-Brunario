# Sistema de Reasignación Persistente e Infinita

## 📋 Objetivo

Permitir que **CUALQUIER cliente** (excepto categorías PREVENTA final) pueda ser **reasignado y gestionado infinitas veces** hasta que finalmente acepte la venta.

## 🎯 Reglas de Negocio

### ✅ Categorías que SIEMPRE pueden ser reasignadas:
- Lista negra
- Sin facilidades
- Retirado
- Rechazado
- Agendado
- Seguimiento
- Sin contacto
- Preventa incompleta (pueden volver a intentar)

### ❌ Categorías que NO pueden ser reasignadas (VENTA CERRADA):
- **Preventa** (con subcategoría que indique venta aceptada)
- **Preventa completa** (con subcategoría "Venta cerrada")

## 🔄 Flujo Completo del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENTE NUEVO                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │  GTR asigna a Asesor A           │
    │  - wizard_completado = 0         │
    │  - seguimiento_status = NULL     │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │  Asesor A gestiona cliente       │
    │  - Abre wizard                   │
    │  - Completa gestión              │
    │  - Asigna categoría/subcategoría │
    └──────────────┬───────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
    ┌─────────┐        ┌──────────┐
    │PREVENTA?│        │ OTRAS    │
    │ final   │        │categorías│
    └────┬────┘        └─────┬────┘
         │                   │
         │ NO                │ SÍ
         ▼                   ▼
    ┌─────────────┐     ┌──────────────────┐
    │ BLOQUEADO   │     │ PUEDE REASIGNAR  │
    │ No más      │     │ - GTR puede      │
    │ reasignación│     │   derivar de nuevo│
    └─────────────┘     └────────┬─────────┘
                                 │
                                 ▼
                    ┌──────────────────────────────┐
                    │ RESETEO COMPLETO             │
                    │ - wizard_completado = 0      │
                    │ - seguimiento_status = NULL  │
                    │ - opened_at = NULL           │
                    │ - fecha_wizard_completado=NULL│
                    │ - asesor_asignado = Nuevo    │
                    └────────────┬─────────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────────┐
                    │ Cliente aparece en panel     │
                    │ del Asesor B como NUEVO      │
                    └────────────┬─────────────────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │ CICLO INFINITO │
                        │ Se repite hasta│
                        │ venta aceptada │
                        └────────────────┘
```

## 🔑 Campos Clave del Sistema

### 1. `wizard_completado` (INT 0/1)
- **0**: Cliente disponible para gestión
- **1**: Cliente ya gestionado (pero puede ser reseteado)

### 2. `estatus_comercial_categoria` (VARCHAR)
- Determina si el cliente puede ser reasignado
- Categorías finales: "Preventa", "Preventa completa"

### 3. `estatus_comercial_subcategoria` (VARCHAR)
- Refinamiento de la categoría
- "Venta cerrada" = NO reasignable
- Otras subcategorías = SÍ reasignable

### 4. `seguimiento_status` (VARCHAR NULL)
- Control de estado del cliente
- NULL = Disponible
- "opened" = Abierto por asesor
- "en_gestion" = En proceso de gestión
- "gestionado" = Completado (pero puede resetearse)

## 🛠️ Implementación Técnica

### Función: `esCategor iaPreventaFinal(categoria, subcategoria)`

```javascript
/**
 * Determina si un cliente está en categoría PREVENTA FINAL (no reasignable)
 * 
 * @param {string} categoria - Categoría comercial del cliente
 * @param {string} subcategoria - Subcategoría comercial del cliente
 * @returns {boolean} true si es PREVENTA FINAL, false si puede reasignarse
 */
function esCategoriaPreventaFinal(categoria, subcategoria) {
  // Lista de categorías que indican venta cerrada (no reasignables)
  const categoriasFinales = ['Preventa', 'Preventa completa'];
  
  // Subcategorías que indican venta aceptada (no reasignables)
  const subcategoriasVentaCerrada = [
    'Venta cerrada',
    'Contrato firmado',
    'Pago realizado',
    'Instalación programada'
  ];
  
  // Validar categoría
  if (!categoriasFinales.includes(categoria)) {
    return false; // No es PREVENTA, puede reasignarse
  }
  
  // Si es PREVENTA, verificar subcategoría
  if (subcategoriasVentaCerrada.includes(subcategoria)) {
    return true; // PREVENTA con venta cerrada = NO reasignable
  }
  
  // PREVENTA pero sin venta cerrada = puede reasignarse
  return false;
}
```

### Función: `reasignarCliente()` - Validación Mejorada

```javascript
// Validación de categoría ANTES de reasignar
const categoriaCliente = cliente.estatus_comercial_categoria;
const subcategoriaCliente = cliente.estatus_comercial_subcategoria;

if (esCategoriaPreventaFinal(categoriaCliente, subcategoriaCliente)) {
  return res.status(403).json({ 
    success: false, 
    message: `No se puede reasignar cliente con venta cerrada. Categoría: ${categoriaCliente}, Subcategoría: ${subcategoriaCliente}`,
    categoria: categoriaCliente,
    subcategoria: subcategoriaCliente
  });
}
```

## 📊 Matriz de Decisión

| Categoría | Subcategoría | ¿Reasignable? | Razón |
|-----------|-------------|---------------|-------|
| Lista negra | (cualquiera) | ✅ SÍ | Cliente rechazado, puede intentar de nuevo |
| Sin facilidades | (cualquiera) | ✅ SÍ | No calificó, puede reconsiderar |
| Retirado | (cualquiera) | ✅ SÍ | Cliente desistió, puede volver |
| Rechazado | (cualquiera) | ✅ SÍ | No aceptó, puede reconsiderar |
| Agendado | (cualquiera) | ✅ SÍ | Agendado pero no cerrado |
| Seguimiento | (cualquiera) | ✅ SÍ | En proceso, puede cambiar de asesor |
| Sin contacto | (cualquiera) | ✅ SÍ | No contactado, puede intentar con otro asesor |
| Preventa incompleta | (cualquiera) | ✅ SÍ | Preventa no completada, puede intentar de nuevo |
| Preventa | Venta cerrada | ❌ NO | **Venta aceptada y cerrada** |
| Preventa completa | Venta cerrada | ❌ NO | **Venta completada** |
| Preventa completa | Contrato firmado | ❌ NO | **Contrato legal firmado** |
| Preventa completa | Pago realizado | ❌ NO | **Cliente ya pagó** |

## 🔄 Historial de Reasignaciones

El sistema mantiene un historial completo de todas las reasignaciones:

```sql
CREATE TABLE IF NOT EXISTS historial_reasignaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  asesor_anterior_id INT,
  asesor_nuevo_id INT NOT NULL,
  gtr_id INT,
  categoria_al_momento VARCHAR(100),
  subcategoria_al_momento VARCHAR(100),
  motivo TEXT,
  fecha_reasignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);
```

## 🎯 Beneficios del Sistema

1. **Flexibilidad Total**: Clientes pueden ser gestionados múltiples veces
2. **Control de Negocio**: Solo PREVENTA con venta cerrada queda bloqueada
3. **Trazabilidad**: Historial completo de reasignaciones
4. **Transparencia**: Logs detallados de cada operación
5. **Persistencia**: El cliente "renace" cada vez que se reasigna

## 🔐 Seguridad y Validaciones

- Validación de categoría en backend (no confiar en frontend)
- Logs exhaustivos de cada reasignación
- WebSocket notifica en tiempo real
- Transacciones SQL para atomicidad
- Rollback automático en caso de error

