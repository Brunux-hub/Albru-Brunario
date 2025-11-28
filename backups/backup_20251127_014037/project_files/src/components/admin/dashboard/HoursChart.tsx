import React from 'react';
import { Typography, Box } from '@mui/material';

const HoursChart: React.FC = () => {
  const data = [
    { day: 'Lun', hours: 60 },
    { day: 'Mar', hours: 65 },
    { day: 'Mié', hours: 55 },
    { day: 'Jue', hours: 60 },
    { day: 'Vie', hours: 65 },
    { day: 'Sáb', hours: 30 }
  ];

  const maxHours = 80;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box sx={{ 
          width: 8, 
          height: 8, 
          borderRadius: '50%', 
          bgcolor: '#1976d2', 
          mr: 1 
        }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Horas Trabajadas - Semana Actual
        </Typography>
      </Box>

      <Box sx={{ height: 200, display: 'flex', alignItems: 'end', gap: 1.5 }}>
        {data.map((item, index) => (
          <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              sx={{
                width: '100%',
                height: `${(item.hours / maxHours) * 100}%`,
                minHeight: 20,
                bgcolor: '#1976d2',
                borderRadius: '4px 4px 0 0',
                mb: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: '#1565c0',
                  transform: 'translateY(-2px)'
                }
              }}
            />
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.75rem',
                color: 'text.secondary',
                fontWeight: 500
              }}
            >
              {item.day}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Y-axis labels */}
      <Box sx={{ 
        position: 'absolute', 
        left: -40, 
        top: 60, 
        height: 200, 
        display: 'flex', 
        flexDirection: 'column-reverse', 
        justifyContent: 'space-between' 
      }}>
        {[0, 20, 40, 60, 80].map((value) => (
          <Typography 
            key={value} 
            variant="caption" 
            sx={{ 
              fontSize: '0.7rem', 
              color: 'text.secondary',
              lineHeight: 1
            }}
          >
            {value}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

export default HoursChart;