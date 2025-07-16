import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ToolRatingProps {
  toolId: number;
  initialRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

const ToolRating: React.FC<ToolRatingProps> = ({
  toolId,
  initialRating = 0,
  size = 'md',
  showCount = false,
  count = 0,
  interactive = false,
  onRatingChange,
  className = ''
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-7 w-7'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const handleRating = async (value: number) => {
    if (!interactive || !user) return;
    
    try {
      // In real app, send to API
      // await fetch(`/api/tools/${toolId}/rate`, {
      //   method: 'POST',
      //   body: JSON.stringify({ rating: value })
      // });
      
      setRating(value);
      setHasRated(true);
      
      if (onRatingChange) {
        onRatingChange(value);
      }
      
    } catch (error) {
      console.error('Error rating tool:', error);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive || hasRated}
            onClick={() => handleRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`focus:outline-none ${interactive && !hasRated ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Star 
              className={`${sizeClasses[size]} ${
                (hoverRating ? star <= hoverRating : star <= rating)
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              } transition-colors`} 
            />
          </button>
        ))}
      </div>
      
      {showCount && (
        <div className={`ml-2 ${textSizeClasses[size]} text-gray-600 flex items-center`}>
          <span className="font-medium">{rating.toFixed(1)}</span>
          {count > 0 && (
            <span className="ml-1">({count})</span>
          )}
        </div>
      )}
      
      {interactive && !user && (
        <span className="ml-2 text-xs text-gray-500">
          <a href="#" className="text-primary-600 hover:text-primary-700">Sign in</a> to rate
        </span>
      )}
      
      {interactive && hasRated && (
        <span className="ml-2 text-xs text-green-600">
          Thanks for rating!
        </span>
      )}
    </div>
  );
};

export default ToolRating;