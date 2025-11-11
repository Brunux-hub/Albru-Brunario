// Hook para usar el servicio de temas
import { useState, useEffect } from 'react';
import ThemeService, { type UserConfig } from '../services/ThemeService';

export const useTheme = () => {
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      setIsLoading(true);
      const config = await ThemeService.loadUserConfig();
      setUserConfig(config);
      if (config) {
        ThemeService.applyTheme();
      }
      setIsLoading(false);
    };

    loadTheme();

    // Suscribirse a cambios de tema
    const unsubscribe = ThemeService.onThemeChange((config) => {
      setUserConfig(config);
      ThemeService.applyTheme();
    });

    return unsubscribe;
  }, []);

  return {
    userConfig,
    theme: userConfig?.theme || null,
    isLoading,
    hasPermission: (permission: string) => ThemeService.hasPermission(permission),
    getDashboardUrl: () => ThemeService.getDashboardUrl(),
    applyTheme: () => ThemeService.applyTheme(),
    clearTheme: () => ThemeService.clearConfig()
  };
};

export const usePermissions = () => {
  const { userConfig } = useTheme();
  
  return {
    hasPermission: (permission: string) => ThemeService.hasPermission(permission),
    permissions: userConfig?.permissions || [],
    isAdmin: () => ThemeService.hasPermission('full_access'),
    isAsesor: () => ThemeService.hasPermission('wizard_access'),
    isGTR: () => ThemeService.hasPermission('assign_clients'),
    isSupervisor: () => ThemeService.hasPermission('monitor_asesores')
  };
};