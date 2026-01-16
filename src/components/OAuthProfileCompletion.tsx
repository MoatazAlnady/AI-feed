import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { User, Calendar, MapPin, Phone, Globe, Lock, ChevronsUpDown, Check, Briefcase, Sparkles, ChevronRight, ChevronLeft, X, FileText, Upload, HelpCircle, Loader2, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

const countriesWithCodes = [
  { name: 'United States', code: '+1' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'Canada', code: '+1' },
  { name: 'Australia', code: '+61' },
  { name: 'Germany', code: '+49' },
  { name: 'France', code: '+33' },
  { name: 'Spain', code: '+34' },
  { name: 'Italy', code: '+39' },
  { name: 'Netherlands', code: '+31' },
  { name: 'Sweden', code: '+46' },
  { name: 'Norway', code: '+47' },
  { name: 'Denmark', code: '+45' },
  { name: 'India', code: '+91' },
  { name: 'Japan', code: '+81' },
  { name: 'South Korea', code: '+82' },
  { name: 'China', code: '+86' },
  { name: 'Brazil', code: '+55' },
  { name: 'Mexico', code: '+52' },
  { name: 'Argentina', code: '+54' },
  { name: 'South Africa', code: '+27' },
  { name: 'Nigeria', code: '+234' },
  { name: 'Egypt', code: '+20' },
  { name: 'United Arab Emirates', code: '+971' },
  { name: 'Saudi Arabia', code: '+966' },
  { name: 'Turkey', code: '+90' },
  { name: 'Russia', code: '+7' },
  { name: 'Poland', code: '+48' },
  { name: 'Ukraine', code: '+380' },
  { name: 'Indonesia', code: '+62' },
  { name: 'Malaysia', code: '+60' },
  { name: 'Singapore', code: '+65' },
  { name: 'Thailand', code: '+66' },
  { name: 'Vietnam', code: '+84' },
  { name: 'Philippines', code: '+63' },
  { name: 'New Zealand', code: '+64' },
  { name: 'Ireland', code: '+353' },
  { name: 'Belgium', code: '+32' },
  { name: 'Switzerland', code: '+41' },
  { name: 'Austria', code: '+43' },
  { name: 'Portugal', code: '+351' },
  { name: 'Greece', code: '+30' },
  { name: 'Czech Republic', code: '+420' },
  { name: 'Romania', code: '+40' },
  { name: 'Hungary', code: '+36' },
  { name: 'Israel', code: '+972' },
  { name: 'Pakistan', code: '+92' },
  { name: 'Bangladesh', code: '+880' },
  { name: 'Sri Lanka', code: '+94' },
  { name: 'Nepal', code: '+977' },
  { name: 'Morocco', code: '+212' },
  { name: 'Kenya', code: '+254' },
  { name: 'Ghana', code: '+233' },
  { name: 'Colombia', code: '+57' },
  { name: 'Chile', code: '+56' },
  { name: 'Peru', code: '+51' },
  { name: 'Venezuela', code: '+58' },
  { name: 'Ecuador', code: '+593' },
  { name: 'Palestine', code: '+970' },
  { name: 'Jordan', code: '+962' },
  { name: 'Lebanon', code: '+961' },
  { name: 'Iraq', code: '+964' },
  { name: 'Kuwait', code: '+965' },
  { name: 'Qatar', code: '+974' },
  { name: 'Bahrain', code: '+973' },
  { name: 'Oman', code: '+968' },
].sort((a, b) => a.name.localeCompare(b.name));

const genderOptions = ['Male', 'Female'];

const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const availableInterests = [
  'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision',
  'AI Ethics', 'Robotics', 'Data Science', 'Neural Networks', 'Generative AI',
  'AI Research', 'AI Startups', 'AI Tools', 'Automation', 'Chatbots',
  'Image Generation', 'Video AI', 'Audio AI', 'Code Assistant', 'Productivity',
  'Writing & Content', 'Data Analysis', 'Business Intelligence', 'Healthcare AI',
  'Finance AI', 'Education AI', 'Gaming AI', 'Art & Creativity', 'Music AI'
];

const languageOptions = [
  'English', 'Arabic', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
  'Chinese (Mandarin)', 'Japanese', 'Korean', 'Hindi', 'Bengali', 'Urdu', 'Turkish',
  'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian'
];

const proficiencyLevels = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Elementary' },
  { value: 3, label: 'Intermediate' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Native/Fluent' }
];

const skillOptions = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Machine Learning',
  'Deep Learning', 'Data Science', 'AI', 'Cloud Computing', 'AWS', 'Azure',
  'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'Product Management', 'UX Design',
  'Project Management', 'Data Analysis', 'Marketing', 'Sales', 'Business Development',
  'Content Writing', 'Graphic Design', 'Video Editing', 'SEO', 'Social Media'
];

// Generate years from 1920 to current year - 13 (minimum age)
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 13 - 1920 + 1 }, (_, i) => (currentYear - 13 - i).toString());

export default function OAuthProfileCompletion() {
  const { user, profileComplete, setProfileComplete } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accountTypeLocked, setAccountTypeLocked] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  
  // Step 0: choose method, Step 1: basic info, Step 2: professional info
  const [step, setStep] = useState(0);
  const [fillMethod, setFillMethod] = useState<'choose' | 'cv' | 'manual'>('choose');
  const [cvParsing, setCVParsing] = useState(false);
  const [parsedFromCV, setParsedFromCV] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    birth_date: '',
    gender: '',
    country: '',
    city: '',
    phone_country_code: '+1',
    phone: '',
    account_type: 'creator',
    // Step 2 fields
    job_title: '',
    company: '',
    bio: '',
    interests: [] as string[],
    languages: [] as Array<{language: string, level: number}>,
    skills: [] as string[],
  });

  // Signup reasons state
  const [signupReasons, setSignupReasons] = useState<number[]>([]);
  const [otherReasonText, setOtherReasonText] = useState('');
  const [availableReasons, setAvailableReasons] = useState<Array<{id: number, reason_text: string, is_other: boolean}>>([]);

  // CV upload state
  const [cvFile, setCVFile] = useState<File | null>(null);
  const [cvUploading, setCVUploading] = useState(false);

  // Only show for logged-in users with incomplete profiles
  const isOpen = !!user && !profileComplete;

  // Generate days based on selected year and month
  const days = useMemo(() => {
    if (!birthYear || !birthMonth) return Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const daysInMonth = new Date(parseInt(birthYear), parseInt(birthMonth), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'));
  }, [birthYear, birthMonth]);

  // Update birth_date when year, month, day change
  useEffect(() => {
    if (birthYear && birthMonth && birthDay) {
      setFormData(prev => ({
        ...prev,
        birth_date: `${birthYear}-${birthMonth}-${birthDay}`,
      }));
    }
  }, [birthYear, birthMonth, birthDay]);

  // Fetch signup reasons on mount
  useEffect(() => {
    const fetchReasons = async () => {
      const { data } = await supabase
        .from('signup_reasons')
        .select('id, reason_text, is_other')
        .order('display_order');
      if (data) setAvailableReasons(data);
    };
    fetchReasons();
  }, []);

  useEffect(() => {
    if (user && isOpen) {
      // Pre-fill with any data from OAuth metadata
      const metadata = user.user_metadata || {};
      setFormData(prev => ({
        ...prev,
        full_name: metadata.full_name || metadata.name || '',
      }));

      // Fetch existing profile to check if account_type is already set
      const fetchExistingProfile = async () => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('account_type, full_name, birth_date, gender, country, city, phone, job_title, company, bio, interests, languages, skills')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          // Lock account type if already set
          if (profile.account_type) {
            setAccountTypeLocked(true);
            setFormData(prev => ({
              ...prev,
              account_type: profile.account_type,
            }));
          }
          // Pre-fill other existing data
          if (profile.full_name) {
            setFormData(prev => ({ ...prev, full_name: profile.full_name }));
          }
          if (profile.gender) {
            setFormData(prev => ({ ...prev, gender: profile.gender }));
          }
          if (profile.country) {
            const countryData = countriesWithCodes.find(c => c.name === profile.country);
            setFormData(prev => ({ 
              ...prev, 
              country: profile.country,
              phone_country_code: countryData?.code || ''
            }));
          }
          if (profile.city) {
            setFormData(prev => ({ ...prev, city: profile.city }));
          }
          if (profile.birth_date) {
            setFormData(prev => ({ ...prev, birth_date: profile.birth_date }));
            // Parse existing birth date to set dropdowns
            const [year, month, day] = profile.birth_date.split('-');
            setBirthYear(year || '');
            setBirthMonth(month || '');
            setBirthDay(day || '');
          }
          if (profile.phone) {
            // Extract phone number without country code
            const phoneMatch = profile.phone?.match(/^\+\d+\s*(.*)$/);
            if (phoneMatch) {
              setFormData(prev => ({ ...prev, phone: phoneMatch[1] }));
            } else {
              setFormData(prev => ({ ...prev, phone: profile.phone || '' }));
            }
          }
          // Step 2 data
          if (profile.job_title) {
            setFormData(prev => ({ ...prev, job_title: profile.job_title }));
          }
          if (profile.company) {
            setFormData(prev => ({ ...prev, company: profile.company }));
          }
          if (profile.bio) {
            setFormData(prev => ({ ...prev, bio: profile.bio }));
          }
          if (profile.interests && Array.isArray(profile.interests)) {
            setFormData(prev => ({ ...prev, interests: profile.interests }));
          }
          if (profile.languages && Array.isArray(profile.languages)) {
            setFormData(prev => ({ ...prev, languages: profile.languages as Array<{language: string, level: number}> }));
          }
          if (profile.skills && Array.isArray(profile.skills)) {
            setFormData(prev => ({ ...prev, skills: profile.skills }));
          }
        }
      };

      fetchExistingProfile();
    }
  }, [user, isOpen]);

  const handleCountryChange = (country: string) => {
    const countryData = countriesWithCodes.find(c => c.name === country);
    setFormData(prev => ({
      ...prev,
      country,
      phone_country_code: countryData?.code || '',
    }));
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const addLanguage = () => {
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, { language: '', level: 3 }]
    }));
  };

  const updateLanguage = (index: number, field: 'language' | 'level', value: string | number) => {
    setFormData(prev => {
      const updatedLanguages = [...prev.languages];
      (updatedLanguages[index] as any)[field] = value;
      return { ...prev, languages: updatedLanguages };
    });
  };

  const removeLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const validateStep1 = () => {
    if (!formData.full_name.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!formData.birth_date) {
      toast.error('Please enter your birth date');
      return false;
    }
    if (calculateAge(formData.birth_date) < 13) {
      toast.error('You must be at least 13 years old to use this platform');
      return false;
    }
    if (!formData.gender) {
      toast.error('Please select your gender');
      return false;
    }
    if (!formData.country) {
      toast.error('Please select your country');
      return false;
    }
    if (!formData.city.trim()) {
      toast.error('Please enter your city');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.job_title.trim()) {
      toast.error('Please enter your job title');
      return false;
    }
    if (!formData.company.trim()) {
      toast.error('Please enter your company');
      return false;
    }
    const validLanguages = formData.languages.filter(lang => lang.language && lang.level);
    if (validLanguages.length === 0) {
      toast.error('Please add at least one language');
      return false;
    }
    if (formData.skills.length < 3) {
      toast.error('Please select at least 3 skills');
      return false;
    }
    if (formData.interests.length < 3) {
      toast.error('Please select at least 3 interests');
      return false;
    }
    if (signupReasons.length === 0) {
      toast.error('Please select at least one reason for joining AI Feed');
      return false;
    }
    // Check if "Other" is selected and text is provided
    const otherReason = availableReasons.find(r => r.is_other);
    if (otherReason && signupReasons.includes(otherReason.id) && !otherReasonText.trim()) {
      toast.error('Please specify your other reason for joining');
      return false;
    }
    return true;
  };

  const handleReasonToggle = (reasonId: number) => {
    setSignupReasons(prev => 
      prev.includes(reasonId)
        ? prev.filter(id => id !== reasonId)
        : [...prev, reasonId]
    );
  };

  // Extract text from file for CV parsing
  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          resolve(content);
        } else if (content instanceof ArrayBuffer) {
          const decoder = new TextDecoder('utf-8', { fatal: false });
          resolve(decoder.decode(content));
        } else {
          reject(new Error('Unable to read file'));
        }
      };
      reader.onerror = reject;
      
      if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  // Handle CV upload and parsing
  const handleCVUploadAndParse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setCVFile(file);
    setCVParsing(true);
    
    try {
      const text = await extractTextFromFile(file);
      
      if (!text || text.trim().length < 50) {
        toast.error('Could not extract enough text from the CV. Please try a different file or fill manually.');
        setFillMethod('manual');
        setStep(1);
        setCVParsing(false);
        return;
      }
      
      // Call parse-cv edge function
      const { data, error } = await supabase.functions.invoke('parse-cv', {
        body: { cvText: text, fileName: file.name }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.data) {
        const parsed = data.data;
        
        // Pre-fill form data with parsed values
        setFormData(prev => ({
          ...prev,
          full_name: parsed.full_name || prev.full_name,
          job_title: parsed.job_title || prev.job_title,
          company: parsed.company || prev.company,
          city: parsed.city || prev.city,
          country: parsed.country || prev.country,
          bio: parsed.bio || prev.bio,
          skills: parsed.skills?.length > 0 ? parsed.skills.filter((s: string) => skillOptions.includes(s) || s) : prev.skills,
          languages: parsed.languages?.length > 0 ? parsed.languages : prev.languages,
        }));
        
        // If country was parsed, try to set the phone code
        if (parsed.country) {
          const countryData = countriesWithCodes.find(c => 
            c.name.toLowerCase() === parsed.country.toLowerCase() ||
            c.name.toLowerCase().includes(parsed.country.toLowerCase())
          );
          if (countryData) {
            setFormData(prev => ({ 
              ...prev, 
              country: countryData.name,
              phone_country_code: countryData.code 
            }));
          }
        }
        
        setParsedFromCV(true);
        toast.success('CV parsed successfully! Please review and complete your profile.');
        setStep(1);
      } else {
        throw new Error('Failed to parse CV');
      }
    } catch (error: any) {
      console.error('CV parsing error:', error);
      toast.error('Failed to parse CV. Please try again or fill manually.');
      setFillMethod('manual');
      setStep(1);
    } finally {
      setCVParsing(false);
    }
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (!validateStep1()) {
      setStep(1);
      return;
    }

    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    try {
      const validLanguages = formData.languages.filter(lang => lang.language && lang.level);
      
      const profileData = {
        id: user.id,
        full_name: formData.full_name.trim(),
        birth_date: formData.birth_date,
        age: calculateAge(formData.birth_date),
        gender: formData.gender,
        country: formData.country,
        city: formData.city.trim(),
        phone: `${formData.phone_country_code} ${formData.phone.trim()}`,
        account_type: formData.account_type,
        // Step 2 fields
        job_title: formData.job_title.trim(),
        company: formData.company.trim(),
        bio: formData.bio.trim() || null,
        interests: formData.interests,
        languages: validLanguages.length > 0 ? validLanguages : null,
        skills: formData.skills.length > 0 ? formData.skills : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (error) throw error;

      // Save signup reasons
      for (const reasonId of signupReasons) {
        const isOther = availableReasons.find(r => r.id === reasonId)?.is_other;
        await supabase.from('user_signup_reasons').insert({
          user_id: user.id,
          reason_id: reasonId,
          other_text: isOther ? otherReasonText : null
        });
      }

      // Upload CV if provided
      if (cvFile) {
        setCVUploading(true);
        const filePath = `${user.id}/${Date.now()}_${cvFile.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('user-cvs')
          .upload(filePath, cvFile);
        
        if (!uploadError) {
          await supabase.from('user_cvs').insert({
            user_id: user.id,
            file_name: cvFile.name,
            file_path: filePath,
            file_size: cvFile.size,
            mime_type: cvFile.type,
            is_primary: true
          });
        }
        setCVUploading(false);
      }

      toast.success('Profile completed successfully!');
      setProfileComplete(true);
    } catch (error: any) {
      console.error('Error completing profile:', error);
      toast.error(error.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getDialogDescription = () => {
    if (step === 0 && fillMethod === 'choose') {
      return 'Choose how you would like to complete your profile.';
    }
    if (step === 0 && fillMethod === 'cv') {
      return 'Upload your CV to automatically fill in your information.';
    }
    if (step === 1) {
      return parsedFromCV 
        ? 'Some fields have been pre-filled from your CV. Please review and complete any missing information.'
        : 'Please provide some basic information to complete your account setup.';
    }
    return 'Tell us more about yourself, your skills, and interests.';
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#091527] border border-gray-200 dark:border-gray-700 rounded-2xl" 
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-gray-100">
            <User className="h-5 w-5 text-primary" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator - only show after method selection */}
        {step > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
              step >= 1 ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            )}>
              1
            </div>
            <div className={cn(
              "flex-1 h-1 rounded transition-colors",
              step >= 2 ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
            )} />
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
              step >= 2 ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            )}>
              2
            </div>
          </div>
        )}

        {/* Pre-filled from CV notice */}
        {step === 1 && parsedFromCV && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Some fields have been pre-filled from your CV. Please review and complete any missing information.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Step 0: Choose Method */}
          {step === 0 && fillMethod === 'choose' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">How would you like to complete your profile?</h3>
                <p className="text-sm text-muted-foreground">
                  You can upload your CV to automatically fill in your information, or enter it manually.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Upload CV Option */}
                <button
                  type="button"
                  onClick={() => setFillMethod('cv')}
                  className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary transition-all text-center group"
                >
                  <Upload className="h-10 w-10 mx-auto text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-medium mb-1 text-gray-900 dark:text-gray-100">Upload Your CV</h4>
                  <p className="text-sm text-muted-foreground">
                    Auto-fill your profile by uploading your resume
                  </p>
                </button>
                
                {/* Manual Entry Option */}
                <button
                  type="button"
                  onClick={() => { setFillMethod('manual'); setStep(1); }}
                  className="p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary transition-all text-center group"
                >
                  <PenLine className="h-10 w-10 mx-auto text-muted-foreground mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-medium mb-1 text-gray-900 dark:text-gray-100">Fill Manually</h4>
                  <p className="text-sm text-muted-foreground">
                    Enter your information step by step
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step 0: CV Upload */}
          {step === 0 && fillMethod === 'cv' && (
            <div className="space-y-6">
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                onClick={() => setFillMethod('choose')}
                className="mb-2"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              
              <div className="text-center space-y-2">
                <FileText className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Upload Your CV</h3>
                <p className="text-sm text-muted-foreground">
                  We'll extract your information automatically. You can review and edit before submitting.
                </p>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCVUploadAndParse}
                  className="hidden"
                  id="cv-upload-parse"
                  disabled={cvParsing}
                />
                <label htmlFor="cv-upload-parse" className={cn("cursor-pointer", cvParsing && "cursor-wait")}>
                  {cvParsing ? (
                    <div className="space-y-2">
                      <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Analyzing your CV...</p>
                      <p className="text-xs text-muted-foreground">This may take a few seconds</p>
                    </div>
                  ) : cvFile ? (
                    <div className="space-y-2">
                      <FileText className="h-10 w-10 mx-auto text-primary" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{cvFile.name}</p>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCVFile(null); }}
                      >
                        Choose Different File
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="font-medium text-gray-900 dark:text-gray-100">Click to upload</p>
                      <p className="text-sm text-muted-foreground">PDF, DOC, or DOCX (max 10MB)</p>
                    </>
                  )}
                </label>
              </div>
              
              <Button 
                type="button"
                onClick={() => { setFillMethod('manual'); setStep(1); }} 
                variant="ghost" 
                className="w-full"
              >
                Or fill in manually instead
              </Button>
            </div>
          )}

          {step === 1 && (
            <>
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-gray-700 dark:text-gray-300">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              {/* Birth Date - Year/Month/Day dropdowns */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Calendar className="h-4 w-4" />
                  Birth Date *
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={birthYear} onValueChange={setBirthYear}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-foreground dark:text-gray-100 rounded-xl">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                      {years.map(year => (
                        <SelectItem key={year} value={year} className="text-gray-900 dark:text-gray-100">{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={birthMonth} onValueChange={setBirthMonth}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-foreground dark:text-gray-100 rounded-xl">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value} className="text-gray-900 dark:text-gray-100">{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={birthDay} onValueChange={setBirthDay}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-foreground dark:text-gray-100 rounded-xl">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                      {days.map(day => (
                        <SelectItem key={day} value={day} className="text-gray-900 dark:text-gray-100">{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-foreground dark:text-gray-100 rounded-xl">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                    {genderOptions.map(gender => (
                      <SelectItem key={gender} value={gender} className="text-gray-900 dark:text-gray-100">{gender}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Country - Searchable */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Globe className="h-4 w-4" />
                  Country *
                </Label>
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={countryOpen}
                      className="w-full justify-between bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-foreground dark:text-gray-100 hover:bg-accent rounded-xl h-10"
                    >
                      {formData.country || "Search and select country..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 z-50" align="start">
                    <Command className="bg-white dark:bg-gray-800">
                      <CommandInput placeholder="Search country..." className="text-gray-900 dark:text-gray-100" />
                      <CommandList>
                        <CommandEmpty className="text-gray-500 dark:text-gray-400 py-6 text-center text-sm">No country found.</CommandEmpty>
                        <CommandGroup>
                          {countriesWithCodes.map(country => (
                            <CommandItem
                              key={country.name}
                              value={country.name}
                              onSelect={() => {
                                handleCountryChange(country.name);
                                setCountryOpen(false);
                              }}
                              className="text-gray-900 dark:text-gray-100"
                            >
                              <Check className={cn("mr-2 h-4 w-4", formData.country === country.name ? "opacity-100" : "opacity-0")} />
                              {country.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <MapPin className="h-4 w-4" />
                  City *
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter your city"
                  className="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Phone className="h-4 w-4" />
                  Phone Number *
                </Label>
                <div className="flex gap-2">
                  <Popover open={phoneCodeOpen} onOpenChange={setPhoneCodeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={phoneCodeOpen}
                        className="w-24 justify-between bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-foreground dark:text-gray-100 rounded-xl"
                      >
                        {formData.phone_country_code || "+1"}
                        <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 z-50">
                      <Command className="bg-white dark:bg-gray-800">
                        <CommandInput placeholder="Search country code..." className="text-gray-900 dark:text-gray-100" />
                        <CommandList>
                          <CommandEmpty className="text-gray-500 dark:text-gray-400 py-6 text-center text-sm">No country found.</CommandEmpty>
                          <CommandGroup>
                            {countriesWithCodes.map((country) => (
                              <CommandItem
                                key={`${country.name}-${country.code}`}
                                value={`${country.name} ${country.code}`}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, phone_country_code: country.code }));
                                  setPhoneCodeOpen(false);
                                }}
                                className="text-gray-900 dark:text-gray-100"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.phone_country_code === country.code ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {country.code} ({country.name})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                    className="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Account Type - Radio Buttons */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  Account Type *
                  {accountTypeLocked && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Lock className="h-3 w-3" />
                      Locked
                    </span>
                  )}
                </Label>
                <RadioGroup 
                  value={formData.account_type}
                  onValueChange={(value) => !accountTypeLocked && setFormData(prev => ({ ...prev, account_type: value }))}
                  disabled={accountTypeLocked}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="creator" id="oauth-creator" disabled={accountTypeLocked} />
                    <Label htmlFor="oauth-creator" className={cn("cursor-pointer", accountTypeLocked && "opacity-60 cursor-not-allowed")}>Creator</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="employer" id="oauth-employer" disabled={accountTypeLocked} />
                    <Label htmlFor="oauth-employer" className={cn("cursor-pointer", accountTypeLocked && "opacity-60 cursor-not-allowed")}>Employer</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button type="button" className="w-full" onClick={handleNextStep}>
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Job Title */}
              <div className="space-y-2">
                <Label htmlFor="job_title" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Briefcase className="h-4 w-4" />
                  Job Title *
                </Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                  placeholder="e.g., Software Engineer, Product Manager"
                  className="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-gray-700 dark:text-gray-300">Company *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Where do you work?"
                  className="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              {/* Languages */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Globe className="h-4 w-4" />
                    Languages * <span className="text-xs text-muted-foreground">({formData.languages.filter(l => l.language).length} added)</span>
                  </Label>
                  <Button type="button" variant="ghost" size="sm" onClick={addLanguage} className="text-primary">
                    + Add Language
                  </Button>
                </div>
                
                {formData.languages.length > 0 ? (
                  <div className="space-y-2">
                    {formData.languages.map((lang, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Select value={lang.language} onValueChange={(v) => updateLanguage(index, 'language', v)}>
                          <SelectTrigger className="flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-xl">
                            <SelectValue placeholder="Select Language" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                            {languageOptions.map(opt => (
                              <SelectItem key={opt} value={opt} className="text-gray-900 dark:text-gray-100">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={lang.level.toString()} onValueChange={(v) => updateLanguage(index, 'level', parseInt(v))}>
                          <SelectTrigger className="w-32 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                            {proficiencyLevels.map(lvl => (
                              <SelectItem key={lvl.value} value={lvl.value.toString()} className="text-gray-900 dark:text-gray-100">{lvl.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLanguage(index)} className="text-destructive">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-muted-foreground">
                    Click "+ Add Language" to add your languages
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Briefcase className="h-4 w-4" />
                  Skills * (minimum 3) <span className="text-xs text-muted-foreground">({formData.skills.length} selected)</span>
                </Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  {skillOptions.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                        formData.skills.includes(skill)
                          ? "bg-primary text-white"
                          : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary/50"
                      )}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-gray-700 dark:text-gray-300">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us a bit about yourself..."
                  className="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Interests */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Sparkles className="h-4 w-4" />
                  Interests * (minimum 3)
                  <span className="text-xs text-muted-foreground ml-1">
                    ({formData.interests.length} selected)
                  </span>
                </Label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  {availableInterests.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                        formData.interests.includes(interest)
                          ? "bg-primary text-white"
                          : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary/50"
                      )}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Why are you joining AI Feed */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <HelpCircle className="h-4 w-4" />
                  Why are you joining AI Feed? * (select all that apply)
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  {availableReasons.map(reason => (
                    <label key={reason.id} className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={signupReasons.includes(reason.id)}
                        onCheckedChange={() => handleReasonToggle(reason.id)}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{reason.reason_text}</span>
                    </label>
                  ))}
                  
                  {/* Show text input when "Other" is selected */}
                  {availableReasons.find(r => r.is_other && signupReasons.includes(r.id)) && (
                    <Input
                      placeholder="Please specify your reason..."
                      value={otherReasonText}
                      onChange={(e) => setOtherReasonText(e.target.value)}
                      className="mt-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl"
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || cvUploading}>
                  {loading || cvUploading ? 'Completing...' : 'Complete Profile'}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
