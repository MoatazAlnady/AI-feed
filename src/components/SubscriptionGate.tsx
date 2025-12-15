import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionGateProps {
  children: React.ReactNode;
  hasActiveSubscription: boolean;
  featureName?: string;
  onUpgrade?: () => void;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  children,
  hasActiveSubscription,
  featureName = 'this feature',
  onUpgrade
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/upgrade');
    }
  };

  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none opacity-50">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
        <Card className="max-w-md mx-4 border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Subscription Required</CardTitle>
            <CardDescription className="text-base">
              Upgrade your plan to access {featureName}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Unlimited job postings
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Advanced talent search
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Team collaboration features
              </li>
            </ul>
            <Button onClick={handleUpgrade} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              View Plans & Upgrade
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionGate;
