import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { ClientesProvider } from './context/ClientesContext';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => (
  <AuthProvider>
    <ClientesProvider>
      <AppRoutes />
    </ClientesProvider>
  </AuthProvider>
);

export default App;
