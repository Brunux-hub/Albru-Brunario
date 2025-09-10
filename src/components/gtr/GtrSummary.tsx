import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

const summaryData = [
  { label: 'Clientes gestionados hoy', value: 24, icon: <GroupAddIcon color="primary" fontSize="large" /> },
  { label: 'Ventas cerradas', value: 7, icon: <EmojiEventsIcon color="success" fontSize="large" /> },
  { label: 'Leads nuevos', value: 12, icon: <AssignmentTurnedInIcon color="info" fontSize="large" /> },
];

const GtrSummary: React.FC = () => (
  <Box mb={4}>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {summaryData.map(item => (
        <Box key={item.label} sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            {item.icon}
            <Box>
              <Typography variant="h5" fontWeight="bold">{item.value}</Typography>
              <Typography variant="body2" color="text.secondary">{item.label}</Typography>
            </Box>
          </Paper>
        </Box>
      ))}
    </Box>
  </Box>
);

export default GtrSummary;
