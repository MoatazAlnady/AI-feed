import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, 
  Users, 
  Briefcase, 
  MapPin, 
  Mail, 
  Phone, 
  Star, 
  MessageCircle,
  UserPlus,
  Filter,
  Globe,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TalentSearchFilters from '../components/TalentSearchFilters';
import { supabase } from '../lib/supabase';

interface Talent {
  id: string;
  full_name: string;
  job_title?: string;
  company?: string;
  location?: string;
  country?: string;
  city?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  languages?: Array<{language: string, level: number}>;
  profile_photo?: string;
  verified?: boolean;
  contact_visible?: boolean;
  email?: string;
  phone?: string;
}

interface TalentSearchProps {
  initialSearch?: string;
}

const TalentSearch: React.FC<TalentSearchProps> = ({ initialSearch = '' }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTalents, setTotalTalents] = useState(0);
  const [filters, setFilters] = useState({
    skills: [] as string[],
    experience: '',
    location: '',
    language: '',
    languageLevel: ''
  });

  useEffect(() => {
    fetchTalents();
  }, []);

  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    // Apply filters whenever they change
    applyFilters();
  }, [talents, filters, searchTerm]);

  const fetchTalents = async () => {
    try {
      setLoading(true);
      
      const [{ data, error }, { data: countData, error: countError }] = await Promise.all([
        supabase.rpc('get_public_user_profiles', { search: null, limit_param: 200, offset_param: 0 }),
        supabase.rpc('get_public_profiles_count', { search: null })
      ]);
      if (countError) throw countError;
      
      if (error) throw error;
      
      // Transform data to match Talent interface
      const transformedData: Talent[] = (data || []).map((profile: any) => ({
        id: profile.id,
        full_name: profile.full_name || '',
        job_title: profile.job_title,
        company: profile.company,
        location: profile.location,
        country: profile.country,
        city: profile.city,
        bio: profile.bio,
        skills: Array.isArray(profile.interests) ? profile.interests : [],
        experience: '',
        languages: (profile.languages as Array<{language: string, level: number}>) || [],
        profile_photo: profile.profile_photo,
        verified: profile.verified,
        contact_visible: !!profile.website || !!profile.github || !!profile.linkedin || !!profile.twitter,
        email: '',
        phone: undefined
      }));
      
      setTalents(transformedData);
      setTotalTalents((countData as number) || 0);
    } catch (error) {
      console.error('Error fetching talents:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...talents];
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(talent => 
        talent.full_name?.toLowerCase().includes(term) ||
        talent.job_title?.toLowerCase().includes(term) ||
        talent.company?.toLowerCase().includes(term) ||
        talent.bio?.toLowerCase().includes(term) ||
        talent.skills?.some(skill => skill.toLowerCase().includes(term))
      );
    }
    
    // Apply skills filter
    if (filters.skills.length > 0) {
      filtered = filtered.filter(talent => 
        talent.skills?.some(skill => 
          filters.skills.some(filterSkill => 
            skill.toLowerCase().includes(filterSkill.toLowerCase())
          )
        )
      );
    }
    
    // Apply experience filter
    if (filters.experience) {
      filtered = filtered.filter(talent => 
        talent.experience === filters.experience
      );
    }
    
    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(talent => 
        talent.location?.includes(filters.location) ||
        talent.country === filters.location ||
        talent.city === filters.location
      );
    }
    
    // Apply language filter
    if (filters.language) {
      filtered = filtered.filter(talent => {
        if (!talent.languages) return false;
        
        // Parse languages if it's a string
        let languagesArray;
        try {
          languagesArray = typeof talent.languages === 'string' 
            ? JSON.parse(talent.languages) 
            : talent.languages;
        } catch (e) {
          console.error('Error parsing languages:', e);
          return false;
        }
        
        // Check if talent speaks the language
        const hasLanguage = Array.isArray(languagesArray) && languagesArray.some((lang: any) => 
          lang.language === filters.language
        );
        
        // If language level is specified, check that too
        if (hasLanguage && filters.languageLevel) {
          return languagesArray.some((lang: any) => 
            lang.language === filters.language && 
            lang.level >= parseInt(filters.languageLevel)
          );
        }
        
        return hasLanguage;
      });
    }
    
    setFilteredTalents(filtered);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  return (
    <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Talent Search
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Find the perfect AI talent for your team
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, skills, or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Filters */}
        <TalentSearchFilters onFilterChange={handleFilterChange} />

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {loading ? 'Loading talents...' : `Showing ${filteredTalents.length} of ${totalTalents} talents`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : filteredTalents.length > 0 ? (
          <div className="space-y-6">
            {filteredTalents.map((talent) => (
              <div key={talent.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  {/* Profile Photo */}
                  <div className="flex-shrink-0">
                    {talent.profile_photo ? (
                      <img
                        src={talent.profile_photo}
                        alt={talent.full_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Talent Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {talent.full_name}
                        {talent.verified && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                            Verified
                          </span>
                        )}
                      </h3>
                      <div className="flex space-x-2">
                        <button className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                          <MessageCircle className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                          <UserPlus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Job Title & Company */}
                    {(talent.job_title || talent.company) && (
                      <div className="flex items-center text-gray-600 dark:text-gray-300 mt-1">
                        <Briefcase className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="text-sm">
                          {talent.job_title}
                          {talent.job_title && talent.company && ' at '}
                          {talent.company}
                        </span>
                      </div>
                    )}
                    
                    {/* Location */}
                    {talent.location && (
                      <div className="flex items-center text-gray-600 dark:text-gray-300 mt-1">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="text-sm">{talent.location}</span>
                      </div>
                    )}
                    
                    {/* Languages */}
                    {talent.languages && (
                      <div className="flex items-center text-gray-600 dark:text-gray-300 mt-1">
                        <Globe className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="text-sm">
                          {(() => {
                            try {
                              const langs = typeof talent.languages === 'string' 
                                ? JSON.parse(talent.languages) 
                                : talent.languages;
                              
                              if (Array.isArray(langs)) {
                                return langs.map((lang: any) => 
                                  `${lang.language} (${getProficiencyLabel(lang.level)})`
                                ).join(', ');
                              }
                              return '';
                            } catch (e) {
                              console.error('Error parsing languages:', e);
                              return '';
                            }
                          })()}
                        </span>
                      </div>
                    )}
                    
                    {/* Bio */}
                    {talent.bio && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">{talent.bio}</p>
                    )}
                    
                    {/* Skills */}
                    {talent.skills && talent.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {talent.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Contact Info - Only if visible */}
                    {talent.contact_visible && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        {talent.email && (
                          <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                            <Mail className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                            <a href={`mailto:${talent.email}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                              {talent.email}
                            </a>
                          </div>
                        )}
                        {talent.phone && (
                          <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm mt-1">
                            <Phone className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                            <a href={`tel:${talent.phone}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                              {talent.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Talents Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true))
                ? 'Try adjusting your search criteria or filters.'
                : 'There are no talents in the system yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get proficiency label
function getProficiencyLabel(level: number): string {
  switch (level) {
    case 1: return 'Beginner';
    case 2: return 'Elementary';
    case 3: return 'Intermediate';
    case 4: return 'Advanced';
    case 5: return 'Native/Fluent';
    default: return 'Unknown';
  }
}

export default TalentSearch;