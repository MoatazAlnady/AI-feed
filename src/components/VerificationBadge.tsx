import React from 'react';
import { Check, Star } from 'lucide-react';

interface VerificationBadgeProps {
  type?: 'verified' | 'top-voice' | 'both';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  type = 'verified', 
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const iconSize = {
    sm: 8,
    md: 10,
    lg: 12
  };

  if (type === 'both') {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className={`${sizeClasses[size]} bg-blue-500 rounded-full flex items-center justify-center`}>
          <Check className={`w-${iconSize[size]} h-${iconSize[size]} text-white`} style={{ width: iconSize[size], height: iconSize[size] }} />
        </div>
        <div className={`${sizeClasses[size]} bg-purple-500 rounded-full flex items-center justify-center`}>
          <Star className={`w-${iconSize[size]} h-${iconSize[size]} text-white`} style={{ width: iconSize[size], height: iconSize[size] }} />
        </div>
      </div>
    );
  }

  if (type === 'top-voice') {
    return (
      <div className={`${sizeClasses[size]} bg-purple-500 rounded-full flex items-center justify-center ${className}`}>
        <Star className={`w-${iconSize[size]} h-${iconSize[size]} text-white`} style={{ width: iconSize[size], height: iconSize[size] }} />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-blue-500 rounded-full flex items-center justify-center ${className}`}>
      <Check className={`w-${iconSize[size]} h-${iconSize[size]} text-white`} style={{ width: iconSize[size], height: iconSize[size] }} />
    </div>
  );
};

export default VerificationBadge;