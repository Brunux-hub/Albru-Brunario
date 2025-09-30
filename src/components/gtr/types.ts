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
