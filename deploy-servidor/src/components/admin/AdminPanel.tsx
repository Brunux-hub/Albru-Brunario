import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import AdminSidebar from './AdminSidebar';
import DashboardPanel from './dashboard/DashboardPanel';
import AsesoresPanel from './asesores/AsesoresPanel';
import VentasPanel from './ventas/VentasPanel';
import FinanzasPanel from './finanzas/FinanzasPanel';
import DatabasePanel from './database/DatabasePanel';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}> {/* Fondo del tema corporativo */}
        {/* Sidebar */}
        <AdminSidebar />
      
      {/* Main Content */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        marginLeft: '280px' // Compensar el ancho del sidebar fijo
      }}>
        {/* Header */}
        <Box sx={{ p: 4, pb: 2 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600, 
              color: 'primary.main',
              mb: 1
            }}
          >
            Panel de Administración General
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.9rem'
            }}
          >
            Monitoreo completo del sistema, asesores y métricas de ventas
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: '#e9ecef', px: 4, bgcolor: 'white' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'uppercase',
                fontWeight: 600,
                fontSize: '0.85rem',
                minWidth: 'auto',
                px: 3,
                py: 2,
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main',
                height: 3
              }
            }}
          >
            <Tab label="Dashboard General" />
            <Tab label="Control de Asesores" />
            <Tab label="Análisis de Ventas" />
            <Tab label="Finanzas" />
            <Tab label="Base de Datos" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ flex: 1, p: 4 }}>
          <TabPanel value={activeTab} index={0}>
            <DashboardPanel />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <AsesoresPanel />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <VentasPanel />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <FinanzasPanel />
          </TabPanel>
          <TabPanel value={activeTab} index={4}>
            <DatabasePanel />
          </TabPanel>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminPanel;