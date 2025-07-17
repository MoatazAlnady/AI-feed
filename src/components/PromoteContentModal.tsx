import React, { useState } from 'react';
import { X, Target, DollarSign, Users, Calendar, TrendingUp, MapPin, Sparkles, Bot, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PromoteContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'tool' | 'article' | 'post' | 'job' | 'event';
  contentId: number;
  contentTitle: string;
}

const PromoteContentModal: React.FC<PromoteContentModalProps> = ({ 
  isOpen, 
  onClose, 
  contentType, 
  contentId, 
  contentTitle 
}) => {
  const { user } = useAuth();
  const [targetingMode, setTargetingMode] = useState<'manual' | 'ai'>('manual');
  const [formData, setFormData] = useState({
    budget: '50',
    duration: '7',
    targetAudience: [] as string[],
    ageFrom: '18',
    ageTo: '65',
    selectedCountries: [] as string[],
    selectedCities: [] as string[],
    interests: [] as string[],
    gender: 'all',
    objective: 'awareness'
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTargeting, setIsGeneratingTargeting] = useState(false);

  // Countries and cities data (from AuthModal)
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
    { name: 'Australia', code: '+61' },
    { name: 'New Zealand', code: '+64' },
    { name: 'Japan', code: '+81' },
    { name: 'South Korea', code: '+82' },
    { name: 'Singapore', code: '+65' },
    { name: 'India', code: '+91' },
    { name: 'Brazil', code: '+55' }
  ];

  const countries = countriesWithCodes.map(c => c.name);

  const cities = {
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington DC', 'Boston', 'Nashville', 'Baltimore', 'Oklahoma City', 'Louisville', 'Portland', 'Las Vegas', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs', 'Raleigh', 'Virginia Beach', 'Long Beach', 'Miami', 'Oakland', 'Minneapolis', 'Tulsa', 'Bakersfield', 'Wichita', 'Arlington'],
    'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor', 'Saskatoon', 'St. Catharines', 'Regina', 'Sherbrooke', 'Kelowna', 'Barrie', 'Guelph', 'Kanata', 'Abbotsford', 'Trois-Rivières'],
    'United Kingdom': ['London', 'Birmingham', 'Glasgow', 'Liverpool', 'Bristol', 'Manchester', 'Sheffield', 'Leeds', 'Edinburgh', 'Leicester', 'Wakefield', 'Coventry', 'Hull', 'Bradford', 'Cardiff', 'Belfast', 'Stoke-on-Trent', 'Wolverhampton', 'Plymouth', 'Derby', 'Swansea', 'Southampton', 'Salford', 'Aberdeen', 'Westminster', 'Portsmouth', 'York', 'Peterborough', 'Dundee', 'Lancaster', 'Oxford', 'Newport', 'Preston', 'St Albans', 'Norwich', 'Chester', 'Cambridge', 'Salisbury', 'Exeter', 'Gloucester', 'Lisburn', 'Chichester', 'Winchester', 'Londonderry', 'Carlisle', 'Worcester', 'Bath', 'Durham', 'Lincoln', 'Hereford', 'Armagh', 'Inverness', 'Stirling', 'Canterbury', 'Lichfield', 'Newry', 'Ripon', 'Bangor', 'Truro', 'Ely', 'Wells', 'St Davids'],
    'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster'],
    'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Angers', 'Grenoble', 'Dijon', 'Nîmes', 'Aix-en-Provence'],
    'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Hospitalet de Llobregat', 'A Coruña', 'Vitoria-Gasteiz', 'Granada', 'Elche'],
    'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania', 'Venice', 'Verona', 'Messina', 'Padua', 'Trieste', 'Taranto', 'Brescia', 'Prato', 'Parma', 'Modena'],
    'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen', 'Enschede', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort', 'Apeldoorn', 'Maastricht', 'Dordrecht', 's-Hertogenbosch', 'Leiden'],
    'Sweden': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping', 'Lund', 'Umeå', 'Gävle', 'Borås', 'Södertälje', 'Eskilstuna', 'Halmstad', 'Växjö', 'Karlstad', 'Sundsvall'],
    'Norway': ['Oslo', 'Bergen', 'Stavanger', 'Trondheim', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Sandnes', 'Tromsø', 'Sarpsborg', 'Skien', 'Ålesund', 'Sandefjord', 'Haugesund', 'Tønsberg', 'Moss', 'Bodø', 'Arendal', 'Hamar', 'Ytrebygda'],
    'Denmark': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde', 'Herning', 'Hørsholm', 'Helsingør', 'Silkeborg', 'Næstved', 'Fredericia', 'Viborg', 'Køge', 'Holstebro', 'Taastrup'],
    'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong', 'Geelong', 'Hobart', 'Townsville', 'Cairns', 'Darwin', 'Toowoomba', 'Ballarat', 'Bendigo', 'Albury', 'Launceston'],
    'New Zealand': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Napier-Hastings', 'Dunedin', 'Palmerston North', 'Nelson', 'Rotorua', 'New Plymouth', 'Whangarei', 'Invercargill', 'Wanganui', 'Gisborne', 'Timaru', 'Oamaru', 'Greymouth', 'Westport'],
    'Japan': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama', 'Hiroshima', 'Sendai', 'Kitakyushu', 'Chiba', 'Sakai', 'Niigata', 'Hamamatsu', 'Okayama', 'Sagamihara', 'Kumamoto'],
    'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Goyang', 'Yongin', 'Seongnam', 'Bucheon', 'Cheongju', 'Ansan', 'Jeonju', 'Anyang', 'Pohang', 'Uijeongbu', 'Pyeongtaek'],
    'Singapore': ['Singapore'],
    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri & Chinchwad', 'Patna', 'Vadodara'],
    'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Goiânia', 'Belém', 'Porto Alegre', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Nova Iguaçu', 'Teresina']
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

  const objectives = [
    { value: 'awareness', label: 'Brand Awareness', description: 'Increase visibility and recognition' },
    { value: 'engagement', label: 'Engagement', description: 'Drive likes, comments, and shares' },
    { value: 'traffic', label: 'Website Traffic', description: 'Direct users to your content' },
    { value: 'conversions', label: 'Conversions', description: 'Encourage specific actions' }
  ];

  const genderOptions = [
    { value: 'all', label: 'All Genders' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-binary' }
  ];

  const ageRanges = [
    '18-24', '25-34', '35-44', '45-54', '55-64', '65+', '18-34', '25-45', '35-55', '18+'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayToggle = (array: string[], item: string, field: keyof typeof formData) => {
    const newArray = array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const generateAITargeting = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGeneratingTargeting(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI-generated targeting based on prompt
      const mockTargeting = {
        targetAudience: ['AI Researchers', 'Data Scientists', 'Tech Enthusiasts'],
        interests: ['Machine Learning', 'AI Research', 'Data Science'],
        selectedCountries: ['United States', 'Canada', 'United Kingdom'],
        selectedCities: ['New York', 'Toronto', 'London'],
        ageFrom: '25',
        ageTo: '45',
        gender: 'all'
      };
      
      setFormData(prev => ({
        ...prev,
        ...mockTargeting
      }));
      
      alert('AI targeting generated successfully! Review and adjust the targeting criteria below.');
    } catch (error) {
      console.error('Error generating AI targeting:', error);
      alert('Error generating targeting. Please try again.');
    } finally {
      setIsGeneratingTargeting(false);
    }
  };

  const calculateEstimatedReach = () => {
    const budget = parseInt(formData.budget);
    const duration = parseInt(formData.duration);
    
    // $1 = 10 new creators per day
    const creatorsPerDay = budget * 10;
    const totalCreators = creatorsPerDay * duration;
    
    // Apply targeting filters - more specific targeting means fewer available creators
    let availableCreators = totalCreators;
    
    // Reduce available creators based on targeting specificity
    if (formData.targetAudience.length > 0) {
      availableCreators *= (1 - formData.targetAudience.length * 0.05); // 5% reduction per audience
    }
    const totalLocations = formData.selectedCountries.length + formData.selectedCities.length;
    if (totalLocations > 0 && totalLocations < 10) {
      availableCreators *= (1 - totalLocations * 0.03); // 3% reduction per location when specific
    }
    if (formData.interests.length > 0) {
      availableCreators *= (1 - formData.interests.length * 0.02); // 2% reduction per interest
    }
    const ageFrom = parseInt(formData.ageFrom);
    const ageTo = parseInt(formData.ageTo);
    if (ageFrom !== 18 || ageTo !== 65) {
      availableCreators *= 0.9; // 10% reduction for age targeting
    }
    if (formData.gender !== 'all') {
      availableCreators *= 0.85; // 15% reduction for gender targeting
    }
    
    return Math.max(Math.round(availableCreators), budget * 5); // Minimum 5 creators per dollar
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const promotionData = {
      contentType,
      contentId,
      contentTitle,
      ...formData,
      estimatedReach: calculateEstimatedReach(),
      targetingMode,
      aiPrompt: targetingMode === 'ai' ? aiPrompt : null,
      createdBy: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
      createdAt: new Date().toISOString()
    };

    console.log('Creating promotion campaign:', promotionData);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    onClose();
    
    // Show success message
    alert(`Promotion campaign created successfully! Your ${contentType} will be promoted to an estimated ${calculateEstimatedReach().toLocaleString()} users.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Promote Your {contentType}</h2>
              <p className="text-gray-600 mt-1">"{contentTitle}"</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Targeting Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Targeting Method
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary-300 transition-colors">
                  <input
                    type="radio"
                    name="targetingMode"
                    value="manual"
                    checked={targetingMode === 'manual'}
                    onChange={(e) => setTargetingMode(e.target.value as 'manual' | 'ai')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Manual Targeting
                    </div>
                    <div className="text-sm text-gray-600">Choose specific criteria manually</div>
                  </div>
                </label>
                <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary-300 transition-colors">
                  <input
                    type="radio"
                    name="targetingMode"
                    value="ai"
                    checked={targetingMode === 'ai'}
                    onChange={(e) => setTargetingMode(e.target.value as 'manual' | 'ai')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900 flex items-center">
                      <Bot className="h-4 w-4 mr-2" />
                      AI-Powered Targeting
                    </div>
                    <div className="text-sm text-gray-600">Let AI generate targeting based on your description</div>
                  </div>
                </label>
              </div>
            </div>

            {/* AI Targeting Prompt */}
            {targetingMode === 'ai' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-blue-200 dark:border-gray-600">
                <div className="flex items-center mb-3">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h3 className="font-medium text-gray-900">AI Targeting Assistant</h3>
                </div>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe your target audience in natural language. For example: 'Target AI researchers and data scientists in North America who are interested in machine learning and work at tech companies or universities, aged 25-45'"
                />
                <button
                  type="button"
                  onClick={generateAITargeting}
                  disabled={isGeneratingTargeting || !aiPrompt.trim()}
                  className="mt-3 flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingTargeting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4" />
                      <span>Generate Targeting</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Campaign Objective */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Campaign Objective *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {objectives.map((objective) => (
                  <label key={objective.value} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary-300 transition-colors">
                    <input
                      type="radio"
                      name="objective"
                      value={objective.value}
                      checked={formData.objective === objective.value}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{objective.label}</div>
                      <div className="text-sm text-gray-600">{objective.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Budget and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Budget (USD) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    min="1"
                    max="1000"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">$1 = 10 new creators daily • Minimum $1/day</p>
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Duration (days) *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                    max="30"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">1-30 days</p>
              </div>
            </div>

            {/* Target Audience */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Target Audience *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {audienceOptions.map((audience) => (
                  <button
                    key={audience}
                    type="button"
                    onClick={() => handleArrayToggle(formData.targetAudience, audience, 'targetAudience')}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      formData.targetAudience.includes(audience)
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {audience}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {formData.targetAudience.length} audience{formData.targetAudience.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ageFrom" className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="number"
                      id="ageFrom"
                      name="ageFrom"
                      value={formData.ageFrom}
                      onChange={handleInputChange}
                      min="18"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="ageTo" className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="number"
                      id="ageTo"
                      name="ageTo"
                      value={formData.ageTo}
                      onChange={handleInputChange}
                      min="18"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Age range: {formData.ageFrom} - {formData.ageTo} years</p>
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location Targeting */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Location Targeting
              </label>
              
              {/* Countries Selection */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Countries</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {countries.map((country) => (
                    <label key={country} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.selectedCountries.includes(country)}
                        onChange={() => handleArrayToggle(formData.selectedCountries, country, 'selectedCountries')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{country}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {formData.selectedCountries.length} countr{formData.selectedCountries.length !== 1 ? 'ies' : 'y'}
                </p>
              </div>

              {/* Cities Selection */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Cities</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {formData.selectedCountries.length > 0 ? (
                    formData.selectedCountries.flatMap(country => 
                      cities[country]?.map(city => (
                        <label key={`${country}-${city}`} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={formData.selectedCities.includes(`${country}: ${city}`)}
                            onChange={() => handleArrayToggle(formData.selectedCities, `${country}: ${city}`, 'selectedCities')}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">{city} ({country})</span>
                        </label>
                      )) || []
                    )
                  ) : (
                    <p className="text-sm text-gray-500 col-span-full p-4 text-center">
                      Select countries first to choose specific cities
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {formData.selectedCities.length} cit{formData.selectedCities.length !== 1 ? 'ies' : 'y'}
                </p>
              </div>
            </div>

            {/* Interest Targeting */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interest Targeting
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {availableInterests.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleArrayToggle(formData.interests, interest, 'interests')}
                    className={`p-2 text-sm rounded-lg border transition-colors ${
                      formData.interests.includes(interest)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {formData.interests.length} interest{formData.interests.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Campaign Summary */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Campaign Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary-600">
                    ${parseInt(formData.budget) * parseInt(formData.duration)}
                  </div>
                  <div className="text-sm text-gray-600">Total Budget</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-600">
                    {formData.duration}
                  </div>
                  <div className="text-sm text-gray-600">Days</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-600">
                    {calculateEstimatedReach().toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Est. Reach</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-600">
                    {formData.targetAudience.length + formData.selectedCountries.length + formData.selectedCities.length + formData.interests.length}
                  </div>
                  <div className="text-sm text-gray-600">Targeting Criteria</div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || formData.targetAudience.length === 0}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating Campaign...</span>
                </>
              ) : (
                <>
                  <Target className="h-5 w-5" />
                  <span>Launch Campaign (${parseInt(formData.budget) * parseInt(formData.duration)})</span>
                </>
              )}
            </button>

            <p className="text-sm text-gray-500 text-center mt-4">
              Your campaign will be reviewed and activated within 24 hours.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PromoteContentModal;