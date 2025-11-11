import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  CircularProgress,
  InputAdornment,
  IconButton,
  Fade,
  Grow
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Lock as LockIcon, 
  Visibility, 
  VisibilityOff,
  Login as LoginIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { getAuthUrl } from '../config/environment';
import { AnimatedCard } from '../components/common/AnimatedCard';
import { colors, typography, spacing } from '../theme/designTokens';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuthData, isAuthenticated, user } = useAuth();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      const userType = user.tipo;
      let redirectPath = '/dashboard/asesor'; // default
      
      switch (userType) {
        case 'admin':
          redirectPath = '/dashboard/admin';
          break;
        case 'gtr':
          redirectPath = '/dashboard/gtr';
          break;
        case 'asesor':
          redirectPath = '/dashboard/asesor';
          break;
        case 'validador':
          redirectPath = '/dashboard/validaciones';
          break;
      }
      
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingresa email y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔑 Intentando login con:', { email });
      
      const response = await fetch(getAuthUrl('/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      console.log('📝 Respuesta del servidor:', data);

      if (data.success && data.token) {
        console.log('✅ Login exitoso');
        
        // Usar el contexto unificado para establecer los datos
        setAuthData(data.token, data.user);
        
        // Redireccionar según el tipo de usuario
        const userType = data.user.tipo;
        let redirectPath = '/dashboard/asesor'; // default
        
        switch (userType) {
          case 'admin':
            redirectPath = '/dashboard/admin';
            break;
          case 'gtr':
            redirectPath = '/dashboard/gtr';
            break;
          case 'asesor':
            redirectPath = '/dashboard/asesor';
            break;
          case 'validador':
            redirectPath = '/dashboard/validaciones';
            break;
        }
        
        console.log(`➡️ Redirigiendo a: ${redirectPath}`);
        navigate(redirectPath, { replace: true });
      } else {
        setError(data.message || 'Error en el login');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 50%, ${colors.secondary[50]} 100%)`,
        padding: spacing[4],
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle, ${colors.primary[100]}40 0%, transparent 70%)`,
          animation: 'pulse 15s ease-in-out infinite',
        },
        '@keyframes pulse': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(5%, 5%) scale(1.1)' },
        },
      }}
    >
      <Fade in timeout={800}>
        <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480 }}>
          <AnimatedCard
            delay={200}
            elevation={3}
            sx={{
              p: { xs: 3, sm: 5 },
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
            }}
          >
            {/* Logo y Título */}
            <Grow in timeout={600}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 3,
                    boxShadow: `0 8px 24px ${colors.primary[200]}`,
                  }}
                >
                  <LoginIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>

                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: typography.fontWeight.bold,
                    color: colors.text.primary,
                    mb: 1,
                    fontSize: { xs: typography.fontSize['2xl'], sm: typography.fontSize['3xl'] },
                  }}
                >
                  ¡Bienvenido a ALBRU!
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: colors.text.secondary,
                    fontSize: typography.fontSize.base,
                  }}
                >
                  Ingresa tus credenciales para continuar
                </Typography>
              </Box>
            </Grow>

            {/* Formulario */}
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 3 }}>
              <Grow in timeout={700}>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    type="email"
                    label="Correo Electrónico"
                    placeholder="ejemplo@albru.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    autoComplete="username"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: colors.text.secondary }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: colors.neutral[50],
                        },
                        '&.Mui-focused': {
                          backgroundColor: colors.background.paper,
                          boxShadow: `0 0 0 3px ${colors.primary[100]}`,
                        },
                      },
                    }}
                  />
                </Box>
              </Grow>

              <Grow in timeout={800}>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    label="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: colors.text.secondary }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: colors.text.secondary }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: colors.neutral[50],
                        },
                        '&.Mui-focused': {
                          backgroundColor: colors.background.paper,
                          boxShadow: `0 0 0 3px ${colors.primary[100]}`,
                        },
                      },
                    }}
                  />
                </Box>
              </Grow>

              {error && (
                <Fade in>
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      animation: 'shake 0.5s ease',
                      '@keyframes shake': {
                        '0%, 100%': { transform: 'translateX(0)' },
                        '25%': { transform: 'translateX(-10px)' },
                        '75%': { transform: 'translateX(10px)' },
                      },
                    }}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              <Grow in timeout={900}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
                    boxShadow: `0 4px 12px ${colors.primary[200]}`,
                    fontWeight: typography.fontWeight.bold,
                    fontSize: typography.fontSize.base,
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[800]} 100%)`,
                      boxShadow: `0 6px 20px ${colors.primary[300]}`,
                      transform: 'translateY(-2px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    '&.Mui-disabled': {
                      background: colors.neutral[300],
                      color: colors.neutral[500],
                    },
                  }}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </Grow>

              {/* Credenciales de prueba - solo desarrollo */}
              {import.meta.env.DEV && (
                <Fade in timeout={1000}>
                  <Alert
                    severity="info"
                    sx={{
                      mt: 3,
                      borderRadius: 2,
                      backgroundColor: colors.warning[50],
                      border: `1px solid ${colors.warning[200]}`,
                      '& .MuiAlert-icon': {
                        color: colors.warning[600],
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: typography.fontWeight.semibold,
                        mb: 1,
                        color: colors.warning[800],
                      }}
                    >
                      Credenciales de prueba:
                    </Typography>
                    <Box
                      component="code"
                      sx={{
                        display: 'block',
                        fontSize: typography.fontSize.sm,
                        color: colors.text.secondary,
                        lineHeight: 1.8,
                      }}
                    >
                      <div>Admin: admin@albru.com / admin123</div>
                      <div>GTR: mcaceresv@albru.pe / password</div>
                      <div>Asesor: jvenancioo@albru.pe / password</div>
                    </Box>
                  </Alert>
                </Fade>
              )}
            </Box>
          </AnimatedCard>

          {/* Footer */}
          <Fade in timeout={1200}>
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                mt: 3,
                color: colors.text.secondary,
                fontSize: typography.fontSize.sm,
              }}
            >
              © 2025 ALBRU. Todos los derechos reservados.
            </Typography>
          </Fade>
        </Box>
      </Fade>
    </Box>
  );
};

export default LoginPage;
