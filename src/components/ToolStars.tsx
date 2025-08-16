import React from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ToolStarsProps {
  value: number;
  reviewsCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showCount?: boolean;
  className?: string;
}

const ToolStars: React.FC<ToolStarsProps> = ({
  value = 0,
  reviewsCount = 0,
  size = 'sm',
  showLabel = true,
  showCount = true,
  className = ''
}) => {
  const { t } = useTranslation();
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(value);
    const hasHalfStar = value % 1 >= 0.5;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`full-${i}`}
          className={`${sizeClasses[size]} text-yellow-400 fill-current`}
        />
      );
    }
    
    // Half star
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className={`${sizeClasses[size]} text-gray-300 dark:text-gray-600`} />
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ width: '50%' }}
          >
            <Star className={`${sizeClasses[size]} text-yellow-400 fill-current`} />
          </div>
        </div>
      );
    }
    
    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star
          key={`empty-${i}`}
          className={`${sizeClasses[size]} text-gray-300 dark:text-gray-600`}
        />
      );
    }
    
    return stars;
  };

  if (value === 0 && reviewsCount === 0) {
    return (
      <div className={`flex items-center gap-2 ${textSizeClasses[size]} ${className}`}>
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`${sizeClasses[size]} text-gray-300 dark:text-gray-600`}
            />
          ))}
        </div>
        {showLabel && (
          <span className="text-muted-foreground">
            {t('tools.rating.noReviews', '— (0)')}
          </span>
        )}
        <span className="sr-only">
          {t('tools.rating.noReviewsAccessible', 'No reviews yet')}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${textSizeClasses[size]} ${className}`}>
      <div className="flex items-center">
        {renderStars()}
      </div>
      {showLabel && (
        <span className="font-medium text-foreground">
          {value.toFixed(1)}
        </span>
      )}
      {showCount && (
        <span className="text-muted-foreground">
          ({reviewsCount.toLocaleString()})
        </span>
      )}
      <span className="sr-only">
        {t('tools.rating.accessibleLabel', 'Rated {{rating}} out of 5 from {{count}} reviews', {
          rating: value.toFixed(1),
          count: reviewsCount
        })}
      </span>
    </div>
  );
};

export default ToolStars;