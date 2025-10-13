import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import KPICard from '../dashboard/KPICard';
import TendenciasTab from './TendenciasTab';
import ProductosTab from './ProductosTab';
import CanalesTab from './CanalesTab';
import ComparativoTab from './ComparativoTab';

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
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const VentasPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      {/* KPIs Header */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <KPICard title="Ventas del Mes" value="67" subtitle="+26.4%" icon="📊" color="#3498db" />
        <KPICard title="Ingresos del Mes" value="$101K" subtitle="+26.4%" icon="💰" color="#2ecc71" />
        <KPICard title="Tasa Conversión" value="18.3%" subtitle="Excelente" icon="🎯" color="#9b59b6" />
        <KPICard title="Meta Mensual" value="96%" subtitle="67/70 ventas" icon="📈" color="#f39c12" />
      </Box>

      {/* Sub Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem'
            }
          }}
        >
          <Tab label="Tendencias" />
          <Tab label="Productos" />
          <Tab label="Canales" />
          <Tab label="Comparativo" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <TendenciasTab />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ProductosTab />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <CanalesTab />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <ComparativoTab />
      </TabPanel>
    </Box>
  );
};

export default VentasPanel;