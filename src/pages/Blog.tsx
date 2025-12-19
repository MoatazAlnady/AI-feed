import React, { useState, useEffect } from 'react';
import ChatDock from '@/components/ChatDock';
import { Calendar, User, ArrowRight, Video, FileText, Edit, Star, Flag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import ProfileHoverCard from '@/components/ProfileHoverCard';
import ReportContentModal from '@/components/ReportContentModal';
import SEOHead from '@/components/SEOHead';

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  author: string;
  created_at: string;
  category: string;
  type: string | null;
  featured_image_url: string | null;
  views: number | null;
  user_id: string | null;
  average_rating?: number;
  review_count?: number;
}

const Blog: React.FC = () => {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportArticle, setReportArticle] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Fetch articles
        const { data: articlesData, error: articlesError } = await supabase
          .from('articles')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(20);

        if (articlesError) throw articlesError;

        // Fetch average ratings for all articles
        const articleIds = (articlesData || []).map(a => a.id);
        const { data: reviewsData } = await supabase
          .from('article_reviews')
          .select('article_id, rating')
          .in('article_id', articleIds)
          .eq('status', 'approved');

        // Calculate average ratings per article
        const ratingsMap: Record<string, { sum: number; count: number }> = {};
        (reviewsData || []).forEach(review => {
          if (!ratingsMap[review.article_id]) {
            ratingsMap[review.article_id] = { sum: 0, count: 0 };
          }
          ratingsMap[review.article_id].sum += review.rating;
          ratingsMap[review.article_id].count += 1;
        });

        // Merge ratings into articles
        const articlesWithRatings = (articlesData || []).map(article => ({
          ...article,
          average_rating: ratingsMap[article.id] 
            ? ratingsMap[article.id].sum / ratingsMap[article.id].count 
            : undefined,
          review_count: ratingsMap[article.id]?.count || 0
        }));

        setArticles(articlesWithRatings);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const estimateReadTime = (excerpt: string | null) => {
    const wordCount = excerpt?.split(/\s+/).length || 100;
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="py-8 bg-gradient-to-b from-muted/30 via-background to-background min-h-screen">
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
        title="AI Blog - Latest AI News, Tutorials & Insights"
        description="Stay updated with the latest AI news, in-depth tutorials, tool reviews, and industry insights. Written by AI experts and enthusiasts from around the world."
        keywords="AI blog, AI news, AI tutorials, machine learning articles, AI reviews, artificial intelligence insights, AI industry updates"
        url="https://aifeed.app/blog"
        type="website"
      />
      <div className="py-8 bg-gradient-to-b from-muted/30 via-background to-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t('blog.title')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('blog.subtitle')}
            </p>
          </div>
          <div className="flex justify-end">
            <Link
              to="/articles/create"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-xl hover:shadow-lg transition-shadow"
            >
              <Edit className="h-5 w-5 mr-2" />
              {t('blog.writeArticle')}
            </Link>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t('blog.noArticles')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('blog.beFirstToShare')}
            </p>
            <Link
              to="/articles/create"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-xl hover:shadow-lg transition-shadow"
            >
              <Edit className="h-5 w-5 mr-2" />
              {t('blog.writeArticle')}
            </Link>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {articles.length > 0 && (
              <div className="bg-card rounded-2xl shadow-sm overflow-hidden mb-12 border border-border">
                <div className="lg:flex">
                  <div className="lg:w-1/2">
                    {articles[0].featured_image_url ? (
                      <img
                        src={articles[0].featured_image_url}
                        alt={articles[0].title}
                        className="w-full h-64 lg:h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 lg:h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <FileText className="h-20 w-20 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="lg:w-1/2 p-8 lg:p-12">
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        {t('blog.featured')}
                      </span>
                      <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                        {articles[0].category}
                      </span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                      {articles[0].title}
                    </h2>
                    <p className="text-muted-foreground mb-6 line-clamp-3">
                      {articles[0].excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {articles[0].user_id ? (
                          <ProfileHoverCard userId={articles[0].user_id}>
                            <div className="flex items-center space-x-1 cursor-pointer hover:text-primary transition-colors">
                              <User className="h-4 w-4" />
                              <span>{articles[0].author}</span>
                            </div>
                          </ProfileHoverCard>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{articles[0].author}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(articles[0].created_at)}</span>
                        </div>
                        <span>{estimateReadTime(articles[0].excerpt)}</span>
                      </div>
                      <Link 
                        to={`/articles/${articles[0].id}`}
                        className="flex items-center text-primary font-medium hover:text-primary/80"
                      >
                        {t('blog.readMore')}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Blog Posts Grid */}
            {articles.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.slice(1).map((article) => (
                  <article
                    key={article.id}
                    className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group border border-border"
                  >
                    <div className="relative">
                      {article.featured_image_url ? (
                        <img
                          src={article.featured_image_url}
                          alt={article.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center space-x-1 px-2 py-1 bg-background/90 backdrop-blur-sm rounded-full">
                          {article.type === 'video' ? (
                            <Video className="h-3 w-3 text-destructive" />
                          ) : (
                            <FileText className="h-3 w-3 text-primary" />
                          )}
                          <span className="text-xs font-medium text-foreground capitalize">
                            {article.type || 'article'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs">
                          {article.category}
                        </span>
                        {article.average_rating && article.average_rating > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-foreground font-medium">
                              {article.average_rating.toFixed(1)}
                            </span>
                            <span className="text-muted-foreground">
                              ({article.review_count})
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Link to={`/articles/${article.id}`}>
                        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                      </Link>
                      
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-3">
                          {article.user_id ? (
                            <ProfileHoverCard userId={article.user_id}>
                              <span className="cursor-pointer hover:text-primary transition-colors">
                                {article.author}
                              </span>
                            </ProfileHoverCard>
                          ) : (
                            <span>{article.author}</span>
                          )}
                          <span>{formatDate(article.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>{estimateReadTime(article.excerpt)}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setReportArticle({ id: article.id, title: article.title });
                              setReportModalOpen(true);
                            }}
                            className="p-1 hover:bg-destructive/10 rounded transition-colors"
                            title="Report article"
                          >
                            <Flag className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Load More */}
            {articles.length >= 20 && (
              <div className="text-center mt-12">
                <button className="px-8 py-3 border-2 border-primary/20 text-primary font-semibold rounded-xl hover:bg-primary/10 transition-colors">
                  {t('blog.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat Dock */}
      <ChatDock />
      
      {/* Report Modal */}
      {reportArticle && (
        <ReportContentModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setReportArticle(null);
          }}
          contentType="article"
          contentId={reportArticle.id}
          contentTitle={reportArticle.title}
        />
      )}
    </div>
    </>
  );
};

export default Blog;
