import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { User, Calendar, MapPin, Phone, Globe, Lock, ChevronsUpDown, Check } from 'lucide-react';
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

const accountTypes = [
  { value: 'creator', label: 'Creator', description: 'For content creators' },
  { value: 'employer', label: 'Employer', description: 'For companies' },
];

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

// Generate years from 1920 to current year - 13 (minimum age)
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 13 - 1920 + 1 }, (_, i) => (currentYear - 13 - i).toString());

export default function OAuthProfileCompletion() {
  const { user, profileComplete, setProfileComplete } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accountTypeLocked, setAccountTypeLocked] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    birth_date: '',
    gender: '',
    country: '',
    city: '',
    phone_country_code: '',
    phone: '',
    account_type: 'creator',
  });

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
          .select('account_type, full_name, birth_date, gender, country, city, phone')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validation
    if (!formData.full_name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!formData.birth_date) {
      toast.error('Please enter your birth date');
      return;
    }
    if (calculateAge(formData.birth_date) < 13) {
      toast.error('You must be at least 13 years old to use this platform');
      return;
    }
    if (!formData.gender) {
      toast.error('Please select your gender');
      return;
    }
    if (!formData.country) {
      toast.error('Please select your country');
      return;
    }
    if (!formData.city.trim()) {
      toast.error('Please enter your city');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
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
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (error) throw error;

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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-background border-border" 
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
            <User className="h-5 w-5 text-primary" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Please provide some additional information to complete your account setup.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-foreground">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter your full name"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          {/* Birth Date - Year/Month/Day dropdowns */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-foreground">
              <Calendar className="h-4 w-4" />
              Birth Date *
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Select value={birthYear} onValueChange={setBirthYear}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-popover border-border">
                  {years.map(year => (
                    <SelectItem key={year} value={year} className="text-popover-foreground">{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={birthMonth} onValueChange={setBirthMonth}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-popover border-border">
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value} className="text-popover-foreground">{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={birthDay} onValueChange={setBirthDay}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-popover border-border">
                  {days.map(day => (
                    <SelectItem key={day} value={day} className="text-popover-foreground">{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-foreground">Gender *</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
              <SelectTrigger className="bg-background border-input text-foreground">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {genderOptions.map(gender => (
                  <SelectItem key={gender} value={gender} className="text-popover-foreground">{gender}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country - Searchable */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-foreground">
              <Globe className="h-4 w-4" />
              Country *
            </Label>
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countryOpen}
                  className="w-full justify-between bg-background border-input text-foreground hover:bg-accent"
                >
                  {formData.country || "Search and select country..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-popover border-border" align="start">
                <Command className="bg-popover">
                  <CommandInput placeholder="Search country..." className="text-foreground" />
                  <CommandList>
                    <CommandEmpty className="text-muted-foreground py-6 text-center text-sm">No country found.</CommandEmpty>
                    <CommandGroup>
                      {countriesWithCodes.map(country => (
                        <CommandItem
                          key={country.name}
                          value={country.name}
                          onSelect={() => {
                            handleCountryChange(country.name);
                            setCountryOpen(false);
                          }}
                          className="text-popover-foreground"
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
            <Label htmlFor="city" className="flex items-center gap-2 text-foreground">
              <MapPin className="h-4 w-4" />
              City *
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Enter your city"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-foreground">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <div className="flex gap-2">
              <Input
                value={formData.phone_country_code}
                className="w-20 bg-muted border-input text-foreground"
                placeholder="+1"
                readOnly
              />
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
                className="flex-1 bg-background border-input text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-foreground">
              Account Type *
              {accountTypeLocked && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Locked
                </span>
              )}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {accountTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => !accountTypeLocked && setFormData(prev => ({ ...prev, account_type: type.value }))}
                  disabled={accountTypeLocked}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    formData.account_type === type.value
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border bg-background hover:border-primary/50'
                  } ${accountTypeLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="font-medium text-foreground">{type.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Completing...' : 'Complete Profile'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
