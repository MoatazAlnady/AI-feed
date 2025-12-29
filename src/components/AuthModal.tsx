import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Upload, Camera, MapPin, Calendar, Users, Building, UserCheck, Sparkles, AlertCircle, CheckCircle, Chrome } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InputBase, TextareaBase, SelectBase } from '@/components/ui/InputBase';
import OnboardingFlow from './OnboardingFlow';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { getAuthRedirectUrl } from '@/utils/authRedirect';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [step, setStep] = useState(1); // For multi-step signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // New required fields
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [accountType, setAccountType] = useState('creator'); // creator, employer
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Languages and skills
  const [languages, setLanguages] = useState<Array<{language: string, level: number}>>([]);

  // Invitation handling
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteCompanyName, setInviteCompanyName] = useState<string | null>(null);

  const { signIn, signUp, resendConfirmation } = useAuth();

  // Check for invitation token in URL
  useEffect(() => {
    const token = searchParams.get('invite');
    if (token && isOpen) {
      setInviteToken(token);
      fetchInvitationDetails(token);
    }
  }, [searchParams, isOpen]);

  const fetchInvitationDetails = async (token: string) => {
    try {
      const { data } = await supabase
        .from('company_invitations')
        .select(`
          email,
          company_pages (name)
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (data) {
        setEmail(data.email);
        setInviteCompanyName((data.company_pages as any)?.name || null);
      }
    } catch (err) {
      console.error('Failed to fetch invitation:', err);
    }
  };

  const availableInterests = [
    'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision',
    'AI Ethics', 'Robotics', 'Data Science', 'Neural Networks', 'Generative AI',
    'AI Research', 'AI Startups', 'AI Tools', 'Automation', 'Chatbots',
    'Image Generation', 'Video AI', 'Audio AI', 'Code Assistant', 'Productivity',
    'Writing & Content', 'Data Analysis', 'Business Intelligence', 'Healthcare AI',
    'Finance AI', 'Education AI', 'Gaming AI', 'Art & Creativity', 'Music AI'
  ];

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
    { name: 'UAE', code: '+971' },
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
    // Arabic Countries
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
    'Palestine': ['Gaza', 'Ramallah', 'Hebron', 'Nablus', 'Bethlehem', 'Jenin', 'Tulkarm', 'Qalqilya', 'Salfit', 'Jericho', 'Tubas', 'Khan Yunis', 'Rafah', 'Deir al-Balah', 'Beit Lahia', 'Beit Hanoun', 'Jabalya'],
    'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Dhahran', 'Taif', 'Buraidah', 'Tabuk', 'Hail', 'Khamis Mushait', 'Najran', 'Jizan', 'Yanbu', 'Al Jubail', 'Abha', 'Arar', 'Sakaka', 'Al Qatif'],
    'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'El Mahalla El Kubra', 'Tanta', 'Asyut', 'Ismailia', 'Fayyum', 'Zagazig', 'Aswan', 'Damietta', 'Damanhur', 'Minya', 'Beni Suef', 'Hurghada'],
    'Iraq': ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Sulaymaniyah', 'Najaf', 'Karbala', 'Kirkuk', 'Nasiriyah', 'Amarah', 'Diwaniyah', 'Kut', 'Ramadi', 'Fallujah', 'Samarra', 'Baqubah', 'Tikrit', 'Hilla', 'Dohuk', 'Zakho'],
    'Jordan': ['Amman', 'Zarqa', 'Irbid', 'Russeifa', 'Wadi as-Sir', 'Aqaba', 'Madaba', 'As-Salt', 'Mafraq', 'Jerash', 'Karak', 'Tafilah', 'Maan', 'Ajloun', 'Sahab', 'Fuheis', 'Ain al-Basha', 'Qadisiyah', 'Kufranja', 'Jubeiha'],
    'Lebanon': ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Nabatieh', 'Jounieh', 'Zahle', 'Baalbek', 'Byblos', 'Aley', 'Bint Jbeil', 'Marjayoun', 'Jezzine', 'Halba', 'Chekka', 'Anjar', 'Rashaya', 'Hermel', 'Qbayyat', 'Minieh'],
    'Syria': ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Deir ez-Zor', 'Raqqa', 'Daraa', 'Al-Hasakah', 'Qamishli', 'Tartus', 'Idlib', 'Douma', 'As-Suwayda', 'Quneitra', 'Palmyra', 'Manbij', 'Afrin', 'Azaz', 'Jarablus'],
    'Yemen': ['Sanaa', 'Aden', 'Taiz', 'Hodeidah', 'Ibb', 'Dhamar', 'Mukalla', 'Saada', 'Zinjibar', 'Sayyan', 'Zabid', 'Hajjah', 'Sadah', 'Amran', 'Yarim', 'Marib', 'Bayhan', 'Lawdar', 'Ataq', 'Shibam'],
    'Kuwait': ['Kuwait City', 'Hawalli', 'As Salimiyah', 'Sabah as Salim', 'Al Farwaniyah', 'Al Ahmadi', 'Ar Riqqah', 'Ar Rabiyah', 'Al Fahahil', 'Salwa', 'Jaber Al-Ali', 'Mangaf', 'Mahboula', 'Abu Halifa', 'Fintas', 'Fahaheel', 'Al Wafra', 'Kaifan', 'Khaitan', 'Abraq Khaitan'],
    'Qatar': ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah', 'Al Khor', 'Madinat ash Shamal', 'Al Daayen', 'Al Shamal', 'Lusail', 'Mesaieed', 'Dukhan', 'Al Shahaniya', 'Al Thakhira', 'Al Kharrara', 'Simaisma', 'Al Ghuwariyah', 'Fuwayrit', 'Al Jumayliyah', 'Umm Bab', 'Zekreet'],
    'Bahrain': ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'A\'ali', 'Isa Town', 'Sitra', 'Budaiya', 'Jidhafs', 'Al-Malikiyah', 'Sanabis', 'Tubli', 'Barbar', 'Galali', 'Malkiya', 'Karzakan', 'Samaheej', 'Karbabad', 'Duraz', 'Bani Jamra'],
    'Oman': ['Muscat', 'Seeb', 'Salalah', 'Bawshar', 'Sohar', 'As Suwayq', 'Ibri', 'Saham', 'Barka', 'Rustaq', 'Burka', 'Nizwa', 'Sur', 'Bahla', 'Khasab', 'Shinas', 'Izki', 'Jabrin', 'Manah', 'Ibra'],
    'Libya': ['Tripoli', 'Benghazi', 'Misrata', 'Tarhuna', 'Al Bayda', 'Zawiya', 'Zliten', 'Ajdabiya', 'Tobruk', 'Sabha', 'Derna', 'Sirte', 'Gharyan', 'Kufra', 'Marj', 'Bani Walid', 'Sabratha', 'Sorman', 'Zuwara', 'Murzuq'],
    'Tunisia': ['Tunis', 'Sfax', 'Sousse', 'Ettadhamen', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa', 'Monastir', 'Ben Arous', 'Kasserine', 'Médenine', 'Nabeul', 'Tataouine', 'Béja', 'Jendouba', 'Mahdia', 'Siliana', 'Manouba'],
    'Algeria': ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Djelfa', 'Sétif', 'Sidi Bel Abbès', 'Biskra', 'Tébessa', 'El Oued', 'Skikda', 'Tiaret', 'Béjaïa', 'Tlemcen', 'Ouargla', 'Béchar', 'Mostaganem', 'Bordj Bou Arréridj'],
    'Morocco': ['Casablanca', 'Rabat', 'Fez', 'Marrakech', 'Agadir', 'Tangier', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Safi', 'Mohammedia', 'Khouribga', 'El Jadida', 'Beni Mellal', 'Nador', 'Taza', 'Settat', 'Berrechid', 'Khemisset'],
    'Sudan': ['Khartoum', 'Omdurman', 'Khartoum North', 'Nyala', 'Port Sudan', 'Kassala', 'Al-Ubayyid', 'Kosti', 'Wad Madani', 'El Fasher', 'Atbara', 'Dongola', 'Malakal', 'El Geneina', 'Rabak', 'Geneina', 'Kadugli', 'El Daein', 'Sennar', 'Zalingei'],
    'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Kalba', 'Dibba Al-Fujairah', 'Dibba Al-Hisn', 'Madinat Zayed', 'Liwa Oasis', 'Ghayathi', 'Ruwais', 'Jebel Ali', 'Al Dhafra', 'Hatta', 'Masafi'],
    'Somalia': ['Mogadishu', 'Hargeisa', 'Bosaso', 'Kismayo', 'Merca', 'Galcaio', 'Baidoa', 'Garowe', 'Berbera', 'Burao', 'Las Anod', 'Erigavo', 'Galkayo', 'Beledweyne', 'Jowhar', 'Luuq', 'Hudur', 'Qardho', 'Borama', 'Zeila'],
    'Djibouti': ['Djibouti City', 'Ali Sabieh', 'Dikhil', 'Tadjourah', 'Obock', 'Arta', 'Holhol', 'Yoboki', 'As Eyla', 'Balho', 'Galafi', 'Loyada', 'Randa', 'Sagallou', 'Khor Angar', 'Dorale', 'Damerjog', 'Airolaf', 'Assamo', 'Gobaad'],
    'Comoros': ['Moroni', 'Mutsamudu', 'Fomboni', 'Domoni', 'Sima', 'Mitsoudje', 'Ouani', 'Adda-Douéni', 'Tsémbéhou', 'Koni-Djodjo', 'Mirontsy', 'Nioumachoua', 'Mbéni', 'Iconi', 'Mitsamiouli', 'Foumbouni', 'Salamani', 'Chindini', 'Vouvouni', 'Bandamadji'],
    'Mauritania': ['Nouakchott', 'Nouadhibou', 'Néma', 'Kaédi', 'Zouérat', 'Rosso', 'Atar', 'Adel Bagrou', 'Aleg', 'Boutilimit', 'Tidjikja', 'Akjoujt', 'Kiffa', 'Sélibaby', 'Aioun', 'Bogué', 'Chinguetti', 'Ouadane', 'Tichitt', 'Oualata']
  };

  // Updated gender options - only Male and Female
  const genderOptions = ['Male', 'Female'];

  // Language options
  const languageOptions = [
    'English', 'Arabic', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
    'Chinese (Mandarin)', 'Japanese', 'Korean', 'Hindi', 'Bengali', 'Urdu', 'Turkish',
    'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian'
  ];

  // Proficiency levels
  const proficiencyLevels = [
    { value: 1, label: 'Beginner' },
    { value: 2, label: 'Elementary' },
    { value: 3, label: 'Intermediate' },
    { value: 4, label: 'Advanced' },
    { value: 5, label: 'Native/Fluent' }
  ];

  const handleInterestToggle = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resendConfirmation(email);
      if (error) throw error;
      setSuccess('Confirmation email sent! Please check your inbox and spam folder.');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addLanguage = () => {
    setLanguages([...languages, { language: '', level: 3 }]);
  };

  const updateLanguage = (index: number, field: 'language' | 'level', value: string | number) => {
    const updatedLanguages = [...languages];
    (updatedLanguages[index] as any)[field] = value;
    setLanguages(updatedLanguages);
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleCountryChange = (selectedCountry: string) => {
    setCountry(selectedCountry);
    const countryData = countriesWithCodes.find(c => c.name === selectedCountry);
    if (countryData) {
      setPhoneCountryCode(countryData.code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setShowEmailConfirmation(false);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          // Handle specific email confirmation error
          if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
            setShowEmailConfirmation(true);
            setError('Please confirm your email address before signing in. Check your inbox (and spam folder) for the confirmation email.');
            return;
          }
          throw error;
        }
        onClose();
      } else {
        if (step === 1) {
          // Basic info validation
          if (!fullName || !email || !password || !confirmPassword || !birthDate || !gender || !country || !city || !accountType || !phoneNumber) {
            throw new Error('Please fill in all required fields including phone number and password confirmation');
          }
          
          // Password confirmation validation
          if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
          }
          
          // Age validation (must be 13+)
          const age = calculateAge(birthDate);
          if (age < 13) {
            throw new Error('You must be at least 13 years old to create an account');
          }
          
          setStep(2);
          setLoading(false);
          return;
        } else if (step === 2) {
          // Languages validation
          const validLanguages = languages.filter(lang => lang.language && lang.level);
          
          // Complete signup with profile data
          const { error } = await signUp(email, password, {
            full_name: fullName,
            job_title: jobTitle,
            company: company,
            bio: bio,
            interests: interests,
            profile_photo: profilePhoto ? URL.createObjectURL(profilePhoto) : null,
            birth_date: birthDate,
            age: calculateAge(birthDate),
            gender: gender,
            country: country,
            city: city,
            account_type: accountType,
            location: `${city}, ${country}`,
            verified: false,
            ai_feed_top_voice: false,
            tools_submitted: 0,
            articles_written: 0,
            total_reach: 0,
            total_engagement: 0,
            languages: validLanguages,
            phone: phoneNumber,
            phone_country_code: phoneCountryCode
          });
          if (error) throw error;
          
          // If employer account, redirect to employer onboarding after a short delay
          if (accountType === 'employer') {
            setSuccess('Account created! Redirecting to employer setup...');
            setTimeout(() => {
              onClose();
              navigate('/employer/onboarding');
            }, 2000);
          } else if (inviteToken) {
            // If there's an invitation token, redirect to accept it
            setSuccess('Account created! Redirecting to accept invitation...');
            setTimeout(() => {
              onClose();
              navigate(`/invite/${inviteToken}`);
            }, 2000);
          } else {
            setSuccess('Account created successfully! Please check your email for a confirmation link before signing in.');
            setTimeout(() => {
              setMode('signin');
              setStep(1);
              setSuccess('');
            }, 3000);
          }
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setJobTitle('');
    setCompany('');
    setBio('');
    setInterests([]);
    setProfilePhoto(null);
    setBirthDate('');
    setGender('');
    setCountry('');
    setCity('');
    setAccountType('creator');
    setLanguages([]);
    setPhoneCountryCode('+1');
    setPhoneNumber('');
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowEmailConfirmation(false);
    setStep(1);
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-overlay">
        <div className={`bg-white dark:bg-[#091527] rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content border border-gray-200 dark:border-gray-700 ${isOpen ? 'show' : ''}`}>
        <div className="p-6">
          {/* Header */}
          <header className="flex w-full items-center justify-center py-6 relative">
            <h2 className="text-xl font-semibold text-foreground dark:text-foreground">
              {mode === 'signin' ? 'Sign in to AI Feed' : 
               step === 1 ? 'Join AI Feed' : 'Complete Your Profile'}
            </h2>
            <button
              onClick={onClose}
              className="absolute right-0 p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </header>

          {/* Invitation banner */}
          {inviteCompanyName && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-center">
                <span className="text-muted-foreground">You've been invited to join </span>
                <strong className="text-foreground">{inviteCompanyName}</strong>
              </p>
            </div>
          )}

          {/* Progress indicator for signup */}
          {mode === 'signup' && (
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  step >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <div className={`flex-1 h-1 rounded transition-all duration-300 ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  step >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>Basic Info</span>
                <span>Profile & Interests</span>
              </div>
            </div>
          )}

          {/* Email Confirmation Notice */}
          {showEmailConfirmation && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-slide-up">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2">Email Confirmation Required</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Before you can sign in, you need to confirm your email address. We've sent a confirmation link to <strong>{email}</strong>.
                  </p>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p>• Check your inbox for an email from AI Feed</p>
                    <p>• Don't forget to check your spam/junk folder</p>
                    <p>• Click the confirmation link in the email</p>
                    <p>• Then return here to sign in</p>
                  </div>
                  <button
                    onClick={handleResendConfirmation}
                    disabled={loading}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium underline disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Resend confirmation email'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg animate-slide-up flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-slide-up flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* OAuth Buttons - shown for both modes, but not on step 2 of signup */}
          {(mode === 'signin' || (mode === 'signup' && step === 1)) && (
            <div className="mb-4">
              {/* Row 1: Google and LinkedIn */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {/* Google */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 py-5"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError('');
                      // Clear any existing session before OAuth to prevent stale session issues on mobile
                      await supabase.auth.signOut({ scope: 'local' });
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: getAuthRedirectUrl('/')
                        }
                      });
                      if (error) throw error;
                    } catch (err: any) {
                      setError(err.message || 'Failed to sign in with Google');
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="hidden sm:inline">Google</span>
                </Button>

                {/* LinkedIn */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 py-5"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError('');
                      // Clear any existing session before OAuth to prevent stale session issues on mobile
                      await supabase.auth.signOut({ scope: 'local' });
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'linkedin_oidc',
                        options: {
                          redirectTo: getAuthRedirectUrl('/')
                        }
                      });
                      if (error) throw error;
                    } catch (err: any) {
                      setError(err.message || 'Failed to sign in with LinkedIn');
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="hidden sm:inline">LinkedIn</span>
                </Button>
              </div>

              {/* Row 2: Discord and GitHub */}
              <div className="grid grid-cols-2 gap-2">
                {/* Discord */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 py-5"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError('');
                      // Clear any existing session before OAuth to prevent stale session issues on mobile
                      await supabase.auth.signOut({ scope: 'local' });
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'discord',
                        options: {
                          redirectTo: getAuthRedirectUrl('/')
                        }
                      });
                      if (error) throw error;
                    } catch (err: any) {
                      setError(err.message || 'Failed to sign in with Discord');
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#5865F2">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                  </svg>
                  <span className="hidden sm:inline">Discord</span>
                </Button>

                {/* GitHub */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 py-5"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError('');
                      // Clear any existing session before OAuth to prevent stale session issues on mobile
                      await supabase.auth.signOut({ scope: 'local' });
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'github',
                        options: {
                          redirectTo: getAuthRedirectUrl('/')
                        }
                      });
                      if (error) throw error;
                    } catch (err: any) {
                      setError(err.message || 'Failed to sign in with GitHub');
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="hidden sm:inline">GitHub</span>
                </Button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-[#091527] px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signin' || step === 1 ? (
              <>
                {mode === 'signup' && (
                  <>
                    {/* Account Type - PROMINENTLY DISPLAYED */}
                    <div className="animate-slide-up bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl border-2 border-blue-200 dark:border-gray-600">
                      <label className="block text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
                        🚀 Choose Your Account Type
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`group flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          accountType === 'creator' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400 shadow-lg' 
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-400 hover:shadow-md'
                        }`}>
                          <input
                            type="radio"
                            name="accountType"
                            value="creator"
                            checked={accountType === 'creator'}
                            onChange={(e) => setAccountType(e.target.value)}
                            className="sr-only"
                          />
                          <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${
                            accountType === 'creator' ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-blue-400'
                          }`}>
                            <Sparkles className="h-8 w-8 text-white" />
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2">Creator</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              • Access all AI tools
                              <br />
                              • Join community discussions
                              <br />
                              • Submit tools & articles
                              <br />
                              • Save favorites & analytics
                            </div>
                          </div>
                        </label>
                        
                        <label className={`group flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          accountType === 'employer' 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-400 shadow-lg' 
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-400 hover:shadow-md'
                        }`}>
                          <input
                            type="radio"
                            name="accountType"
                            value="employer"
                            checked={accountType === 'employer'}
                            onChange={(e) => setAccountType(e.target.value)}
                            className="sr-only"
                          />
                          <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${
                            accountType === 'employer' ? 'bg-purple-500' : 'bg-gray-300 group-hover:bg-purple-400'
                          }`}>
                            <Building className="h-8 w-8 text-white" />
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2">Employer</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              • Post job opportunities
                              <br />
                              • Search talent database
                              <br />
                              • Advanced filtering
                              <br />
                              • Employer dashboard
                            </div>
                          </div>
                        </label>
                      </div>
                      
                      {/* Visual indicator of selection */}
                      <div className="mt-4 text-center">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          accountType === 'creator' 
                            ? 'bg-blue-100 text-blue-800' 
                            : accountType === 'employer'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {accountType === 'creator' && (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Creator Account Selected
                            </>
                          )}
                          {accountType === 'employer' && (
                            <>
                              <Building className="h-4 w-4 mr-2" />
                              Employer Account Selected
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="animate-slide-up">
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>

                    {/* Birth Date */}
                    <div className="animate-slide-up">
                      <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date of Birth *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="date"
                          id="birthDate"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                          required
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">You must be at least 13 years old</p>
                    </div>

                    {/* Gender - Limited to Male and Female */}
                    <div className="animate-slide-up">
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gender *
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          id="gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                          required
                        >
                          <option value="">Select gender</option>
                          {genderOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Location - Fixed city selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Country *
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <select
                            id="country"
                            value={country}
                            onChange={(e) => handleCountryChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                            required
                          >
                            <option value="">Select country</option>
                            {countries.map((countryOption) => (
                              <option key={countryOption} value={countryOption}>
                                {countryOption}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          City *
                        </label>
                        <select
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                          required
                          disabled={!country}
                        >
                          <option value="">Select city</option>
                          {country && cities[country as keyof typeof cities]?.map((cityOption) => (
                            <option key={cityOption} value={cityOption}>
                              {cityOption}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {mode === 'signup' && (
                  <div className="animate-slide-up">
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number *
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="col-span-2">
                        <select
                          value={phoneCountryCode}
                          onChange={(e) => setPhoneCountryCode(e.target.value)}
                          className="w-full px-3 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        >
                          {countriesWithCodes.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.code} ({country.name})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="tel"
                          id="phoneNumber"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter phone number"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="animate-slide-up">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="animate-slide-up">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {mode === 'signup' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 6 characters long
                    </p>
                  )}
                </div>

                {mode === 'signup' && (
                  <div className="animate-slide-up">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        placeholder="Confirm your password"
                        required
                        minLength={6}
                      />
                    </div>
                    {password && confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Step 2: Profile & Interests */
              <>
                {/* Profile Photo */}
                <div className="text-center mb-6 animate-slide-up">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
                      {profilePhoto ? (
                        <img
                          src={URL.createObjectURL(profilePhoto)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="profilePhoto"
                      className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full cursor-pointer hover:bg-primary-600 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                    </label>
                    <input
                      type="file"
                      id="profilePhoto"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Upload your profile photo</p>
                </div>

                {/* Professional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title {accountType === 'employer' && '*'}
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder={accountType === 'employer' ? 'e.g., HR Manager, Recruiter' : 'e.g., AI Engineer'}
                      required={accountType === 'employer'}
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                      Company {accountType === 'employer' && '*'}
                    </label>
                    <input
                      type="text"
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., OpenAI, Google, Microsoft"
                      required={accountType === 'employer'}
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="animate-slide-up">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all duration-200"
                    placeholder={
                      accountType === 'employer' 
                        ? 'Tell us about your company and what kind of talent you\'re looking for...'
                        : 'Tell us about yourself and your AI interests...'
                    }
                  />
                </div>

                {/* Languages */}
                <div className="animate-slide-up">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Languages
                    </label>
                    <button
                      type="button"
                      onClick={addLanguage}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add Language
                    </button>
                  </div>
                  
                  {languages.length > 0 ? (
                    <div className="space-y-3">
                      {languages.map((lang, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <select
                            value={lang.language}
                            onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Select Language</option>
                            {languageOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          
                          <select
                            value={lang.level}
                            onChange={(e) => updateLanguage(index, 'level', parseInt(e.target.value))}
                            className="w-40 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            {proficiencyLevels.map(level => (
                              <option key={level.value} value={level.value}>{level.label}</option>
                            ))}
                          </select>
                          
                          <button
                            type="button"
                            onClick={() => removeLanguage(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 border border-dashed border-gray-300 rounded-lg">
                      <p className="text-sm text-gray-500">No languages added yet</p>
                    </div>
                  )}
                </div>

                {/* Interests */}
                <div className="animate-slide-up">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Your Interests (Choose at least 3)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {availableInterests.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleInterestToggle(interest)}
                        className={`p-2 text-sm rounded-lg border transition-all duration-200 ${
                          interests.includes(interest)
                            ? 'bg-primary-500 text-white border-primary-500 transform scale-105'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {interests.length} interests
                  </p>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex space-x-3 animate-slide-up">
              {mode === 'signup' && step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                >
                  Back
                </button>
              )}
              
              <button
                type="submit"
                disabled={loading || (mode === 'signup' && step === 2 && interests.length < 3)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white dark:text-white py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg border-0"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>
                      {mode === 'signin' ? 'Signing In...' : 
                       step === 1 ? 'Next...' : 'Creating Account...'}
                    </span>
                  </div>
                ) : (
                  mode === 'signin' ? 'Sign In' : 
                  step === 1 ? 'Next' : 'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Switch Mode */}
          <div className="mt-6 text-center animate-slide-up">
            <p className="text-gray-600">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={switchMode}
                className="ml-1 text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
        </div>
      </div>
      
      <OnboardingFlow
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => {
          setShowOnboarding(false);
          onClose();
        }}
      />
    </>
  );
};

export default AuthModal;