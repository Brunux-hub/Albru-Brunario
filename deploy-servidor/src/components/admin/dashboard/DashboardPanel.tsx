import React from 'react';
import { Box, Paper, Typography, Card, CardContent, LinearProgress } from '@mui/material';

// Componente KPICard inline
const KPICard: React.FC<{title: string, value: string, subtitle?: string, icon?: string, color?: string}> = ({ title, value, subtitle, icon, color = '#2c3e50' }) => (
  <Card sx={{ 
    minHeight: '110px',
    backgroundColor: '#ffffff',
    border: '1px solid #e9ecef',
    '&:hover': { 
      boxShadow: '0 4px 16px rgba(44, 62, 80, 0.12)',
      borderColor: '#dee2e6'
    }
  }}>
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Typography className="kpi-title" sx={{ 
          fontSize: '0.75rem',
          fontWeight: 500,
          color: '#5d6d7e',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {title}
        </Typography>
        {icon && (
          <Box sx={{ 
            fontSize: '1.4rem', 
            opacity: 0.6,
            color: '#5d6d7e'
          }}>{icon}</Box>
        )}
      </Box>
      <Typography className="kpi-value" sx={{ 
        fontSize: '1.8rem',
        fontWeight: 700,
        color: color,
        mb: 0.5,
        lineHeight: 1.1
      }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ 
          fontSize: '0.7rem', 
          lineHeight: 1.2,
          color: '#5d6d7e'
        }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// Componente HoursChart inline
const HoursChart: React.FC = () => {
  const data = [
    { day: 'Lun', hours: 60 },
    { day: 'Mar', hours: 65 },
    { day: 'Mié', hours: 55 },
    { day: 'Jue', hours: 60 },
    { day: 'Vie', hours: 65 },
    { day: 'Sáb', hours: 30 }
  ];
  
  return (
    <Box>
      <Typography className="section-title">Horas Trabajadas - Semana Actual</Typography>
      <Box sx={{ height: 150, display: 'flex', alignItems: 'end', gap: 1 }}>
        {data.map((item, index) => (
          <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{
              width: '100%',
              height: `${(item.hours / 80) * 100}%`,
              minHeight: 15,
              bgcolor: '#2c3e50',
              borderRadius: '4px 4px 0 0',
              mb: 0.5,
              '&:hover': { bgcolor: '#1a252f' }
            }} />
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 500 }}>
              {item.day}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Componente ProgressGoals inline
const ProgressGoals: React.FC = () => {
  const goals = [
    { label: 'Ventas', current: 67, target: 70 },
    { label: 'Ingresos', current: 101, target: 120, unit: 'K' },
    { label: 'Conversión', current: 18.3, target: 20, unit: '%' }
  ];
  
  return (
    <Box>
      <Typography className="section-title">Progreso de Metas del Mes</Typography>
      <Box sx={{ display: 'grid', gap: 2 }}>
        {goals.map((goal, index) => {
          const percentage = (goal.current / goal.target) * 100;
          const displayCurrent = goal.unit === 'K' ? `$${goal.current}K` : 
                                goal.unit === '%' ? `${goal.current}%` : goal.current;
          const displayTarget = goal.unit === 'K' ? `${goal.target}K` : 
                              goal.unit === '%' ? `${goal.target}%` : goal.target;
          return (
            <Box key={index}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>{goal.label}</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                  {displayCurrent}/{displayTarget}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(percentage, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: '#e9ecef',
                  '& .MuiLinearProgress-bar': { bgcolor: '#2c3e50', borderRadius: 4 }
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const DashboardPanel: React.FC = () => {
  return (
    <Box>
      {/* Top KPI row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <KPICard title="Total Clientes" value="2,487" subtitle="+12.5% vs mes anterior" icon="👥" color="#2c3e50" />
        <KPICard title="Clientes Activos" value="1,856" subtitle="+8.3% vs mes anterior" icon="👤" color="#27ae60" />
        <KPICard title="Ventas del Mes" value="67" subtitle="+15.2% vs mes anterior" icon="📈" color="#3498db" />
        <KPICard title="Ingresos del Mes" value="$101K" subtitle="+22.1% vs mes anterior" icon="💰" color="#f39c12" />
      </Box>

      {/* Second KPI row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <KPICard title="Asesores Activos" value="12/15" subtitle="80% vs mes anterior" icon="👥" color="#2c3e50" />
        <KPICard title="Conversión General" value="18.3%" subtitle="+3.1% vs mes anterior" icon="🎯" color="#e74c3c" />
        <KPICard title="Ingresos Recurrentes" value="1.1K" subtitle="+5.2% vs mes anterior" icon="💰" color="#27ae60" />
        <KPICard title="Facturación Total" value="8.8K" subtitle="Acumulado vs mes anterior" icon="📊" color="#2c3e50" />
      </Box>

      {/* Main charts row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2, mb: 2 }}>
        <Paper sx={{ p: 2, borderRadius: 1 }}>
          <HoursChart />
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 1 }}>
          <ProgressGoals />
        </Paper>
      </Box>

      {/* Lower summary row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Paper sx={{ p: 2, borderRadius: 1 }}>
          <Typography className="section-title">Estado General del Sistema</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1.4rem' }}>1856</Typography>
              <Typography variant="caption" sx={{ color: '#5d6d7e', fontSize: '0.75rem' }}>Clientes Activos</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#27ae60', fontSize: '1.4rem' }}>12</Typography>
              <Typography variant="caption" sx={{ color: '#5d6d7e', fontSize: '0.75rem' }}>Asesores Online</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f39c12', fontSize: '1.4rem' }}>5.6</Typography>
              <Typography variant="caption" sx={{ color: '#5d6d7e', fontSize: '0.75rem' }}>Ventas/Asesor</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#e74c3c', fontSize: '1.4rem' }}>18.3%</Typography>
              <Typography variant="caption" sx={{ color: '#5d6d7e', fontSize: '0.75rem' }}>Tasa Conversión</Typography>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: 1 }}>
          <Typography className="section-title">Resumen Base de Datos de Clientes</Typography>
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <Box sx={{ textAlign: 'left', p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
              <Typography variant="caption" sx={{ mb: 0.5, color: '#5d6d7e', fontSize: '0.75rem', fontWeight: 500 }}>Clientes Activos en BD</Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', color: '#27ae60', mb: 1 }}>Con contratos vigentes</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#27ae60', textAlign: 'right', fontSize: '1.6rem' }}>8</Typography>
            </Box>
            <Box sx={{ textAlign: 'left', p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
              <Typography variant="caption" sx={{ mb: 0.5, color: '#5d6d7e', fontSize: '0.75rem', fontWeight: 500 }}>Ingresos Mensuales</Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', color: '#2c3e50', mb: 1 }}>Recurrentes confirmados</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', textAlign: 'right', fontSize: '1.6rem' }}>$1,075.2</Typography>
            </Box>
            <Box sx={{ textAlign: 'left', p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
              <Typography variant="caption" sx={{ mb: 0.5, color: '#5d6d7e', fontSize: '0.75rem', fontWeight: 500 }}>Facturación Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f39c12', textAlign: 'right', fontSize: '1.6rem' }}>$8,797.6</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default DashboardPanel;