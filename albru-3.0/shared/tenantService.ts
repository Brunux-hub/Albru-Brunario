// Tenant Configuration Service
import { TenantConfig } from './types';

export const TENANT_CONFIGS: Record<string, TenantConfig> = {
  'asesor1': {
    id: 'asesor1',
    name: 'Asesor Premium 1',
    subdomain: 'asesor1',
    theme: {
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      logoUrl: '/assets/logo-asesor1.png',
      brandName: 'Asesor Premium 1'
    },
    features: {
      wizard: true,
      clientManagement: true,
      reports: true,
      notifications: true
    },
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'view_reports']
  },
  'asesor2': {
    id: 'asesor2',
    name: 'Asesor Elite 2',
    subdomain: 'asesor2',
    theme: {
      primaryColor: '#388e3c',
      secondaryColor: '#ff5722',
      logoUrl: '/assets/logo-asesor2.png',
      brandName: 'Asesor Elite 2'
    },
    features: {
      wizard: true,
      clientManagement: true,
      reports: true,
      notifications: true
    },
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'view_reports']
  },
  'gtr': {
    id: 'gtr',
    name: 'GTR Dashboard',
    subdomain: 'gtr',
    theme: {
      primaryColor: '#7b1fa2',
      secondaryColor: '#e91e63',
      logoUrl: '/assets/logo-gtr.png',
      brandName: 'GTR Management'
    },
    features: {
      wizard: false,
      clientManagement: true,
      reports: true,
      notifications: true
    },
    permissions: ['view_all_clients', 'assign_clients', 'view_asesores', 'manage_assignments']
  },
  'admin': {
    id: 'admin',
    name: 'Admin Panel',
    subdomain: 'admin',
    theme: {
      primaryColor: '#d32f2f',
      secondaryColor: '#1976d2',
      logoUrl: '/assets/logo-admin.png',
      brandName: 'Albru Admin'
    },
    features: {
      wizard: false,
      clientManagement: true,
      reports: true,
      notifications: true
    },
    permissions: ['full_access', 'manage_users', 'system_config']
  }
};

export class TenantService {
  static getTenantFromSubdomain(subdomain: string): TenantConfig | null {
    return TENANT_CONFIGS[subdomain] || null;
  }

  static getTenantFromUrl(): TenantConfig | null {
    if (typeof window === 'undefined') return null;
    
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    
    // Para desarrollo local
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      const urlParams = new URLSearchParams(window.location.search);
      const tenantParam = urlParams.get('tenant');
      return tenantParam ? TENANT_CONFIGS[tenantParam] : TENANT_CONFIGS['admin'];
    }
    
    return this.getTenantFromSubdomain(subdomain);
  }

  static isFeatureEnabled(feature: keyof TenantConfig['features']): boolean {
    const tenant = this.getTenantFromUrl();
    return tenant?.features[feature] || false;
  }

  static hasPermission(permission: string): boolean {
    const tenant = this.getTenantFromUrl();
    return tenant?.permissions.includes(permission) || false;
  }
}