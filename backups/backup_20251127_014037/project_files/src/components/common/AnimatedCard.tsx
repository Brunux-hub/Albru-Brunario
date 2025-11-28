import React from 'react';
import { Paper, type PaperProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { mixins, transitions } from '../../theme/designTokens';

interface AnimatedCardProps extends PaperProps {
  hoverEffect?: boolean;
  delay?: number;
}

const StyledCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'hoverEffect' && prop !== 'delay',
})<AnimatedCardProps>(({ hoverEffect, delay }) => ({
  ...mixins.card,
  animation: `fadeInUp ${transitions.duration.slow} ${transitions.easing.easeOut} ${delay || 0}ms both`,
  
  ...(hoverEffect && {
    cursor: 'pointer',
    '&:hover': {
      ...mixins.cardHover,
    },
  }),
  
  '@keyframes fadeInUp': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}));

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  hoverEffect = false,
  delay = 0,
  ...props 
}) => {
  return (
    <StyledCard hoverEffect={hoverEffect} delay={delay} {...props}>
      {children}
    </StyledCard>
  );
};

export default AnimatedCard;
