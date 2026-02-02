import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface SubCategoryInfo {
  id: string;
  name: string;
  slug?: string;
  color?: string;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  website: string;
  pricing_type: string;
  features: string[];
  pros: string[];
  cons: string[];
  tags: string[];
  created_at: string;
  category_id: string;
  category_name?: string;
  sub_categories?: SubCategoryInfo[];
}

export default function TrendingTools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingTools = async () => {
      try {
        console.log('Fetching trending tools...');
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch tools without join to avoid relationship issues
        const { data: toolsData, error: toolsError } = await supabase
          .from('tools')
          .select('*')
          .eq('status', 'published')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        if (toolsError) throw toolsError;

        // Fetch categories separately
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name, color, icon');

        // Fetch subcategories from junction table
        const toolIds = (toolsData || []).map(t => t.id);
        let toolSubCategoriesMap = new Map<string, SubCategoryInfo[]>();
        
        if (toolIds.length > 0) {
          const { data: junctionData } = await supabase
            .from('tool_sub_categories')
            .select('tool_id, sub_categories(id, name, slug, color)')
            .in('tool_id', toolIds);
          
          if (junctionData) {
            junctionData.forEach((item: any) => {
              const subCat = item.sub_categories;
              if (subCat) {
                const existing = toolSubCategoriesMap.get(item.tool_id) || [];
                existing.push(subCat);
                toolSubCategoriesMap.set(item.tool_id, existing);
              }
            });
          }
        }

        // Create category lookup map
        const categoryMap = new Map(categoriesData?.map(cat => [cat.id, cat]) || []);

        // Add category and subcategory info to tools
        const toolsWithCategories = (toolsData || []).map(tool => ({
          ...tool,
          category_name: categoryMap.get(tool.category_id)?.name || 'Uncategorized',
          sub_categories: toolSubCategoriesMap.get(tool.id) || []
        }));

        console.log('Trending tools with categories:', toolsWithCategories);
        setTools(toolsWithCategories);
      } catch (error) {
        console.error('Error fetching trending tools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTools();
  }, []);

  if (!loading && tools.length === 0) return null;

  return (
    <section className="animate-fade-in">
      <div className="container max-w-6xl mx-auto">
        <h3 className="mb-6 text-2xl font-bold text-foreground">Trending AI Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            : tools.map((tool) => (
                <div key={tool.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-lg text-foreground">{tool.name}</h4>
                      <div className="flex flex-wrap gap-1">
                        {tool.sub_categories && tool.sub_categories.length > 0 ? (
                          tool.sub_categories.slice(0, 1).map((subCat) => (
                            <span 
                              key={subCat.id}
                              className="text-xs px-2 py-1 rounded-full bg-primary/10"
                              style={{ color: subCat.color || 'hsl(var(--primary))' }}
                            >
                              {subCat.name}
                            </span>
                          ))
                        ) : tool.category_name && tool.category_name !== 'Uncategorized' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {tool.category_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-3">{tool.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-secondary">{tool.pricing_type}</span>
                      <a 
                        href={tool.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Visit →
                      </a>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </section>
  );
}