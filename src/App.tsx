import React from 'react';
import ProfessionalRoutes from './routes/ProfessionalRoutes';
import { ClientesProvider } from './context/ClientesContext';
import { AuthProvider } from './context/UnifiedAuthContext';
import DynamicThemeProvider from './components/DynamicThemeProvider';

const App: React.FC = () => (
  <AuthProvider>
    <DynamicThemeProvider>
      <ClientesProvider>
        <ProfessionalRoutes />
      </ClientesProvider>
    </DynamicThemeProvider>
  </AuthProvider>
);

export default App;
