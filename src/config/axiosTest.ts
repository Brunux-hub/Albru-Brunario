// Archivo de prueba para verificar funciones

export const testConnection = async () => {
  return true;
};

export const testReassignCliente = async (clientId: number, previousAdvisor: string, newAdvisor: string) => {
  const mockResponse = {
    success: true,
    message: 'Cliente reasignado exitosamente',
    clientId,
    previousAdvisor,
    newAdvisor,
    timestamp: new Date().toISOString()
  };
  
  return mockResponse;
};