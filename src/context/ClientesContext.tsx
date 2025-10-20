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
        
        if (!clienteId) {
          console.warn('No se puede actualizar cliente sin ID:', clienteActualizado.nombre);
          return;
        }

        // Mapear todos los campos del frontend a los campos esperados por el backend
        const datosBackend: any = {};
        
        // Campos básicos - CORREGIDOS para coincidir con la BD
        if (clienteActualizado.nombre) datosBackend.nombre = clienteActualizado.nombre;
        if (clienteActualizado.telefono) datosBackend.telefono = clienteActualizado.telefono;
        if (clienteActualizado.dni) datosBackend.dni = clienteActualizado.dni;
        if (clienteActualizado.direccion) datosBackend.direccion = clienteActualizado.direccion;
        if (clienteActualizado.estado) datosBackend.estado = clienteActualizado.estado;
        if (clienteActualizado.servicio) datosBackend.servicio_contratado = clienteActualizado.servicio; // CORREGIDO: servicio va a servicio_contratado
        if (clienteActualizado.seguimiento) datosBackend.fecha_ultimo_contacto = clienteActualizado.seguimiento;
        if (clienteActualizado.comentariosIniciales) datosBackend.notas = clienteActualizado.comentariosIniciales;
        
        // Campos del wizard (si están presentes en el objeto cliente actualizado)
        const camposWizard = [
          // Campos originales
          'tipo_cliente', 'tipo_documento', 'score', 'fecha_nacimiento', 'lugar_nacimiento',
          'titular_linea', 'correo_electronico', 'distrito', 'numero_piso', 'plan_seleccionado',
          'precio_final', 'dispositivos_adicionales', 'plataforma_digital', 'pago_adelanto_instalacion',
          'numero_referencia', 'numero_grabacion', 'coordenadas', 'observaciones_asesor',
          // Nuevos campos del wizard
          'lead_score', 'tipo_cliente_wizard', 'telefono_registro', 'dni_nombre_titular',
          'parentesco_titular', 'telefono_referencia_wizard', 'telefono_grabacion_wizard',
          'departamento', 'direccion_completa', 'numero_piso_wizard', 'tipo_plan',
          'servicio_contratado', 'velocidad_contratada', 'precio_plan',
          'dispositivos_adicionales_wizard', 'plataforma_digital_wizard',
          'pago_adelanto_instalacion_wizard', 'wizard_completado',
          'fecha_wizard_completado', 'wizard_data_json'
        ];
        
        camposWizard.forEach(campo => {
          if ((clienteActualizado as any)[campo] !== undefined && (clienteActualizado as any)[campo] !== null) {
            datosBackend[campo] = (clienteActualizado as any)[campo];
          }
        });

        console.log('🔄 Enviando actualización al backend para cliente ID:', clienteId);
        console.log('� Datos a enviar:', datosBackend);
        
        const response = await fetch((import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001') + `/api/clientes/${clienteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosBackend)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Cliente actualizado en backend:', result);
        } else {
          const error = await response.json();
          console.error('❌ Error del backend:', error);
        }
      } catch (e) {
        console.warn('⚠️ No se pudo persistir en backend (continuando en UI):', e);
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