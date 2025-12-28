import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Calendar, MapPin, Phone, Globe } from 'lucide-react';

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

export default function OAuthProfileCompletion() {
  const { user, profileComplete, setProfileComplete } = useAuth();
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (user && isOpen) {
      // Pre-fill with any data from OAuth metadata
      const metadata = user.user_metadata || {};
      setFormData(prev => ({
        ...prev,
        full_name: metadata.full_name || metadata.name || '',
      }));
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
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: formData.full_name.trim(),
          birth_date: formData.birth_date,
          age: calculateAge(formData.birth_date),
          gender: formData.gender,
          country: formData.country,
          city: formData.city.trim(),
          phone: `${formData.phone_country_code} ${formData.phone.trim()}`,
          account_type: formData.account_type,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-primary" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Please provide some additional information to complete your account setup.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <Label htmlFor="birth_date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Birth Date *
            </Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label>Gender *</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map(gender => (
                  <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Country *
            </Label>
            <Select value={formData.country} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {countriesWithCodes.map(country => (
                  <SelectItem key={country.name} value={country.name}>{country.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              City *
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Enter your city"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <div className="flex gap-2">
              <Input
                value={formData.phone_country_code}
                className="w-20"
                placeholder="+1"
                readOnly
              />
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
                className="flex-1"
                required
              />
            </div>
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label>Account Type *</Label>
            <div className="grid grid-cols-2 gap-3">
              {accountTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, account_type: type.value }))}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    formData.account_type === type.value
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
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
