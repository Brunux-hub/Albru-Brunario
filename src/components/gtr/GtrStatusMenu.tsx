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
    flexDirection: { xs: 'column', md: 'row' },
    alignItems: { xs: 'stretch', md: 'center' }, 
    justifyContent: 'space-between',
    gap: { xs: 2, md: 0 },
    mb: 3,
    p: { xs: 2, md: 3 },
    backgroundColor: 'white',
    borderRadius: 2,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    width: '100%'
  }}>
    <Box sx={{ flex: 1 }}>
      <Typography variant="h5" sx={{ 
        fontWeight: 600, 
        color: '#1f2937', 
        mb: 2,
        fontSize: { xs: '1.25rem', md: '1.5rem' }
      }}>
        Gestión de Clientes
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {statuses.map(status => (
          <Chip
            key={status}
            label={status}
            onClick={() => onSelect(status)}
            variant={selected === status ? 'filled' : 'outlined'}
            size={window.innerWidth < 768 ? 'small' : 'medium'}
            sx={{
              backgroundColor: selected === status ? '#3b82f6' : 'transparent',
              color: selected === status ? 'white' : '#6b7280',
              borderColor: selected === status ? '#3b82f6' : '#d1d5db',
              fontWeight: 500,
              fontSize: { xs: '0.75rem', md: '0.875rem' },
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
      fullWidth={window.innerWidth < 768}
      sx={{
        backgroundColor: '#3b82f6',
        '&:hover': { backgroundColor: '#2563eb' },
        textTransform: 'none',
        fontWeight: 500,
        px: 3,
        py: 1.5,
        minWidth: { xs: 'auto', md: '160px' }
      }}
    >
      Agregar Cliente
    </Button>
  </Box>
);

export default GtrStatusMenu;
