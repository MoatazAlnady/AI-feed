import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, UserPlus, ArrowRight, Sparkles, Users, Compass, Building2 } from 'lucide-react';
import InterestManagement from './InterestManagement';
import CompanySelector from './CompanySelector';

interface TopCreator {
  id: string;
  full_name: string;
  profile_photo?: string;
  job_title?: string;
  bio?: string;
  interests: string[];
  followers_count?: number;
  tools_submitted?: number;
  articles_written?: number;
  verified?: boolean;
  ai_feed_top_voice?: boolean;
}

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ isOpen, onClose, onComplete }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Workplace state
  const [companyName, setCompanyName] = useState('');
  const [companyPageId, setCompanyPageId] = useState<string | null>(null);

  const totalSteps = 4;

  useEffect(() => {
    if (isOpen && currentStep === 3) {
      fetchTopCreators();
    }
  }, [isOpen, currentStep, userInterests]);

  const fetchTopCreators = async () => {
    if (userInterests.length === 0) return;
    
    setLoading(true);
    try {
      const { data: creators, error } = await supabase
        .from('user_profiles')
        .select('*')
        .overlaps('interests', userInterests)
        .eq('verified', true)
        .or('ai_feed_top_voice.eq.true,tools_submitted.gte.5,articles_written.gte.3')
        .limit(6);

      if (error) throw error;

      setTopCreators(creators || []);
    } catch (error) {
      console.error('Error fetching top creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInterestsChange = (interests: string[]) => {
    setUserInterests(interests);
  };

  const handleCompanyChange = (name: string, pageId: string | null) => {
    setCompanyName(name);
    setCompanyPageId(pageId);
  };

  const saveWorkplace = async () => {
    if (!user || !companyName) return;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          company: companyName,
          company_page_id: companyPageId,
        })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving workplace:', error);
    }
  };

  const toggleCreatorSelection = (creatorId: string) => {
    setSelectedCreators(prev => 
      prev.includes(creatorId) 
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  const handleFollowCreators = async () => {
    if (selectedCreators.length === 0) {
      handleNextStep();
      return;
    }

    if (!user) {
      toast({
        title: t('common.error'),
        description: t('onboarding.mustBeLoggedIn', 'You must be logged in to follow creators.'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const followPromises = selectedCreators.map(async (creatorId) => {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: creatorId
          });
        
        if (error && error.code !== '23505') {
          throw error;
        }
      });

      await Promise.all(followPromises);
      
      toast({
        title: t('common.success'),
        description: t('onboarding.followingCreators', "You're now following {{count}} creators.", { count: selectedCreators.length }),
      });
      
      handleNextStep();
    } catch (error) {
      console.error('Error following creators:', error);
      toast({
        title: t('common.error'),
        description: t('onboarding.followError', 'Failed to follow creators. Please try again.'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    // Save workplace when moving from step 2
    if (currentStep === 2 && companyName) {
      await saveWorkplace();
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (currentStep === totalSteps) {
      onComplete();
    } else {
      setCurrentStep(totalSteps);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">{t('onboarding.welcome', 'Welcome to AI Feed!')}</h2>
              <p className="text-muted-foreground">
                {t('onboarding.selectInterestsDesc', "Let's personalize your experience by selecting your interests")}
              </p>
            </div>
            <InterestManagement 
              mode="user" 
              userInterests={userInterests}
              onUserInterestsChange={handleInterestsChange}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">{t('onboarding.yourWorkplace', 'Your Workplace')}</h2>
              <p className="text-muted-foreground">
                {t('onboarding.workplaceDesc', 'Where do you currently work?')}
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <CompanySelector
                value={companyName}
                companyPageId={companyPageId}
                onChange={handleCompanyChange}
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {t('onboarding.workplaceOptional', 'This is optional - you can add or change this later in your profile settings.')}
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">{t('onboarding.discoverCreators', 'Discover Top Creators')}</h2>
              <p className="text-muted-foreground">
                {t('onboarding.discoverCreatorsDesc', 'Follow creators who share your interests and get inspired')}
              </p>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">{t('onboarding.findingCreators', 'Finding creators for you...')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {topCreators.map((creator) => (
                  <Card 
                    key={creator.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedCreators.includes(creator.id) 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : ''
                    }`}
                    onClick={() => toggleCreatorSelection(creator.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={creator.profile_photo} />
                          <AvatarFallback>
                            {creator.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm truncate">
                              {creator.full_name}
                            </h3>
                            {creator.verified && (
                              <Badge variant="secondary" className="text-xs">✓</Badge>
                            )}
                            {creator.ai_feed_top_voice && (
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                {t('onboarding.topVoice', 'Top Voice')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {creator.job_title || t('onboarding.aiEnthusiast', 'AI Enthusiast')}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {creator.interests.slice(0, 2).map((interest) => (
                              <Badge key={interest} variant="outline" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                            {creator.interests.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{creator.interests.length - 2}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span>{creator.tools_submitted || 0} {t('onboarding.tools', 'tools')}</span>
                            <span>{creator.articles_written || 0} {t('onboarding.articles', 'articles')}</span>
                          </div>
                        </div>
                        {selectedCreators.includes(creator.id) && (
                          <UserPlus className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {topCreators.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('onboarding.noCreatorsFound', 'No creators found matching your interests yet. You can explore and follow creators later!')}
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 text-center">
            <div>
              <Compass className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">{t('onboarding.allSet', "You're All Set!")}</h2>
              <p className="text-muted-foreground mb-6">
                {t('onboarding.welcomeMessage', "Welcome to AI Feed! Here's what you can do:")}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">📝 {t('onboarding.shareContent', 'Share Content')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('onboarding.shareContentDesc', 'Create posts, share AI tools, and write articles to engage with the community')}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">🔍 {t('onboarding.discoverTools', 'Discover Tools')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('onboarding.discoverToolsDesc', 'Explore AI tools submitted by the community and find your next favorite')}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">🤝 {t('onboarding.connect', 'Connect')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('onboarding.connectDesc', 'Network with AI enthusiasts, professionals, and innovators')}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">📚 {t('onboarding.learn', 'Learn')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('onboarding.learnDesc', 'Read articles, tutorials, and insights from experts in the field')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepButtons = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <Button variant="outline" onClick={handleSkip}>
              {t('onboarding.skipTour', 'Skip Tour')}
            </Button>
            <Button 
              onClick={handleNextStep}
              disabled={userInterests.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {t('onboarding.next', 'Next')} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        );
      
      case 2:
        return (
          <>
            <Button variant="outline" onClick={handleNextStep}>
              {t('onboarding.skip', 'Skip')}
            </Button>
            <Button 
              onClick={handleNextStep}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {t('onboarding.next', 'Next')} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        );
      
      case 3:
        return (
          <>
            <Button variant="outline" onClick={handleNextStep}>
              {t('onboarding.skip', 'Skip')}
            </Button>
            <Button 
              onClick={handleFollowCreators}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {loading ? t('onboarding.following', 'Following...') : `${t('onboarding.follow', 'Follow')} ${selectedCreators.length > 0 ? `(${selectedCreators.length})` : ''}`}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        );
      
      case 4:
        return (
          <Button 
            onClick={onComplete}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-full"
          >
            {t('onboarding.startExploring', 'Start Exploring AI Feed!')}
          </Button>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{t('onboarding.welcomeTitle', 'Welcome to AI Feed')}</DialogTitle>
              <DialogDescription>
                {t('onboarding.stepOf', 'Step {{current}} of {{total}}', { current: currentStep, total: totalSteps })}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </DialogHeader>
        
        <div className="py-6">
          {renderStep()}
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            {getStepButtons()}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingFlow;