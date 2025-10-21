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
  nombre?: string;
  dni?: string;
  email?: string;
  estado: string;
  asesor: string;
  historial?: Historial[];
  fecha: string;
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
}

// Tipos compartidos para componentes GTR

export interface ClientHistoryData {
  id: number;
  nombre: string;
  cliente: string;
  dni: string;
  email: string;
  campania: string;
  canal: string;
  estado: string;
  fechaCreacion: string;
  historial: {
    fecha: string;
    asesor: string;
    accion: string;
    estadoAnterior?: string;
    estadoNuevo?: string;
    comentarios: string;
  }[];
}
