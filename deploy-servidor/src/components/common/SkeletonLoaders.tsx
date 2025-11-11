import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { AnimatedCard } from './AnimatedCard';

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <AnimatedCard>
      <Box sx={{ p: 3 }}>
        {/* Header skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="rectangular" width={240} height={40} sx={{ borderRadius: 1 }} />
        </Box>
        
        {/* Table skeleton */}
        <Box>
          {/* Table header */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2, mb: 2 }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="text" height={24} />
            ))}
          </Box>
          
          {/* Table rows */}
          {[...Array(rows)].map((_, rowIndex) => (
            <Box 
              key={rowIndex} 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(6, 1fr)', 
                gap: 2, 
                mb: 2,
                py: 1.5
              }}
            >
              {[...Array(6)].map((_, colIndex) => (
                <Skeleton key={colIndex} variant="text" height={20} />
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </AnimatedCard>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <AnimatedCard>
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="40%" height={48} />
      </Box>
    </AnimatedCard>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <Box>
      {/* Title skeleton */}
      <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />
      
      {/* Cards skeleton */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 4 }}>
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </Box>
      
      {/* Table skeleton */}
      <TableSkeleton />
    </Box>
  );
};
