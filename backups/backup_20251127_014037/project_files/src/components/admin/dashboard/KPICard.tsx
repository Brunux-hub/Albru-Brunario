import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, color = '#1976d2' }) => {
  return (
    <Card sx={{ 
      borderRadius: 2, 
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
      transition: 'box-shadow 0.2s ease'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            {title}
          </Typography>
          {icon && (
            <Typography sx={{ fontSize: '1.5rem', opacity: 0.7 }}>
              {icon}
            </Typography>
          )}
        </Box>
        
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 'bold',
            color: color,
            mb: 1,
            fontSize: { xs: '1.5rem', md: '2rem' }
          }}
        >
          {value}
        </Typography>
        
        {subtitle && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: '0.75rem',
              opacity: 0.8
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;