import React from 'react';
import { Shield, Star, Crown } from 'lucide-react';

interface VerificationBadgeProps {
  type: 'verified' | 'top-voice' | 'both';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  type, 
  size = 'md', 
  showTooltip = true,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const getBadgeContent = () => {
    switch (type) {
      case 'verified':
        return {
          icon: Shield,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500',
          tooltip: 'Verified Profile - This account has been verified by AI Nexus'
        };
      case 'top-voice':
        return {
          icon: Crown,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500',
          tooltip: 'AI Nexus Top Voice - 50+ tools submitted and 50+ articles with 100K+ reach and 10K+ engagement'
        };
      case 'both':
        return {
          icon: Star,
          color: 'text-purple-500',
          bgColor: 'bg-purple-500',
          tooltip: 'Verified Top Voice - Verified profile with AI Nexus Top Voice status'
        };
      default:
        return null;
    }
  };

  const badgeContent = getBadgeContent();
  if (!badgeContent) return null;

  const { icon: Icon, color, bgColor, tooltip } = badgeContent;

  if (type === 'both') {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        {/* Verified Badge */}
        <div className="relative group">
          <div className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center`}>
            <Shield className={`${size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
          </div>
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
              Verified Profile
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
        
        {/* Top Voice Badge */}
        <div className="relative group">
          <div className={`${sizeClasses[size]} bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center`}>
            <Crown className={`${size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
          </div>
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
              AI Nexus Top Voice
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <div className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center ${
        type === 'top-voice' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : ''
      }`}>
        <Icon className={`${size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 max-w-xs">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default VerificationBadge;
export { VerificationBadge };