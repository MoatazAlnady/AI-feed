import React, { useState, useEffect } from 'react';
import { Filter, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MultiSelectCombobox, SingleSelectCombobox, MultiSelectOption } from '@/components/ui/multi-select-combobox';
import { supabase } from '@/lib/supabase';

interface TalentSearchFiltersProps {
  onFilterChange?: (filters: TalentFilters) => void;
}

export interface TalentFilters {
  skills: string[];
  languages: string[];
  languageLevel: string;
  countries: string[];
  cities: string[];
  industries: string[];
  companySizes: string[];
  experienceLevels: string[];
  jobTitles: string[];
  genders: string[];
  ageRange: [number, number];
  verifiedOnly: boolean;
  accountTypes: string[];
  booleanOperator: 'AND' | 'OR';
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

const TalentSearchFilters: React.FC<TalentSearchFiltersProps> = ({ onFilterChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [filters, setFilters] = useState<TalentFilters>(defaultFilters);
  
  // Dynamic options from database
  const [interestOptions, setInterestOptions] = useState<MultiSelectOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<MultiSelectOption[]>([]);

  // Static options
  const languageOptions: MultiSelectOption[] = [
    { value: 'English', label: 'English' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
    { value: 'Italian', label: 'Italian' },
    { value: 'Portuguese', label: 'Portuguese' },
    { value: 'Russian', label: 'Russian' },
    { value: 'Chinese (Mandarin)', label: 'Chinese (Mandarin)' },
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Korean', label: 'Korean' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Bengali', label: 'Bengali' },
    { value: 'Urdu', label: 'Urdu' },
    { value: 'Turkish', label: 'Turkish' },
    { value: 'Dutch', label: 'Dutch' },
    { value: 'Swedish', label: 'Swedish' },
    { value: 'Norwegian', label: 'Norwegian' },
    { value: 'Danish', label: 'Danish' },
    { value: 'Finnish', label: 'Finnish' },
    { value: 'Polish', label: 'Polish' },
    { value: 'Czech', label: 'Czech' },
    { value: 'Hungarian', label: 'Hungarian' },
    { value: 'Persian', label: 'Persian' },
  ];

  const proficiencyLevelOptions: MultiSelectOption[] = [
    { value: '1', label: 'Beginner' },
    { value: '2', label: 'Elementary' },
    { value: '3', label: 'Intermediate' },
    { value: '4', label: 'Advanced' },
    { value: '5', label: 'Native/Fluent' },
  ];

  const experienceLevelOptions: MultiSelectOption[] = [
    { value: 'entry-level', label: 'Entry Level (0-2 years)' },
    { value: 'mid-level', label: 'Mid Level (3-5 years)' },
    { value: 'senior-level', label: 'Senior Level (6-10 years)' },
    { value: 'executive', label: 'Executive (10+ years)' },
  ];

  const companySizeOptions: MultiSelectOption[] = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' },
  ];

  const industryOptions: MultiSelectOption[] = [
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'education', label: 'Education' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'media', label: 'Media & Entertainment' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'energy', label: 'Energy & Utilities' },
    { value: 'transportation', label: 'Transportation & Logistics' },
    { value: 'hospitality', label: 'Hospitality & Tourism' },
    { value: 'non-profit', label: 'Non-Profit' },
    { value: 'government', label: 'Government' },
    { value: 'other', label: 'Other' },
  ];

  const genderOptions: MultiSelectOption[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ];

  const accountTypeOptions: MultiSelectOption[] = [
    { value: 'creator', label: 'Creator' },
    { value: 'employer', label: 'Employer' },
  ];

  // Fetch dynamic options
  useEffect(() => {
    const fetchOptions = async () => {
      // Fetch interests/skills
      const { data: interests } = await supabase
        .from('interests')
        .select('id, name')
        .order('name');
      
      if (interests) {
        setInterestOptions(interests.map(i => ({ value: i.name, label: i.name })));
      }

      // Fetch countries
      const { data: countries } = await supabase
        .from('country_codes')
        .select('country_name, country_code')
        .order('country_name');
      
      if (countries) {
        setCountryOptions(countries.map(c => ({ value: c.country_name, label: c.country_name })));
      }
    };

    fetchOptions();
  }, []);

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    const parseArrayParam = (key: string): string[] => {
      const value = params.get(key);
      return value ? value.split(',').filter(Boolean) : [];
    };

    const ageMin = parseInt(params.get('ageMin') || '18');
    const ageMax = parseInt(params.get('ageMax') || '65');

    setFilters({
      skills: parseArrayParam('skills'),
      languages: parseArrayParam('languages'),
      languageLevel: params.get('languageLevel') || '',
      countries: parseArrayParam('countries'),
      cities: parseArrayParam('cities'),
      industries: parseArrayParam('industries'),
      companySizes: parseArrayParam('companySizes'),
      experienceLevels: parseArrayParam('experienceLevels'),
      jobTitles: parseArrayParam('jobTitles'),
      genders: parseArrayParam('genders'),
      ageRange: [ageMin, ageMax],
      verifiedOnly: params.get('verifiedOnly') === 'true',
      accountTypes: parseArrayParam('accountTypes'),
      booleanOperator: (params.get('operator') as 'AND' | 'OR') || 'AND',
    });
  }, []);

  const updateFilters = (newFilters: TalentFilters) => {
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    
    const setArrayParam = (key: string, values: string[]) => {
      if (values.length > 0) {
        params.set(key, values.join(','));
      }
    };

    setArrayParam('skills', newFilters.skills);
    setArrayParam('languages', newFilters.languages);
    if (newFilters.languageLevel) params.set('languageLevel', newFilters.languageLevel);
    setArrayParam('countries', newFilters.countries);
    setArrayParam('cities', newFilters.cities);
    setArrayParam('industries', newFilters.industries);
    setArrayParam('companySizes', newFilters.companySizes);
    setArrayParam('experienceLevels', newFilters.experienceLevels);
    setArrayParam('jobTitles', newFilters.jobTitles);
    setArrayParam('genders', newFilters.genders);
    if (newFilters.ageRange[0] !== 18) params.set('ageMin', newFilters.ageRange[0].toString());
    if (newFilters.ageRange[1] !== 65) params.set('ageMax', newFilters.ageRange[1].toString());
    if (newFilters.verifiedOnly) params.set('verifiedOnly', 'true');
    setArrayParam('accountTypes', newFilters.accountTypes);
    if (newFilters.booleanOperator !== 'AND') params.set('operator', newFilters.booleanOperator);

    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleFilterChange = <K extends keyof TalentFilters>(key: K, value: TalentFilters[K]) => {
    const newFilters = { ...filters, [key]: value };
    
    // Clear language level if no languages selected
    if (key === 'languages' && (value as string[]).length === 0) {
      newFilters.languageLevel = '';
    }
    
    updateFilters(newFilters);
  };

  const clearFilters = () => {
    updateFilters(defaultFilters);
    navigate(location.pathname, { replace: true });
  };

  const activeFilterCount = [
    filters.skills.length > 0,
    filters.languages.length > 0,
    filters.countries.length > 0,
    filters.cities.length > 0,
    filters.industries.length > 0,
    filters.companySizes.length > 0,
    filters.experienceLevels.length > 0,
    filters.jobTitles.length > 0,
    filters.genders.length > 0,
    filters.ageRange[0] !== 18 || filters.ageRange[1] !== 65,
    filters.verifiedOnly,
    filters.accountTypes.length > 0,
  ].filter(Boolean).length;

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">
                {t('talentSearch.filters', 'Filters')}
              </CardTitle>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <RotateCcw className="h-4 w-4" />
                  {t('talentSearch.clearAll', 'Clear All')}
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Boolean Operator Toggle */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">Match:</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant={filters.booleanOperator === 'AND' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('booleanOperator', 'AND')}
                >
                  All filters (AND)
                </Button>
                <Button
                  variant={filters.booleanOperator === 'OR' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('booleanOperator', 'OR')}
                >
                  Any filter (OR)
                </Button>
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Skills */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('talentSearch.skills', 'Skills & Interests')}</Label>
                <MultiSelectCombobox
                  options={interestOptions.length > 0 ? interestOptions : [
                    { value: 'Python', label: 'Python' },
                    { value: 'JavaScript', label: 'JavaScript' },
                    { value: 'React', label: 'React' },
                    { value: 'Node.js', label: 'Node.js' },
                    { value: 'Machine Learning', label: 'Machine Learning' },
                    { value: 'Data Science', label: 'Data Science' },
                    { value: 'AI', label: 'AI' },
                    { value: 'Cloud Computing', label: 'Cloud Computing' },
                  ]}
                  selected={filters.skills}
                  onChange={(value) => handleFilterChange('skills', value)}
                  placeholder={t('talentSearch.selectSkills', 'Select skills...')}
                  searchPlaceholder={t('talentSearch.searchSkills', 'Search skills...')}
                />
              </div>

              {/* Languages */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('talentSearch.languages', 'Languages')}</Label>
                <MultiSelectCombobox
                  options={languageOptions}
                  selected={filters.languages}
                  onChange={(value) => handleFilterChange('languages', value)}
                  placeholder={t('talentSearch.selectLanguages', 'Select languages...')}
                  searchPlaceholder={t('talentSearch.searchLanguages', 'Search languages...')}
                />
              </div>

              {/* Language Proficiency */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('talentSearch.proficiency', 'Min. Proficiency')}</Label>
                <SingleSelectCombobox
                  options={proficiencyLevelOptions}
                  value={filters.languageLevel}
                  onChange={(value) => handleFilterChange('languageLevel', value)}
                  placeholder={t('talentSearch.anyLevel', 'Any level')}
                  disabled={filters.languages.length === 0}
                />
              </div>

              {/* Countries */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('talentSearch.countries', 'Countries')}</Label>
                <MultiSelectCombobox
                  options={countryOptions.length > 0 ? countryOptions : [
                    { value: 'United States', label: 'United States' },
                    { value: 'United Kingdom', label: 'United Kingdom' },
                    { value: 'Canada', label: 'Canada' },
                    { value: 'Germany', label: 'Germany' },
                    { value: 'France', label: 'France' },
                  ]}
                  selected={filters.countries}
                  onChange={(value) => handleFilterChange('countries', value)}
                  placeholder={t('talentSearch.selectCountries', 'Select countries...')}
                  searchPlaceholder={t('talentSearch.searchCountries', 'Search countries...')}
                />
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('talentSearch.experience', 'Experience Level')}</Label>
                <MultiSelectCombobox
                  options={experienceLevelOptions}
                  selected={filters.experienceLevels}
                  onChange={(value) => handleFilterChange('experienceLevels', value)}
                  placeholder={t('talentSearch.selectExperience', 'Select experience...')}
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('talentSearch.industry', 'Industry')}</Label>
                <MultiSelectCombobox
                  options={industryOptions}
                  selected={filters.industries}
                  onChange={(value) => handleFilterChange('industries', value)}
                  placeholder={t('talentSearch.selectIndustry', 'Select industry...')}
                  searchPlaceholder={t('talentSearch.searchIndustry', 'Search industry...')}
                />
              </div>

              {/* Company Size */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('talentSearch.companySize', 'Company Size')}</Label>
                <MultiSelectCombobox
                  options={companySizeOptions}
                  selected={filters.companySizes}
                  onChange={(value) => handleFilterChange('companySizes', value)}
                  placeholder={t('talentSearch.selectCompanySize', 'Select size...')}
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('talentSearch.gender', 'Gender')}</Label>
                <MultiSelectCombobox
                  options={genderOptions}
                  selected={filters.genders}
                  onChange={(value) => handleFilterChange('genders', value)}
                  placeholder={t('talentSearch.selectGender', 'Select gender...')}
                />
              </div>

              {/* Account Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('talentSearch.accountType', 'Account Type')}</Label>
                <MultiSelectCombobox
                  options={accountTypeOptions}
                  selected={filters.accountTypes}
                  onChange={(value) => handleFilterChange('accountTypes', value)}
                  placeholder={t('talentSearch.selectAccountType', 'Select type...')}
                />
              </div>

              {/* Age Range */}
              <div className="space-y-2 col-span-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('talentSearch.ageRange', 'Age Range')}</Label>
                  <span className="text-sm text-muted-foreground">
                    {filters.ageRange[0]} - {filters.ageRange[1]} years
                  </span>
                </div>
                <Slider
                  value={filters.ageRange}
                  onValueChange={(value) => handleFilterChange('ageRange', value as [number, number])}
                  min={18}
                  max={65}
                  step={1}
                  className="py-2"
                />
              </div>

              {/* Verified Only Toggle */}
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <Label className="text-sm font-medium cursor-pointer" htmlFor="verified-only">
                  {t('talentSearch.verifiedOnly', 'Verified profiles only')}
                </Label>
                <Switch
                  id="verified-only"
                  checked={filters.verifiedOnly}
                  onCheckedChange={(checked) => handleFilterChange('verifiedOnly', checked)}
                />
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="mt-6 pt-4 border-t">
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Active Filters:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {filters.skills.map(skill => (
                    <Badge key={`skill-${skill}`} variant="secondary" className="gap-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleFilterChange('skills', filters.skills.filter(s => s !== skill))}
                      />
                    </Badge>
                  ))}
                  {filters.languages.map(lang => (
                    <Badge key={`lang-${lang}`} variant="secondary" className="gap-1">
                      {lang}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleFilterChange('languages', filters.languages.filter(l => l !== lang))}
                      />
                    </Badge>
                  ))}
                  {filters.countries.map(country => (
                    <Badge key={`country-${country}`} variant="secondary" className="gap-1">
                      {country}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleFilterChange('countries', filters.countries.filter(c => c !== country))}
                      />
                    </Badge>
                  ))}
                  {filters.experienceLevels.map(exp => (
                    <Badge key={`exp-${exp}`} variant="secondary" className="gap-1">
                      {experienceLevelOptions.find(o => o.value === exp)?.label || exp}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleFilterChange('experienceLevels', filters.experienceLevels.filter(e => e !== exp))}
                      />
                    </Badge>
                  ))}
                  {filters.industries.map(ind => (
                    <Badge key={`ind-${ind}`} variant="secondary" className="gap-1">
                      {industryOptions.find(o => o.value === ind)?.label || ind}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleFilterChange('industries', filters.industries.filter(i => i !== ind))}
                      />
                    </Badge>
                  ))}
                  {filters.verifiedOnly && (
                    <Badge variant="secondary" className="gap-1">
                      Verified Only
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleFilterChange('verifiedOnly', false)}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default TalentSearchFilters;
