import React from 'react';
import { Box, Typography } from '@mui/material';

const Logo: React.FC = () => (
  <Box display="flex" alignItems="center" gap={2}>
    {/* Placeholder para el logo, reemplazar por imagen real si se desea */}
    <Box width={40} height={40} bgcolor="#1976d2" borderRadius="50%" display="flex" alignItems="center" justifyContent="center">
      <Typography variant="h5" color="white" fontWeight="bold">A</Typography>
    </Box>
    <Typography variant="h5" fontWeight="bold" color="primary">ALBRU</Typography>
  </Box>
);

export default Logo;
