import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

interface Cliente {
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
  { 
    fecha: '08/09/2025', 
    nombre: 'Juan Pérez', 
    telefono: '914118663', 
    dni: '12345678', 
    servicio: 'Fibra Óptica', 
    estado: 'En gestión', 
    gestion: 'En proceso', 
    seguimiento: '2025-09-14T10:00', 
    coordenadas: '-12.0464,-77.0428', 
    campania: 'MASIVO', 
    canal: 'WSP 1', 
    comentariosIniciales: 'Cliente interesado en fibra',
    direccion: 'Av. Principal 123',
    tipoCasa: 'Casa',
    tipoVia: 'Avenida'
  },
  { 
    fecha: '06/09/2025', 
    nombre: 'Ana Rodríguez', 
    telefono: '923456789', 
    dni: '78945612', 
    servicio: 'Combo', 
    estado: 'En seguimiento', 
    gestion: 'En proceso', 
    seguimiento: '2025-09-15T16:00', 
    coordenadas: '', 
    campania: 'LEADS', 
    canal: 'WSP 4', 
    comentariosIniciales: '',
    direccion: 'Jr. Los Olivos 456',
    tipoCasa: 'Departamento',
    tipoVia: 'Jirón'
  },
  { 
    fecha: '07/09/2025', 
    nombre: 'Roberto Silva', 
    telefono: '912345678', 
    dni: '98765432', 
    servicio: 'Fibra Óptica', 
    estado: 'Nuevo', 
    gestion: 'Derivado', 
    seguimiento: '2025-09-14T09:00', 
    coordenadas: '-12.0500,-77.0500', 
    campania: 'REFERIDOS', 
    canal: 'REFERIDO', 
    comentariosIniciales: 'Referido por cliente actual',
    direccion: 'Calle Las Flores 789',
    tipoCasa: 'Casa',
    tipoVia: 'Calle'
  },
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