import React, { useState, useEffect, useRef } from 'react';
import { Search, Bot, User, Users, Calendar, Briefcase, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'tool' | 'creator' | 'group' | 'event' | 'job';
  image?: string;
}

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ placeholder, className }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchAll = async () => {
      if (searchTerm.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      const search = searchTerm.trim().toLowerCase();

      try {
        const [toolsRes, creatorsRes, groupsRes, jobsRes] = await Promise.all([
          // Search tools
          supabase
            .from('tools')
            .select('id, name, description, logo_url')
            .eq('status', 'published')
            .or(`name.ilike.%${search}%,description.ilike.%${search}%`)
            .limit(3),
          // Search creators (users)
          supabase
            .from('user_profiles')
            .select('id, full_name, job_title, profile_photo')
            .eq('visibility', 'public')
            .or(`full_name.ilike.%${search}%,job_title.ilike.%${search}%`)
            .limit(3),
          // Search groups
          supabase
            .from('groups')
            .select('id, name, description, cover_image')
            .ilike('name', `%${search}%`)
            .limit(3),
          // Search jobs
          supabase
            .from('jobs')
            .select('id, title, company, location')
            .or(`title.ilike.%${search}%,company.ilike.%${search}%`)
            .limit(3),
        ]);

        const allResults: SearchResult[] = [];

        // Add tools
        (toolsRes.data || []).forEach(tool => {
          allResults.push({
            id: tool.id,
            title: tool.name,
            subtitle: tool.description?.substring(0, 50) + '...',
            type: 'tool',
            image: tool.logo_url
          });
        });

        // Add creators
        (creatorsRes.data || []).forEach(creator => {
          allResults.push({
            id: creator.id,
            title: creator.full_name || 'Unknown',
            subtitle: creator.job_title,
            type: 'creator',
            image: creator.profile_photo
          });
        });

        // Add groups
        (groupsRes.data || []).forEach(group => {
          allResults.push({
            id: group.id,
            title: group.name,
            subtitle: group.description?.substring(0, 50),
            type: 'group',
            image: group.cover_image
          });
        });

        // Add jobs
        (jobsRes.data || []).forEach(job => {
          allResults.push({
            id: job.id,
            title: job.title,
            subtitle: `${job.company} • ${job.location}`,
            type: 'job'
          });
        });

        setResults(allResults);
        setIsOpen(allResults.length > 0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchAll, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'tool': return <Bot className="h-4 w-4 text-primary" />;
      case 'creator': return <User className="h-4 w-4 text-blue-500" />;
      case 'group': return <Users className="h-4 w-4 text-green-500" />;
      case 'event': return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'job': return <Briefcase className="h-4 w-4 text-purple-500" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'tool': return t('search.categories.tools', 'Tool');
      case 'creator': return t('search.categories.creators', 'Creator');
      case 'group': return t('search.categories.groups', 'Group');
      case 'event': return t('search.categories.events', 'Event');
      case 'job': return t('search.categories.jobs', 'Job');
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setSearchTerm('');
    
    switch (result.type) {
      case 'tool':
        navigate(`/tools/${result.id}`);
        break;
      case 'creator':
        navigate(`/profile/${result.id}`);
        break;
      case 'group':
        navigate(`/community?group=${result.id}`);
        break;
      case 'job':
        navigate(`/jobs?id=${result.id}`);
        break;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder || t('search.placeholder', 'Search tools, creators, groups, jobs...')}
          className="pl-10 pr-8 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-full transition-all duration-200 bg-card text-foreground"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {t('search.noResults', 'No results found')}
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                >
                  {result.image ? (
                    <img
                      src={result.image}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-muted"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      {getTypeIcon(result.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-sm text-muted-foreground truncate">{result.subtitle}</div>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {getTypeLabel(result.type)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
