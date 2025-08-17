import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  ExternalLink, 
  Star, 
  Users, 
  TrendingUp,
  MessageSquare,
  Bot
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
  const { toolIds } = useParams<{ toolIds: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tools, setTools] = useState<ToolComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [generatingInsight, setGeneratingInsight] = useState(false);

  useEffect(() => {
    if (toolIds) {
      const ids = toolIds.split(',');
      if (ids.length > 5) {
        toast({
          title: "Too many tools",
          description: "Maximum 5 tools can be compared at once",
          variant: "destructive"
        });
        navigate('/tools');
        return;
      }
      fetchToolsData(ids);
    }
  }, [toolIds]);

  const fetchToolsData = async (ids: string[]) => {
    try {
      setLoading(true);
      
      // Fetch tools data without reviews initially
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .in('id', ids)
        .eq('status', 'published');

      if (toolsError) throw toolsError;

      // Fetch categories separately
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');

      if (categoriesError) throw categoriesError;

      // Fetch reviews separately for each tool
      const toolsWithReviews = await Promise.all(
        toolsData.map(async (tool) => {
          const { data: reviews } = await supabase
            .from('tool_reviews')
            .select(`
              id,
              rating,
              title,
              comment,
              created_at
            `)
            .eq('tool_id', tool.id)
            .order('created_at', { ascending: false })
            .limit(10);

          // Format reviews to match expected interface
          const formattedReviews = (reviews || []).map(review => ({
            ...review,
            user_profiles: { full_name: 'Anonymous' }
          }));

          return {
            ...tool,
            reviews: formattedReviews
          };
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
      generateAIInsight(formattedTools);
    } catch (error) {
      console.error('Error fetching tools data:', error);
      toast({
        title: "Error",
        description: "Failed to load tools for comparison",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsight = async (toolsData: ToolComparisonData[]) => {
    setGeneratingInsight(true);
    try {
      // Create a comprehensive comparison summary
      const toolNames = toolsData.map(t => t.name).join(', ');
      const avgRatings = toolsData.map(t => `${t.name}: ${t.average_rating.toFixed(1)}/5`).join(', ');
      const pricingComparison = toolsData.map(t => `${t.name}: ${t.pricing}`).join(', ');
      
      // Find the highest rated tool
      const topRated = toolsData.reduce((prev, current) => 
        prev.average_rating > current.average_rating ? prev : current
      );
      
      // Find most reviewed tool
      const mostReviewed = toolsData.reduce((prev, current) => 
        prev.review_count > current.review_count ? prev : current
      );

      const insight = `## AI-Generated Comparison Summary

**Tools Compared:** ${toolNames}

**Overall Ratings:** ${avgRatings}

**Pricing Comparison:** ${pricingComparison}

**Key Insights:**
• **Highest Rated:** ${topRated.name} (${topRated.average_rating.toFixed(1)}/5 stars)
• **Most Popular:** ${mostReviewed.name} (${mostReviewed.review_count} reviews)

**Feature Analysis:**
${toolsData.map(tool => `
**${tool.name}:**
- Key Features: ${tool.features.slice(0, 3).join(', ')}
- Main Strengths: ${tool.pros.slice(0, 2).join(', ')}
- Considerations: ${tool.cons.slice(0, 2).join(', ')}
`).join('')}

**Recommendation:**
Based on the data analysis, ${topRated.name} appears to be the top choice with the highest user satisfaction rating. However, consider ${mostReviewed.name} if you value community feedback and proven adoption. Your final choice should depend on your specific use case, budget, and feature requirements.`;

      setAiInsight(insight);
    } catch (error) {
      console.error('Error generating AI insight:', error);
      setAiInsight('Unable to generate AI insights at this time.');
    } finally {
      setGeneratingInsight(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-6">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading tool comparison...</p>
        </div>
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
            Back to Tools
          </Button>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
            Tool Comparison
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Comparing {tools.length} AI tools side by side
          </p>
        </div>
      </div>

      {/* Horizontal Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium text-muted-foreground min-w-[150px]">Tool</th>
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
            {/* Rating Row */}
            <tr className="border-b bg-muted/20">
              <td className="p-4 font-medium">Rating</td>
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
            
            {/* Pricing Row */}
            <tr className="border-b">
              <td className="p-4 font-medium">Pricing</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4 text-center">
                  <Badge variant="secondary">{tool.pricing}</Badge>
                </td>
              ))}
            </tr>
            
            {/* Description Row */}
            <tr className="border-b bg-muted/20">
              <td className="p-4 font-medium">Description</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4">
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </td>
              ))}
            </tr>
            
            {/* Key Features Row */}
            <tr className="border-b">
              <td className="p-4 font-medium">Key Features</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4">
                  <div className="space-y-1">
                    {tool.features.slice(0, 5).map((feature, index) => (
                      <div key={index} className="text-sm flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            
            {/* Pros Row */}
            <tr className="border-b bg-muted/20">
              <td className="p-4 font-medium text-green-600">Pros</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4">
                  <div className="space-y-1">
                    {tool.pros.slice(0, 4).map((pro, index) => (
                      <div key={index} className="text-sm flex items-start gap-2">
                        <TrendingUp className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                        <span>{pro}</span>
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            
            {/* Cons Row */}
            <tr className="border-b">
              <td className="p-4 font-medium text-orange-600">Cons</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4">
                  <div className="space-y-1">
                    {tool.cons.slice(0, 4).map((con, index) => (
                      <div key={index} className="text-sm flex items-start gap-2">
                        <MessageSquare className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                        <span>{con}</span>
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            
            {/* Free Plan Row */}
            <tr className="border-b">
              <td className="p-4 font-medium">Free Plan</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4 text-center">
                  <Badge variant={tool.pricing.toLowerCase().includes('free') ? 'default' : 'secondary'}>
                    {tool.pricing.toLowerCase().includes('free') ? 'Yes' : 'No'}
                  </Badge>
                </td>
              ))}
            </tr>
            
            {/* Website Row */}
            <tr className="border-b bg-muted/20">
              <td className="p-4 font-medium">Website</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4 text-center">
                  <Button size="sm" variant="outline" asChild>
                    <a href={tool.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit
                    </a>
                  </Button>
                </td>
              ))}
            </tr>
            
            {/* Tags Row */}
            <tr className="border-b">
              <td className="p-4 font-medium">Tags</td>
              {tools.map(tool => (
                <td key={tool.id} className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {tool.tags.slice(0, 6).map(tag => (
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
            <CardTitle>AI-Generated Comparison Insights</CardTitle>
          </div>
          <CardDescription>
            Intelligent analysis based on features, ratings, and user reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatingInsight ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              Generating AI insights...
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