import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, UserPlus, ArrowRight, Sparkles, Users, Compass } from 'lucide-react';
import InterestManagement from './InterestManagement';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const totalSteps = 3;

  useEffect(() => {
    if (isOpen && currentStep === 2) {
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
        title: "Error",
        description: "You must be logged in to follow creators.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Insert follow records for each selected creator
      const followPromises = selectedCreators.map(async (creatorId) => {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: creatorId
          });
        
        // Ignore duplicate errors (user already following)
        if (error && error.code !== '23505') {
          throw error;
        }
      });

      await Promise.all(followPromises);
      
      toast({
        title: "Success!",
        description: `You're now following ${selectedCreators.length} creators.`,
      });
      
      handleNextStep();
    } catch (error) {
      console.error('Error following creators:', error);
      toast({
        title: "Error",
        description: "Failed to follow creators. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
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
              <h2 className="text-2xl font-bold mb-2">Welcome to AI Feed!</h2>
              <p className="text-muted-foreground">
                Let's personalize your experience by selecting your interests
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
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Discover Top Creators</h2>
              <p className="text-muted-foreground">
                Follow creators who share your interests and get inspired
              </p>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Finding creators for you...</p>
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
                                Top Voice
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {creator.job_title || 'AI Enthusiast'}
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
                            <span>{creator.tools_submitted || 0} tools</span>
                            <span>{creator.articles_written || 0} articles</span>
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
                  No creators found matching your interests yet. You can explore and follow creators later!
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 text-center">
            <div>
              <Compass className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
              <p className="text-muted-foreground mb-6">
                Welcome to AI Feed! Here's what you can do:
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">📝 Share Content</h3>
                  <p className="text-sm text-muted-foreground">
                    Create posts, share AI tools, and write articles to engage with the community
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">🔍 Discover Tools</h3>
                  <p className="text-sm text-muted-foreground">
                    Explore AI tools submitted by the community and find your next favorite
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">🤝 Connect</h3>
                  <p className="text-sm text-muted-foreground">
                    Network with AI enthusiasts, professionals, and innovators
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">📚 Learn</h3>
                  <p className="text-sm text-muted-foreground">
                    Read articles, tutorials, and insights from experts in the field
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
              Skip Tour
            </Button>
            <Button 
              onClick={handleNextStep}
              disabled={userInterests.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        );
      
      case 2:
        return (
          <>
            <Button variant="outline" onClick={handleNextStep}>
              Skip
            </Button>
            <Button 
              onClick={handleFollowCreators}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {loading ? 'Following...' : `Follow ${selectedCreators.length > 0 ? `(${selectedCreators.length})` : ''}`}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        );
      
      case 3:
        return (
          <Button 
            onClick={onComplete}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-full"
          >
            Start Exploring AI Feed!
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
              <DialogTitle>Welcome to AI Feed</DialogTitle>
              <DialogDescription>
                Step {currentStep} of {totalSteps}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
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