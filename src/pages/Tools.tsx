import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Grid, List, GitCompare, Star, Bookmark, Plus, TrendingUp, ArrowUpDown, Lock, Bot, Crown, X } from 'lucide-react';
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';
import ToolComparisonModal from '../components/ToolComparisonModal';
import PromoteContentModal from '../components/PromoteContentModal';
import ToolStars from '../components/ToolStars';
import ToolActionButtons from '../components/ToolActionButtons';
import SEOHead from '../components/SEOHead';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Tool {
  id: string;
  name: string;
  description: string;
  category_id: string;
  category_name?: string;
  subcategory?: string;
  pricing: string;
  website: string;
  features: string[];
  pros: string[];
  cons: string[];
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  average_rating: number;
  review_count: number;
  logo_url?: string;
}

const Tools: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showComparison, setShowComparison] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedToolsForComparison, setSelectedToolsForComparison] = useState<string[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Sorting and filtering
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'reviews' | 'name'>('newest');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'freemium' | 'paid'>('all');
  
  // Creator filter
  const [creatorFilter, setCreatorFilter] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchToolsAndCategories();
    checkPremiumStatus();
  }, []);

  // Handle creator filter from URL
  useEffect(() => {
    const creatorId = searchParams.get('creator');
    if (creatorId && !creatorFilter) {
      fetchCreatorDetails(creatorId);
    }
  }, [searchParams]);

  const fetchCreatorDetails = async (creatorId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles_safe')
        .select('id, full_name')
        .eq('id', creatorId)
        .single();
      
      if (!error && data) {
        setCreatorFilter({ id: data.id, name: data.full_name || 'Creator' });
      }
    } catch (error) {
      console.error('Error fetching creator details:', error);
    }
  };

  const clearCreatorFilter = () => {
    setCreatorFilter(null);
    setSearchParams(prev => {
      prev.delete('creator');
      return prev;
    });
  };

  const checkPremiumStatus = async () => {
    if (!user) {
      setIsPremium(false);
      return;
    }
    
    const { data } = await supabase
      .from('user_profiles')
      .select('is_premium, premium_until')
      .eq('id', user.id)
      .single();
    
    if (data) {
      const isActive = data.is_premium && (!data.premium_until || new Date(data.premium_until) > new Date());
      setIsPremium(isActive);
    }
  };

  const fetchToolsAndCategories = async () => {
    try {
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (toolsError) throw toolsError;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (categoriesError) throw categoriesError;

      const categoryMap = new Map(categoriesData?.map(cat => [cat.id, cat.name]) || []);

      const transformedTools = (toolsData || []).map(tool => ({
        ...tool,
        category_name: categoryMap.get(tool.category_id) || 'Uncategorized',
        average_rating: tool.average_rating || 0,
        review_count: tool.review_count || 0
      }));

      setTools(transformedTools);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToolDelete = () => {
    fetchToolsAndCategories();
  };

  const handleCompareClick = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setShowComparison(true);
  };

  // Filter and sort tools
  const filteredAndSortedTools = React.useMemo(() => {
    let result = tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tool.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || tool.category_id === selectedCategory;
      
      const matchesCreator = !creatorFilter || tool.user_id === creatorFilter.id;
      
      let matchesPrice = true;
      if (priceFilter !== 'all') {
        const pricing = tool.pricing.toLowerCase();
        if (priceFilter === 'free') {
          matchesPrice = pricing === 'free';
        } else if (priceFilter === 'freemium') {
          matchesPrice = pricing.includes('freemium') || pricing.includes('free tier');
        } else if (priceFilter === 'paid') {
          matchesPrice = !pricing.includes('free');
        }
      }
      
      return matchesSearch && matchesCategory && matchesPrice && matchesCreator;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'reviews':
          return (b.review_count || 0) - (a.review_count || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [tools, searchTerm, selectedCategory, sortBy, priceFilter, creatorFilter]);

  if (loading) {
    return (
      <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="AI Tools Directory - Discover & Compare 1000+ AI Tools"
        description="Browse our comprehensive AI tools directory. Find the best AI tools for writing, image generation, coding, productivity and more. Compare features, read reviews, and discover new AI solutions."
        keywords="AI tools directory, best AI tools, AI software, AI applications, AI comparison, AI reviews, ChatGPT alternatives, AI image generators, AI writing tools"
        url="https://aifeed.app/tools"
      />
      <div className="py-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {t('tools.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('tools.subtitle')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => navigate('/submit-tool')} size="sm" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('tools.submitTool')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCompareClick}
                  size="sm"
                >
                  {!isPremium && <Lock className="h-3 w-3 mr-1" />}
                  <GitCompare className="h-4 w-4 mr-1" />
                  {t('tools.compareTools')}
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('tools.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')} Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={(v: any) => setPriceFilter(v)}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')} Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="freemium">Freemium</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('common.newest')}</SelectItem>
                <SelectItem value="rating">{t('common.topRated')}</SelectItem>
                <SelectItem value="reviews">{t('common.mostReviews')}</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Creator filter badge */}
          {creatorFilter && (
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                <span>Tools by: {creatorFilter.name}</span>
                <button onClick={clearCreatorFilter} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-4">
            {t('tools.showing', { count: filteredAndSortedTools.length })}
          </p>

          {/* Empty State */}
          {tools.length === 0 ? (
            <div className="text-center py-16">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('tools.noTools')}</h3>
              <Button onClick={() => navigate('/submit-tool')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('tools.submitTool')}
              </Button>
            </div>
          ) : filteredAndSortedTools.length === 0 ? (
            <div className="text-center py-16">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('tools.noResults')}</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredAndSortedTools.map((tool) => (
                <Card 
                  key={tool.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow group overflow-hidden"
                  onClick={() => navigate(`/tools/${tool.id}`)}
                >
                  <CardContent className="p-3">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-2">
                      {tool.logo_url ? (
                        <img 
                          src={tool.logo_url} 
                          alt={tool.name}
                          className="w-10 h-10 rounded-lg object-contain bg-muted"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{tool.name}</h3>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {tool.category_name}
                        </Badge>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2 min-h-[32px]">
                      {tool.description}
                    </p>

                    {/* Rating & Price */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{tool.average_rating.toFixed(1)}</span>
                        <span className="text-[10px] text-muted-foreground">({tool.review_count})</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {tool.pricing}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                      <ToolActionButtons tool={tool} onDelete={handleToolDelete} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 ml-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isPremium) {
                            setShowPremiumModal(true);
                            return;
                          }
                          setSelectedTool(tool);
                          setShowPromoteModal(true);
                        }}
                      >
                        {!isPremium && <Lock className="h-2 w-2 mr-0.5" />}
                        <TrendingUp className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedTools.map((tool) => (
                <Card 
                  key={tool.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/tools/${tool.id}`)}
                >
                  <CardContent className="p-3 flex items-center gap-4">
                    {/* Logo */}
                    {tool.logo_url ? (
                      <img 
                        src={tool.logo_url} 
                        alt={tool.name}
                        className="w-12 h-12 rounded-lg object-contain bg-muted shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{tool.name}</h3>
                        <Badge variant="outline" className="text-xs shrink-0">{tool.category_name}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{tool.description}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{tool.average_rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({tool.review_count})</span>
                      </div>
                      <Badge variant="secondary">{tool.pricing}</Badge>
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                        <ToolActionButtons tool={tool} onDelete={handleToolDelete} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (!isPremium) {
                              setShowPremiumModal(true);
                              return;
                            }
                            setSelectedTool(tool);
                            setShowPromoteModal(true);
                          }}
                        >
                          {!isPremium && <Lock className="h-3 w-3 mr-1" />}
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      <ToolComparisonModal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        selectedTools={selectedToolsForComparison}
        tools={tools}
        onSelectionChange={setSelectedToolsForComparison}
      />

      {/* Promote Modal */}
      {selectedTool && (
        <PromoteContentModal
          isOpen={showPromoteModal}
          onClose={() => {
            setShowPromoteModal(false);
            setSelectedTool(null);
          }}
          contentId={selectedTool.id}
          contentType="tool"
          contentTitle={selectedTool.name}
        />
      )}

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        featureName={t('promotion.contentPromotion', 'Content Promotion')}
        trigger="premium_feature"
      />
    </>
  );
};

export default Tools;