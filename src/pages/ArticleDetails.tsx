import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ArrowLeft, Eye, Share2, Flag, Calendar, User, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import ArticleReviewSystem from '@/components/ArticleReviewSystem';
import ProfileHoverCard from '@/components/ProfileHoverCard';
import ReportContentModal from '@/components/ReportContentModal';
import SharePostModal from '@/components/SharePostModal';
import PromoteContentModal from '@/components/PromoteContentModal';
import SEOHead from '@/components/SEOHead';
import { InArticleAd } from '@/components/GoogleAd';
import PremiumBadge from '@/components/PremiumBadge';

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  author: string;
  category: string;
  type: string | null;
  featured_image_url: string | null;
  created_at: string;
  published_at: string | null;
  views: number | null;
  user_id: string | null;
  tags: string[] | null;
}

interface AuthorProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  premium_tier?: string | null;
  role_id?: number;
  account_type?: string;
}

const ArticleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      setArticle(data);

      // Increment view count
      await supabase
        .from('articles')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id);

      // Fetch author profile if user_id exists
      if (data.user_id) {
        const { data: profiles } = await supabase.rpc('get_public_profiles_by_ids', {
          ids: [data.user_id]
        });
        
        const profile = Array.isArray(profiles) && profiles.length > 0 ? {
          id: profiles[0].id,
          full_name: profiles[0].full_name,
          avatar_url: profiles[0].profile_photo,
          headline: profiles[0].job_title,
          premium_tier: profiles[0].premium_tier,
          role_id: profiles[0].role_id,
          account_type: profiles[0].account_type
        } : null;
        
        if (profile) {
          setAuthorProfile(profile);
        }
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Article not found');
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-muted/50 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-[400px] w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="bg-muted/50 min-h-screen">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
          <Button onClick={() => navigate('/blog')}>Back to Blog</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${article.title} | Blog`}
        description={article.excerpt || article.content.substring(0, 160)}
      />
      
      <div className="bg-muted/50 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/blog')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Button>

        {/* Article Header */}
        <article>
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{article.category}</Badge>
              {article.type && article.type !== 'article' && (
                <Badge variant="outline">{article.type}</Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-lg text-muted-foreground mb-6">
                {article.excerpt}
              </p>
            )}

            {/* Author & Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {authorProfile ? (
                  <>
                    <ProfileHoverCard userId={authorProfile.id}>
                      <span className="font-medium text-foreground hover:underline cursor-pointer">
                        {authorProfile.full_name || article.author}
                      </span>
                    </ProfileHoverCard>
                    <PremiumBadge 
                      tier={
                        (authorProfile.role_id === 1 || authorProfile.account_type === 'admin') 
                          ? 'gold' 
                          : (authorProfile.premium_tier as 'silver' | 'gold' | null)
                      } 
                      size="sm" 
                    />
                  </>
                ) : (
                  <span className="font-medium text-foreground">{article.author}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(article.published_at || article.created_at), 'MMM d, yyyy')}
              </div>

              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {article.views || 0} views
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {article.featured_image_url && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={article.featured_image_url}
                alt={article.title}
                className="w-full h-auto object-cover max-h-[500px]"
              />
            </div>
          )}

          {/* Article Content */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* In-Article Ad */}
          <InArticleAd contentId={article.id} creatorId={article.user_id || undefined} />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {article.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 py-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareModal(true)}
              className="gap-2 text-muted-foreground hover:text-primary"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            
            {user && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPromoteModal(true)}
                  className="gap-2 text-muted-foreground hover:text-primary"
                >
                  <TrendingUp className="h-4 w-4" />
                  Promote
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReportModalOpen(true)}
                  className="gap-2 text-muted-foreground hover:text-destructive"
                >
                  <Flag className="h-4 w-4" />
                  Report
                </Button>
              </>
            )}
          </div>
        </article>

        {/* Reviews Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <ArticleReviewSystem
            articleId={article.id}
            articleTitle={article.title}
          />
        </div>

        {/* Share Modal */}
        <SharePostModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          post={{
            id: article.id,
            content: article.excerpt || article.content.substring(0, 300),
            user_id: article.user_id || '',
            image_url: article.featured_image_url || undefined,
          }}
        />

        {/* Promote Modal */}
        <PromoteContentModal
          isOpen={showPromoteModal}
          onClose={() => setShowPromoteModal(false)}
          contentType="article"
          contentId={article.id}
          contentTitle={article.title}
        />

        {/* Report Modal */}
        <ReportContentModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          contentType="article"
          contentId={article.id}
        />
      </div>
      </div>
    </>
  );
};

export default ArticleDetails;
