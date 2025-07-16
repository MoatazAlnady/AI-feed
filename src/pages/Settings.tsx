import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  MapPin, 
  Briefcase, 
  Globe, 
  Bell, 
  Shield, 
  Trash2, 
  Save,
  Upload,
  Plus,
  Minus,
  Calendar,
  Users,
  GraduationCap,
  Award,
  FileText,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  ExternalLink,
  Building,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Language {
  language: string;
  level: number;
}

interface Skill {
  skill: string;
  level: number;
}

interface WorkExperience {
  company: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate: string;
  credentialId: string;
  credentialUrl: string;
}

interface Achievement {
  title: string;
  description: string;
  date: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'privacy' | 'delete'>('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    jobTitle: user?.user_metadata?.job_title || '',
    company: user?.user_metadata?.company || '',
    bio: user?.user_metadata?.bio || '',
    country: user?.user_metadata?.country || '',
    city: user?.user_metadata?.city || '',
    birthDate: user?.user_metadata?.birth_date || '',
    gender: user?.user_metadata?.gender || '',
    website: user?.user_metadata?.website || '',
    github: user?.user_metadata?.github || '',
    linkedin: user?.user_metadata?.linkedin || '',
    twitter: user?.user_metadata?.twitter || '',
    instagram: user?.user_metadata?.instagram || '',
    youtube: user?.user_metadata?.youtube || ''
  });
  
  // Languages
  const [languages, setLanguages] = useState<Language[]>(
    user?.user_metadata?.languages || []
  );
  
  // Skills
  const [skills, setSkills] = useState<Skill[]>(
    user?.user_metadata?.skills || []
  );
  
  // Work experience
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>(
    user?.user_metadata?.work_experience || []
  );
  
  // Education
  const [education, setEducation] = useState<Education[]>(
    user?.user_metadata?.education || []
  );
  
  // Certifications
  const [certifications, setCertifications] = useState<Certification[]>(
    user?.user_metadata?.certifications || []
  );
  
  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>(
    user?.user_metadata?.achievements || []
  );
  
  // Account settings
  const [accountData, setAccountData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    newFollowers: true,
    mentions: true,
    comments: true,
    likes: true,
    messages: true,
    toolUpdates: true,
    weeklyDigest: true
  });
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showLocation: true,
    allowMessaging: true,
    showActivity: true,
    showFollowers: true,
    showFollowing: true
  });

  // Available options
  const languageOptions = [
    'English', 'Arabic', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
    'Chinese (Mandarin)', 'Japanese', 'Korean', 'Hindi', 'Bengali', 'Urdu', 'Turkish',
    'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian'
  ];

  const skillOptions = [
    'Machine Learning', 'Deep Learning', 'Python', 'JavaScript', 'React', 'Node.js',
    'Data Science', 'AI Research', 'Computer Vision', 'NLP', 'TensorFlow', 'PyTorch',
    'AWS', 'Azure', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'PostgreSQL',
    'Product Management', 'UI/UX Design', 'DevOps', 'Blockchain', 'Cybersecurity'
  ];

  const proficiencyLevels = [
    { value: 1, label: 'Beginner' },
    { value: 2, label: 'Elementary' },
    { value: 3, label: 'Intermediate' },
    { value: 4, label: 'Advanced' },
    { value: 5, label: 'Expert' }
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

  const cities: Record<string, string[]> = {
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

  const genderOptions = ['Male', 'Female'];

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  // Add language
  const addLanguage = () => {
    setLanguages([...languages, { language: '', level: 3 }]);
  };

  // Update language
  const updateLanguage = (index: number, field: 'language' | 'level', value: string | number) => {
    const updatedLanguages = [...languages];
    updatedLanguages[index] = { ...updatedLanguages[index], [field]: value };
    setLanguages(updatedLanguages);
  };

  // Remove language
  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  // Add skill
  const addSkill = () => {
    setSkills([...skills, { skill: '', level: 3 }]);
  };

  // Update skill
  const updateSkill = (index: number, field: 'skill' | 'level', value: string | number) => {
    const updatedSkills = [...skills];
    updatedSkills[index] = { ...updatedSkills[index], [field]: value };
    setSkills(updatedSkills);
  };

  // Remove skill
  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // Add work experience
  const addWorkExperience = () => {
    setWorkExperience([...workExperience, {
      company: '',
      jobTitle: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    }]);
  };

  // Update work experience
  const updateWorkExperience = (index: number, field: string, value: string | boolean) => {
    const updatedWorkExperience = [...workExperience];
    updatedWorkExperience[index] = { ...updatedWorkExperience[index], [field]: value };
    setWorkExperience(updatedWorkExperience);
  };

  // Remove work experience
  const removeWorkExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };

  // Add education
  const addEducation = () => {
    setEducation([...education, {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      current: false
    }]);
  };

  // Update education
  const updateEducation = (index: number, field: string, value: string | boolean) => {
    const updatedEducation = [...education];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setEducation(updatedEducation);
  };

  // Remove education
  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Add certification
  const addCertification = () => {
    setCertifications([...certifications, {
      name: '',
      issuingOrganization: '',
      issueDate: '',
      expirationDate: '',
      credentialId: '',
      credentialUrl: ''
    }]);
  };

  // Update certification
  const updateCertification = (index: number, field: string, value: string) => {
    const updatedCertifications = [...certifications];
    updatedCertifications[index] = { ...updatedCertifications[index], [field]: value };
    setCertifications(updatedCertifications);
  };

  // Remove certification
  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // Add achievement
  const addAchievement = () => {
    setAchievements([...achievements, {
      title: '',
      description: '',
      date: ''
    }]);
  };

  // Update achievement
  const updateAchievement = (index: number, field: string, value: string) => {
    const updatedAchievements = [...achievements];
    updatedAchievements[index] = { ...updatedAchievements[index], [field]: value };
    setAchievements(updatedAchievements);
  };

  // Remove achievement
  const removeAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  // Handle account form changes
  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountData(prev => ({ ...prev, [name]: value }));
  };

  // Handle notification settings changes
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({ ...prev, [name]: checked }));
  };

  // Handle privacy settings changes
  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setPrivacySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // In real app, update via API
      // await fetch('/api/user/profile', {
      //   method: 'PUT',
      //   body: JSON.stringify({
      //     ...profileData,
      //     languages,
      //     skills,
      //     workExperience,
      //     education,
      //     certifications,
      //     achievements
      //   })
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save account changes
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate passwords
      if (accountData.newPassword && accountData.newPassword !== accountData.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      // In real app, update via API
      // await fetch('/api/user/account', {
      //   method: 'PUT',
      //   body: JSON.stringify(accountData)
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Account settings updated successfully!');
      setAccountData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error: any) {
      console.error('Error updating account:', error);
      setError(error.message || 'Failed to update account settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save notification settings
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // In real app, update via API
      // await fetch('/api/user/notifications', {
      //   method: 'PUT',
      //   body: JSON.stringify(notificationSettings)
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Notification preferences updated successfully!');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setError('Failed to update notification preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save privacy settings
  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // In real app, update via API
      // await fetch('/api/user/privacy', {
      //   method: 'PUT',
      //   body: JSON.stringify(privacySettings)
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Privacy settings updated successfully!');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      setError('Failed to update privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // In real app, delete via API
      // await fetch('/api/user/account', {
      //   method: 'DELETE'
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Account Settings
          </h1>
          <p className="text-xl text-gray-600">
            Manage your profile, account settings, and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'account'
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5" />
                    <span>Account</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'privacy'
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5" />
                    <span>Privacy</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('delete')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'delete'
                      ? 'bg-red-50 text-red-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Trash2 className="h-5 w-5" />
                    <span>Delete Account</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Success Message */}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>{success}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile}>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={profileData.fullName}
                            onChange={handleProfileChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Your full name"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="date"
                            id="birthDate"
                            name="birthDate"
                            value={profileData.birthDate}
                            onChange={handleProfileChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <select
                            id="gender"
                            name="gender"
                            value={profileData.gender}
                            onChange={handleProfileChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <select
                            id="country"
                            name="country"
                            value={profileData.country}
                            onChange={handleProfileChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Select country</option>
                            {countries.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <select
                        id="city"
                        name="city"
                        value={profileData.city}
                        onChange={handleProfileChange}
                        disabled={!profileData.country}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">Select city</option>
                        {profileData.country && cities[profileData.country]?.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                          Job Title
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            id="jobTitle"
                            name="jobTitle"
                            value={profileData.jobTitle}
                            onChange={handleProfileChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="e.g., AI Engineer"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                          Company
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            id="company"
                            name="company"
                            value={profileData.company}
                            onChange={handleProfileChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="e.g., AI Nexus"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={profileData.bio}
                        onChange={handleProfileChange}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Languages</h2>
                      <button
                        type="button"
                        onClick={addLanguage}
                        className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Language</span>
                      </button>
                    </div>
                    
                    {languages.length > 0 ? (
                      <div className="space-y-4">
                        {languages.map((lang, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="flex-1">
                              <select
                                value={lang.language}
                                onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              >
                                <option value="">Select Language</option>
                                {languageOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="w-48">
                              <select
                                value={lang.level}
                                onChange={(e) => updateLanguage(index, 'level', parseInt(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              >
                                {proficiencyLevels.map(level => (
                                  <option key={level.value} value={level.value}>{level.label}</option>
                                ))}
                              </select>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => removeLanguage(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Minus className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-500">No languages added yet</p>
                        <button
                          type="button"
                          onClick={addLanguage}
                          className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Add your first language
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
                      <button
                        type="button"
                        onClick={addSkill}
                        className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Skill</span>
                      </button>
                    </div>
                    
                    {skills.length > 0 ? (
                      <div className="space-y-4">
                        {skills.map((skill, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="flex-1">
                              <select
                                value={skill.skill}
                                onChange={(e) => updateSkill(index, 'skill', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              >
                                <option value="">Select Skill</option>
                                {skillOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="w-48">
                              <select
                                value={skill.level}
                                onChange={(e) => updateSkill(index, 'level', parseInt(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              >
                                {proficiencyLevels.map(level => (
                                  <option key={level.value} value={level.value}>{level.label}</option>
                                ))}
                              </select>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => removeSkill(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Minus className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-500">No skills added yet</p>
                        <button
                          type="button"
                          onClick={addSkill}
                          className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Add your first skill
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Work Experience */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
                      <button
                        type="button"
                        onClick={addWorkExperience}
                        className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Experience</span>
                      </button>
                    </div>
                    
                    {workExperience.length > 0 ? (
                      <div className="space-y-6">
                        {workExperience.map((exp, index) => (
                          <div key={index} className="border border-gray-200 rounded-xl p-4">
                            <div className="flex justify-between mb-4">
                              <h3 className="font-medium text-gray-900">Experience #{index + 1}</h3>
                              <button
                                type="button"
                                onClick={() => removeWorkExperience(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Company
                                </label>
                                <input
                                  type="text"
                                  value={exp.company}
                                  onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="Company name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Job Title
                                </label>
                                <input
                                  type="text"
                                  value={exp.jobTitle}
                                  onChange={(e) => updateWorkExperience(index, 'jobTitle', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="Your position"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  value={exp.startDate}
                                  onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  End Date
                                </label>
                                <input
                                  type="date"
                                  value={exp.endDate}
                                  onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                                  disabled={exp.current}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                                />
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={exp.current}
                                  onChange={(e) => updateWorkExperience(index, 'current', e.target.checked)}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">I currently work here</span>
                              </label>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                value={exp.description}
                                onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                placeholder="Describe your role and responsibilities"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-500">No work experience added yet</p>
                        <button
                          type="button"
                          onClick={addWorkExperience}
                          className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Add your first work experience
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Education */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Education</h2>
                      <button
                        type="button"
                        onClick={addEducation}
                        className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Education</span>
                      </button>
                    </div>
                    
                    {education.length > 0 ? (
                      <div className="space-y-6">
                        {education.map((edu, index) => (
                          <div key={index} className="border border-gray-200 rounded-xl p-4">
                            <div className="flex justify-between mb-4">
                              <h3 className="font-medium text-gray-900">Education #{index + 1}</h3>
                              <button
                                type="button"
                                onClick={() => removeEducation(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Institution
                                </label>
                                <input
                                  type="text"
                                  value={edu.institution}
                                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="School or university name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Degree
                                </label>
                                <input
                                  type="text"
                                  value={edu.degree}
                                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="e.g., Bachelor's, Master's"
                                />
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Field of Study
                              </label>
                              <input
                                type="text"
                                value={edu.fieldOfStudy}
                                onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="e.g., Computer Science"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  value={edu.startDate}
                                  onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  End Date
                                </label>
                                <input
                                  type="date"
                                  value={edu.endDate}
                                  onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                                  disabled={edu.current}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={edu.current}
                                  onChange={(e) => updateEducation(index, 'current', e.target.checked)}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">I'm currently studying here</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-500">No education added yet</p>
                        <button
                          type="button"
                          onClick={addEducation}
                          className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Add your first education
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Certifications */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Certifications</h2>
                      <button
                        type="button"
                        onClick={addCertification}
                        className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Certification</span>
                      </button>
                    </div>
                    
                    {certifications.length > 0 ? (
                      <div className="space-y-6">
                        {certifications.map((cert, index) => (
                          <div key={index} className="border border-gray-200 rounded-xl p-4">
                            <div className="flex justify-between mb-4">
                              <h3 className="font-medium text-gray-900">Certification #{index + 1}</h3>
                              <button
                                type="button"
                                onClick={() => removeCertification(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={cert.name}
                                  onChange={(e) => updateCertification(index, 'name', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="Certification name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Issuing Organization
                                </label>
                                <input
                                  type="text"
                                  value={cert.issuingOrganization}
                                  onChange={(e) => updateCertification(index, 'issuingOrganization', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="e.g., Microsoft, Google"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Issue Date
                                </label>
                                <input
                                  type="date"
                                  value={cert.issueDate}
                                  onChange={(e) => updateCertification(index, 'issueDate', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Expiration Date (if applicable)
                                </label>
                                <input
                                  type="date"
                                  value={cert.expirationDate}
                                  onChange={(e) => updateCertification(index, 'expirationDate', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Credential ID
                                </label>
                                <input
                                  type="text"
                                  value={cert.credentialId}
                                  onChange={(e) => updateCertification(index, 'credentialId', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="Credential identifier"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Credential URL
                                </label>
                                <input
                                  type="url"
                                  value={cert.credentialUrl}
                                  onChange={(e) => updateCertification(index, 'credentialUrl', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="https://example.com/credential"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-500">No certifications added yet</p>
                        <button
                          type="button"
                          onClick={addCertification}
                          className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Add your first certification
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Achievements */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
                      <button
                        type="button"
                        onClick={addAchievement}
                        className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Achievement</span>
                      </button>
                    </div>
                    
                    {achievements.length > 0 ? (
                      <div className="space-y-6">
                        {achievements.map((achievement, index) => (
                          <div key={index} className="border border-gray-200 rounded-xl p-4">
                            <div className="flex justify-between mb-4">
                              <h3 className="font-medium text-gray-900">Achievement #{index + 1}</h3>
                              <button
                                type="button"
                                onClick={() => removeAchievement(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={achievement.title}
                                  onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="Achievement title"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Date
                                </label>
                                <input
                                  type="date"
                                  value={achievement.date}
                                  onChange={(e) => updateAchievement(index, 'date', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                value={achievement.description}
                                onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                placeholder="Describe your achievement"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-500">No achievements added yet</p>
                        <button
                          type="button"
                          onClick={addAchievement}
                          className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Add your first achievement
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Social Links</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 flex-shrink-0">
                          <Globe className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          name="website"
                          value={profileData.website}
                          onChange={handleProfileChange}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Your website URL"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 flex-shrink-0">
                          <Github className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          name="github"
                          value={profileData.github}
                          onChange={handleProfileChange}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="GitHub profile URL"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 flex-shrink-0">
                          <Linkedin className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          name="linkedin"
                          value={profileData.linkedin}
                          onChange={handleProfileChange}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="LinkedIn profile URL"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 flex-shrink-0">
                          <Twitter className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          name="twitter"
                          value={profileData.twitter}
                          onChange={handleProfileChange}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Twitter profile URL"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 flex-shrink-0">
                          <Instagram className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          name="instagram"
                          value={profileData.instagram}
                          onChange={handleProfileChange}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Instagram profile URL"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 flex-shrink-0">
                          <Youtube className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          name="youtube"
                          value={profileData.youtube}
                          onChange={handleProfileChange}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="YouTube channel URL"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Account Settings */}
            {activeTab === 'account' && (
              <form onSubmit={handleSaveAccount}>
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>
                    
                    <div className="mb-6">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={accountData.email}
                          onChange={handleAccountChange}
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Your email address"
                          disabled
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        To change your email, please contact support.
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={accountData.currentPassword}
                          onChange={handleAccountChange}
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Enter your current password"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={accountData.newPassword}
                            onChange={handleAccountChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter new password"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={accountData.confirmPassword}
                            onChange={handleAccountChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-6">
                      Password must be at least 8 characters long and include a mix of letters, numbers, and special characters.
                    </p>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <form onSubmit={handleSaveNotifications}>
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-4">Notification Channels</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">Email Notifications</span>
                              <p className="text-sm text-gray-500">Receive notifications via email</p>
                            </div>
                            <input
                              type="checkbox"
                              name="emailNotifications"
                              checked={notificationSettings.emailNotifications}
                              onChange={handleNotificationChange}
                              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </label>
                          
                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">Push Notifications</span>
                              <p className="text-sm text-gray-500">Receive notifications in your browser</p>
                            </div>
                            <input
                              type="checkbox"
                              name="pushNotifications"
                              checked={notificationSettings.pushNotifications}
                              onChange={handleNotificationChange}
                              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </label>
                          
                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">Marketing Emails</span>
                              <p className="text-sm text-gray-500">Receive promotional emails and updates</p>
                            </div>
                            <input
                              type="checkbox"
                              name="marketingEmails"
                              checked={notificationSettings.marketingEmails}
                              onChange={handleNotificationChange}
                              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 mb-4">Notification Types</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">New Followers</span>
                              <p className="text-sm text-gray-500">When someone follows you</p>
                            </div>
                            <input
                              type="checkbox"
                              name="newFollowers"
                              checked={notificationSettings.newFollowers}
                              onChange={handleNotificationChange}
                              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </label>
                          
                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">Mentions</span>
                              <p className="text-sm text-gray-500">When someone mentions you in a post or comment</p>
                            </div>
                            <input
                              type="checkbox"
                              name="mentions"
                              checked={notificationSettings.mentions}
                              onChange={handleNotificationChange}
                              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </label>
                          
                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">Comments</span>
                              <p className="text-sm text-gray-500">When someone comments on your content</p>
                            </div>
                            <input
                              type="checkbox"
                              name="comments"
                              checked={notificationSettings.comments}
                              onChange={handleNotificationChange}
                              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </label>
                          
                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">Likes</span>
                              <p className="text-sm text-gray-500">When someone likes your content</p>
                            </div>
                            <input
                              type="checkbox"
                              name="likes"
                              checked={notificationSettings.likes}
                              onChange={handleNotificationChange}
                              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </label>
                          
                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">Messages</span>
                              <p className="text-sm text-gray-500">When you receive a new message</p>
                            </div>
                            <input
                              type="checkbox"
                              name="messages"
                              checked={notificationSettings.messages}
                              onChange={handleNotificationChange}
                              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </label>
                          
                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">Tool Updates</span>
                              <p className="text-sm text-gray-500">Updates about tools you've submitted or saved</p>
                            </div>
                            <input
                              type="checkbox"
                              name="toolUpdates"
                              checked={notificationSettings.toolUpdates}
                              onChange={handleNotificationChange}
                              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </label>
                          
                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">Weekly Digest</span>
                              <p className="text-sm text-gray-500">Weekly summary of activity and new content</p>
                            </div>
                            <input
                              type="checkbox"
                              name="weeklyDigest"
                              checked={notificationSettings.weeklyDigest}
                              onChange={handleNotificationChange}
                              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <form onSubmit={handleSavePrivacy}>
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy Settings</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="profileVisibility" className="block text-sm font-medium text-gray-700 mb-2">
                          Profile Visibility
                        </label>
                        <select
                          id="profileVisibility"
                          name="profileVisibility"
                          value={privacySettings.profileVisibility}
                          onChange={handlePrivacyChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="public">Public - Anyone can view your profile</option>
                          <option value="registered">Registered Users - Only registered users can view your profile</option>
                          <option value="private">Private - Only you and admins can view your profile</option>
                        </select>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">Show Email Address</span>
                            <p className="text-sm text-gray-500">Make your email visible to other users</p>
                          </div>
                          <input
                            type="checkbox"
                            name="showEmail"
                            checked={privacySettings.showEmail}
                            onChange={handlePrivacyChange}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">Show Location</span>
                            <p className="text-sm text-gray-500">Display your location on your profile</p>
                          </div>
                          <input
                            type="checkbox"
                            name="showLocation"
                            checked={privacySettings.showLocation}
                            onChange={handlePrivacyChange}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">Allow Messaging</span>
                            <p className="text-sm text-gray-500">Let other users send you direct messages</p>
                          </div>
                          <input
                            type="checkbox"
                            name="allowMessaging"
                            checked={privacySettings.allowMessaging}
                            onChange={handlePrivacyChange}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">Show Activity</span>
                            <p className="text-sm text-gray-500">Display your recent activity on your profile</p>
                          </div>
                          <input
                            type="checkbox"
                            name="showActivity"
                            checked={privacySettings.showActivity}
                            onChange={handlePrivacyChange}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">Show Followers</span>
                            <p className="text-sm text-gray-500">Display your followers on your profile</p>
                          </div>
                          <input
                            type="checkbox"
                            name="showFollowers"
                            checked={privacySettings.showFollowers}
                            onChange={handlePrivacyChange}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">Show Following</span>
                            <p className="text-sm text-gray-500">Display who you follow on your profile</p>
                          </div>
                          <input
                            type="checkbox"
                            name="showFollowing"
                            checked={privacySettings.showFollowing}
                            onChange={handlePrivacyChange}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Delete Account */}
            {activeTab === 'delete' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-red-600 mb-6">Delete Account</h2>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-red-700 mb-4">Warning: This action cannot be undone</h3>
                  <p className="text-red-600 mb-4">
                    Deleting your account will permanently remove all your data from our platform, including:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-red-600 mb-4">
                    <li>Your profile information</li>
                    <li>All tools you've submitted</li>
                    <li>All articles you've written</li>
                    <li>All posts, comments, and other content</li>
                    <li>Your messages and conversations</li>
                    <li>Your saved items and preferences</li>
                  </ul>
                  <p className="text-red-600 font-medium">
                    This action is permanent and cannot be reversed.
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">
                      I understand that this action cannot be undone and all my data will be permanently deleted.
                    </span>
                  </label>
                </div>
                
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5" />
                      <span>Delete My Account</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;