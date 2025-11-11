import React from 'react';
import { Chip, type ChipProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { statusColors, borderRadius, typography, transitions } from '../../theme/designTokens';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: StatusType;
}

interface StyledChipProps {
  statusType: StatusType;
}

const StyledChip = styled(Chip)<StyledChipProps>(({ statusType }) => {
  const colors = statusColors[statusType];
  
  return {
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
    borderRadius: borderRadius.full,
    transition: `all ${transitions.duration.fast} ${transitions.easing.easeOut}`,
    
    '&:hover': {
      backgroundColor: colors.bg,
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    
    '& .MuiChip-label': {
      padding: '4px 12px',
    },
  };
});

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  return <StyledChip statusType={status} {...props} />;
};

export default StatusBadge;
