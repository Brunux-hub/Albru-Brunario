type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

// Mapeo de estados de seguimiento a tipos de status
export const getSeguimientoStatus = (seguimiento: string): StatusType => {
  const statusMap: Record<string, StatusType> = {
    'gestionado': 'success',
    'gestionada': 'success',
    'en_gestion': 'warning',
    'derivado': 'info',
    'sin_gestionar': 'error',
    'no_gestionado': 'error',
    'nuevo': 'neutral',
  };
  
  return statusMap[seguimiento?.toLowerCase()] || 'neutral';
};

// Mapeo de categorías a tipos de status
export const getCategoriaBadgeColor = (categoria: string): StatusType => {
  const categoriaMap: Record<string, StatusType> = {
    'preventa completa': 'success',
    'preventa incompleta': 'warning',
    'preventa': 'info',
    'lista negra': 'error',
    'sin facilidades': 'error',
    'rechazado': 'error',
    'retirado': 'neutral',
    'agendado': 'info',
    'seguimiento': 'warning',
    'sin contacto': 'neutral',
  };
  
  return categoriaMap[categoria?.toLowerCase()] || 'neutral';
};

// Función helper para formatear texto de seguimiento
export const formatSeguimientoText = (seguimiento: string): string => {
  const textMap: Record<string, string> = {
    'derivado': 'Derivado',
    'en_gestion': 'En Gestión',
    'gestionado': 'Gestionado',
    'gestionada': 'Gestionado',
    'no_gestionado': 'No Gestionado',
    'sin_gestionar': 'Sin Gestionar',
    'nuevo': 'Nuevo',
  };
  
  return textMap[seguimiento?.toLowerCase()] || seguimiento;
};
