import React from 'react';
import { Typography, Box, LinearProgress } from '@mui/material';

const ProgressGoals: React.FC = () => {
  const goals = [
    { label: 'Ventas', current: 67, target: 70, color: '#000' },
    { label: 'Ingresos', current: 101, target: 120, unit: 'K', color: '#000' },
    { label: 'Conversión', current: 18.3, target: 20, unit: '%', color: '#000' }
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Progreso de Metas del Mes
      </Typography>

      <Box sx={{ display: 'grid', gap: 3 }}>
        {goals.map((goal, index) => {
          const percentage = (goal.current / goal.target) * 100;
          const displayCurrent = goal.unit === 'K' ? `$${goal.current}K` : 
                                goal.unit === '%' ? `${goal.current}%` : goal.current;
          const displayTarget = goal.unit === 'K' ? `${goal.target}K` : 
                              goal.unit === '%' ? `${goal.target}%` : goal.target;

          return (
            <Box key={index}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {goal.label}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                  {displayCurrent}/{displayTarget}
                </Typography>
              </Box>
              
              <Box sx={{ position: 'relative' }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(percentage, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: goal.color,
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ProgressGoals;