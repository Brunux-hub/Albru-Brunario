import React, { createContext, useState, useEffect, useContext } from 'react';
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
  dni: string;
  servicio: string;
  estado: string;
  gestion: string;
  seguimiento: string;
  coordenadas?: string;
  campania?: string;
  canal?: string;
  comentariosIniciales?: string;
  direccion?: string;
  tipoCasa?: string;
  tipoVia?: string;
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

  // ----------------------------------------------------------------------------
  // AUTH: Initialize on mount
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('albru_token');
        
        if (storedToken) {
          // Verificar si el token no está expirado
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
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
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        clearAuth();
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  // ----------------------------------------------------------------------------
  // AUTH: Set authentication data
  // ----------------------------------------------------------------------------
  const setAuthData = (newToken: string, userData: User) => {
    console.log('🔑 AppContext: Estableciendo datos de autenticación');
    
    // Guardar en estado
    setToken(newToken);
    setUser(userData);
    
    // Guardar en localStorage con múltiples formatos para compatibilidad
    localStorage.setItem('albru_token', newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('albru_user', JSON.stringify(userData));
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  // ----------------------------------------------------------------------------
  // AUTH: Clear authentication
  // ----------------------------------------------------------------------------
  const clearAuth = () => {
    console.log('🧹 AppContext: Limpiando autenticación');
    
    // Limpiar estado
    setToken(null);
    setUser(null);
    
    // Limpiar localStorage
    localStorage.removeItem('albru_token');
    localStorage.removeItem('token');
    localStorage.removeItem('albru_user');
    localStorage.removeItem('userData');
  };

  // ----------------------------------------------------------------------------
  // AUTH: Logout
  // ----------------------------------------------------------------------------
  const logout = () => {
    console.log('🚪 AppContext: Logout iniciado');
    
    clearAuth();
    
    // Limpiar todo el localStorage y sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Redireccionar
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  // ----------------------------------------------------------------------------
  // CLIENTES: Agregar nuevo cliente
  // ----------------------------------------------------------------------------
  const agregarCliente = (cliente: Cliente) => {
    console.log('🔥 AppContext: Agregando cliente:', cliente.nombre);
    setClientes((prevClientes) => {
      // Verificar si el cliente ya existe para evitar duplicados
      const existeCliente = prevClientes.some(c => c.dni === cliente.dni || c.telefono === cliente.telefono);
      if (existeCliente) {
        console.log('⚠️ Cliente ya existe, no se agrega duplicado');
        return prevClientes;
      }
      const nuevaLista = [...prevClientes, cliente];
      console.log('✅ Cliente agregado, nueva lista:', nuevaLista.length, 'clientes');
      return nuevaLista;
    });
  };

  // ----------------------------------------------------------------------------
  // CLIENTES: Reasignar cliente
  // ----------------------------------------------------------------------------
  const reasignarCliente = (cliente: Cliente) => {
    console.log('🔄 AppContext: Reasignando cliente:', cliente.nombre);
    setClientes((prevClientes) => {
      const nuevaLista = [...prevClientes, cliente];
      return nuevaLista;
    });
  };

  // ----------------------------------------------------------------------------
  // CLIENTES: Actualizar cliente existente
  // ----------------------------------------------------------------------------
  const actualizarCliente = (clienteActualizado: Cliente) => {
    console.log('🔥 AppContext: actualizarCliente llamado');
    console.log('📋 Datos recibidos:', clienteActualizado);
    
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
        
        console.log('🔍 ID del cliente:', clienteId);
        
        if (!clienteId) {
          console.error('❌ NO HAY ID - No se puede actualizar');
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

        console.log('📦 Datos preparados para enviar:', datosBackend);
        console.log('📊 Total de campos:', Object.keys(datosBackend).length);
        
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const url = `${backendUrl}/api/clientes/${clienteId}`;
        
        console.log('🚀 ENVIANDO PUT a:', url);
        console.log('📤 Body:', JSON.stringify(datosBackend, null, 2));
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(datosBackend)
        });

        console.log('📡 Response recibido - Status:', response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ ¡ÉXITO! Cliente guardado en BD');
          console.log('📥 Respuesta del servidor:', result);
          alert('✅ Cliente guardado exitosamente en la base de datos');
        } else {
          const errorText = await response.text();
          console.error('❌ ERROR del backend:', response.status, errorText);
          try {
            const errorJson = JSON.parse(errorText);
            alert(`❌ Error: ${errorJson.message || 'Error desconocido'}`);
          } catch {
            alert(`❌ Error HTTP ${response.status}: ${errorText}`);
          }
        }
      } catch (e) {
        console.error('💥 EXCEPCIÓN al guardar:', e);
        alert(`💥 Error de conexión: ${(e as Error).message}`);
      }
    })();
  };

  // ----------------------------------------------------------------------------
  // CLIENTES: Recargar lista de clientes
  // ----------------------------------------------------------------------------
  const recargarClientes = () => {
    console.log('♻️ AppContext: Recargando clientes');
    setClientes([]);
  };

  // ----------------------------------------------------------------------------
  // COMPUTED VALUES
  // ----------------------------------------------------------------------------
  const isAuthenticated = !!token && !!user;

  // ----------------------------------------------------------------------------
  // CONTEXT VALUE
  // ----------------------------------------------------------------------------
  const value: AppContextType = {
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
    recargarClientes
  };

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
  const { clientes, agregarCliente, reasignarCliente, actualizarCliente, recargarClientes } = useApp();
  return { clientes, agregarCliente, reasignarCliente, actualizarCliente, recargarClientes };
};
