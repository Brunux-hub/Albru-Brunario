import React from 'react';
import { Box, Chip, Stack } from '@mui/material';

const statuses = [
  'Todos',
  'Nuevo',
  'En gestión',
  'Vendido',
  'No contactado',
  'Lista negra',
];

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  'Todos': 'default',
  'Nuevo': 'info',
  'En gestión': 'primary',
  'Vendido': 'success',
  'No contactado': 'warning',
  'Lista negra': 'error',
};

const GtrStatusMenu: React.FC<{ selected: string, onSelect: (status: string) => void }> = ({ selected, onSelect }) => (
  <Box mb={2}>
    <Stack direction="row" spacing={1}>
      {statuses.map(status => (
        <Chip
          key={status}
          label={status}
          color={selected === status ? statusColors[status] : 'default'}
          variant={selected === status ? 'filled' : 'outlined'}
          onClick={() => onSelect(status)}
        />
      ))}
    </Stack>
  </Box>
);

export default GtrStatusMenu;
