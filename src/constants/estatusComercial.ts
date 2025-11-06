// Constantes para estatus comercial
// Estructura: Categoría → Subcategorías

export const ESTATUS_COMERCIAL = {
  "Lista negra": ["Lista negra"],
  "Preventa completa": ["Venta cerrada", "Venta cerrada mes siguiente"],
  "Preventa": ["Preventa", "Pendiente score"],
  "Sin facilidades": ["Sin CTO", "Sin cobertura", "Servicio activo", "Edificio sin liberar"],
  "Retirado": ["No desea publicidad"],
  "Rechazado": ["Zona fraude", "Venta cerrada desaprobada", "No desea", "No califica", "Con programación"],
  "Agendado": ["Fin de mes", "Consultaría con familiar", "Agendado"],
  "Seguimiento": ["Solo info", "Seguimiento", "Gestión o chat"],
  "Sin contacto": ["No contesta", "Número equivocado", "Fuera de servicio", "Corta llamada", "Buzón"]
} as const;

export const CATEGORIAS = Object.keys(ESTATUS_COMERCIAL) as Array<keyof typeof ESTATUS_COMERCIAL>;

// Categorías que permiten cierre rápido del wizard (guardar en Paso 1)
export const CATEGORIAS_CIERRE_RAPIDO = [
  "Rechazado",
  "Retirado", 
  "Sin facilidades"
] as const;

// Función helper para verificar si una categoría permite cierre rápido
export function permiteRierreRapido(categoria: string | null): boolean {
  if (!categoria) return false;
  return (CATEGORIAS_CIERRE_RAPIDO as readonly string[]).includes(categoria);
}

// Obtener subcategorías de una categoría
export function getSubcategorias(categoria: string | null): readonly string[] {
  if (!categoria || !(categoria in ESTATUS_COMERCIAL)) return [];
  return ESTATUS_COMERCIAL[categoria as keyof typeof ESTATUS_COMERCIAL];
}

// Colores por categoría para UI
export const CATEGORIA_COLORS = {
  "Lista negra": { bg: '#1f2937', text: '#ffffff' },
  "Preventa completa": { bg: '#d1fae5', text: '#059669' },
  "Preventa": { bg: '#dbeafe', text: '#2563eb' },
  "Sin facilidades": { bg: '#fef3c7', text: '#d97706' },
  "Retirado": { bg: '#fee2e2', text: '#dc2626' },
  "Rechazado": { bg: '#fecaca', text: '#b91c1c' },
  "Agendado": { bg: '#e0e7ff', text: '#4f46e5' },
  "Seguimiento": { bg: '#dbeafe', text: '#2563eb' },
  "Sin contacto": { bg: '#f3f4f6', text: '#6b7280' }
} as const;
