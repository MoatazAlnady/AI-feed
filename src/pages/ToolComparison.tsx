import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, 
  ExternalLink, 
  Star, 
  TrendingUp,
  MessageSquare,
  Bot,
  Lock
} from 'lucide-react';

interface ToolComparisonData {
  id: string;
  name: string;
  description: string;
  website: string;
  pricing: string;
  features: string[];
  pros: string[];
  cons: string[];
  tags: string[];
  average_rating: number;
  review_count: number;
  logo_url?: string;
  category_name?: string;
  updated_at?: string;
  reviews: Array<{
    id: string;
    rating: number;
    title?: string;
    comment?: string;
    user_profiles?: {
      full_name: string;
    };
    created_at: string;
  }>;
}

const ToolComparison: React.FC = () => {
  const { t } = useTranslation();
  const { toolIds } = useParams<{ toolIds: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [tools, setTools] = useState<ToolComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(true);

  useEffect(() => {
    checkPremiumStatus();
  }, [user]);

  useEffect(() => {
    if (!checkingPremium && toolIds) {
      if (!isPremium) {
        toast({
          title: t('toolComparison.premiumRequired'),
          description: t('toolComparison.premiumDescription'),
          variant: 'destructive'
        });
        navigate('/upgrade');
        return;
      }
      
      const ids = toolIds.split(',');
      if (ids.length > 5) {
        toast({
          title: t('toolComparison.tooManyTools'),
          description: t('toolComparison.maxTools'),
          variant: "destructive"
        });
        navigate('/tools');
        return;
      }
      fetchToolsData(ids);
    }
  }, [toolIds, checkingPremium, isPremium]);

  const checkPremiumStatus = async () => {
    setCheckingPremium(true);
    if (!user) {
      setIsPremium(false);
      setCheckingPremium(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_premium, premium_until')
      .eq('id', user.id)
      .single();
    
    if (!error && data) {
      const isActive = data.is_premium && (!data.premium_until || new Date(data.premium_until) > new Date());
      setIsPremium(isActive);
    }
    setCheckingPremium(false);
  };

  const fetchToolsData = async (ids: string[]) => {
    try {
      setLoading(true);
      
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .in('id', ids)
        .eq('status', 'published');

      if (toolsError) throw toolsError;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');

      if (categoriesError) throw categoriesError;

      const toolsWithReviews = await Promise.all(
        toolsData.map(async (tool) => {
          const { data: reviews } = await supabase
            .from('tool_reviews')
            .select(`id, rating, title, comment, created_at`)
            .eq('tool_id', tool.id)
            .order('created_at', { ascending: false })
            .limit(10);

          const formattedReviews = (reviews || []).map(review => ({
            ...review,
            user_profiles: { full_name: 'Anonymous' }
          }));

          return { ...tool, reviews: formattedReviews };
        })
      );

      const categoryMap = new Map(categoriesData?.map(cat => [cat.id, cat.name]) || []);

      const formattedTools = toolsWithReviews.map(tool => ({
        ...tool,
        category_name: categoryMap.get(tool.category_id) || 'Uncategorized',
        average_rating: tool.average_rating || 0,
        review_count: tool.review_count || 0
      }));

      setTools(formattedTools);
      await loadOrGenerateAIInsight(formattedTools, ids);
    } catch (error) {
      console.error('Error fetching tools data:', error);
      toast({
        title: t('common.error'),
        description: t('toolComparison.loadError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateToolIdsHash = (ids: string[]) => {
    return [...ids].sort().join('-');
  };

  const loadOrGenerateAIInsight = async (toolsData: ToolComparisonData[], ids: string[]) => {
    setGeneratingInsight(true);
    const hash = generateToolIdsHash(ids);
    
    try {
      // Check cache first
      const { data: cached } = await supabase
        .from('tool_comparison_cache')
        .select('*')
        .eq('tool_ids_hash', hash)
        .single();

      if (cached) {
        // Check if cache is still valid (tools haven't been updated)
        const maxUpdatedAt = Math.max(...toolsData.map(t => new Date(t.updated_at || 0).getTime()));
        const cacheToolsUpdatedAt = cached.tools_max_updated_at ? new Date(cached.tools_max_updated_at).getTime() : 0;
        
        if (maxUpdatedAt <= cacheToolsUpdatedAt) {
          setAiInsight(cached.ai_insight);
          setGeneratingInsight(false);
          return;
        }
      }

      // Generate new insight
      const insight = generateInsightContent(toolsData);
      setAiInsight(insight);

      // Store in cache
      const maxUpdatedAt = new Date(Math.max(...toolsData.map(t => new Date(t.updated_at || 0).getTime())));
      const categoryIds = [...new Set(toolsData.map(t => t.category_name))];

      await supabase
        .from('tool_comparison_cache')
        .upsert({
          tool_ids_hash: hash,
          tool_ids: ids,
          ai_insight: insight,
          category_ids: categoryIds,
          tools_max_updated_at: maxUpdatedAt.toISOString(),
          generated_at: new Date().toISOString()
        }, { onConflict: 'tool_ids_hash' });

    } catch (error) {
      console.error('Error with AI insight:', error);
      const insight = generateInsightContent(toolsData);
      setAiInsight(insight);
    } finally {
      setGeneratingInsight(false);
    }
  };

  const generateInsightContent = (toolsData: ToolComparisonData[]) => {
    const toolNames = toolsData.map(t => t.name).join(', ');
    const avgRatings = toolsData.map(t => `${t.name}: ${t.average_rating.toFixed(1)}/5`).join(', ');
    const pricingComparison = toolsData.map(t => `${t.name}: ${t.pricing}`).join(', ');
    
    const topRated = toolsData.reduce((prev, current) => 
      prev.average_rating > current.average_rating ? prev : current
    );
    
    const mostReviewed = toolsData.reduce((prev, current) => 
      prev.review_count > current.review_count ? prev : current
    );

    return `## AI-Generated Comparison Summary

**Tools Compared:** ${toolNames}

**Overall Ratings:** ${avgRatings}

**Pricing Comparison:** ${pricingComparison}

**Key Insights:**
• **Highest Rated:** ${topRated.name} (${topRated.average_rating.toFixed(1)}/5 stars)
• **Most Popular:** ${mostReviewed.name} (${mostReviewed.review_count} reviews)

**Feature Analysis:**
${toolsData.map(tool => `
**${tool.name}:**
- Key Features: ${(tool.features || []).slice(0, 3).join(', ') || 'Not specified'}
- Main Strengths: ${(tool.pros || []).slice(0, 2).join(', ') || 'Not specified'}
- Considerations: ${(tool.cons || []).slice(0, 2).join(', ') || 'Not specified'}
`).join('')}

**Recommendation:**
Based on the data analysis, ${topRated.name} appears to be the top choice with the highest user satisfaction rating. However, consider ${mostReviewed.name} if you value community feedback and proven adoption. Your final choice should depend on your specific use case, budget, and feature requirements.`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  if (checkingPremium || loading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-6">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>{t('toolComparison.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="container max-w-7xl mx-auto py-16 px-6">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-8 pb-6">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">{t('toolComparison.premiumRequired')}</h2>
            <p className="text-muted-foreground mb-6">{t('toolComparison.premiumDescription')}</p>
            <Button onClick={() => navigate('/upgrade')}>
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/tools')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('toolComparison.backToTools')}
          </Button>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
            {t('toolComparison.title')}
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            {t('toolComparison.subtitle', { count: tools.length })}
          </p>
        </div>
      </div>

      {/* Horizontal Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium text-muted-foreground min-w-[150px]">{t('toolComparison.table.tool')}</th>
              {tools.map(tool => (
                <th key={tool.id} className="text-center p-4 min-w-[250px]">
                  <div className="flex flex-col items-center gap-2">
                    {tool.logo_url ? (
                      <img 
                        src={tool.logo_url} 
                        alt={`${tool.name} logo`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <Bot className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="text-center">
                      <h3 className="font-semibold text-lg">{tool.name}</h3>
                      <Badge variant="outline" className="text-xs mt-1">
                        {tool.category_name}
                      </Badge>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b bg-muted/20">
              <td className="p-4 font-medium">{t('toolComparison.table.rating')}</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center">
                      {renderStars(tool.average_rating)}
                    </div>
                    <span className="text-sm font-medium">{tool.average_rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({tool.review_count})
                    </span>
                  </div>
                </td>
              ))}
            </tr>
            
            <tr className="border-b">
              <td className="p-4 font-medium">{t('toolComparison.table.pricing')}</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4 text-center">
                  <Badge variant="secondary">{tool.pricing}</Badge>
                </td>
              ))}
            </tr>
            
            <tr className="border-b bg-muted/20">
              <td className="p-4 font-medium">{t('toolComparison.table.description')}</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4">
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </td>
              ))}
            </tr>
            
            <tr className="border-b">
              <td className="p-4 font-medium">{t('toolComparison.table.keyFeatures')}</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4">
                  <div className="space-y-1">
                    {(tool.features || []).slice(0, 5).map((feature, index) => (
                      <div key={index} className="text-sm flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            
            <tr className="border-b bg-muted/20">
              <td className="p-4 font-medium text-green-600">{t('toolComparison.table.pros')}</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4">
                  <div className="space-y-1">
                    {(tool.pros || []).slice(0, 4).map((pro, index) => (
                      <div key={index} className="text-sm flex items-start gap-2">
                        <TrendingUp className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                        <span>{pro}</span>
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            
            <tr className="border-b">
              <td className="p-4 font-medium text-orange-600">{t('toolComparison.table.cons')}</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4">
                  <div className="space-y-1">
                    {(tool.cons || []).slice(0, 4).map((con, index) => (
                      <div key={index} className="text-sm flex items-start gap-2">
                        <MessageSquare className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                        <span>{con}</span>
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            
            <tr className="border-b">
              <td className="p-4 font-medium">{t('toolComparison.table.freePlan')}</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4 text-center">
                  <Badge variant={tool.pricing.toLowerCase().includes('free') ? 'default' : 'secondary'}>
                    {tool.pricing.toLowerCase().includes('free') ? t('common.yes') : t('common.no')}
                  </Badge>
                </td>
              ))}
            </tr>
            
            <tr className="border-b bg-muted/20">
              <td className="p-4 font-medium">{t('toolComparison.table.website')}</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4 text-center">
                  <Button size="sm" variant="outline" asChild>
                    <a href={tool.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('toolComparison.table.visit')}
                    </a>
                  </Button>
                </td>
              ))}
            </tr>
            
            <tr className="border-b">
              <td className="p-4 font-medium">{t('toolComparison.table.tags')}</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {(tool.tags || []).slice(0, 6).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* AI-Generated Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <CardTitle>{t('toolComparison.aiInsights.title')}</CardTitle>
          </div>
          <CardDescription>
            {t('toolComparison.aiInsights.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatingInsight ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              {t('toolComparison.aiInsights.generating')}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {aiInsight}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolComparison;