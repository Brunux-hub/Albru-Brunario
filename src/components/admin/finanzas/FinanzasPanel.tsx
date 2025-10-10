import React from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';
import KPICard from '../dashboard/KPICard';

const FinanzasPanel: React.FC = () => {
  return (
    <Box>
      {/* KPIs Header */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <KPICard title="Ingresos del Mes" value="$101K" subtitle="+25.4%" icon="💰" color="#2ecc71" />
        <KPICard title="Utilidad Bruta" value="$30K" subtitle="30.7%" icon="📊" color="#3498db" />
        <KPICard title="Proyección Anual" value="$1.21M" subtitle="basado en mes actual" icon="📈" color="#9b59b6" />
        <KPICard title="Progreso Anual" value="78.6%" icon="🎯" color="#f39c12" />
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Evolución Financiera
          </Typography>
          
          {/* Gráfico de Área Apilada */}
          <Box sx={{ height: 250, position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
            {/* Datos simulados por mes */}
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'end',
              gap: 0.5,
              px: 2,
              pb: 3
            }}>
              {[
                { mes: 'Ene', base: 60000, medio: 40000, superior: 20000 },
                { mes: 'Feb', base: 55000, medio: 35000, superior: 25000 },
                { mes: 'Mar', base: 70000, medio: 45000, superior: 30000 },
                { mes: 'Abr', base: 65000, medio: 42000, superior: 28000 },
                { mes: 'May', base: 75000, medio: 48000, superior: 32000 },
                { mes: 'Jun', base: 68000, medio: 44000, superior: 29000 },
                { mes: 'Jul', base: 72000, medio: 46000, superior: 31000 },
                { mes: 'Ago', base: 80000, medio: 52000, superior: 35000 },
                { mes: 'Sep', base: 85000, medio: 55000, superior: 37000 },
                { mes: 'Oct', base: 78000, medio: 50000, superior: 33000 },
                { mes: 'Nov', base: 82000, medio: 53000, superior: 36000 },
                { mes: 'Dic', base: 90000, medio: 58000, superior: 40000 }
              ].map((data, index) => {
                const total = data.base + data.medio + data.superior;
                const maxTotal = 120000;
                
                return (
                  <Box key={index} sx={{ 
                    flex: 1, 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'end',
                    alignItems: 'center'
                  }}>
                    {/* Área apilada */}
                    <Box sx={{ 
                      width: '90%',
                      height: `${(total / maxTotal) * 100}%`,
                      minHeight: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '2px 2px 0 0',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      mb: 1
                    }}>
                      {/* Capa superior - azul */}
                      <Box sx={{ 
                        flex: data.superior,
                        bgcolor: '#3498db',
                        transition: 'all 0.3s ease',
                        '&:hover': { bgcolor: '#2980b9' }
                      }} />
                      
                      {/* Capa media - rosa */}
                      <Box sx={{ 
                        flex: data.medio,
                        bgcolor: '#e74c3c',
                        transition: 'all 0.3s ease',
                        '&:hover': { bgcolor: '#c0392b' }
                      }} />
                      
                      {/* Capa base - verde */}
                      <Box sx={{ 
                        flex: data.base,
                        bgcolor: '#2ecc71',
                        transition: 'all 0.3s ease',
                        '&:hover': { bgcolor: '#27ae60' }
                      }} />
                    </Box>
                    
                    {/* Etiqueta del mes */}
                    <Typography variant="caption" sx={{ 
                      fontSize: '0.7rem',
                      color: 'text.secondary',
                      fontWeight: 500
                    }}>
                      {data.mes}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
            
            {/* Eje Y con valores */}
            <Box sx={{ 
              position: 'absolute',
              left: -10,
              top: 10,
              height: 200,
              display: 'flex',
              flexDirection: 'column-reverse',
              justifyContent: 'space-between'
            }}>
              {[0, 30000, 60000, 90000, 120000].map((value) => (
                <Typography 
                  key={value}
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.7rem',
                    color: 'text.secondary',
                    lineHeight: 1
                  }}
                >
                  {value === 0 ? '0' : `${value/1000}K`}
                </Typography>
              ))}
            </Box>
            
            {/* Leyenda */}
            <Box sx={{ 
              position: 'absolute',
              top: 10,
              right: 15,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              bgcolor: 'rgba(255,255,255,0.9)',
              p: 1,
              borderRadius: 1,
              fontSize: '0.75rem'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 8, bgcolor: '#3498db', borderRadius: 0.5 }} />
                <Typography variant="caption">Utilidades</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 8, bgcolor: '#e74c3c', borderRadius: 0.5 }} />
                <Typography variant="caption">Costos</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 8, bgcolor: '#2ecc71', borderRadius: 0.5 }} />
                <Typography variant="caption">Ingresos Base</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Distribución de Costos - Mes Actual
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {[
              { label: 'Personal', value: 40000, max: 50000 },
              { label: 'Marketing', value: 15000, max: 50000 },
              { label: 'Infraestructura', value: 10000, max: 50000 },
              { label: 'Otros Gastos', value: 5000, max: 50000 }
            ].map((item, index) => (
              <Box key={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ${(item.value / 1000).toFixed(0)}K
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(item.value / item.max) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#000',
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
            ))}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Total Costos
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  $70K
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Bottom Section */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        <KPICard 
          title="Ticket Promedio" 
          value="$1500" 
          subtitle="Por venta realizada • +$0 vs mes anterior" 
          color="#3498db" 
        />
        <KPICard 
          title="ROI Marketing" 
          value="667%" 
          subtitle="Retorno por inversión • 36.7% retorno" 
          color="#2ecc71" 
        />
        <KPICard 
          title="Costo por Adquisición" 
          value="$225" 
          subtitle="Por cliente adquirido • 15.0% del ticket" 
          color="#9b59b6" 
        />
      </Box>

      {/* Projections */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Proyecciones y Metas Anuales
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Progreso hacia Meta Anual
            </Typography>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Ingresos</Typography>
                  <Typography variant="body2">$944K / $1200K</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={78.7}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': { bgcolor: '#000' }
                  }}
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Ventas</Typography>
                  <Typography variant="body2">629 / 800</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={78.6}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': { bgcolor: '#000' }
                  }}
                />
              </Box>
            </Box>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Proyección Fin de Año
            </Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Ingresos Proyectados:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>$1.21M</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Utilidad Proyectada:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>$0.36M</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Margen Proyectado:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>30%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Meta Cumplimiento:</Typography>
                <Box sx={{ 
                  bgcolor: '#000', 
                  color: 'white', 
                  px: 1, 
                  py: 0.5, 
                  borderRadius: 1, 
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  100%
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default FinanzasPanel;