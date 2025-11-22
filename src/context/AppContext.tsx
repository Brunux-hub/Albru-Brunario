import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { API_BASE } from '../config/backend';
import type { ReactNode } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface User {
  id: number;
  nombre: string;
  email: string;
  tipo: 'admin' | 'gtr' | 'asesor' | 'supervisor' | 'validador';
  tenant_id: number;
}

export interface Cliente {
  id?: number;
  fecha: string;
  nombre: string;
  telefono: string;
  // Número original proveniente del lead si existe (separado del teléfono normal)
  leads_original_telefono?: string;
  dni: string;
  servicio: string;
  estado: string;
  gestion: string;
  seguimiento: string;
  coordenadas?: string;
  // campana: nombre canonico para la campaña (usar este en todo el frontend)
  campana?: string;
  canal?: string;
  compania?: string;
  sala_asignada?: string;
  comentariosIniciales?: string;
  direccion?: string;
  tipoCasa?: string;
  tipoVia?: string;
  // Flag temporal que indica que el cliente está siendo gestionado por un asesor
  ocupado?: boolean;
  // Estado del seguimiento automático (derivado, en_gestion, gestionado, no_gestionado)
  seguimiento_status?: string | null;
  // Timestamps para seguimiento automático
  derivado_at?: string | null;
  opened_at?: string | null;
  // ID del asesor asignado
  asesor_asignado?: number | null;
  // Categoría y subcategoría del estatus comercial (del wizard)
  estatus_comercial_categoria?: string | null;
  estatus_comercial_subcategoria?: string | null;
  // Campos para sistema de duplicados
  es_duplicado?: boolean;
  cantidad_duplicados?: number;
  telefono_principal_id?: number | null;
}

interface AppContextType {
  // Auth state
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  
  // Auth actions
  setAuthData: (token: string, user: User) => void;
  logout: () => void;
  
  // Clientes state
  clientes: Cliente[];
  
  // Clientes actions
  agregarCliente: (cliente: Cliente) => void;
  reasignarCliente: (cliente: Cliente) => void;
  actualizarCliente: (clienteActualizado: Cliente) => void;
  marcarClienteOcupadoLocal: (clienteId: number | undefined, ocupado?: boolean) => void;
  recargarClientes: () => void;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ----------------------------------------------------------------------------
  // AUTH STATE
  // ----------------------------------------------------------------------------
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ----------------------------------------------------------------------------
  // CLIENTES STATE
  // ----------------------------------------------------------------------------
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // (Inicialización de auth movida más abajo para que las funciones usadas estén declaradas antes)

  // ----------------------------------------------------------------------------
  // AUTH: Set authentication data
  // ----------------------------------------------------------------------------
  const setAuthData = useCallback((newToken: string, userData: User) => {
    // Establecer datos de autenticación (no loguear en consola para evitar ruido)
    
    // Guardar en estado
    setToken(newToken);
    setUser(userData);
    
    // Guardar en localStorage con múltiples formatos para compatibilidad
    localStorage.setItem('albru_token', newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('albru_user', JSON.stringify(userData));
    localStorage.setItem('userData', JSON.stringify(userData));
  }, []);

  // ----------------------------------------------------------------------------
  // AUTH: Clear authentication
  // ----------------------------------------------------------------------------
  const clearAuth = useCallback(() => {
    // Limpiar autenticación
    
    // Limpiar estado
    setToken(null);
    setUser(null);
    
    // Limpiar localStorage
    localStorage.removeItem('albru_token');
    localStorage.removeItem('token');
    localStorage.removeItem('albru_user');
    localStorage.removeItem('userData');
  }, []);

  // ----------------------------------------------------------------------------
  // AUTH: Logout
  // ----------------------------------------------------------------------------
  const logout = useCallback(() => {
    // Logout iniciado
    clearAuth();
    
    // Limpiar todo el localStorage y sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Redireccionar
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  }, [clearAuth]);

  // ----------------------------------------------------------------------------
  // AUTH: Initialize on mount
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const initAuth = () => {
      try {
          // Remove legacy large client cache to avoid localStorage quota issues
          if (localStorage.getItem('gtr_clients')) {
            try {
              console.info('Limpiando localStorage key: gtr_clients (legacy)');
              localStorage.removeItem('gtr_clients');
            } catch (e) {
              console.warn('No se pudo limpiar localStorage gtr_clients:', e);
            }
          }

          const storedToken = localStorage.getItem('albru_token');
        
        if (storedToken) {
          // Validar formato JWT (debe tener 3 partes separadas por punto)
          const parts = storedToken.split('.');
          if (parts.length !== 3) {
            console.warn('⚠️ Token con formato inválido (no es JWT), limpiando datos');
            clearAuth();
            setAuthLoading(false);
            return;
          }

          try {
            // Verificar si el token no está expirado
            const payload = JSON.parse(atob(parts[1]));
            const isExpired = payload.exp * 1000 < Date.now();
            
            if (!isExpired) {
              console.log('✅ Token válido encontrado, restaurando sesión');
              
              const userData: User = {
                id: payload.userId,
                nombre: payload.nombre,
                email: payload.email,
                tipo: payload.tipo,
                tenant_id: payload.tenant_id || payload.tenantId
              };
              
              setToken(storedToken);
              setUser(userData);
              
              // Guardar también en formato legacy para compatibilidad
              localStorage.setItem('token', storedToken);
              localStorage.setItem('albru_user', JSON.stringify(userData));
              localStorage.setItem('userData', JSON.stringify(userData));
            } else {
              console.log('❌ Token expirado, limpiando datos');
              clearAuth();
            }
          } catch (decodeError) {
            // Mostrar como warning para no llenar la consola con errores no críticos
            console.warn('❌ Error decodificando token (corrupto o inválido):', decodeError);
            clearAuth();
          }
        }
      } catch (error) {
        console.error('❌ Error inicializando autenticación:', error);
        clearAuth();
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, [clearAuth]);

  // ----------------------------------------------------------------------------
  // CLIENTES: Agregar nuevo cliente
  // ----------------------------------------------------------------------------
  const agregarCliente = useCallback((cliente: Cliente) => {
    setClientes((prevClientes) => {
      // Verificar si el cliente ya existe para evitar duplicados (comparar por DNI o teléfono si existen)
      const existeCliente = prevClientes.some(c => (c.dni && cliente.dni && c.dni === cliente.dni) || (c.telefono && cliente.telefono && c.telefono === cliente.telefono));
      if (existeCliente) return prevClientes;
      return [...prevClientes, cliente];
    });
  }, []);

  // ----------------------------------------------------------------------------
  // CLIENTES: Reasignar cliente
  // ----------------------------------------------------------------------------
  const reasignarCliente = useCallback((cliente: Cliente) => {
    // Añadir cliente reasignado al estado local
    setClientes((prevClientes) => [...prevClientes, cliente]);
  }, []);

  // ----------------------------------------------------------------------------
  // CLIENTES: Actualizar cliente existente
  // ----------------------------------------------------------------------------
  const actualizarCliente = useCallback((clienteActualizado: Cliente) => {
    // Actualizar cliente en el estado local y enviar cambios al backend
    // Actualizar estado local primero
    setClientes((prevClientes) =>
      prevClientes.map((cliente) =>
        cliente.dni === clienteActualizado.dni ? { ...cliente, ...clienteActualizado } : cliente
      )
    );

    // Enviar al backend
    (async () => {
      try {
        const clienteId = (clienteActualizado as Cliente & { id?: number }).id || null;
        
        if (!clienteId) {
          console.error('No hay ID de cliente para actualizar');
          alert('Error: No se puede guardar sin ID de cliente');
          return;
        }

        // Construir objeto con TODOS los campos del wizard
        const datosBackend: Record<string, unknown> = {};
        
        // Copiar TODO el objeto clienteActualizado
        Object.keys(clienteActualizado).forEach(key => {
          const valor = (clienteActualizado as unknown as Record<string, unknown>)[key];
          if (valor !== undefined && valor !== null && valor !== '') {
            datosBackend[key] = valor;
          }
        });

        const backendUrl = API_BASE || '';
        const url = `${backendUrl}/api/clientes/${clienteId}`;
        
        // Añadir usuario_id (asesor que realiza la gestión) para que el backend pueda registrar historial
        const currentUser = user || JSON.parse(localStorage.getItem('userData') || 'null');
        if (currentUser && !(datosBackend as Record<string, unknown>)['usuario_id']) {
          (datosBackend as Record<string, unknown>)['usuario_id'] = (currentUser as User).id;
        }

        const response = await fetch(url, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(datosBackend)
        });

        if (response.ok) {
          await response.json();
          // Éxito: opcional mostrar notificación en UI
          alert('✅ Cliente guardado exitosamente en la base de datos');
        } else {
          const errorText = await response.text();
          console.error('Error del backend al guardar cliente:', response.status, errorText);
          try {
            const errorJson = JSON.parse(errorText);
            alert(`❌ Error: ${errorJson.message || 'Error desconocido'}`);
          } catch {
            alert(`❌ Error HTTP ${response.status}: ${errorText}`);
          }
        }
      } catch (e) {
        console.error('Excepción al guardar cliente:', e);
        alert(`💥 Error de conexión: ${(e as Error).message}`);
      }
    })();
  }, [user]);

  // ----------------------------------------------------------------------------
  // CLIENTES: Recargar lista de clientes
  // ----------------------------------------------------------------------------
  const recargarClientes = useCallback(() => {
    // Recargar la lista de clientes (limpiar estado local)
    setClientes([]);
  }, []);

  // ----------------------------------------------------------------------------
  // CLIENTES: Marcar un cliente como ocupado localmente (no persiste en backend)
  // Esto permite indicar que un asesor abrió el wizard sin modificar el estado
  // visible en el panel Asesor. Es un flag temporal en el estado cliente.
  const marcarClienteOcupadoLocal = useCallback((clienteId: number | undefined, ocupado = true) => {
    if (!clienteId) return;
    setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, ocupado } : c));
  }, []);

  // ----------------------------------------------------------------------------
  // COMPUTED VALUES
  // ----------------------------------------------------------------------------
  const isAuthenticated = !!token && !!user;

  // ----------------------------------------------------------------------------
  // CONTEXT VALUE
  // ----------------------------------------------------------------------------
  const value: AppContextType = useMemo(() => ({
    // Auth
    user,
    token,
    isAuthenticated,
    authLoading,
    setAuthData,
    logout,
    
    // Clientes
    clientes,
    agregarCliente,
    reasignarCliente,
    actualizarCliente,
    marcarClienteOcupadoLocal,
    recargarClientes
  }), [user, token, isAuthenticated, authLoading, clientes, agregarCliente, reasignarCliente, actualizarCliente, marcarClienteOcupadoLocal, recargarClientes, setAuthData, logout]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

// Hook para acceso completo al contexto
// eslint-disable-next-line react-refresh/only-export-components
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};

// Hook específico para autenticación (backward compatibility)
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const { user, token, isAuthenticated, authLoading, setAuthData, logout } = useApp();
  return { user, token, isAuthenticated, loading: authLoading, setAuthData, logout };
};

// Hook específico para clientes (backward compatibility)
// eslint-disable-next-line react-refresh/only-export-components
export const useClientes = () => {
  const { clientes, agregarCliente, reasignarCliente, actualizarCliente, marcarClienteOcupadoLocal, recargarClientes } = useApp();
  return { clientes, agregarCliente, reasignarCliente, actualizarCliente, marcarClienteOcupadoLocal, recargarClientes };
};
