// 🎨 Design Tokens - Sistema de diseño profesional para CRM
// Inspirado en Material Design 3 y principios de diseño enterprise

export const colors = {
  // Primary - Azul corporativo profesional
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3', // Main
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  
  // Secondary - Verde para success/confirmación
  secondary: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50', // Main
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  
  // Warning - Naranja para alertas
  warning: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800', // Main
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100',
  },
  
  // Error - Rojo para errores
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336', // Main
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },
  
  // Neutrales - Grises profesionales
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#000000',
  },
  
  // Backgrounds
  background: {
    default: '#f8fafc',
    paper: '#ffffff',
    elevated: '#ffffff',
  },
  
  // Text
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    disabled: '#cbd5e1',
  },
};

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
};

export const borderRadius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const transitions = {
  duration: {
    fastest: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slowest: '500ms',
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
};

// 🎯 Mixins útiles para componentes
export const mixins = {
  card: {
    background: colors.background.paper,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.md,
    transition: `all ${transitions.duration.normal} ${transitions.easing.easeOut}`,
  },
  
  cardHover: {
    boxShadow: shadows.lg,
    transform: 'translateY(-2px)',
  },
  
  button: {
    borderRadius: borderRadius.md,
    fontWeight: typography.fontWeight.semibold,
    transition: `all ${transitions.duration.fast} ${transitions.easing.easeInOut}`,
  },
  
  input: {
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.neutral[300]}`,
    transition: `all ${transitions.duration.fast} ${transitions.easing.easeOut}`,
  },
  
  inputFocus: {
    borderColor: colors.primary[500],
    boxShadow: `0 0 0 3px ${colors.primary[50]}`,
  },
  
  tableCellHeader: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    backgroundColor: colors.neutral[50],
    borderBottom: `2px solid ${colors.neutral[200]}`,
  },
  
  tableRowHover: {
    backgroundColor: colors.neutral[50],
    transition: `background-color ${transitions.duration.fast} ${transitions.easing.easeOut}`,
  },
};

// 🎨 Status Colors - Para estados de negocio
export const statusColors = {
  success: {
    bg: colors.secondary[50],
    text: colors.secondary[700],
    border: colors.secondary[200],
  },
  warning: {
    bg: colors.warning[50],
    text: colors.warning[700],
    border: colors.warning[200],
  },
  error: {
    bg: colors.error[50],
    text: colors.error[700],
    border: colors.error[200],
  },
  info: {
    bg: colors.primary[50],
    text: colors.primary[700],
    border: colors.primary[200],
  },
  neutral: {
    bg: colors.neutral[100],
    text: colors.neutral[700],
    border: colors.neutral[300],
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  transitions,
  zIndex,
  mixins,
  statusColors,
};
