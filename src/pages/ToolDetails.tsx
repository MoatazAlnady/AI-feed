import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Star, Calendar, User, Tag, CheckCircle, XCircle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  user_profiles?: {
    full_name: string;
  };
  tool_categories?: {
    name: string;
  };
}

const ToolDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTool();
    }
  }, [id]);

  const fetchTool = async () => {
    try {
      console.log('Fetching tool with ID:', id);
      
      // Fetch tool without join to avoid relationship issues
      const { data, error } = await supabase
        .from('tools')
        .select(`
          *,
          user_profiles(full_name)
        `)
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Tool fetch error:', error);
        setNotFound(true);
        return;
      }

      // Fetch category separately if tool has category_id
      let categoryName = 'Uncategorized';
      if (data.category_id) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('name')
          .eq('id', data.category_id)
          .single();
        
        if (categoryData) {
          categoryName = categoryData.name;
        }
      }

      setTool({
        ...data,
        category_name: categoryName
      });
    } catch (error) {
      console.error('Error fetching tool:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !tool) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="container max-w-6xl mx-auto px-6 py-4">
            <Link
              to="/tools"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tools
            </Link>
          </div>
        </div>

        <div className="container max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Tool Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The tool you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/tools"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tools
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="container max-w-6xl mx-auto px-6 py-4">
          <Link
            to="/tools"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tools
          </Link>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Tool Icon */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                <div className="text-4xl lg:text-5xl">🤖</div>
              </div>
            </div>

            {/* Tool Info */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {tool.name}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    {tool.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary">{tool.category_name}</Badge>
                    {tool.subcategory && (
                      <Badge variant="outline">{tool.subcategory}</Badge>
                    )}
                    <Badge variant={tool.pricing === 'free' ? 'default' : 'destructive'}>
                      {tool.pricing}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Features */}
            {tool.features && tool.features.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Zap className="h-5 w-5" />
                    Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tool.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Pros & Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pros */}
              {tool.pros && tool.pros.length > 0 && (
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      Pros
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tool.pros.map((pro, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Cons */}
              {tool.cons && tool.cons.length > 0 && (
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <XCircle className="h-5 w-5" />
                      Cons
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tool.cons.map((con, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tool Info */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Tool Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <User className="h-4 w-4" />
                    Submitted by
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {tool.user_profiles?.full_name || 'Anonymous'}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <Calendar className="h-4 w-4" />
                    Added on
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(tool.created_at).toLocaleDateString()}
                  </p>
                </div>

                {tool.updated_at !== tool.created_at && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <Calendar className="h-4 w-4" />
                      Last updated
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(tool.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {tool.tags && tool.tags.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Tag className="h-4 w-4" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tool.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolDetails;