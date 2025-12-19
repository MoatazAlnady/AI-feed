import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, Check, Users, Calendar, Wrench, BarChart3, MessageSquare, 
  TrendingUp, GitCompare, Video, Gift, Radio, Lock, Mail, DollarSign, 
  Headphones, Sparkles 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  trigger?: 'limit_reached' | 'premium_feature';
}

const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onClose,
  featureName,
  trigger = 'premium_feature'
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    { icon: MessageSquare, label: '10 AI Chat prompts/day' },
    { icon: Users, label: 'Unlimited group creation' },
    { icon: Calendar, label: 'Create unlimited events' },
    { icon: Wrench, label: 'Submit unlimited tools' },
    { icon: GitCompare, label: 'Compare AI tools side-by-side' },
    { icon: Video, label: 'Video upload & recording' },
    { icon: Radio, label: 'Go live with your audience' },
    { icon: TrendingUp, label: 'AI-powered content promotion' },
    { icon: Crown, label: 'Premium verified badge' },
    { icon: BarChart3, label: 'Advanced analytics dashboard' },
    { icon: Lock, label: 'Post privacy controls' },
    { icon: Mail, label: 'Creator newsletter to subscribers' },
    { icon: DollarSign, label: 'Paid subscription tiers' },
    { icon: Headphones, label: 'Priority support' },
    { icon: Sparkles, label: 'Early access to new features' },
  ];

  const handleViewPlans = () => {
    onClose();
    navigate('/upgrade');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            {t('premiumModal.title', 'Upgrade to Premium')}
          </DialogTitle>
          <DialogDescription className="text-base">
            {trigger === 'limit_reached' && featureName
              ? t('premiumModal.limitReached', 'You\'ve reached your free limit for {{feature}}', { feature: featureName })
              : featureName 
                ? t('premiumModal.premiumOnly', '{{feature}} is a premium feature', { feature: featureName })
                : t('premiumModal.subtitle', 'Unlock all features and boost your productivity')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* 7-Day Free Trial Badge */}
          <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
              {t('premiumModal.freeTrial', '7-Day Free Trial Included')}
            </span>
          </div>

          {/* Features List */}
          <div className="space-y-3 mb-6">
            {features.map(({ icon: Icon, label }, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">
                  {label}
                </span>
                <Check className="h-4 w-4 text-green-500 ml-auto" />
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-2xl font-bold text-foreground">
                  {t('premiumModal.monthlyPrice', '$20')}
                </span>
                <span className="text-muted-foreground">
                  {t('premiumModal.perMonth', '/month')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-foreground">
                  {t('premiumModal.yearlyPrice', '$200')}
                </span>
                <span className="text-muted-foreground">
                  {t('premiumModal.perYear', '/year')}
                </span>
              </div>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              {t('premiumModal.saveAmount', 'Save $40/year (2 months free)')}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleViewPlans}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold"
              size="lg"
            >
              {t('premiumModal.viewPlans', 'View Plans & Upgrade')}
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
              size="lg"
            >
              {t('premiumModal.maybeLater', 'Maybe Later')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpgradeModal;
