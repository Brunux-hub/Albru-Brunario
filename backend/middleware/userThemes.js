// Middleware para identificar usuario y aplicar configuración personalizada
const jwt = require('jsonwebtoken');

// Configuraciones de tema por usuario individual
const USER_THEMES = {
  // ASESORES INDIVIDUALIZADOS
  'jvenancioo@albru.pe': {
    userId: 'jvenancio',
    name: 'JEYSON ALDHAIR VENANCIO OBREGON',
    theme: {
      primary: '#1976d2',      // Azul
      secondary: '#dc004e',    // Rosa
      accent: '#00bcd4',       // Cyan
      background: '#f5f5f5',
      surface: '#ffffff'
    },
    logo: '/assets/logo-jvenancio.png',
    brandName: 'Jeyson Venancio - Asesor',
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'wizard_access'],
    dashboard: '/dashboard/asesor'
  },
  'acatalanm@albru.pe': {
    userId: 'acatalanm',
    name: 'ANDREA YANEL CATALAN MAYTA',
    theme: {
      primary: '#388e3c',      // Verde
      secondary: '#ff5722',    // Naranja
      accent: '#4caf50',       // Verde claro
      background: '#f1f8e9',
      surface: '#ffffff'
    },
    logo: '/assets/logo-acatalann.png',
    brandName: 'Andrea Catalan - Asesor',
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'wizard_access'],
    dashboard: '/dashboard/asesor'
  },
  'adiazc@albru.pe': {
    userId: 'adiazc',
    name: 'ANGELO MATEO DIAZ CHANCAFE',
    theme: {
      primary: '#7b1fa2',      // Morado
      secondary: '#e91e63',    // Rosa fuerte
      accent: '#9c27b0',       // Morado claro
      background: '#fce4ec',
      surface: '#ffffff'
    },
    logo: '/assets/logo-adiazc.png',
    brandName: 'Angelo Diaz - Asesor',
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'wizard_access'],
    dashboard: '/dashboard/asesor'
  },
  'cmacedol@albru.pe': {
    userId: 'cmacedol',
    name: 'CRISTHIAN DIEGO MACEDO LEYVA',
    theme: {
      primary: '#d32f2f',      // Rojo
      secondary: '#1976d2',    // Azul
      accent: '#ff5722',       // Naranja
      background: '#ffebee',
      surface: '#ffffff'
    },
    logo: '/assets/logo-cmacedol.png',
    brandName: 'Cristhian Macedo - Asesor',
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'wizard_access'],
    dashboard: '/dashboard/asesor'
  },
  'dsanchezc@albru.pe': {
    userId: 'dsanchezc',
    name: 'DARYL ESTEFANO SANCHEZ CACERES',
    theme: {
      primary: '#ff9800',      // Naranja
      secondary: '#2196f3',    // Azul
      accent: '#ffc107',       // Amarillo
      background: '#fff3e0',
      surface: '#ffffff'
    },
    logo: '/assets/logo-dsanchezc.png',
    brandName: 'Daryl Sanchez - Asesor',
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'wizard_access'],
    dashboard: '/dashboard/asesor'
  },
  'jmezav@albru.pe': {
    userId: 'jmezav',
    name: 'JESSICA DIANA MEZA VELASQUEZ',
    theme: {
      primary: '#e91e63',      // Rosa
      secondary: '#673ab7',    // Morado oscuro
      accent: '#f06292',       // Rosa claro
      background: '#fce4ec',
      surface: '#ffffff'
    },
    logo: '/assets/logo-jmezav.png',
    brandName: 'Jessica Meza - Asesor',
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'wizard_access'],
    dashboard: '/dashboard/asesor'
  },
  'gcabreran@albru.pe': {
    userId: 'gcabreran',
    name: 'GINGER STEPHANY CABRERA NIZAMA',
    theme: {
      primary: '#00bcd4',      // Cyan
      secondary: '#ff9800',    // Naranja
      accent: '#4dd0e1',       // Cyan claro
      background: '#e0f7fa',
      surface: '#ffffff'
    },
    logo: '/assets/logo-gcabrerac.png',
    brandName: 'Ginger Cabrera - Asesor',
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'wizard_access'],
    dashboard: '/dashboard/asesor'
  },
  'jariasr@albru.pe': {
    userId: 'jariasr',
    name: 'JHUDIT ARIAS ROJAS',
    theme: {
      primary: '#795548',      // Marrón
      secondary: '#607d8b',    // Azul gris
      accent: '#8d6e63',       // Marrón claro
      background: '#efebe9',
      surface: '#ffffff'
    },
    logo: '/assets/logo-jariasrr.png',
    brandName: 'Jhudit Arias - Asesor',
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'wizard_access'],
    dashboard: '/dashboard/asesor'
  },
  'kriverab@albru.pe': {
    userId: 'kriverab',
    name: 'KAREN GUISELL RIVERA BALDEON',
    theme: {
      primary: '#9c27b0',      // Morado medio
      secondary: '#4caf50',    // Verde
      accent: '#ba68c8',       // Morado claro
      background: '#f3e5f5',
      surface: '#ffffff'
    },
    logo: '/assets/logo-kriverab.png',
    brandName: 'Karen Rivera - Asesor',
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'wizard_access'],
    dashboard: '/dashboard/asesor'
  },
  'lparedesc@albru.pe': {
    userId: 'lparedesc',
    name: 'LUCIA PAREDES CASAMAYOR',
    theme: {
      primary: '#ff5722',      // Naranja profundo
      secondary: '#3f51b5',    // Indigo
      accent: '#ff8a65',       // Naranja claro
      background: '#fbe9e7',
      surface: '#ffffff'
    },
    logo: '/assets/logo-lparedes.png',
    brandName: 'Lucia Paredes - Asesor',
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'wizard_access'],
    dashboard: '/dashboard/asesor'
  },
  'npalacioss@albru.pe': {
    userId: 'npalacioss',
    name: 'NAYELI AMELUZ PALACIOS SIMBALA',
    theme: {
      primary: '#607d8b',      // Azul gris
      secondary: '#ff9800',    // Naranja
      accent: '#90a4ae',       // Azul gris claro
      background: '#eceff1',
      surface: '#ffffff'
    },
    logo: '/assets/logo-npalacioss.png',
    brandName: 'Nayeli Palacios - Validador',
    permissions: ['view_clients', 'validate_clients', 'edit_clients'],
    dashboard: '/dashboard/validador'
  },
  'rvillarb@albru.pe': {
    userId: 'rvillarb',
    name: 'ROXANA GISELA VILLAR BAZAN',
    theme: {
      primary: '#e91e63',      // Rosa medio
      secondary: '#00bcd4',    // Cyan
      accent: '#f48fb1',       // Rosa claro
      background: '#fce4ec',
      surface: '#ffffff'
    },
    logo: '/assets/logo-rvillarb.png',
    brandName: 'Roxana Villar - Validador',
    permissions: ['view_clients', 'validate_clients', 'edit_clients'],
    dashboard: '/dashboard/validador'
  },
  'sbatistal@albru.pe': {
    userId: 'sbatistal',
    name: 'SEBASTIAN ALESSANDRO BATISTA LIZARBE ACASIETE',
    theme: {
      primary: '#2196f3',      // Azul medio
      secondary: '#ff5722',    // Naranja profundo
      accent: '#64b5f6',       // Azul claro
      background: '#e3f2fd',
      surface: '#ffffff'
    },
    logo: '/assets/logo-sbatistal.png',
    brandName: 'Sebastian Batista - Asesor',
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'wizard_access'],
    dashboard: '/dashboard/asesor'
  },
  // SUPERVISORES
  'rramirezt@albru.pe': {
    userId: 'rramirezt',
    name: 'REILEX GABRIEL RAMIREZ TOVAR',
    theme: {
      primary: '#ff9800',      // Naranja
      secondary: '#2196f3',    // Azul
      accent: '#ffb74d',       // Naranja claro
      background: '#fff3e0',
      surface: '#ffffff'
    },
    logo: '/assets/logo-rramirezt.png',
    brandName: 'Reilex Ramirez - Supervisor',
    permissions: ['view_all_clients', 'view_reports', 'monitor_asesores', 'manage_team'],
    dashboard: '/dashboard/supervisor'
  },
  'jclementc@albru.pe': {
    userId: 'jclementc',
    name: 'JUAN PABLO CLEMENT CLEMENT',
    theme: {
      primary: '#673ab7',      // Morado profundo
      secondary: '#4caf50',    // Verde
      accent: '#9575cd',       // Morado claro
      background: '#ede7f6',
      surface: '#ffffff'
    },
    logo: '/assets/logo-jclementc.png',
    brandName: 'Juan Pablo Clement - Asesor',
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'wizard_access'],
    dashboard: '/dashboard/asesor'
  },
  
  // GTRs
  'mcaceresv@albru.pe': {
    userId: 'mcaceresv',
    name: 'MATIAS JOSUÉ CÁCERES VASQUEZ',
    theme: {
      primary: '#009688',      // Teal
      secondary: '#ff5722',    // Naranja profundo
      accent: '#4db6ac',       // Teal claro
      background: '#e0f2f1',
      surface: '#ffffff'
    },
    logo: '/assets/logo-mcaceresv.png',
    brandName: 'Matias Caceres - GTR',
    permissions: ['view_all_clients', 'assign_clients', 'view_asesores', 'manage_assignments'],
    dashboard: '/dashboard/gtr'
  },
  'kvivancoa@albru.pe': {
    userId: 'kvivancoa',
    name: 'KIARA MIA VIVANCO ALVA',
    theme: {
      primary: '#e91e63',      // Rosa
      secondary: '#673ab7',    // Morado profundo
      accent: '#f06292',       // Rosa claro
      background: '#fce4ec',
      surface: '#ffffff'
    },
    logo: '/assets/logo-kvivancoa.png',
    brandName: 'Kiara Vivanco - Asesor',
    permissions: ['view_clients', 'edit_clients', 'create_clients', 'wizard_access'],
    dashboard: '/dashboard/asesor'
  },
  // ADMIN
  'admin@albru.pe': {
    userId: 'admin',
    name: 'Administrador General',
    theme: {
      primary: '#d32f2f',      // Rojo
      secondary: '#1976d2',    // Azul
      accent: '#ff5722',       // Naranja
      background: '#ffebee',
      surface: '#ffffff'
    },
    logo: '/assets/logo-admin.png',
    brandName: 'Albru - Admin General',
    permissions: ['full_access', 'manage_users', 'system_config'],
    dashboard: '/dashboard/admin'
  },
  
  // USUARIOS DE DESARROLLO/TESTING (mantener para pruebas)
  'admin@albru.com': {
    userId: 'admin_test',
    name: 'Admin Test',
    theme: {
      primary: '#d32f2f',
      secondary: '#1976d2',
      accent: '#ff5722',
      background: '#ffebee',
      surface: '#ffffff'
    },
    logo: '/assets/logo-admin.png',
    brandName: 'Admin Test',
    permissions: ['full_access', 'manage_users', 'system_config'],
    dashboard: '/dashboard/admin'
  },
  'gtr@albru.com': {
    userId: 'gtr_test',
    name: 'GTR Test',
    theme: {
      primary: '#7b1fa2',
      secondary: '#e91e63',
      accent: '#9c27b0',
      background: '#fce4ec',
      surface: '#ffffff'
    },
    logo: '/assets/logo-gtr.png',
    brandName: 'GTR Test',
    permissions: ['view_all_clients', 'assign_clients', 'view_asesores', 'manage_assignments'],
    dashboard: '/dashboard/gtr'
  }
};

// Middleware para obtener configuración del usuario
const getUserConfig = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token requerido' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'albru_jwt_secret_key_2025_secure_production');
    const userEmail = decoded.email;
    
    // Obtener configuración del usuario
    const userConfig = USER_THEMES[userEmail];
    
    if (!userConfig) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario no autorizado o configuración no encontrada' 
      });
    }

    // Agregar configuración al request
    req.user = decoded;
    req.userConfig = userConfig;
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

// Endpoint para obtener configuración del usuario logueado
const getUserThemeConfig = async (req, res) => {
  try {
    const userConfig = req.userConfig;
    
    if (!userConfig) {
      return res.status(404).json({
        success: false,
        message: 'Configuración de usuario no encontrada'
      });
    }

    return res.json({
      success: true,
      config: {
        userId: userConfig.userId,
        name: userConfig.name,
        theme: userConfig.theme,
        logo: userConfig.logo,
        brandName: userConfig.brandName,
        permissions: userConfig.permissions,
        dashboard: userConfig.dashboard
      }
    });
  } catch (error) {
    console.error('Error getUserThemeConfig:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar permisos específicos
const hasPermission = (permission) => {
  return (req, res, next) => {
    const userConfig = req.userConfig;
    
    if (!userConfig || !userConfig.permissions.includes(permission) && !userConfig.permissions.includes('full_access')) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes'
      });
    }
    
    next();
  };
};

module.exports = {
  getUserConfig,
  getUserThemeConfig,
  hasPermission,
  USER_THEMES
};