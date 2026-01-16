import React, { useState, useEffect, useRef } from 'react';
import { Search, Bot, User, Users, Briefcase, X, FileText, MessageSquare, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PremiumBadge, { type PremiumTier } from '@/components/PremiumBadge';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'tool' | 'creator' | 'group' | 'job' | 'article' | 'post';
  image?: string;
  premium_tier?: PremiumTier;
  role_id?: number;
  account_type?: string;
}

interface GroupedResults {
  tools: SearchResult[];
  creators: SearchResult[];
  groups: SearchResult[];
  jobs: SearchResult[];
  articles: SearchResult[];
  posts: SearchResult[];
}

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ placeholder, className }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [groupedResults, setGroupedResults] = useState<GroupedResults>({
    tools: [],
    creators: [],
    groups: [],
    jobs: [],
    articles: [],
    posts: []
  });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalResults = Object.values(groupedResults).reduce((sum, arr) => sum + arr.length, 0);

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
        setGroupedResults({ tools: [], creators: [], groups: [], jobs: [], articles: [], posts: [] });
        setIsOpen(false);
        return;
      }

      setLoading(true);
      const search = searchTerm.trim().toLowerCase();

      try {
        const [toolsRes, creatorsRes, groupsRes, jobsRes, articlesRes, postsRes] = await Promise.all([
          // Search tools
          supabase
            .from('tools')
            .select('id, name, description, logo_url')
            .eq('status', 'published')
            .or(`name.ilike.%${search}%,description.ilike.%${search}%`)
            .limit(3),
          // Search creators (using user_profiles_safe view for public profiles)
          supabase
            .from('user_profiles_safe')
            .select('id, full_name, job_title, profile_photo, premium_tier, role_id, account_type, handle')
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
          // Search articles
          supabase
            .from('articles')
            .select('id, title, excerpt, featured_image_url')
            .eq('status', 'published')
            .or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
            .limit(3),
          // Search posts (no status column - filter by visibility)
          supabase
            .from('posts')
            .select('id, content, user_id')
            .eq('visibility', 'public')
            .ilike('content', `%${search}%`)
            .limit(3),
        ]);

        const newGroupedResults: GroupedResults = {
          tools: [],
          creators: [],
          groups: [],
          jobs: [],
          articles: [],
          posts: []
        };

        // Add tools
        (toolsRes.data || []).forEach(tool => {
          newGroupedResults.tools.push({
            id: tool.id,
            title: tool.name,
            subtitle: tool.description?.substring(0, 50) + '...',
            type: 'tool',
            image: tool.logo_url
          });
        });

        // Add creators with admin override logic
        (creatorsRes.data || []).forEach(creator => {
          const isAdmin = creator.role_id === 1 || creator.account_type === 'admin';
          newGroupedResults.creators.push({
            id: creator.id,
            title: creator.full_name || 'Unknown',
            subtitle: creator.job_title,
            type: 'creator',
            image: creator.profile_photo,
            premium_tier: isAdmin ? 'gold' : (creator.premium_tier as PremiumTier),
            role_id: creator.role_id,
            account_type: creator.account_type
          });
        });

        // Add groups
        (groupsRes.data || []).forEach(group => {
          newGroupedResults.groups.push({
            id: group.id,
            title: group.name,
            subtitle: group.description?.substring(0, 50),
            type: 'group',
            image: group.cover_image
          });
        });

        // Add jobs
        (jobsRes.data || []).forEach(job => {
          newGroupedResults.jobs.push({
            id: job.id,
            title: job.title,
            subtitle: `${job.company} • ${job.location}`,
            type: 'job'
          });
        });

        // Add articles
        (articlesRes.data || []).forEach(article => {
          newGroupedResults.articles.push({
            id: article.id,
            title: article.title,
            subtitle: article.excerpt?.substring(0, 50),
            type: 'article',
            image: article.featured_image_url
          });
        });

        // Add posts
        (postsRes.data || []).forEach(post => {
          newGroupedResults.posts.push({
            id: post.id,
            title: post.content?.substring(0, 60) + '...',
            type: 'post'
          });
        });

        setGroupedResults(newGroupedResults);
        const hasResults = Object.values(newGroupedResults).some(arr => arr.length > 0);
        setIsOpen(hasResults);
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
      case 'job': return <Briefcase className="h-4 w-4 text-purple-500" />;
      case 'article': return <FileText className="h-4 w-4 text-orange-500" />;
      case 'post': return <MessageSquare className="h-4 w-4 text-pink-500" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'tool': return t('search.categories.tools', 'Tool');
      case 'creator': return t('search.categories.creators', 'Creator');
      case 'group': return t('search.categories.groups', 'Group');
      case 'job': return t('search.categories.jobs', 'Job');
      case 'article': return t('search.categories.articles', 'Article');
      case 'post': return t('search.categories.posts', 'Post');
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
        navigate(`/creator/${result.id}`);
        break;
      case 'group':
        navigate(`/community?group=${result.id}`);
        break;
      case 'job':
        navigate(`/jobs?id=${result.id}`);
        break;
      case 'article':
        navigate(`/articles/${result.id}`);
        break;
      case 'post':
        navigate(`/posts/${result.id}`);
        break;
    }
  };

  const handleSeeAll = (type?: string) => {
    setIsOpen(false);
    const query = encodeURIComponent(searchTerm);
    if (type) {
      navigate(`/search?q=${query}&type=${type}`);
    } else {
      navigate(`/search?q=${query}`);
    }
    setSearchTerm('');
  };

  const renderResultGroup = (type: keyof GroupedResults, results: SearchResult[]) => {
    if (results.length === 0) return null;

    // Map plural keys to singular type for getTypeLabel
    const singularType = type.endsWith('s') ? type.slice(0, -1) : type;
    const typeLabel = getTypeLabel(singularType as SearchResult['type']) || type;

    return (
      <div key={type} className="border-b border-border last:border-b-0">
        <div className="px-3 py-2 bg-muted/50">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {typeLabel}s ({results.length})
          </span>
        </div>
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
              <div className="font-medium text-foreground truncate flex items-center gap-1.5">
                {result.title}
                {result.type === 'creator' && <PremiumBadge tier={result.premium_tier} size="sm" />}
              </div>
              {result.subtitle && (
                <div className="text-sm text-muted-foreground truncate">{result.subtitle}</div>
              )}
            </div>
          </button>
        ))}
        <button
          onClick={() => handleSeeAll(type)}
          className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-primary hover:bg-muted transition-colors"
        >
          {t('search.seeAll', 'See all')} {typeLabel.toLowerCase()}s
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
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
          onFocus={() => totalResults > 0 && setIsOpen(true)}
          placeholder={placeholder || t('search.placeholder', 'Search tools, creators, groups, jobs...')}
          className="pl-10 pr-8 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-full transition-all duration-200 bg-card text-foreground"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setGroupedResults({ tools: [], creators: [], groups: [], jobs: [], articles: [], posts: [] });
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
          ) : totalResults === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {t('search.noResults', 'No results found')}
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                {renderResultGroup('tools', groupedResults.tools)}
                {renderResultGroup('creators', groupedResults.creators)}
                {renderResultGroup('articles', groupedResults.articles)}
                {renderResultGroup('groups', groupedResults.groups)}
                {renderResultGroup('jobs', groupedResults.jobs)}
                {renderResultGroup('posts', groupedResults.posts)}
              </div>
              {/* See All Results Button */}
              <div className="border-t border-border">
                <button
                  onClick={() => handleSeeAll()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-muted transition-colors"
                >
                  {t('search.seeAllResults', 'See All Results')} ({totalResults})
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;