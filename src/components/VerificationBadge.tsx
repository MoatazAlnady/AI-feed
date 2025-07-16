import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Shield } from 'lucide-react';

interface VerificationBadgeProps {
  user: any;
}

export const VerificationBadge = ({ user }: VerificationBadgeProps) => {
  if (user?.verified) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Verified
      </Badge>
    );
  }

  if (user?.ai_nexus_top_voice) {
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <Star className="h-3 w-3" />
        Top Voice
      </Badge>
    );
  }

  if (user?.account_type === 'admin') {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Admin
      </Badge>
    );
  }

  return null;
};