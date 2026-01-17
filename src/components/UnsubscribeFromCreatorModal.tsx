import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Mail, CreditCard, AlertTriangle, Gift, ChevronRight, Star, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UnsubscribeFromCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
}

interface SubscriptionData {
  id: string;
  tier_name: string;
  started_at: string;
  receive_newsletter: boolean;
  stripe_subscription_id?: string;
}

interface NewsletterData {
  id: string;
  is_active: boolean;
}

interface CancellationQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: { value: string; label: string }[] | null;
  is_mandatory: boolean;
  order_index: number;
}

interface RetentionOffer {
  id: string;
  offer_type: 'unconditional' | 'conditional';
  title: string;
  description: string | null;
  discount_percent: number | null;
  discount_months: number | null;
  free_months: number | null;
  condition_rules: {
    question_id: string;
    answer_values: string[];
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  } | null;
  priority: number;
}

type Step = 'questions' | 'offers' | 'confirm';

const UnsubscribeFromCreatorModal: React.FC<UnsubscribeFromCreatorModalProps> = ({
  isOpen,
  onClose,
  creatorId,
  creatorName,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [newsletter, setNewsletter] = useState<NewsletterData | null>(null);
  
  // Multi-step flow state
  const [currentStep, setCurrentStep] = useState<Step>('questions');
  const [questions, setQuestions] = useState<CancellationQuestion[]>([]);
  const [offers, setOffers] = useState<RetentionOffer[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [matchingOffers, setMatchingOffers] = useState<RetentionOffer[]>([]);
  
  // Legacy options (kept for backwards compatibility)
  const [cancelSubscription, setCancelSubscription] = useState(true);
  const [unsubscribeNewsletter, setUnsubscribeNewsletter] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchSubscriptionData();
    }
    // Reset state when modal closes
    if (!isOpen) {
      setCurrentStep('questions');
      setResponses({});
      setMatchingOffers([]);
      setCancelSubscription(true);
      setUnsubscribeNewsletter(false);
    }
  }, [isOpen, user, creatorId]);

  const fetchSubscriptionData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Fetch subscription
      const { data: subData } = await supabase
        .from('creator_subscriptions')
        .select(`
          id,
          started_at,
          receive_newsletter,
          stripe_subscription_id,
          creator_subscription_tiers (name)
        `)
        .eq('subscriber_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .single();

      if (subData) {
        setSubscription({
          id: subData.id,
          tier_name: (subData.creator_subscription_tiers as any)?.name || 'Premium',
          started_at: subData.started_at,
          receive_newsletter: subData.receive_newsletter ?? true,
          stripe_subscription_id: subData.stripe_subscription_id || undefined,
        });
      }

      // Fetch newsletter subscription
      const { data: newsData } = await supabase
        .from('creator_newsletter_subscribers')
        .select('id, is_active')
        .eq('subscriber_id', user.id)
        .eq('creator_id', creatorId)
        .single();

      if (newsData) {
        setNewsletter({
          id: newsData.id,
          is_active: newsData.is_active ?? true,
        });
      }

      // Fetch creator's cancellation questions
      const { data: questionsData } = await supabase
        .from('creator_cancellation_questions')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (questionsData) {
        setQuestions(questionsData.map(q => ({
          ...q,
          options: q.options as { value: string; label: string }[] | null
        })));
      }

      // Fetch creator's retention offers
      const { data: offersData } = await supabase
        .from('creator_retention_offers')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (offersData) {
        setOffers(offersData.map(o => ({
          ...o,
          offer_type: o.offer_type as 'unconditional' | 'conditional',
          condition_rules: o.condition_rules as RetentionOffer['condition_rules']
        })));
      }

      // If no questions, skip to offers step
      if (!questionsData || questionsData.length === 0) {
        setCurrentStep('offers');
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const validateMandatoryQuestions = (): boolean => {
    const mandatoryQuestions = questions.filter(q => q.is_mandatory);
    for (const q of mandatoryQuestions) {
      const response = responses[q.id];
      if (response === undefined || response === null || response === '' || 
          (Array.isArray(response) && response.length === 0)) {
        toast.error(`Please answer: "${q.question_text}"`);
        return false;
      }
    }
    return true;
  };

  const evaluateOfferConditions = (): RetentionOffer[] => {
    const matching: RetentionOffer[] = [];
    
    for (const offer of offers) {
      if (offer.offer_type === 'unconditional') {
        matching.push(offer);
      } else if (offer.offer_type === 'conditional' && offer.condition_rules) {
        const { question_id, answer_values, operator } = offer.condition_rules;
        const userAnswer = responses[question_id];
        
        if (userAnswer === undefined) continue;
        
        let matches = false;
        switch (operator) {
          case 'equals':
            matches = answer_values.includes(String(userAnswer));
            break;
          case 'contains':
            if (Array.isArray(userAnswer)) {
              matches = answer_values.some(v => userAnswer.includes(v));
            } else {
              matches = answer_values.some(v => String(userAnswer).includes(v));
            }
            break;
          case 'greater_than':
            matches = Number(userAnswer) > Number(answer_values[0]);
            break;
          case 'less_than':
            matches = Number(userAnswer) < Number(answer_values[0]);
            break;
        }
        
        if (matches) {
          matching.push(offer);
        }
      }
    }
    
    return matching.sort((a, b) => b.priority - a.priority);
  };

  const handleProceedToOffers = () => {
    if (questions.length > 0 && !validateMandatoryQuestions()) {
      return;
    }
    
    const matching = evaluateOfferConditions();
    setMatchingOffers(matching);
    setCurrentStep('offers');
  };

  const handleAcceptOffer = async (offer: RetentionOffer) => {
    if (!user || !subscription) return;
    setProcessing(true);

    try {
      // Call edge function to apply the offer
      const { data, error } = await supabase.functions.invoke('apply-creator-retention-offer', {
        body: {
          offer_id: offer.id,
          subscription_id: subscription.id
        }
      });

      if (error) throw error;

      // Record the response
      await supabase.from('creator_cancellation_responses').insert({
        subscription_id: subscription.id,
        subscriber_id: user.id,
        creator_id: creatorId,
        responses: responses,
        offer_shown_id: offer.id,
        offer_accepted: true,
        cancelled: false
      });

      toast.success('Offer applied! Your subscription has been updated.');
      onClose();
    } catch (error) {
      console.error('Error applying offer:', error);
      toast.error('Failed to apply offer. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleProceedToConfirm = () => {
    setCurrentStep('confirm');
  };

  const handleConfirmCancellation = async () => {
    if (!user) return;
    setProcessing(true);

    try {
      // Record the cancellation response
      if (subscription) {
        await supabase.from('creator_cancellation_responses').insert({
          subscription_id: subscription.id,
          subscriber_id: user.id,
          creator_id: creatorId,
          responses: responses,
          offer_shown_id: matchingOffers.length > 0 ? matchingOffers[0].id : null,
          offer_accepted: false,
          cancelled: true
        });
      }

      if (cancelSubscription && subscription) {
        await supabase
          .from('creator_subscriptions')
          .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('id', subscription.id);
      }

      if (unsubscribeNewsletter) {
        if (newsletter) {
          await supabase
            .from('creator_newsletter_subscribers')
            .update({ is_active: false })
            .eq('id', newsletter.id);
        }
        
        if (subscription && !cancelSubscription) {
          await supabase
            .from('creator_subscriptions')
            .update({ receive_newsletter: false })
            .eq('id', subscription.id);
        }
      }

      toast.success(t('creator.unsubscribe.success', 'Successfully updated your preferences'));
      onClose();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error(t('creator.unsubscribe.error', 'Failed to update preferences'));
    } finally {
      setProcessing(false);
    }
  };

  const renderQuestionInput = (question: CancellationQuestion) => {
    const value = responses[question.id];
    
    switch (question.question_type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            rows={3}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(v) => handleResponseChange(question.id, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'radio':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={(v) => handleResponseChange(question.id, v)}
          >
            {question.options?.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`${question.id}-${opt.value}`} />
                <Label htmlFor={`${question.id}-${opt.value}`}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${opt.value}`}
                  checked={(value || []).includes(opt.value)}
                  onCheckedChange={(checked) => {
                    const current = value || [];
                    if (checked) {
                      handleResponseChange(question.id, [...current, opt.value]);
                    } else {
                      handleResponseChange(question.id, current.filter((v: string) => v !== opt.value));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${opt.value}`}>{opt.label}</Label>
              </div>
            ))}
          </div>
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter a number..."
          />
        );
      
      case 'rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleResponseChange(question.id, rating)}
                className={`p-2 rounded-lg transition-colors ${
                  value >= rating 
                    ? 'text-yellow-500' 
                    : 'text-muted-foreground hover:text-yellow-400'
                }`}
              >
                <Star className={`h-6 w-6 ${value >= rating ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
          />
        );
    }
  };

  const renderOfferCard = (offer: RetentionOffer) => {
    const getOfferDetails = () => {
      const details: string[] = [];
      if (offer.discount_percent) {
        details.push(`${offer.discount_percent}% off`);
      }
      if (offer.discount_months) {
        details.push(`for ${offer.discount_months} month${offer.discount_months > 1 ? 's' : ''}`);
      }
      if (offer.free_months) {
        details.push(`${offer.free_months} month${offer.free_months > 1 ? 's' : ''} free`);
      }
      return details.join(' ');
    };

    return (
      <div
        key={offer.id}
        className="p-4 border border-primary/30 bg-primary/5 rounded-lg"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            {offer.discount_percent ? (
              <Percent className="h-5 w-5 text-primary" />
            ) : (
              <Gift className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">{offer.title}</h4>
            {offer.description && (
              <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
            )}
            <p className="text-sm font-medium text-primary mt-2">{getOfferDetails()}</p>
            <Button
              onClick={() => handleAcceptOffer(offer)}
              disabled={processing}
              className="mt-3"
              size="sm"
            >
              {processing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                'Accept Offer'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {t('creator.unsubscribe.title', 'Manage Subscription')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Progress indicator */}
          {(questions.length > 0 || offers.length > 0) && (
            <div className="flex items-center gap-2 mb-6">
              {questions.length > 0 && (
                <>
                  <div className={`h-2 flex-1 rounded-full ${currentStep === 'questions' ? 'bg-primary' : 'bg-muted'}`} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </>
              )}
              <div className={`h-2 flex-1 rounded-full ${currentStep === 'offers' ? 'bg-primary' : 'bg-muted'}`} />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <div className={`h-2 flex-1 rounded-full ${currentStep === 'confirm' ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : currentStep === 'questions' && questions.length > 0 ? (
            /* Questions Step */
            <div className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Before you go, we'd love to understand your experience better. Please answer a few quick questions.
                </p>
              </div>

              <div className="space-y-6">
                {questions.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <Label className="flex items-center gap-1">
                      {question.question_text}
                      {question.is_mandatory && <span className="text-destructive">*</span>}
                    </Label>
                    {renderQuestionInput(question)}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button onClick={handleProceedToOffers} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          ) : currentStep === 'offers' ? (
            /* Offers Step */
            <div className="space-y-6">
              {/* Current Subscription Info */}
              {subscription && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{subscription.tier_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('creator.unsubscribe.memberSince', 'Member since {{date}}', {
                      date: format(new Date(subscription.started_at), 'MMM d, yyyy')
                    })}
                  </p>
                </div>
              )}

              {/* Retention Offers */}
              {matchingOffers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">
                    Wait! We have special offers for you
                  </h3>
                  {matchingOffers.map(renderOfferCard)}
                </div>
              )}

              {/* Options for cancellation */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-medium text-foreground">
                  {matchingOffers.length > 0 ? 'Or continue with cancellation:' : 'Select what to cancel:'}
                </h3>
                
                {subscription && (
                  <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={cancelSubscription}
                      onCheckedChange={(checked) => setCancelSubscription(checked as boolean)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {t('creator.unsubscribe.cancelSubscription', 'Cancel Subscription')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('creator.unsubscribe.cancelDesc', 'Stop access to premium content and end billing')}
                      </p>
                    </div>
                  </label>
                )}

                {(newsletter?.is_active || subscription?.receive_newsletter) && (
                  <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={unsubscribeNewsletter}
                      onCheckedChange={(checked) => setUnsubscribeNewsletter(checked as boolean)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {t('creator.unsubscribe.unsubscribeNewsletter', 'Unsubscribe from Newsletter')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('creator.unsubscribe.newsletterDesc', 'Stop receiving email updates from this creator')}
                      </p>
                    </div>
                  </label>
                )}
              </div>

              <div className="flex gap-3">
                {questions.length > 0 && (
                  <Button variant="outline" onClick={() => setCurrentStep('questions')} className="flex-1">
                    Back
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className={questions.length === 0 ? "flex-1" : ""}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button 
                  onClick={handleProceedToConfirm} 
                  disabled={!cancelSubscription && !unsubscribeNewsletter}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          ) : (
            /* Confirmation Step */
            <div className="space-y-6">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {t('creator.unsubscribe.confirmTitle', 'Confirm Your Changes')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('creator.unsubscribe.confirmMessage', 'You are about to make the following changes:')}
                    </p>
                    <ul className="mt-2 text-sm text-foreground space-y-1">
                      {cancelSubscription && (
                        <li>• {t('creator.unsubscribe.cancelSub', 'Cancel premium subscription')}</li>
                      )}
                      {unsubscribeNewsletter && (
                        <li>• {t('creator.unsubscribe.unsubNews', 'Unsubscribe from newsletter')}</li>
                      )}
                    </ul>
                    {cancelSubscription && (
                      <p className="mt-3 text-sm text-destructive font-medium">
                        You will lose access to {creatorName}'s premium content immediately.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('offers')}
                  className="flex-1"
                >
                  {t('common.back', 'Back')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmCancellation}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    t('common.confirm', 'Confirm')
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnsubscribeFromCreatorModal;
