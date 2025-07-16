import React, { useState } from 'react';
import { X, Briefcase, MapPin, DollarSign, Clock, ExternalLink, Building, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProjectConversionModal from './ProjectConversionModal';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (job: any) => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    country: '',
    city: '',
    type: 'full-time',
    workMode: 'hybrid',
    salary: '',
    description: '',
    requirements: '',
    applicationUrl: '',
    experience: 'mid-level',
    slots: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [createdJob, setCreatedJob] = useState<any>(null);

  const jobTypes = ['full-time', 'part-time', 'contract', 'freelance', 'internship'];
  const workModes = ['remote', 'on-site', 'hybrid'];
  const experienceLevels = ['entry-level', 'mid-level', 'senior-level', 'executive'];
  const slotOptions = [1, 2, 3, 5, 10];

  // Location data (same as in AuthModal)
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
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington DC', 'Boston', 'Nashville', 'Baltimore', 'Oklahoma City', 'Louisville', 'Portland', 'Las Vegas', 'Milwaukee', 'Albuquerque', 'Tucson'],
    'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor', 'Saskatoon', 'St. Catharines', 'Regina', 'Sherbrooke', 'Barrie'],
    'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff', 'Leicester', 'Coventry', 'Bradford', 'Belfast', 'Nottingham', 'Hull', 'Newcastle', 'Stoke-on-Trent', 'Southampton', 'Derby'],
    'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster'],
    'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne'],
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newJob = {
        id: Date.now(),
        ...formData,
        location: `${formData.city}, ${formData.country}`,
        postedBy: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
        postedAt: new Date().toISOString(),
        applicants: 0
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setCreatedJob(newJob);
      onJobCreated(newJob);
      
      // Show conversion modal with options
      setShowConversionModal(true);
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Error creating job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConversionClose = () => {
    setShowConversionModal(false);
    onClose();
    // Reset form
    setFormData({
      title: '',
      company: '',
      country: '',
      city: '',
      type: 'full-time',
      workMode: 'hybrid',
      salary: '',
      description: '',
      requirements: '',
      applicationUrl: '',
      experience: 'mid-level',
      slots: 1
    });
    setCreatedJob(null);
  };

  const handleProjectCreated = (project: any) => {
    console.log('Project created:', project);
    // You can add navigation to projects page or show success message
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Post a Job</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Job Title */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Senior AI Engineer"
                  />
                </div>
              </div>

              {/* Company */}
              <div className="mb-6">
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Company name"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={(e) => {
                        handleInputChange(e);
                        setFormData(prev => ({ ...prev, city: '' })); // Reset city when country changes
                      }}
                      required
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
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.country}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select city</option>
                    {formData.country && cities[formData.country as keyof typeof cities]?.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Job Type, Work Mode, and Experience */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {jobTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="workMode" className="block text-sm font-medium text-gray-700 mb-2">
                    Work Mode *
                  </label>
                  <select
                    id="workMode"
                    name="workMode"
                    value={formData.workMode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {workModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level *
                  </label>
                  <select
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {experienceLevels.map((level) => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary and Job Slots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Range
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="salary"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., $120,000 - $180,000 or Competitive"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="slots" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Slots *
                  </label>
                  <select
                    id="slots"
                    name="slots"
                    value={formData.slots}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {slotOptions.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot} {slot === 1 ? 'position' : 'positions'}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Number of positions to fill
                  </p>
                </div>
              </div>

              {/* Job Description */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                />
              </div>

              {/* Requirements */}
              <div className="mb-6">
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements *
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="List the required skills, experience, and qualifications..."
                />
              </div>

              {/* Application URL */}
              <div className="mb-8">
                <label htmlFor="applicationUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Application URL *
                </label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    id="applicationUrl"
                    name="applicationUrl"
                    value={formData.applicationUrl}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://company.com/careers/apply"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Candidates will be redirected to this URL to apply
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Posting Job...</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="h-5 w-5" />
                    <span>Post Job</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Project Conversion Modal */}
      {showConversionModal && createdJob && (
        <ProjectConversionModal
          isOpen={showConversionModal}
          onClose={handleConversionClose}
          jobData={{
            title: createdJob.title,
            company: createdJob.company,
            description: createdJob.description,
            requirements: createdJob.requirements,
            location: createdJob.location,
            experience: createdJob.experience
          }}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </>
  );
};

export default CreateJobModal;