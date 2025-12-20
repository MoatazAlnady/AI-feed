import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ExternalLink, Star, Calendar, User, Tag, CheckCircle, XCircle, Zap, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ToolStars from '@/components/ToolStars';
import ToolReviews from '@/components/ToolReviews';
import ToolActionButtons from '@/components/ToolActionButtons';
import { getCreatorProfileLink } from '@/utils/profileUtils';
import { useAuth } from '@/context/AuthContext';
import EditToolModal from '@/components/EditToolModal';
import SEOHead from '@/components/SEOHead';
import { getDeviceFingerprint } from '@/utils/deviceFingerprint';

interface Tool {
  id: string;
  name: string;
  description: string;
  category_id: string;
  category_name?: string;
  subcategory?: string;
  pricing: string;
  free_plan?: string;
  website: string;
  features: string[];
  pros: string[];
  cons: string[];
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  average_rating?: number;
  review_count?: number;
  logo_url?: string;
  user_profiles?: {
    full_name: string;
    profile_photo?: string;
    handle?: string;
  };
  tool_categories?: {
    name: string;
  };
}

const ToolDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const canRequestEdit = user && !isAdmin;

  const handleToolDelete = () => {
    // Redirect to tools page after deletion
    window.location.href = '/tools';
  };

  const handleToolUpdate = () => {
    // Refetch the tool data after an update
    if (id) {
      fetchTool();
    }
  };

  useEffect(() => {
    if (id) {
      fetchTool();
    }
  }, [id]);

  const fetchTool = async () => {
    try {
      console.log('Fetching tool with ID:', id);
      
      // Fetch tool data
      const { data, error } = await supabase
        .from('tools')
        .select(`
          *,
          user_profiles(full_name, profile_photo, handle)
        `)
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Tool fetch error:', error);
        setNotFound(true);
        return;
      }

      // Track unique view - deduplicated
      await trackUniqueView(id!);

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

  const trackUniqueView = async (toolId: string) => {
    try {
      const viewData: { tool_id: string; user_id?: string; device_fingerprint?: string } = { tool_id: toolId };
      
      if (user) {
        // For logged-in users, use user_id
        viewData.user_id = user.id;
      } else {
        // For anonymous users, use device fingerprint
        const fingerprint = await getDeviceFingerprint();
        viewData.device_fingerprint = fingerprint;
      }

      // Try to insert the view (will fail silently if duplicate due to unique constraint)
      const { error: viewError } = await supabase
        .from('tool_views')
        .insert(viewData);

      // If insert succeeded (not a duplicate), increment the view count directly
      if (!viewError) {
        // Use direct update instead of RPC to avoid type issues
        await supabase
          .from('tools')
          .update({ views: (await supabase.from('tools').select('views').eq('id', toolId).single()).data?.views + 1 || 1 })
          .eq('id', toolId);
      }
    } catch (error) {
      // Silently fail - view tracking shouldn't break the page
      console.error('Error tracking view:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <div className="border-b border-border">
          <div className="container max-w-6xl mx-auto px-6 py-4">
            <Link
              to="/tools"
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('toolDetails.backToTools')}
            </Link>
          </div>
        </div>

        <div className="container max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4 text-foreground">{t('toolDetails.notFound')}</h1>
          <p className="text-muted-foreground mb-8">
            {t('toolDetails.notFoundDesc')}
          </p>
          <Link
            to="/tools"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('toolDetails.backToTools')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${tool.name} - AI Tool Review & Features`}
        description={tool.description}
        keywords={`${tool.name}, AI tool, ${tool.category_name || 'AI'}, ${(tool.tags || []).join(', ')}`}
        url={`https://aifeed.app/tools/${tool.id}`}
        type="product"
        productName={tool.name}
        productRating={tool.average_rating}
        productReviewCount={tool.review_count}
        productCategory={tool.category_name}
      />
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b border-border">
        <div className="container max-w-6xl mx-auto px-6 py-4">
            <Link
              to="/tools"
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('toolDetails.backToTools')}
            </Link>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Tool Icon */}
            <div className="flex-shrink-0">
              {tool.logo_url ? (
                <img 
                  src={tool.logo_url} 
                  alt={`${tool.name} logo`}
                  className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl object-contain bg-card border border-border p-2"
                />
              ) : (
                <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                  <div className="text-4xl lg:text-5xl">🤖</div>
                </div>
              )}
            </div>

            {/* Tool Info */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    {tool.name}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-4">
                    {tool.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <ToolStars 
                      value={tool.average_rating || 0}
                      reviewsCount={tool.review_count || 0}
                      size="md"
                    />
                    {tool.review_count && tool.review_count > 0 && (
                      <a 
                        href="#reviews"
                        className="text-sm text-primary hover:text-primary/80 underline"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        {t('toolDetails.readAllReviews')}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary">{tool.category_name}</Badge>
                    {tool.subcategory && (
                      <Badge variant="outline">{tool.subcategory}</Badge>
                    )}
                    <Badge variant={tool.pricing === 'free' ? 'default' : 'destructive'}>
                      {tool.pricing}
                    </Badge>
                    {tool.free_plan === 'Yes' && (
                      <Badge 
                        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700"
                      >
                        {t('toolDetails.freePlanAvailable')}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {canRequestEdit && (
                    <Button
                      variant="outline"
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      {t('common.edit', 'Request Edit')}
                    </Button>
                  )}
                  <ToolActionButtons 
                    tool={tool} 
                    onDelete={handleToolDelete}
                    className="flex items-center space-x-2"
                  />
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
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Zap className="h-5 w-5" />
                    {t('toolDetails.features')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tool.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
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
              <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      {t('toolDetails.pros')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tool.pros.map((pro, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Cons */}
              {tool.cons && tool.cons.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <XCircle className="h-5 w-5" />
                      {t('toolDetails.cons')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tool.cons.map((con, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{con}</span>
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
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{t('toolDetails.toolInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <User className="h-4 w-4" />
                    {t('toolDetails.submittedBy')}
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={tool.user_profiles?.profile_photo || undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {tool.user_profiles?.full_name ? (
                        <Link
                          to={getCreatorProfileLink({ 
                            id: tool.user_id, 
                            handle: tool.user_profiles.handle 
                          })}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {tool.user_profiles.full_name}
                        </Link>
                      ) : (
                        <span className="font-medium text-muted-foreground">{t('toolDetails.anonymous')}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    {t('toolDetails.addedOn')}
                  </div>
                  <p className="font-medium text-foreground">
                    {new Date(tool.created_at).toLocaleDateString()}
                  </p>
                </div>

                {tool.updated_at !== tool.created_at && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      {t('toolDetails.lastUpdated')}
                    </div>
                    <p className="font-medium text-foreground">
                      {new Date(tool.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {tool.tags && tool.tags.length > 0 && (
              <Card className="bg-card border-border">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Tag className="h-4 w-4" />
                    {t('toolDetails.tags')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tool.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-muted text-muted-foreground">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reviews Section - Full Width at Bottom */}
        <div className="mt-12" id="reviews">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <ToolReviews toolId={tool.id} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Tool Modal */}
      {tool && (
        <EditToolModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onToolUpdated={handleToolUpdate}
          toolId={tool.id}
        />
      )}
    </div>
    </>
  );
};

export default ToolDetails;