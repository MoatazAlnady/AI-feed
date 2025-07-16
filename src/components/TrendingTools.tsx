import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ToolCard from '@/components/ToolCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function TrendingTools() {
  const { data: tools, error, isLoading } = useQuery({
    queryKey: ['trending-tools'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('tools')
        .select(`
          id,
          name,
          description,
          website,
          pricing,
          features,
          pros,
          cons,
          tags,
          created_at,
          category_id,
          subcategory,
          tool_categories (
            name,
            color,
            icon
          )
        `)
        .eq('status', 'published')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    }
  });

  if (error || (!isLoading && !tools?.length)) return null;

  return (
    <section className="animate-fade-in">
      <div className="container max-w-6xl mx-auto">
        <h3 className="mb-6 text-2xl font-bold text-foreground">Trending AI Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            : tools?.map((tool) => (
                <div key={tool.id} className="bg-white dark:bg-[#091527] border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-lg text-foreground">{tool.name}</h4>
                      {tool.tool_categories && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {tool.tool_categories.name}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-3">{tool.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-secondary">{tool.pricing}</span>
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