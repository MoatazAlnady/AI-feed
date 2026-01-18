import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingBadgeProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  reviewCount = 0,
  size = 'md',
  showCount = true,
  className = ''
}) => {
  if (reviewCount === 0) return null;

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2'
  };

  const starSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div 
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium',
        sizeClasses[size],
        className
      )}
    >
      <Star className={cn(starSizes[size], 'fill-amber-400 text-amber-400')} />
      <span>{rating.toFixed(1)}</span>
      {showCount && (
        <span className="text-muted-foreground">({reviewCount})</span>
      )}
    </div>
  );
};

export default RatingBadge;
