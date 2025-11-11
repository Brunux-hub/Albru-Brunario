// Servicio para manejar temas personalizados por usuario
import axios from 'axios';
// import { API_BASE } from '../config/backend'; // Comentado temporalmente hasta implementar endpoint

export interface UserTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
}

export interface UserConfig {
  userId: string;
  name: string;
  theme: UserTheme;
  logo: string;
  brandName: string;
  permissions: string[];
  dashboard: string;
}

class ThemeService {
  private static instance: ThemeService;
  private userConfig: UserConfig | null = null;
  private themeListeners: ((config: UserConfig) => void)[] = [];

  private constructor() {}

  public static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  // Obtener configuración del usuario desde el backend
  async loadUserConfig(): Promise<UserConfig | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // No mostrar error si no hay token (usuario no logueado)
        return null;
      }

      // Por ahora, el endpoint /api/user/theme no está implementado
      // Retornamos null silenciosamente para evitar errores en consola
      // TODO: Descomentar cuando el backend implemente este endpoint
      /*
      const response = await axios.get(`${API_BASE}/api/user/theme`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        this.userConfig = response.data.config;
        this.notifyThemeListeners();
        return this.userConfig;
      }
      */
      
      return null;
    } catch (error: unknown) {
      // Silenciar todos los errores (401, 404, etc.) para evitar spam en consola
      // cuando el endpoint no está implementado
      if (axios.isAxiosError(error)) {
        const status = error?.response?.status;
        // Solo logear si es un error inesperado (no 401, 404)
        if (status && status !== 401 && status !== 404) {
          console.error('Error loading user config:', error);
        }
      }
      // Retornar null silenciosamente
    }
    return null;
  }

  // Obtener configuración actual
  getUserConfig(): UserConfig | null {
    return this.userConfig;
  }

  // Verificar si el usuario tiene un permiso específico
  hasPermission(permission: string): boolean {
    if (!this.userConfig) return false;
    return this.userConfig.permissions.includes(permission) || 
           this.userConfig.permissions.includes('full_access');
  }

  // Obtener tema actual
  getCurrentTheme(): UserTheme | null {
    return this.userConfig?.theme || null;
  }

  // Obtener dashboard URL para el usuario
  getDashboardUrl(): string {
    return this.userConfig?.dashboard || '/dashboard';
  }

  // Suscribirse a cambios de tema
  onThemeChange(callback: (config: UserConfig) => void): () => void {
    this.themeListeners.push(callback);
    
    // Si ya hay configuración, ejecutar callback inmediatamente
    if (this.userConfig) {
      callback(this.userConfig);
    }

    // Devolver función para desuscribirse
    return () => {
      const index = this.themeListeners.indexOf(callback);
      if (index > -1) {
        this.themeListeners.splice(index, 1);
      }
    };
  }

  // @ts-expect-error - Used in line 58
  private notifyThemeListeners(): void {
    if (this.userConfig) {
      this.themeListeners.forEach(callback => callback(this.userConfig!));
    }
  }

  // Aplicar tema CSS al documento
  applyTheme(): void {
    if (!this.userConfig) return;

    const theme = this.userConfig.theme;
    const root = document.documentElement;

    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-surface', theme.surface);

    // Aplicar al theme de Material-UI si está disponible
    interface WindowWithTheme extends Window {
      MUI_THEME?: {
        palette: {
          primary: { main: string };
          secondary: { main: string };
        };
      };
    }
    
    const win = window as WindowWithTheme;
    if (win.MUI_THEME) {
      win.MUI_THEME.palette.primary.main = theme.primary;
      win.MUI_THEME.palette.secondary.main = theme.secondary;
    }
  }

  // Limpiar configuración (logout)
  clearConfig(): void {
    this.userConfig = null;
    // Restaurar tema por defecto
    const root = document.documentElement;
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-secondary');
    root.style.removeProperty('--color-accent');
    root.style.removeProperty('--color-background');
    root.style.removeProperty('--color-surface');
  }
}

export default ThemeService.getInstance();