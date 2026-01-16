import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Bot, User, Users, Briefcase, FileText, MessageSquare, X, Grid, List, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import PremiumBadge, { type PremiumTier } from '@/components/PremiumBadge';
import VerificationBadge from '@/components/VerificationBadge';
import { getCreatorProfileLink } from '@/utils/profileUtils';
import SEOHead from '@/components/SEOHead';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  premium_tier?: PremiumTier;
  role_id?: number;
  account_type?: string;
  verified?: boolean;
  ai_feed_top_voice?: boolean;
  handle?: string;
  extra?: Record<string, unknown>;
}

interface SearchResultsByType {
  tools: SearchResult[];
  creators: SearchResult[];
  groups: SearchResult[];
  jobs: SearchResult[];
  articles: SearchResult[];
  posts: SearchResult[];
}

type SearchType = 'all' | 'tools' | 'creators' | 'groups' | 'jobs' | 'articles' | 'posts';

const SearchResults: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const query = searchParams.get('q') || '';
  const typeParam = searchParams.get('type') as SearchType || 'all';
  
  const [searchTerm, setSearchTerm] = useState(query);
  const [activeTab, setActiveTab] = useState<SearchType>(typeParam);
  const [results, setResults] = useState<SearchResultsByType>({
    tools: [],
    creators: [],
    groups: [],
    jobs: [],
    articles: [],
    posts: []
  });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (query) {
      fetchResults(query);
    }
  }, [query]);

  useEffect(() => {
    setActiveTab(typeParam);
  }, [typeParam]);

  const fetchResults = async (search: string) => {
    if (!search.trim()) return;
    
    setLoading(true);
    const searchLower = search.trim().toLowerCase();

    try {
      const [toolsRes, creatorsRes, groupsRes, jobsRes, articlesRes, postsRes] = await Promise.all([
        supabase
          .from('tools')
          .select('id, name, description, logo_url, category_id, pricing')
          .eq('status', 'published')
          .or(`name.ilike.%${searchLower}%,description.ilike.%${searchLower}%`)
          .limit(50),
        supabase
          .from('user_profiles_safe')
          .select('id, full_name, job_title, profile_photo, premium_tier, role_id, account_type, handle, verified, ai_feed_top_voice, bio')
          .eq('visibility', 'public')
          .or(`full_name.ilike.%${searchLower}%,job_title.ilike.%${searchLower}%,bio.ilike.%${searchLower}%`)
          .limit(50),
        supabase
          .from('groups')
          .select('id, name, description, cover_image, member_count, is_private')
          .or(`name.ilike.%${searchLower}%,description.ilike.%${searchLower}%`)
          .limit(50),
        supabase
          .from('jobs')
          .select('id, title, company, location, type, experience, salary')
          .or(`title.ilike.%${searchLower}%,company.ilike.%${searchLower}%`)
          .limit(50),
        supabase
          .from('articles')
          .select('id, title, excerpt, featured_image_url, author, category, views')
          .eq('status', 'published')
          .or(`title.ilike.%${searchLower}%,excerpt.ilike.%${searchLower}%`)
          .limit(50),
        supabase
          .from('posts')
          .select('id, content, user_id, created_at')
          .eq('visibility', 'public')
          .ilike('content', `%${searchLower}%`)
          .limit(50),
      ]);

      const newResults: SearchResultsByType = {
        tools: (toolsRes.data || []).map((tool: any) => ({
          id: tool.id,
          title: tool.name,
          subtitle: tool.pricing,
          description: tool.description,
          image: tool.logo_url,
          extra: { pricing: tool.pricing }
        })),
        creators: (creatorsRes.data || []).map((creator: any) => {
          const isAdmin = creator.role_id === 1 || creator.account_type === 'admin';
          return {
            id: creator.id,
            title: creator.full_name || 'Unknown',
            subtitle: creator.job_title,
            description: creator.bio,
            image: creator.profile_photo,
            premium_tier: isAdmin ? 'gold' : (creator.premium_tier as PremiumTier),
            role_id: creator.role_id,
            account_type: creator.account_type,
            verified: creator.verified,
            ai_feed_top_voice: creator.ai_feed_top_voice,
            handle: creator.handle
          };
        }),
        groups: (groupsRes.data || []).map((group: any) => ({
          id: group.id,
          title: group.name,
          subtitle: `${group.member_count || 0} members`,
          description: group.description,
          image: group.cover_image,
          extra: { is_private: group.is_private }
        })),
        jobs: (jobsRes.data || []).map((job: any) => ({
          id: job.id,
          title: job.title,
          subtitle: `${job.company} • ${job.location}`,
          description: `${job.type} • ${job.experience}`,
          extra: { salary: job.salary }
        })),
        articles: (articlesRes.data || []).map((article: any) => ({
          id: article.id,
          title: article.title,
          subtitle: `${article.author} • ${article.category}`,
          description: article.excerpt,
          image: article.featured_image_url,
          extra: { views: article.views }
        })),
        posts: (postsRes.data || []).map((post: any) => ({
          id: post.id,
          title: post.content?.substring(0, 100) + (post.content?.length > 100 ? '...' : ''),
          subtitle: new Date(post.created_at).toLocaleDateString()
        })),
      };

      setResults(newResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim(), ...(activeTab !== 'all' && { type: activeTab }) });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as SearchType);
    if (tab === 'all') {
      setSearchParams({ q: query });
    } else {
      setSearchParams({ q: query, type: tab });
    }
  };

  const getResultCount = (type: keyof SearchResultsByType) => results[type].length;
  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tools': return <Bot className="h-4 w-4" />;
      case 'creators': return <User className="h-4 w-4" />;
      case 'groups': return <Users className="h-4 w-4" />;
      case 'jobs': return <Briefcase className="h-4 w-4" />;
      case 'articles': return <FileText className="h-4 w-4" />;
      case 'posts': return <MessageSquare className="h-4 w-4" />;
      default: return null;
    }
  };

  const renderToolCard = (result: SearchResult) => (
    <Card 
      key={result.id} 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/tools/${result.id}`)}
    >
      <div className="flex items-start gap-3">
        {result.image ? (
          <img src={result.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Bot className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{result.title}</h3>
          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
          {result.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
          )}
          {result.extra?.pricing && (
            <Badge variant="outline" className="mt-2">{result.extra.pricing as string}</Badge>
          )}
        </div>
      </div>
    </Card>
  );

  const renderCreatorCard = (result: SearchResult) => (
    <Card 
      key={result.id} 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(getCreatorProfileLink({ id: result.id, handle: result.handle }))}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="w-12 h-12">
            <AvatarImage src={result.image || ''} alt={result.title} />
            <AvatarFallback>{result.title?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          {(result.verified || result.ai_feed_top_voice) && (
            <div className="absolute -top-1 -right-1">
              <VerificationBadge 
                type={result.verified && result.ai_feed_top_voice ? 'both' : result.ai_feed_top_voice ? 'top-voice' : 'verified'}
                size="sm"
              />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-foreground truncate">{result.title}</h3>
            <PremiumBadge tier={result.premium_tier} size="sm" />
          </div>
          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
          {result.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
          )}
        </div>
      </div>
    </Card>
  );

  const renderGroupCard = (result: SearchResult) => (
    <Card 
      key={result.id} 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/community?group=${result.id}`)}
    >
      <div className="flex items-start gap-3">
        {result.image ? (
          <img src={result.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{result.title}</h3>
            {result.extra?.is_private && <Badge variant="secondary">Private</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
          {result.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
          )}
        </div>
      </div>
    </Card>
  );

  const renderJobCard = (result: SearchResult) => (
    <Card 
      key={result.id} 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/jobs?id=${result.id}`)}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Briefcase className="h-6 w-6 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{result.title}</h3>
          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
          {result.description && (
            <p className="text-sm text-muted-foreground mt-1">{result.description}</p>
          )}
          {result.extra?.salary && (
            <Badge variant="outline" className="mt-2">{result.extra.salary as string}</Badge>
          )}
        </div>
      </div>
    </Card>
  );

  const renderArticleCard = (result: SearchResult) => (
    <Card 
      key={result.id} 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/articles/${result.id}`)}
    >
      <div className="flex items-start gap-3">
        {result.image ? (
          <img src={result.image} alt="" className="w-16 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-16 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <FileText className="h-6 w-6 text-orange-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-1">{result.title}</h3>
          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
          {result.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
          )}
        </div>
      </div>
    </Card>
  );

  const renderPostCard = (result: SearchResult) => (
    <Card 
      key={result.id} 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/posts/${result.id}`)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-pink-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground line-clamp-3">{result.title}</p>
          <p className="text-xs text-muted-foreground mt-2">{result.subtitle}</p>
        </div>
      </div>
    </Card>
  );

  const renderResults = (type: keyof SearchResultsByType) => {
    const typeResults = results[type];
    if (typeResults.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          {t('search.noResultsFor', 'No {{type}} found for "{{query}}"', { type, query })}
        </div>
      );
    }

    return (
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
        {type === 'tools' && typeResults.map(renderToolCard)}
        {type === 'creators' && typeResults.map(renderCreatorCard)}
        {type === 'groups' && typeResults.map(renderGroupCard)}
        {type === 'jobs' && typeResults.map(renderJobCard)}
        {type === 'articles' && typeResults.map(renderArticleCard)}
        {type === 'posts' && typeResults.map(renderPostCard)}
      </div>
    );
  };

  const renderAllResults = () => {
    const hasResults = totalResults > 0;
    if (!hasResults) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          {t('search.noResults', 'No results found for "{{query}}"', { query })}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {results.tools.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              {t('search.categories.tools', 'Tools')} ({results.tools.length})
            </h3>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {results.tools.slice(0, 6).map(renderToolCard)}
            </div>
            {results.tools.length > 6 && (
              <Button variant="link" className="mt-2" onClick={() => handleTabChange('tools')}>
                {t('search.viewAll', 'View all {{count}} tools', { count: results.tools.length })}
              </Button>
            )}
          </div>
        )}
        {results.creators.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              {t('search.categories.creators', 'Creators')} ({results.creators.length})
            </h3>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {results.creators.slice(0, 6).map(renderCreatorCard)}
            </div>
            {results.creators.length > 6 && (
              <Button variant="link" className="mt-2" onClick={() => handleTabChange('creators')}>
                {t('search.viewAll', 'View all {{count}} creators', { count: results.creators.length })}
              </Button>
            )}
          </div>
        )}
        {results.articles.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              {t('search.categories.articles', 'Articles')} ({results.articles.length})
            </h3>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {results.articles.slice(0, 6).map(renderArticleCard)}
            </div>
            {results.articles.length > 6 && (
              <Button variant="link" className="mt-2" onClick={() => handleTabChange('articles')}>
                {t('search.viewAll', 'View all {{count}} articles', { count: results.articles.length })}
              </Button>
            )}
          </div>
        )}
        {results.groups.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              {t('search.categories.groups', 'Groups')} ({results.groups.length})
            </h3>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {results.groups.slice(0, 6).map(renderGroupCard)}
            </div>
            {results.groups.length > 6 && (
              <Button variant="link" className="mt-2" onClick={() => handleTabChange('groups')}>
                {t('search.viewAll', 'View all {{count}} groups', { count: results.groups.length })}
              </Button>
            )}
          </div>
        )}
        {results.jobs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-500" />
              {t('search.categories.jobs', 'Jobs')} ({results.jobs.length})
            </h3>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {results.jobs.slice(0, 6).map(renderJobCard)}
            </div>
            {results.jobs.length > 6 && (
              <Button variant="link" className="mt-2" onClick={() => handleTabChange('jobs')}>
                {t('search.viewAll', 'View all {{count}} jobs', { count: results.jobs.length })}
              </Button>
            )}
          </div>
        )}
        {results.posts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-pink-500" />
              {t('search.categories.posts', 'Posts')} ({results.posts.length})
            </h3>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {results.posts.slice(0, 6).map(renderPostCard)}
            </div>
            {results.posts.length > 6 && (
              <Button variant="link" className="mt-2" onClick={() => handleTabChange('posts')}>
                {t('search.viewAll', 'View all {{count}} posts', { count: results.posts.length })}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <SEOHead 
        title={query ? `Search: ${query}` : 'Search'}
        description={`Search results for "${query}" - Find tools, creators, articles, groups, jobs, and posts.`}
      />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search.placeholder', 'Search tools, creators, groups, jobs...')}
              className="w-full pl-12 pr-12 py-4 text-lg border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </form>
          {query && (
            <p className="text-center text-muted-foreground mt-4">
              {loading ? t('search.searching', 'Searching...') : t('search.resultsCount', '{{count}} results for "{{query}}"', { count: totalResults, query })}
            </p>
          )}
        </div>

        {/* Results Tabs */}
        {query && (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="flex items-center justify-between mb-6">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="all" className="gap-1">
                  {t('search.tabs.all', 'All')} ({totalResults})
                </TabsTrigger>
                <TabsTrigger value="tools" className="gap-1">
                  <Bot className="h-4 w-4" />
                  {t('search.tabs.tools', 'Tools')} ({getResultCount('tools')})
                </TabsTrigger>
                <TabsTrigger value="creators" className="gap-1">
                  <User className="h-4 w-4" />
                  {t('search.tabs.creators', 'Creators')} ({getResultCount('creators')})
                </TabsTrigger>
                <TabsTrigger value="articles" className="gap-1">
                  <FileText className="h-4 w-4" />
                  {t('search.tabs.articles', 'Articles')} ({getResultCount('articles')})
                </TabsTrigger>
                <TabsTrigger value="groups" className="gap-1">
                  <Users className="h-4 w-4" />
                  {t('search.tabs.groups', 'Groups')} ({getResultCount('groups')})
                </TabsTrigger>
                <TabsTrigger value="jobs" className="gap-1">
                  <Briefcase className="h-4 w-4" />
                  {t('search.tabs.jobs', 'Jobs')} ({getResultCount('jobs')})
                </TabsTrigger>
                <TabsTrigger value="posts" className="gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {t('search.tabs.posts', 'Posts')} ({getResultCount('posts')})
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <TabsContent value="all">{renderAllResults()}</TabsContent>
                <TabsContent value="tools">{renderResults('tools')}</TabsContent>
                <TabsContent value="creators">{renderResults('creators')}</TabsContent>
                <TabsContent value="articles">{renderResults('articles')}</TabsContent>
                <TabsContent value="groups">{renderResults('groups')}</TabsContent>
                <TabsContent value="jobs">{renderResults('jobs')}</TabsContent>
                <TabsContent value="posts">{renderResults('posts')}</TabsContent>
              </>
            )}
          </Tabs>
        )}

        {/* Empty State */}
        {!query && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {t('search.startSearching', 'Start searching')}
            </h2>
            <p className="text-muted-foreground">
              {t('search.searchHint', 'Search for tools, creators, articles, groups, jobs, and posts')}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default SearchResults;