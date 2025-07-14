import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Upload, Camera, MapPin, Calendar, Users, Building, UserCheck, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [step, setStep] = useState(1); // For multi-step signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  // New required fields
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [accountType, setAccountType] = useState('creator'); // creator, employer
  
  // Languages and skills
  const [languages, setLanguages] = useState<Array<{language: string, level: number}>>([]);

  const { signIn, signUp, resendConfirmation } = useAuth();

  const availableInterests = [
    'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision',
    'AI Ethics', 'Robotics', 'Data Science', 'Neural Networks', 'Generative AI',
    'AI Research', 'AI Startups', 'AI Tools', 'Automation', 'Chatbots',
    'Image Generation', 'Video AI', 'Audio AI', 'Code Assistant', 'Productivity',
    'Writing & Content', 'Data Analysis', 'Business Intelligence', 'Healthcare AI',
    'Finance AI', 'Education AI', 'Gaming AI', 'Art & Creativity', 'Music AI'
  ];

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Spain', 'Italy',
    'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Australia', 'New Zealand',
    'Japan', 'South Korea', 'Singapore', 'India', 'China', 'Brazil', 'Mexico',
    'Argentina', 'Chile', 'South Africa', 'Palestine', 'UAE', 'Switzerland', 'Austria',
    'Belgium', 'Ireland', 'Portugal', 'Poland', 'Czech Republic', 'Hungary', 'Romania',
    'Russia', 'Turkey', 'Greece', 'Croatia', 'Bulgaria', 'Serbia', 'Slovenia',
    'Slovakia', 'Estonia', 'Latvia', 'Lithuania', 'Malta', 'Cyprus', 'Luxembourg',
    'Iceland', 'Thailand', 'Vietnam', 'Philippines', 'Indonesia', 'Malaysia',
    'Bangladesh', 'Pakistan', 'Sri Lanka', 'Nepal', 'Myanmar', 'Cambodia', 'Laos',
    // Arabic Countries
    'Saudi Arabia', 'Egypt', 'Iraq', 'Jordan', 'Lebanon', 'Syria', 'Yemen', 'Kuwait',
    'Qatar', 'Bahrain', 'Oman', 'Libya', 'Tunisia', 'Algeria', 'Morocco', 'Sudan',
    'Somalia', 'Djibouti', 'Comoros', 'Mauritania'
  ];

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
    updatedLanguages[index][field] = value;
    setLanguages(updatedLanguages);
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
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
          if (!fullName || !email || !password || !birthDate || !gender || !country || !city || !accountType) {
            throw new Error('Please fill in all required fields');
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
            ai_nexus_top_voice: false,
            tools_submitted: 0,
            articles_written: 0,
            total_reach: 0,
            total_engagement: 0,
            languages: validLanguages
          });
          if (error) throw error;
          setSuccess('Account created successfully! Please check your email for a confirmation link before signing in.');
          setTimeout(() => {
            setMode('signin');
            setStep(1);
            setSuccess('');
          }, 3000);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-overlay">
      <div className={`bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content ${isOpen ? 'show' : ''}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'signin' ? 'Welcome Back' : 
               step === 1 ? 'Join AI Nexus' : 'Complete Your Profile'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

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
                    <p>• Check your inbox for an email from AI Nexus</p>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signin' || step === 1 ? (
              <>
                {mode === 'signup' && (
                  <>
                    {/* Account Type - PROMINENTLY DISPLAYED */}
                    <div className="animate-slide-up bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
                      <label className="block text-lg font-bold text-gray-900 mb-4 text-center">
                        🚀 Choose Your Account Type
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`group flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          accountType === 'creator' 
                            ? 'border-blue-500 bg-blue-50 shadow-lg' 
                            : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-md'
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
                            <div className="font-bold text-gray-900 text-lg mb-2">Creator</div>
                            <div className="text-sm text-gray-600">
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
                            ? 'border-purple-500 bg-purple-50 shadow-lg' 
                            : 'border-gray-300 bg-white hover:border-purple-300 hover:shadow-md'
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
                            <div className="font-bold text-gray-900 text-lg mb-2">Employer</div>
                            <div className="text-sm text-gray-600">
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
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>

                    {/* Birth Date */}
                    <div className="animate-slide-up">
                      <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="date"
                          id="birthDate"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                          required
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">You must be at least 13 years old</p>
                    </div>

                    {/* Gender - Limited to Male and Female */}
                    <div className="animate-slide-up">
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                        Gender *
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          id="gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
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
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                          Country *
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <select
                            id="country"
                            value={country}
                            onChange={(e) => {
                              setCountry(e.target.value);
                              setCity(''); // Reset city when country changes
                            }}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
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
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <select
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
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

                <div className="animate-slide-up">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="animate-slide-up">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
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
                className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
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
  );
};

export default AuthModal;