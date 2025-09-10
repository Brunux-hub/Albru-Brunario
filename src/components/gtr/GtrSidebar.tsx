import React from 'react';
import { Drawer, List, ListItemIcon, ListItemText, ListItemButton, ListItem } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';

const menuItems = [
  { text: 'Clientes', icon: <PeopleIcon /> },
  { text: 'Asesores', icon: <AssignmentIndIcon /> },
  { text: 'Reportes', icon: <BarChartIcon /> },
  { text: 'Configuración', icon: <SettingsIcon /> },
];

const GtrSidebar: React.FC<{ onSelect: (section: string) => void, selected: string }> = ({ onSelect, selected }) => (
  <Drawer variant="permanent" anchor="left" sx={{ width: 220, flexShrink: 0, '& .MuiDrawer-paper': { width: 220, boxSizing: 'border-box' } }}>
    <List>
      {menuItems.map(item => (
        <ListItem disablePadding key={item.text}>
          <ListItemButton selected={selected === item.text} onClick={() => onSelect(item.text)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  </Drawer>
);

export default GtrSidebar;
