import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getAuthUrl } from '../config/environment';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="card max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
            ¡Bienvenido a ALBRU!
          </h1>
          <p className="text-gray-600">
            Ingresa tus credenciales para acceder a la plataforma
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@albru.pe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              autoFocus
              autoComplete="username"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            {/* Campo dummy para engañar al autofill del navegador */}
            <input type="text" name="fake_user" id="fake_user" autoComplete="username" style={{ display: 'none' }} />
            {/* Usar un name/id menos predecible para evitar que el gestor de contraseñas complete automáticamente */}
            <input
              id={`pwd_${Date.now()}`}
              name={`pwd_${Date.now()}`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              autoComplete="new-password"
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && (
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {loading ? 'Iniciando...' : 'Entrar'}
          </button>
        </form>
            {/* Ayuda de pruebas — solo en desarrollo */}
            {import.meta.env.DEV && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded">
                <strong>Credenciales de prueba:</strong>
                <div className="text-sm mt-2">
                  <div>GTR: <code>mcaceresv@albru.pe</code> / <code>password</code></div>
                  <div>Asesor: <code>jvenancioo@albru.pe</code> / <code>password</code></div>
                </div>
                <div className="text-xs text-gray-600 mt-2">Si el navegador autocompleta otra contraseña, bórrala y usa <code>password</code>.</div>
              </div>
            )}
        
  
      </div>
    </div>
  );
};

export default LoginPage;
