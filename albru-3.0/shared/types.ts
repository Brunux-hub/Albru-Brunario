// Shared types for multi-tenant architecture
export interface TenantConfig {
  id: string;
  name: string;
  subdomain: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    brandName: string;
  };
  features: {
    wizard: boolean;
    clientManagement: boolean;
    reports: boolean;
    notifications: boolean;
  };
  permissions: string[];
}

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'asesor' | 'gtr' | 'admin' | 'supervisor' | 'calidad';
  tenantId: string;
  permissions: string[];
}

export interface Cliente {
  id: number;
  nombre: string;
  apellidos: string;
  telefono: string;
  email?: string;
  dni?: string;
  edad?: number;
  estado: 'nuevo' | 'contactado' | 'interesado' | 'propuesta_enviada' | 'cerrado' | 'perdido';
  asesor_asignado?: number;
  created_at: string;
  updated_at: string;
}

export interface AsesorInfo {
  id: number;
  usuario_id: number;
  nombre: string;
  email: string;
  telefono?: string;
  especialidad?: string;
  tenantId: string;
}