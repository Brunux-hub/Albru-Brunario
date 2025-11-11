import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import PhoneIcon from '@mui/icons-material/Phone';

const stats = [
  { title: 'Total Clientes', value: 6, icon: PersonIcon, color: '#3b82f6' },
  { title: 'En Gestión', value: 3, icon: ContactPhoneIcon, color: '#10b981' },
  { title: 'Solo Números', value: 3, icon: PhoneIcon, color: '#f59e0b' },
  { title: 'Ventas Cerradas', value: 1, icon: CheckCircleIcon, color: '#8b5cf6' },
];

const GtrSummary: React.FC = () => (
  <Box sx={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
    gap: 3, 
    mb: 3 
  }}>
    {stats.map(stat => {
      const IconComponent = stat.icon;
      return (
        <Card 
          key={stat.title} 
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            '&:hover': {
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 1 }}
                >
                  {stat.title}
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#1f2937',
                    fontSize: '2rem'
                  }}
                >
                  {stat.value}
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  backgroundColor: `${stat.color}15`,
                  borderRadius: '12px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IconComponent sx={{ color: stat.color, fontSize: '1.5rem' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      );
    })}
  </Box>
);

export default GtrSummary;
