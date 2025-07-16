import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Award } from 'lucide-react';

interface VerificationBadgeProps {
  type: 'verified' | 'featured' | 'top-rated';
  size?: 'sm' | 'md' | 'lg';
}

export default function VerificationBadge({ type, size = 'md' }: VerificationBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5',
  };

  const getBadgeContent = () => {
    switch (type) {
      case 'verified':
        return {
          icon: <CheckCircle className={`${iconSizes[size]} text-blue-500`} />,
          text: 'Verified',
          variant: 'secondary' as const,
        };
      case 'featured':
        return {
          icon: <Star className={`${iconSizes[size]} text-yellow-500`} />,
          text: 'Featured',
          variant: 'secondary' as const,
        };
      case 'top-rated':
        return {
          icon: <Award className={`${iconSizes[size]} text-purple-500`} />,
          text: 'Top Rated',
          variant: 'secondary' as const,
        };
      default:
        return null;
    }
  };

  const badgeContent = getBadgeContent();
  if (!badgeContent) return null;

  return (
    <Badge variant={badgeContent.variant} className={`${sizeClasses[size]} flex items-center gap-1`}>
      {badgeContent.icon}
      {badgeContent.text}
    </Badge>
  );
}