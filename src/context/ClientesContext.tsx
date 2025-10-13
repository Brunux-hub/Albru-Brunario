import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

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

interface ClientesContextType {
  clientes: Cliente[];
  agregarCliente: (cliente: Cliente) => void;
  reasignarCliente: (cliente: Cliente) => void;
  actualizarCliente: (clienteActualizado: Cliente) => void;
  recargarClientes: () => void;
}

const ClientesContext = createContext<ClientesContextType | undefined>(undefined);

const clientesIniciales: Cliente[] = [
  // Lista vacía - los clientes se cargarán desde la base de datos
];

export const ClientesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Usar solo datos iniciales (sin localStorage)
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciales);

  // Función para recargar datos iniciales
  const recargarDatos = () => {
    setClientes(clientesIniciales);
  };

  const agregarCliente = (cliente: Cliente) => {
    console.log('🔥 ClientesContext: Agregando cliente:', cliente.nombre);
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

  const reasignarCliente = (cliente: Cliente) => {
    setClientes((prevClientes) => {
      const nuevaLista = [...prevClientes, cliente];
      return nuevaLista;
    });
  };

  const actualizarCliente = (clienteActualizado: Cliente) => {
    // Enviar al backend para persistir cambios si tenemos un DNI identificador
    (async () => {
      try {
        // Intentar enviar cambios al backend si existe un endpoint
        const clienteId = (clienteActualizado as any).id || null;
        const payload: any = { clienteId: clienteId, datos: { ...clienteActualizado } };
        // Usar fetch directo para no introducir dependencias adicionales
        await fetch((import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001') + '/api/asesores/actualizar-cliente', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.warn('No se pudo persistir en backend (continuando en UI):', e);
      }
    })();

    setClientes((prevClientes) =>
      prevClientes.map((cliente) =>
        cliente.dni === clienteActualizado.dni ? { ...cliente, ...clienteActualizado } : cliente
      )
    );
  };

  return (
    <ClientesContext.Provider value={{ clientes, agregarCliente, reasignarCliente, actualizarCliente, recargarClientes: recargarDatos }}>
      {children}
    </ClientesContext.Provider>
  );
};

export const useClientes = (): ClientesContextType => {
  const context = useContext(ClientesContext);
  if (context === undefined) {
    throw new Error('useClientes debe ser usado dentro de un ClientesProvider');
  }
  return context;
};