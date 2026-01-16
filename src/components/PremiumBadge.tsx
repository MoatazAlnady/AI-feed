import React from 'react';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PremiumTier = 'silver' | 'gold' | null;

interface PremiumBadgeProps {
  tier: PremiumTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({ 
  tier, 
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  if (!tier) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = {
    sm: 10,
    md: 12,
    lg: 14
  };

  const tierStyles = {
    silver: {
      bgClass: 'bg-gradient-to-br from-gray-300 to-gray-400',
      iconClass: 'text-white',
      labelBg: 'bg-gradient-to-r from-gray-300 to-gray-400',
      label: 'Silver'
    },
    gold: {
      bgClass: 'bg-gradient-to-br from-yellow-400 to-amber-500',
      iconClass: 'text-white',
      labelBg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
      label: 'Gold'
    }
  };

  const styles = tierStyles[tier];

  if (showLabel) {
    return (
      <div className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-medium',
        styles.labelBg,
        className
      )}>
        <Crown 
          className={cn(sizeClasses[size], styles.iconClass)} 
          style={{ width: iconSize[size], height: iconSize[size] }} 
        />
        <span>{styles.label}</span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        sizeClasses[size], 
        styles.bgClass,
        'rounded-full flex items-center justify-center shadow-sm',
        className
      )}
      title={`${styles.label} Member`}
    >
      <Crown 
        className={styles.iconClass} 
        style={{ width: iconSize[size], height: iconSize[size] }} 
      />
    </div>
  );
};

export default PremiumBadge;
