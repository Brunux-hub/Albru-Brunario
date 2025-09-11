import React from 'react';
import { Box, Chip, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const statuses = [
  'Todos',
  'En gestión',
  'Vendido',
  'No contactado',
  'Lista negra',
  'Solo números',
];

const GtrStatusMenu: React.FC<{ 
  selected: string, 
  onSelect: (status: string) => void,
  onAddClient: () => void 
}> = ({ selected, onSelect, onAddClient }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    mb: 3,
    p: 3,
    backgroundColor: 'white',
    borderRadius: 2,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    width: '100%'
  }}>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#1f2937', mb: 2 }}>
        Dashboard GTR
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {statuses.map(status => (
          <Chip
            key={status}
            label={status}
            onClick={() => onSelect(status)}
            variant={selected === status ? 'filled' : 'outlined'}
            sx={{
              backgroundColor: selected === status ? '#3b82f6' : 'transparent',
              color: selected === status ? 'white' : '#6b7280',
              borderColor: selected === status ? '#3b82f6' : '#d1d5db',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: selected === status ? '#2563eb' : '#f3f4f6',
              }
            }}
          />
        ))}
      </Box>
    </Box>
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={onAddClient}
      sx={{
        backgroundColor: '#3b82f6',
        '&:hover': { backgroundColor: '#2563eb' },
        textTransform: 'none',
        fontWeight: 500,
        px: 3,
        py: 1
      }}
    >
      Agregar Cliente
    </Button>
  </Box>
);

export default GtrStatusMenu;
