import React, { useState, useEffect } from 'react';
import { Filter, X, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TalentSearchFiltersProps {
  onFilterChange?: (filters: any) => void;
}

const TalentSearchFilters: React.FC<TalentSearchFiltersProps> = ({ onFilterChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    skills: [] as string[],
    experience: '',
    location: '',
    language: '',
    languageLevel: ''
  });

  // Parse query params on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    setFilters({
      skills: params.get('skills')?.split(',') || [],
      experience: params.get('experience') || '',
      location: params.get('location') || '',
      language: params.get('language') || '',
      languageLevel: params.get('languageLevel') || ''
    });
  }, [location.search]);

  const handleFilterChange = (name: string, value: any) => {
    const newFilters = { ...filters, [name]: value };
    
    // If language is cleared, also clear languageLevel
    if (name === 'language' && !value) {
      newFilters.languageLevel = '';
    }
    
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams(location.search);
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(name, value.join(','));
      } else {
        params.delete(name);
      }
    } else if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    
    // Update URL without reloading the page
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    
    // Notify parent component
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const clearFilters = () => {
    setFilters({
      skills: [],
      experience: '',
      location: '',
      language: '',
      languageLevel: ''
    });
    
    // Clear URL params
    navigate(location.pathname, { replace: true });
    
    // Notify parent component
    if (onFilterChange) {
      onFilterChange({
        skills: [],
        experience: '',
        location: '',
        language: '',
        languageLevel: ''
      });
    }
  };

  const languages = [
    'English', 'Arabic', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
    'Chinese (Mandarin)', 'Japanese', 'Korean', 'Hindi', 'Bengali', 'Urdu', 'Turkish',
    'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian'
  ];

  const proficiencyLevels = [
    { value: 1, label: 'Beginner' },
    { value: 2, label: 'Elementary' },
    { value: 3, label: 'Intermediate' },
    { value: 4, label: 'Advanced' },
    { value: 5, label: 'Native/Fluent' }
  ];

  const experienceLevels = [
    { value: 'entry-level', label: 'Entry Level' },
    { value: 'mid-level', label: 'Mid Level' },
    { value: 'senior-level', label: 'Senior Level' },
    { value: 'executive', label: 'Executive' }
  ];

  const locations = [
    'Remote', 'United States', 'United Kingdom', 'Canada', 'Australia', 
    'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'India', 
    'Japan', 'China', 'Brazil', 'South Africa'
  ];

  const skills = [
    'Python', 'JavaScript', 'React', 'Node.js', 'Machine Learning',
    'Deep Learning', 'NLP', 'Computer Vision', 'Data Science',
    'TensorFlow', 'PyTorch', 'SQL', 'AWS', 'Azure', 'GCP',
    'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Agile'
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Always visible filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Language Dropdown */}
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <select
            id="language"
            value={filters.language}
            onChange={(e) => handleFilterChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Any language</option>
            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>

        {/* Language Level Dropdown - Only show if language is selected */}
        <div>
          <label htmlFor="languageLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Proficiency Level
          </label>
          <select
            id="languageLevel"
            value={filters.languageLevel}
            onChange={(e) => handleFilterChange('languageLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={!filters.language}
          >
            <option value="">Any level</option>
            {proficiencyLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Experience Level */}
        <div>
          <label htmlFor="experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Experience Level
          </label>
          <select
            id="experience"
            value={filters.experience}
            onChange={(e) => handleFilterChange('experience', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Any experience</option>
            {experienceLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <select
                id="location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Any location</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Skills - Multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skills
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <select
                  multiple
                  value={filters.skills}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    handleFilterChange('skills', selectedOptions);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  size={4}
                >
                  {skills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Hold Ctrl/Cmd to select multiple skills
              </p>
            </div>
          </div>

          {/* Selected Skills */}
          {filters.skills.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                  >
                    {skill}
                    <button
                      onClick={() => {
                        const newSkills = filters.skills.filter(s => s !== skill);
                        handleFilterChange('skills', newSkills);
                      }}
                      className="ml-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters Button */}
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalentSearchFilters;