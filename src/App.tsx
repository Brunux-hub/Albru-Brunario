import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { ClientesProvider } from './context/ClientesContext';

const App: React.FC = () => (
  <ClientesProvider>
    <AppRoutes />
  </ClientesProvider>
);

export default App;
