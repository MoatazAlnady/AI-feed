import React, { useState, useEffect, useMemo } from 'react';
import { X, Target, DollarSign, Users, Calendar, TrendingUp, MapPin, Sparkles, Bot, ChevronDown, Check, ChevronsUpDown, Smartphone, Monitor, Tablet, Globe, Clock, AlertTriangle, Eye, MousePointer, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, differenceInDays, addDays } from 'date-fns';
import { usePromotionAnalytics } from '@/hooks/usePromotionAnalytics';
import CampaignSummary from './CampaignSummary';

interface PromoteContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'tool' | 'article' | 'post' | 'job' | 'event' | 'profile';
  contentId: string | number;
  contentTitle: string;
}

interface DetailedReach {
  impressions: number;
  impressionsPerDay: number;
  clicks: number;
  cpm: string;
  cpc: string;
  targetingScore: number;
}

const PromoteContentModal: React.FC<PromoteContentModalProps> = ({ 
  isOpen, 
  onClose, 
  contentType, 
  contentId, 
  contentTitle 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [targetingMode, setTargetingMode] = useState<'manual' | 'ai'>('manual');
  const [contentVisibility, setContentVisibility] = useState<string | null>(null);
  const [isCheckingVisibility, setIsCheckingVisibility] = useState(false);
  
  // Date range state
  const [startDate, setStartDate] = useState<Date>(addDays(new Date(), 1)); // Tomorrow
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 8)); // 7 days from tomorrow
  const [openStartDatePicker, setOpenStartDatePicker] = useState(false);
  const [openEndDatePicker, setOpenEndDatePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    budget: '50',
    targetAudience: [] as string[],
    ageFrom: '18',
    ageTo: '65',
    selectedCountries: [] as string[],
    selectedCities: [] as string[],
    interests: [] as string[],
    gender: 'all',
    objective: 'awareness',
    devices: [] as string[],
    languages: [] as string[],
    scheduleEnabled: false,
    scheduleStartTime: '09:00',
    scheduleEndTime: '21:00',
    scheduleDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as string[],
    industries: [] as string[]
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTargeting, setIsGeneratingTargeting] = useState(false);
  const [openCountriesDropdown, setOpenCountriesDropdown] = useState(false);
  const [openCitiesDropdown, setOpenCitiesDropdown] = useState(false);

  // Calculate duration from date range
  const duration = useMemo(() => {
    return Math.max(1, differenceInDays(endDate, startDate));
  }, [startDate, endDate]);

  // Check content visibility when modal opens
  useEffect(() => {
    if (isOpen && contentType === 'post') {
      checkContentVisibility();
    }
  }, [isOpen, contentId, contentType]);

  const checkContentVisibility = async () => {
    setIsCheckingVisibility(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('visibility')
        .eq('id', String(contentId))
        .single();
      
      if (!error && data) {
        setContentVisibility(data.visibility || 'public');
      } else {
        setContentVisibility('public');
      }
    } catch (error) {
      console.error('Error checking content visibility:', error);
      setContentVisibility('public');
    } finally {
      setIsCheckingVisibility(false);
    }
  };

  const makeContentPublic = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ visibility: 'public' })
        .eq('id', String(contentId));
      
      if (!error) {
        setContentVisibility('public');
        toast({
          title: 'Content Updated',
          description: 'Your content is now public and can be promoted.',
        });
      }
    } catch (error) {
      console.error('Error making content public:', error);
      toast({
        title: 'Error',
        description: 'Failed to update content visibility.',
        variant: 'destructive'
      });
    }
  };

  const isContentPromotable = contentVisibility === 'public' || contentType !== 'post';

  // Complete countries and cities data
  const countriesWithCodes = [
    { name: 'United States', code: '+1' },
    { name: 'Canada', code: '+1' },
    { name: 'United Kingdom', code: '+44' },
    { name: 'Germany', code: '+49' },
    { name: 'France', code: '+33' },
    { name: 'Spain', code: '+34' },
    { name: 'Italy', code: '+39' },
    { name: 'Netherlands', code: '+31' },
    { name: 'Sweden', code: '+46' },
    { name: 'Norway', code: '+47' },
    { name: 'Denmark', code: '+45' },
    { name: 'Finland', code: '+358' },
    { name: 'Australia', code: '+61' },
    { name: 'New Zealand', code: '+64' },
    { name: 'Japan', code: '+81' },
    { name: 'South Korea', code: '+82' },
    { name: 'Singapore', code: '+65' },
    { name: 'India', code: '+91' },
    { name: 'China', code: '+86' },
    { name: 'Brazil', code: '+55' },
    { name: 'Mexico', code: '+52' },
    { name: 'Argentina', code: '+54' },
    { name: 'Chile', code: '+56' },
    { name: 'South Africa', code: '+27' },
    { name: 'Palestine', code: '+970' },
    { name: 'United Arab Emirates', code: '+971' },
    { name: 'Switzerland', code: '+41' },
    { name: 'Austria', code: '+43' },
    { name: 'Belgium', code: '+32' },
    { name: 'Ireland', code: '+353' },
    { name: 'Portugal', code: '+351' },
    { name: 'Poland', code: '+48' },
    { name: 'Czech Republic', code: '+420' },
    { name: 'Hungary', code: '+36' },
    { name: 'Romania', code: '+40' },
    { name: 'Russia', code: '+7' },
    { name: 'Turkey', code: '+90' },
    { name: 'Greece', code: '+30' },
    { name: 'Croatia', code: '+385' },
    { name: 'Bulgaria', code: '+359' },
    { name: 'Serbia', code: '+381' },
    { name: 'Slovenia', code: '+386' },
    { name: 'Slovakia', code: '+421' },
    { name: 'Estonia', code: '+372' },
    { name: 'Latvia', code: '+371' },
    { name: 'Lithuania', code: '+370' },
    { name: 'Malta', code: '+356' },
    { name: 'Cyprus', code: '+357' },
    { name: 'Luxembourg', code: '+352' },
    { name: 'Iceland', code: '+354' },
    { name: 'Thailand', code: '+66' },
    { name: 'Vietnam', code: '+84' },
    { name: 'Philippines', code: '+63' },
    { name: 'Indonesia', code: '+62' },
    { name: 'Malaysia', code: '+60' },
    { name: 'Bangladesh', code: '+880' },
    { name: 'Pakistan', code: '+92' },
    { name: 'Sri Lanka', code: '+94' },
    { name: 'Nepal', code: '+977' },
    { name: 'Myanmar', code: '+95' },
    { name: 'Cambodia', code: '+855' },
    { name: 'Laos', code: '+856' },
    { name: 'Saudi Arabia', code: '+966' },
    { name: 'Egypt', code: '+20' },
    { name: 'Iraq', code: '+964' },
    { name: 'Jordan', code: '+962' },
    { name: 'Lebanon', code: '+961' },
    { name: 'Syria', code: '+963' },
    { name: 'Yemen', code: '+967' },
    { name: 'Kuwait', code: '+965' },
    { name: 'Qatar', code: '+974' },
    { name: 'Bahrain', code: '+973' },
    { name: 'Oman', code: '+968' },
    { name: 'Libya', code: '+218' },
    { name: 'Tunisia', code: '+216' },
    { name: 'Algeria', code: '+213' },
    { name: 'Morocco', code: '+212' },
    { name: 'Sudan', code: '+249' },
    { name: 'Somalia', code: '+252' },
    { name: 'Djibouti', code: '+253' },
    { name: 'Comoros', code: '+269' },
    { name: 'Mauritania', code: '+222' }
  ];

  const countries = countriesWithCodes.map(c => c.name);

  const cities = {
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington DC', 'Boston', 'Nashville', 'Baltimore', 'Oklahoma City', 'Louisville', 'Portland', 'Las Vegas', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs', 'Raleigh', 'Virginia Beach', 'Long Beach', 'Miami', 'Oakland', 'Minneapolis', 'Tulsa', 'Bakersfield', 'Wichita', 'Arlington'],
    'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor', 'Saskatoon', 'St. Catharines', 'Regina', 'Sherbrooke', 'Barrie', 'Kelowna', 'Abbotsford', 'Kingston', 'Sudbury', 'Saguenay', 'Trois-Rivières', 'Guelph', 'Cambridge', 'Whitby', 'Brantford'],
    'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff', 'Leicester', 'Coventry', 'Bradford', 'Belfast', 'Nottingham', 'Hull', 'Newcastle', 'Stoke-on-Trent', 'Southampton', 'Derby', 'Portsmouth', 'Brighton', 'Plymouth', 'Northampton', 'Reading', 'Luton', 'Wolverhampton', 'Bolton', 'Bournemouth', 'Norwich'],
    'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Karlsruhe', 'Mannheim', 'Augsburg', 'Wiesbaden', 'Gelsenkirchen', 'Mönchengladbach', 'Braunschweig', 'Chemnitz', 'Kiel', 'Aachen'],
    'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne', 'Saint-Denis', 'Le Mans', 'Aix-en-Provence', 'Clermont-Ferrand', 'Brest', 'Limoges', 'Tours', 'Amiens', 'Perpignan', 'Metz'],
    'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain']
  } as Record<string, string[]>;

  const availableInterests = [
    'Machine Learning', 'Deep Learning', 'AI Research', 'Data Science',
    'Software Development', 'Startups', 'Technology', 'Innovation',
    'Automation', 'Robotics', 'Computer Vision', 'NLP', 'AI Ethics',
    'Healthcare AI', 'Finance AI', 'Education AI', 'Gaming AI',
    'Art & Creativity', 'Music AI', 'Writing & Content', 'Productivity'
  ];

  const audienceOptions = [
    'AI Researchers', 'Data Scientists', 'Software Engineers', 'Product Managers',
    'Entrepreneurs', 'Students', 'Tech Enthusiasts', 'Business Leaders',
    'Developers', 'Designers', 'Marketers', 'Consultants', 'Freelancers'
  ];

  const deviceOptions = [
    { value: 'desktop', label: 'Desktop', icon: Monitor },
    { value: 'mobile', label: 'Mobile', icon: Smartphone },
    { value: 'tablet', label: 'Tablet', icon: Tablet }
  ];

  const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
    'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish',
    'Turkish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian'
  ];

  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
    'Manufacturing', 'Media & Entertainment', 'Real Estate', 'Legal',
    'Consulting', 'Marketing & Advertising', 'Non-profit', 'Government',
    'Transportation', 'Energy', 'Agriculture', 'Retail', 'Hospitality'
  ];

  const weekDays = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' }
  ];

  // Enhanced detailed reach calculation
  const calculateDetailedReach = useMemo((): DetailedReach => {
    const budgetNum = parseFloat(formData.budget) || 0;
    const durationDays = duration;
    
    // Base: $1 = 100 impressions per day
    const baseImpressions = budgetNum * 100 * durationDays;
    
    // Targeting multipliers (narrow targeting = smaller but more relevant audience)
    let audienceMultiplier = 1.0;
    
    // Country targeting
    if (formData.selectedCountries.length === 0) {
      audienceMultiplier *= 1.5; // Global reach
    } else if (formData.selectedCountries.length <= 3) {
      audienceMultiplier *= 0.8; // Focused countries
    } else {
      audienceMultiplier *= 1.0; // Multiple countries
    }
    
    // Interest/Industry targeting
    if (formData.interests.length > 3) {
      audienceMultiplier *= 0.7;
    } else if (formData.interests.length > 0) {
      audienceMultiplier *= 0.85;
    }
    
    // Demographics - age range
    const ageRange = parseInt(formData.ageTo) - parseInt(formData.ageFrom);
    if (ageRange < 20) {
      audienceMultiplier *= 0.75;
    } else if (ageRange < 30) {
      audienceMultiplier *= 0.85;
    }
    
    // Gender targeting
    if (formData.gender !== 'all') {
      audienceMultiplier *= 0.85;
    }
    
    // Device targeting
    if (formData.devices.length > 0 && formData.devices.length < 3) {
      audienceMultiplier *= 0.9;
    }
    
    // Industry targeting
    if (formData.industries.length > 0) {
      audienceMultiplier *= 0.8;
    }
    
    // CTR by objective
    const ctrByObjective: Record<string, number> = {
      awareness: 0.02,    // 2% CTR
      engagement: 0.05,   // 5% CTR
      traffic: 0.08,      // 8% CTR
      conversions: 0.03   // 3% CTR (focused)
    };
    
    const estimatedImpressions = Math.round(baseImpressions * audienceMultiplier);
    const ctr = ctrByObjective[formData.objective] || 0.03;
    const estimatedClicks = Math.round(estimatedImpressions * ctr);
    const costPerImpression = budgetNum > 0 && estimatedImpressions > 0 ? budgetNum / estimatedImpressions : 0;
    const costPerClick = budgetNum > 0 && estimatedClicks > 0 ? budgetNum / estimatedClicks : 0;
    
    return {
      impressions: estimatedImpressions,
      impressionsPerDay: durationDays > 0 ? Math.round(estimatedImpressions / durationDays) : 0,
      clicks: estimatedClicks,
      cpm: (costPerImpression * 1000).toFixed(2),
      cpc: costPerClick.toFixed(2),
      targetingScore: audienceMultiplier
    };
  }, [formData, duration]);

  // Simple reach calculation for backward compatibility
  const calculateEstimatedReach = () => {
    return calculateDetailedReach.impressions;
  };

  const handleArrayToggle = (currentArray: string[], value: string, field: string) => {
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const generateAITargeting = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: 'Please describe your ideal audience',
        description: 'Enter a description to generate AI-powered targeting.',
        variant: 'destructive'
      });
      return;
    }

    setIsGeneratingTargeting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-targeting', {
        body: { 
          prompt: aiPrompt,
          contentType,
          contentTitle
        }
      });

      if (error) throw error;

      if (data?.targeting) {
        setFormData(prev => ({
          ...prev,
          targetAudience: data.targeting.targetAudience || prev.targetAudience,
          interests: data.targeting.interests || prev.interests,
          selectedCountries: data.targeting.countries || prev.selectedCountries,
          ageFrom: data.targeting.ageFrom?.toString() || prev.ageFrom,
          ageTo: data.targeting.ageTo?.toString() || prev.ageTo,
          gender: data.targeting.gender || prev.gender,
          industries: data.targeting.industries || prev.industries,
          languages: data.targeting.languages || prev.languages
        }));
        
        toast({
          title: 'AI Targeting Generated',
          description: 'Your targeting settings have been updated based on your description.',
        });
      }
    } catch (error) {
      console.error('Error generating AI targeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI targeting. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingTargeting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to promote content.',
        variant: 'destructive'
      });
      return;
    }

    if (!isContentPromotable) {
      toast({
        title: 'Content Not Promotable',
        description: 'Please make your content public before promoting.',
        variant: 'destructive'
      });
      return;
    }

    // Validate dates
    if (startDate >= endDate) {
      toast({
        title: 'Invalid Date Range',
        description: 'End date must be after start date.',
        variant: 'destructive'
      });
      return;
    }

    if (startDate < new Date()) {
      toast({
        title: 'Invalid Start Date',
        description: 'Start date must be in the future.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const targetingData = {
        targetAudience: formData.targetAudience,
        ageRange: { from: parseInt(formData.ageFrom), to: parseInt(formData.ageTo) },
        countries: formData.selectedCountries,
        cities: formData.selectedCities,
        interests: formData.interests,
        gender: formData.gender,
        devices: formData.devices,
        languages: formData.languages,
        industries: formData.industries,
        schedule: formData.scheduleEnabled ? {
          startTime: formData.scheduleStartTime,
          endTime: formData.scheduleEndTime,
          days: formData.scheduleDays
        } : null,
        estimatedReach: calculateDetailedReach,
        targetingMode,
        aiPrompt: targetingMode === 'ai' ? aiPrompt : null
      };

      console.log('Creating promotion checkout:', { contentType, contentId, contentTitle, ...formData });

      const { data, error } = await supabase.functions.invoke('create-promotion-checkout', {
        body: {
          contentType,
          contentId: String(contentId),
          contentTitle,
          budget: formData.budget,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          objective: formData.objective,
          targetingData
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        onClose();
        toast({
          title: 'Redirecting to Payment',
          description: 'Complete your payment to activate the promotion.',
        });
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating promotion checkout:', error);
      toast({
        title: 'Error',
        description: 'Failed to create promotion. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          .dark ::-webkit-scrollbar-thumb { 
            background: #475569; 
            border-radius: 4px; 
          }
          .dark ::-webkit-scrollbar-track { 
            background: #1e293b; 
          }
          .promo-command-list {
            max-height: 220px;
            overflow-y: auto;
          }
          .promo-command-content {
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
          }
          .promo-command-input {
            background: #0f172a;
            border: 1px solid #334155;
          }
          .promo-command-item:hover {
            background: #1e293b;
          }
          .promo-command-item[data-selected="true"] {
            background: #1c2743;
          }
        `}
      </style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Promote Your {contentType}</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">"{contentTitle}"</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Visibility Warning */}
            {contentType === 'post' && !isContentPromotable && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Content Must Be Public</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>Only public content can be promoted. This post is currently set to "{contentVisibility}" visibility.</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={makeContentPublic}
                    className="ml-4"
                  >
                    Make Public
                  </Button>
                </AlertDescription>
              </Alert>
            )}


            <form onSubmit={handleSubmit}>
              {/* Targeting Mode Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Targeting Method
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                    <input
                      type="radio"
                      name="targetingMode"
                      value="manual"
                      checked={targetingMode === 'manual'}
                      onChange={(e) => setTargetingMode(e.target.value as 'manual' | 'ai')}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-2 text-primary-500" />
                        <span className="font-medium text-gray-900 dark:text-white">Manual Targeting</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Customize your audience with precise targeting options
                      </p>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                    <input
                      type="radio"
                      name="targetingMode"
                      value="ai"
                      checked={targetingMode === 'ai'}
                      onChange={(e) => setTargetingMode(e.target.value as 'manual' | 'ai')}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center">
                        <Bot className="h-4 w-4 mr-2 text-purple-500" />
                        <span className="font-medium text-gray-900 dark:text-white">AI-Powered Targeting</span>
                        <span className="ml-2 px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 text-xs rounded-full">Beta</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Describe your ideal audience and let AI optimize targeting
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* AI Targeting Prompt */}
              {targetingMode === 'ai' && (
                <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Describe Your Ideal Audience
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Example: Tech-savvy professionals aged 25-45 interested in AI tools for productivity, primarily in the US and Europe..."
                    className="w-full px-4 py-3 border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                    rows={3}
                  />
                  <Button
                    type="button"
                    onClick={generateAITargeting}
                    disabled={isGeneratingTargeting || !aiPrompt.trim()}
                    className="mt-3 bg-purple-600 hover:bg-purple-700"
                  >
                    {isGeneratingTargeting ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Targeting
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Campaign Objective */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Campaign Objective
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'awareness', label: 'Awareness', description: 'Maximize reach' },
                    { value: 'engagement', label: 'Engagement', description: 'Get interactions' },
                    { value: 'traffic', label: 'Traffic', description: 'Drive clicks' },
                    { value: 'conversions', label: 'Conversions', description: 'Get actions' }
                  ].map((objective) => (
                    <label
                      key={objective.value}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        formData.objective === objective.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="objective"
                        value={objective.value}
                        checked={formData.objective === objective.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="font-medium text-gray-900 dark:text-white">{objective.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{objective.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Budget & Campaign Period */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Total Budget (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                      min="1"
                      max="10000"
                      step="1"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Enter any amount"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Min: $1 • Any amount accepted
                  </p>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Start Date
                  </label>
                  <Popover open={openStartDatePicker} onOpenChange={setOpenStartDatePicker}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 dark:bg-slate-800 dark:border-slate-600",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "MMM dd, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          if (date) {
                            setStartDate(date);
                            // Ensure end date is after start date
                            if (date >= endDate) {
                              setEndDate(addDays(date, 7));
                            }
                          }
                          setOpenStartDatePicker(false);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    End Date
                  </label>
                  <Popover open={openEndDatePicker} onOpenChange={setOpenEndDatePicker}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 dark:bg-slate-800 dark:border-slate-600",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "MMM dd, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          if (date) setEndDate(date);
                          setOpenEndDatePicker(false);
                        }}
                        disabled={(date) => date <= startDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Duration: {duration} day{duration !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Audience Targeting */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Target Audience
                </label>
                <MultiSelectCombobox
                  options={audienceOptions.map(a => ({ value: a, label: a }))}
                  selected={formData.targetAudience}
                  onChange={(selected) => setFormData(prev => ({ ...prev, targetAudience: selected }))}
                  placeholder="Select target audiences..."
                  searchPlaceholder="Search audiences..."
                  emptyMessage="No audiences found."
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Selected: {formData.targetAudience.length} audience{formData.targetAudience.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Demographics */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Demographics
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Age Range</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={formData.ageFrom}
                        onChange={(e) => setFormData(prev => ({ ...prev, ageFrom: e.target.value }))}
                        min="13"
                        max="99"
                        className="w-20 px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-center dark:text-white"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        value={formData.ageTo}
                        onChange={(e) => setFormData(prev => ({ ...prev, ageTo: e.target.value }))}
                        min="13"
                        max="99"
                        className="w-20 px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-center dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg dark:text-white"
                    >
                      <option value="all">All Genders</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location Targeting */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-6 mt-6">
                  Location Targeting
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Countries Multi-Select Dropdown */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Countries</h4>
                    <Popover open={openCountriesDropdown} onOpenChange={setOpenCountriesDropdown}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCountriesDropdown}
                          className="w-full justify-between h-12 px-4 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"
                        >
                          {formData.selectedCountries.length > 0
                            ? `${formData.selectedCountries.length} countr${formData.selectedCountries.length !== 1 ? 'ies' : 'y'} selected`
                            : "Select countries..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 promo-command-content">
                        <Command className="bg-slate-900">
                          <CommandInput placeholder="Search countries..." className="h-9 promo-command-input dark:text-white" />
                          <CommandList className="promo-command-list">
                            <CommandEmpty className="dark:text-gray-400">No countries found.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((country) => (
                                <CommandItem
                                  key={country}
                                  value={country}
                                  onSelect={() => {
                                    const isSelected = formData.selectedCountries.includes(country);
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedCountries: isSelected
                                        ? prev.selectedCountries.filter(c => c !== country)
                                        : [...prev.selectedCountries, country],
                                      selectedCities: isSelected && prev.selectedCountries.length === 1 
                                        ? [] 
                                        : prev.selectedCities
                                    }));
                                  }}
                                  className="flex items-center space-x-2 cursor-pointer promo-command-item dark:text-white hover:bg-slate-800"
                                  data-selected={formData.selectedCountries.includes(country)}
                                >
                                  <Checkbox
                                    checked={formData.selectedCountries.includes(country)}
                                    className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                                  />
                                  <span>{country}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Selected: {formData.selectedCountries.length} countr{formData.selectedCountries.length !== 1 ? 'ies' : 'y'}
                    </p>
                  </div>

                  {/* Cities Multi-Select Dropdown */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Cities</h4>
                    {formData.selectedCountries.length > 0 ? (
                      <>
                        <Popover open={openCitiesDropdown} onOpenChange={setOpenCitiesDropdown}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openCitiesDropdown}
                              className="w-full justify-between h-12 px-4 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"
                            >
                              {formData.selectedCities.length > 0
                                ? `${formData.selectedCities.length} cit${formData.selectedCities.length !== 1 ? 'ies' : 'y'} selected`
                                : "Select cities..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 promo-command-content">
                            <Command className="bg-slate-900">
                              <CommandInput placeholder="Search cities..." className="h-9 promo-command-input dark:text-white" />
                              <CommandList className="promo-command-list">
                                <CommandEmpty className="dark:text-gray-400">No cities found.</CommandEmpty>
                                <CommandGroup>
                                  {formData.selectedCountries.flatMap(country => 
                                    cities[country]?.map(city => {
                                      const cityValue = `${country}: ${city}`;
                                      return (
                                        <CommandItem
                                          key={`${country}-${city}`}
                                          value={cityValue}
                                          onSelect={() => {
                                            const isSelected = formData.selectedCities.includes(cityValue);
                                            setFormData(prev => ({
                                              ...prev,
                                              selectedCities: isSelected
                                                ? prev.selectedCities.filter(c => c !== cityValue)
                                                : [...prev.selectedCities, cityValue]
                                            }));
                                          }}
                                          className="flex items-center space-x-2 cursor-pointer promo-command-item dark:text-white hover:bg-slate-800"
                                          data-selected={formData.selectedCities.includes(cityValue)}
                                        >
                                          <Checkbox
                                            checked={formData.selectedCities.includes(cityValue)}
                                            className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                                          />
                                          <span>{city} ({country})</span>
                                        </CommandItem>
                                      );
                                    }) || []
                                  )}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Selected: {formData.selectedCities.length} cit{formData.selectedCities.length !== 1 ? 'ies' : 'y'}
                        </p>
                      </>
                    ) : (
                      <div className="w-full px-4 py-8 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-800 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Select countries first to choose specific cities
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Interest Targeting */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Interest Targeting
                </label>
                <MultiSelectCombobox
                  options={availableInterests.map(i => ({ value: i, label: i }))}
                  selected={formData.interests}
                  onChange={(selected) => setFormData(prev => ({ ...prev, interests: selected }))}
                  placeholder="Select interests..."
                  searchPlaceholder="Search interests..."
                  emptyMessage="No interests found."
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Selected: {formData.interests.length} interest{formData.interests.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Device Targeting */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Device Targeting
                </label>
                <MultiSelectCombobox
                  options={deviceOptions.map(d => ({ 
                    value: d.value, 
                    label: d.label,
                    icon: <d.icon className="h-4 w-4" />
                  }))}
                  selected={formData.devices}
                  onChange={(selected) => setFormData(prev => ({ ...prev, devices: selected }))}
                  placeholder="All devices (default)"
                  searchPlaceholder="Search devices..."
                  emptyMessage="No devices found."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formData.devices.length === 0 ? 'All devices (default)' : `${formData.devices.length} device type(s) selected`}
                </p>
              </div>

              {/* Language Targeting */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Language Targeting
                </label>
                <MultiSelectCombobox
                  options={languageOptions.map(l => ({ value: l, label: l }))}
                  selected={formData.languages}
                  onChange={(selected) => setFormData(prev => ({ ...prev, languages: selected }))}
                  placeholder="All languages (default)"
                  searchPlaceholder="Search languages..."
                  emptyMessage="No languages found."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formData.languages.length === 0 ? 'All languages (default)' : `${formData.languages.length} language(s) selected`}
                </p>
              </div>

              {/* Industry Targeting */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Industry Targeting
                </label>
                <MultiSelectCombobox
                  options={industryOptions.map(i => ({ value: i, label: i }))}
                  selected={formData.industries}
                  onChange={(selected) => setFormData(prev => ({ ...prev, industries: selected }))}
                  placeholder="All industries (default)"
                  searchPlaceholder="Search industries..."
                  emptyMessage="No industries found."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formData.industries.length === 0 ? 'All industries (default)' : `${formData.industries.length} industry/industries selected`}
                </p>
              </div>

              {/* Schedule Targeting */}
              <div className="mb-8">
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule Targeting
                  </span>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.scheduleEnabled}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduleEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </label>
                
                {formData.scheduleEnabled && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={formData.scheduleStartTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, scheduleStartTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg text-sm dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">End Time</label>
                        <input
                          type="time"
                          value={formData.scheduleEndTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, scheduleEndTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 rounded-lg text-sm dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Active Days</label>
                      <div className="flex flex-wrap gap-2">
                        {weekDays.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => handleArrayToggle(formData.scheduleDays, day.value, 'scheduleDays')}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                              formData.scheduleDays.includes(day.value)
                                ? 'bg-primary-500 text-white border-primary-500'
                                : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-600'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Comprehensive Campaign Summary */}
              <CampaignSummary 
                formData={formData}
                duration={duration}
                startDate={startDate}
                endDate={endDate}
                calculateDetailedReach={calculateDetailedReach}
                objective={formData.objective}
              />

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !isContentPromotable}
                  className="px-8 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Launch Campaign - ${formData.budget}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default PromoteContentModal;
