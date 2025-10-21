import React from 'react';
import ProfessionalRoutes from './routes/ProfessionalRoutes';
import { AppProvider } from './context/AppContext';
import DynamicThemeProvider from './components/DynamicThemeProvider';

const App: React.FC = () => (
  <AppProvider>
    <DynamicThemeProvider>
      <ProfessionalRoutes />
    </DynamicThemeProvider>
  </AppProvider>
);

export default App;
