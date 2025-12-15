import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/AuthContext';
import TalentSearchFilters, { TalentFilters } from '../components/TalentSearchFilters';
import TalentCard from '../components/TalentCard';
import TalentProfilePreview from '../components/TalentProfilePreview';
import SaveToProjectModal from '../components/SaveToProjectModal';
import { supabase } from '../lib/supabase';

interface Talent {
  id: string;
  full_name: string | null;
  job_title: string | null;
  company: string | null;
  company_page_id?: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
  interests: string[] | null;
  experience?: string;
  languages: { language: string; proficiency: number }[] | null;
  profile_photo: string | null;
  verified: boolean;
  contact_visible: boolean;
  gender?: string;
  age?: number;
  account_type?: string;
  website?: string | null;
  github?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
}

interface TalentSearchProps {
  initialSearch?: string;
}

const defaultFilters: TalentFilters = {
  skills: [],
  languages: [],
  languageLevel: '',
  countries: [],
  cities: [],
  industries: [],
  companySizes: [],
  experienceLevels: [],
  jobTitles: [],
  genders: [],
  ageRange: [18, 65],
  verifiedOnly: false,
  accountTypes: [],
  booleanOperator: 'AND',
};

const TalentSearch: React.FC<TalentSearchProps> = ({ initialSearch = '' }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTalents, setTotalTalents] = useState(0);
  const [filters, setFilters] = useState<TalentFilters>(defaultFilters);
  
  // Split view state
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  
  // Save to project modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [talentToSave, setTalentToSave] = useState<Talent | null>(null);

  useEffect(() => {
    fetchTalents();
  }, []);

  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
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
      
      const transformedData: Talent[] = (data || []).map((profile: any) => ({
        id: profile.id,
        full_name: profile.full_name || '',
        job_title: profile.job_title,
        company: profile.company,
        company_page_id: profile.company_page_id,
        location: profile.location,
        country: profile.country,
        city: profile.city,
        bio: profile.bio,
        interests: Array.isArray(profile.interests) ? profile.interests : [],
        experience: '',
        languages: (profile.languages as Array<{ language: string; proficiency: number }>) || [],
        profile_photo: profile.profile_photo,
        verified: profile.verified || false,
        contact_visible: !!profile.website || !!profile.github || !!profile.linkedin || !!profile.twitter,
        website: profile.website,
        github: profile.github,
        linkedin: profile.linkedin,
        twitter: profile.twitter,
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
    const isAndMode = filters.booleanOperator === 'AND';
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(talent => 
        talent.full_name?.toLowerCase().includes(term) ||
        talent.job_title?.toLowerCase().includes(term) ||
        talent.company?.toLowerCase().includes(term) ||
        talent.bio?.toLowerCase().includes(term) ||
        talent.interests?.some(skill => skill.toLowerCase().includes(term))
      );
    }

    const filterChecks: ((talent: Talent) => boolean)[] = [];
    
    if (filters.skills.length > 0) {
      filterChecks.push((talent) => 
        talent.interests?.some(skill => 
          filters.skills.some(filterSkill => 
            skill.toLowerCase().includes(filterSkill.toLowerCase())
          )
        ) ?? false
      );
    }
    
    if (filters.experienceLevels.length > 0) {
      filterChecks.push((talent) => 
        filters.experienceLevels.includes(talent.experience || '')
      );
    }
    
    if (filters.countries.length > 0) {
      filterChecks.push((talent) => 
        filters.countries.some(country => 
          talent.country?.toLowerCase() === country.toLowerCase() ||
          talent.location?.toLowerCase().includes(country.toLowerCase())
        )
      );
    }
    
    if (filters.languages.length > 0) {
      filterChecks.push((talent) => {
        if (!talent.languages) return false;
        
        let languagesArray;
        try {
          languagesArray = typeof talent.languages === 'string' 
            ? JSON.parse(talent.languages) 
            : talent.languages;
        } catch (e) {
          return false;
        }
        
        if (!Array.isArray(languagesArray)) return false;
        
        const hasLanguage = languagesArray.some((lang: any) => 
          filters.languages.includes(lang.language)
        );
        
        if (hasLanguage && filters.languageLevel) {
          return languagesArray.some((lang: any) => 
            filters.languages.includes(lang.language) && 
            (lang.level || lang.proficiency) >= parseInt(filters.languageLevel)
          );
        }
        
        return hasLanguage;
      });
    }

    if (filters.verifiedOnly) {
      filterChecks.push((talent) => talent.verified === true);
    }

    if (filters.genders.length > 0) {
      filterChecks.push((talent) => 
        filters.genders.includes(talent.gender || '')
      );
    }

    if (filters.accountTypes.length > 0) {
      filterChecks.push((talent) => 
        filters.accountTypes.includes(talent.account_type || '')
      );
    }

    if (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 65) {
      filterChecks.push((talent) => {
        if (!talent.age) return true;
        return talent.age >= filters.ageRange[0] && talent.age <= filters.ageRange[1];
      });
    }

    if (filterChecks.length > 0) {
      filtered = filtered.filter(talent => {
        if (isAndMode) {
          return filterChecks.every(check => check(talent));
        } else {
          return filterChecks.some(check => check(talent));
        }
      });
    }
    
    setFilteredTalents(filtered);
  };

  const handleFilterChange = (newFilters: TalentFilters) => {
    setFilters(newFilters);
  };

  const handleSelectTalent = (talent: Talent) => {
    setSelectedTalent(talent);
  };

  const handleSaveToProject = (talent: Talent) => {
    setTalentToSave(talent);
    setSaveModalOpen(true);
  };

  const handleSendMessage = (talent: Talent) => {
    navigate(`/messages?userId=${talent.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="bg-card rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('talentSearch.searchPlaceholder', 'Search by name, job title, skills...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        {/* Filters */}
        <TalentSearchFilters onFilterChange={handleFilterChange} />

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {loading 
              ? t('talentSearch.loading', 'Loading...') 
              : t('talentSearch.showingResults', 'Showing {{count}} of {{total}} talents', { 
                  count: filteredTalents.length, 
                  total: totalTalents 
                })}
          </p>
        </div>

        {/* Split View Layout */}
        <div className="flex gap-6">
          {/* Talent List - Left Side */}
          <div className={`${selectedTalent ? 'w-3/5' : 'w-full'} transition-all duration-300`}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTalents.length > 0 ? (
              <div className="space-y-4">
                {filteredTalents.map((talent) => (
                  <TalentCard
                    key={talent.id}
                    talent={talent}
                    isSelected={selectedTalent?.id === talent.id}
                    onSelect={handleSelectTalent}
                    onSaveToProject={handleSaveToProject}
                    onSendMessage={handleSendMessage}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl shadow-sm p-12 text-center">
                <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {t('talentSearch.noTalentsFound', 'No talents found')}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true))
                    ? t('talentSearch.adjustCriteria', 'Try adjusting your search or filters')
                    : t('talentSearch.noTalentsYet', 'No talents available yet')}
                </p>
              </div>
            )}
          </div>

          {/* Profile Preview - Right Side */}
          {selectedTalent && (
            <div className="w-2/5 sticky top-6 h-[calc(100vh-8rem)]">
              <TalentProfilePreview
                talent={selectedTalent}
                onClose={() => setSelectedTalent(null)}
                onSaveToProject={handleSaveToProject}
                onSendMessage={handleSendMessage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Save to Project Modal */}
      {talentToSave && (
        <SaveToProjectModal
          open={saveModalOpen}
          onOpenChange={setSaveModalOpen}
          candidateId={talentToSave.id}
          candidateName={talentToSave.full_name || 'Unknown'}
        />
      )}
    </div>
  );
};

export default TalentSearch;
