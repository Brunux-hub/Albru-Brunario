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
