/**
 * ALBRU CRM - STORE DE SESIONES
 * State management con Zustand + persistencia localStorage
 * @module stores/sessionStore
 */

import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SessionData {
  clienteId: number;
  asesorId: number;
  status: 'derivado' | 'en_gestion' | 'gestionado' | 'no_gestionado' | 'cerrado';
  startedAt: string;
  ttl?: number;
  expiresAt?: string;
}

interface SessionState {
  // Estado
  activeSessions: Map<number, SessionData>;
  currentSession: SessionData | null;

  // Acciones
  setCurrentSession: (session: SessionData | null) => void;
  updateCurrentSession: (updates: Partial<SessionData>) => void;
  addSession: (clienteId: number, session: SessionData) => void;
  removeSession: (clienteId: number) => void;
  getSession: (clienteId: number) => SessionData | undefined;
  clearAllSessions: () => void;

  // TTL Management
  updateTTL: (clienteId: number, ttl: number) => void;

  // Persistencia
  restoreFromStorage: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      activeSessions: new Map(),
      currentSession: null,

      // Establecer sesión actual
      setCurrentSession: (session) => {
        set({ currentSession: session });

        if (session) {
          // También guardar en sessions map
          set((state) => {
            const newMap = new Map(state.activeSessions);
            newMap.set(session.clienteId, session);
            return { activeSessions: newMap };
          });

          // Guardar en localStorage
          localStorage.setItem('albru_current_session', JSON.stringify(session));
        } else {
          localStorage.removeItem('albru_current_session');
        }
      },

      // Actualizar sesión actual
      updateCurrentSession: (updates) => {
        set((state) => {
          if (!state.currentSession) return state;

          const updatedSession = { ...state.currentSession, ...updates };

          // Actualizar también en el map
          const newMap = new Map(state.activeSessions);
          newMap.set(updatedSession.clienteId, updatedSession);

          // Guardar en localStorage
          localStorage.setItem('albru_current_session', JSON.stringify(updatedSession));

          return {
            currentSession: updatedSession,
            activeSessions: newMap,
          };
        });
      },

      // Agregar sesión al map
      addSession: (clienteId, session) => {
        set((state) => {
          const newMap = new Map(state.activeSessions);
          newMap.set(clienteId, session);
          return { activeSessions: newMap };
        });
      },

      // Remover sesión
      removeSession: (clienteId) => {
        set((state) => {
          const newMap = new Map(state.activeSessions);
          newMap.delete(clienteId);

          // Si era la sesión actual, limpiarla
          const newCurrentSession =
            state.currentSession?.clienteId === clienteId ? null : state.currentSession;

          if (newCurrentSession === null) {
            localStorage.removeItem('albru_current_session');
          }

          return {
            activeSessions: newMap,
            currentSession: newCurrentSession,
          };
        });
      },

      // Obtener sesión por ID
      getSession: (clienteId) => {
        return get().activeSessions.get(clienteId);
      },

      // Limpiar todas las sesiones
      clearAllSessions: () => {
        set({ activeSessions: new Map(), currentSession: null });
        localStorage.removeItem('albru_current_session');
      },

      // Actualizar TTL de una sesión
      updateTTL: (clienteId, ttl) => {
        set((state) => {
          const session = state.activeSessions.get(clienteId);
          if (!session) return state;

          const updatedSession = {
            ...session,
            ttl,
            expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
          };

          const newMap = new Map(state.activeSessions);
          newMap.set(clienteId, updatedSession);

          // Si es la sesión actual, actualizarla también
          const newCurrentSession =
            state.currentSession?.clienteId === clienteId
              ? updatedSession
              : state.currentSession;

          return {
            activeSessions: newMap,
            currentSession: newCurrentSession,
          };
        });
      },

      // Restaurar desde localStorage (recovery)
      restoreFromStorage: () => {
        try {
          const stored = localStorage.getItem('albru_current_session');
          if (stored) {
            const session = JSON.parse(stored);
            set({ currentSession: session });

            // Agregar al map
            set((state) => {
              const newMap = new Map(state.activeSessions);
              newMap.set(session.clienteId, session);
              return { activeSessions: newMap };
            });

            console.log('✅ Sesión restaurada desde localStorage:', session);
          }
        } catch (error) {
          console.error('❌ Error al restaurar sesión:', error);
        }
      },
    }),
    {
      name: 'albru-session-storage',
      // Solo persistir currentSession para no sobrecargar localStorage
      partialize: (state) => ({
        currentSession: state.currentSession,
      }),
    }
  )
);

/**
 * Hook para restaurar sesión al cargar la app
 */
export const useRestoreSession = () => {
  const restoreFromStorage = useSessionStore((state) => state.restoreFromStorage);

  // Restaurar al montar
  useEffect(() => {
    restoreFromStorage();
  }, [restoreFromStorage]);
};

export default useSessionStore;
