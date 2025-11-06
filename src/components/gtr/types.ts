export interface Asesor {
  asesor_id: number;
  usuario_id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado: string;
  clientes_asignados: number;
  meta_mensual: string;
  ventas_realizadas: string;
  comision_porcentaje: string;
}

export interface Historial {
  fecha: string;
  asesor: string;
  accion: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  comentarios: string;
}

export interface Cliente {
  id: number;
  lead_id?: string;
  leads_original_telefono?: string;
  nombre?: string;
  dni?: string;
  email?: string;
  estado: string;
  asesor: string;
  historial?: Historial[];
  // Usamos fechaCreacion de forma consistente en las vistas
  fechaCreacion: string;
  // Campo de fecha real de registro en BD
  created_at?: string;
  comentarios?: string;
  // Campos adicionales del dashboard
  cliente?: string;
  lead?: string;
  ciudad?: string;
  plan?: string;
  precio?: number;
  canal?: string;
  distrito?: string;
  clienteNuevo?: boolean;
  observaciones?: string;
  telefono?: string;
  direccion?: string;
  campana?: string;
  compania?: string;
  sala_asignada?: string;
  // alias o campo opcional usado en algunas vistas
  sala?: string;
  canal_adquisicion?: string;
  // Flag transitorio/durable que indica si el cliente está siendo gestionado
  ocupado?: boolean;
  // Nuevos campos introducidos por el flujo de seguimiento / estatus comercial
  seguimiento_status?: string | null;
  estatus_comercial_categoria?: string | null;
  estatus_comercial_subcategoria?: string | null;
}

// Tipos compartidos para componentes GTR

export interface ClientHistoryData {
  id: number;
  nombre: string;
  cliente: string;
  dni: string;
  email: string;
  campana: string;
  canal: string;
  tipificacion_back?: string | null;
  estado: string;
  fechaCreacion: string;
  // Reutilizamos la interfaz Historial para evitar duplicación
  historial: Historial[];
}
