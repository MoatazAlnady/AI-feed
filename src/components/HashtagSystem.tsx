import React, { useState, useEffect } from 'react';
import { Hash, TrendingUp } from 'lucide-react';

interface HashtagSystemProps {
  onHashtagClick?: (hashtag: string) => void;
  className?: string;
}

interface TrendingHashtag {
  tag: string;
  posts: number;
  trend: 'up' | 'down' | 'stable';
}

const HashtagSystem: React.FC<HashtagSystemProps> = ({ onHashtagClick, className = '' }) => {
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      try {
        // In real app, fetch from API
        // const response = await fetch('/api/hashtags/trending');
        // const data = await response.json();
        // setTrendingHashtags(data);
        setTrendingHashtags([]); // No dummy data
      } catch (error) {
        console.error('Error fetching trending hashtags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingHashtags();
  }, []);

  const handleHashtagClick = (hashtag: string) => {
    if (onHashtagClick) {
      onHashtagClick(hashtag);
    } else {
      // Default behavior: search for the hashtag
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('search', hashtag);
      window.location.search = searchParams.toString();
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default:
        return <Hash className="h-3 w-3 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Hash className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Trending Topics</h3>
        </div>
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Hash className="h-5 w-5 text-primary-600" />
        <h3 className="font-semibold text-gray-900">Trending Topics</h3>
      </div>
      
      {trendingHashtags.length === 0 ? (
        <div className="text-center py-8">
          <Hash className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            No trending topics yet. Start using hashtags in your posts to see them here!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {trendingHashtags.map((item, index) => (
            <button
              key={item.tag}
              onClick={() => handleHashtagClick(item.tag)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors hover:shadow-sm ${getTrendColor(item.trend)} hover:opacity-80`}
            >
              <div className="flex items-center space-x-2">
                {getTrendIcon(item.trend)}
                <span className="font-medium">{item.tag}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm opacity-75">{item.posts.toLocaleString()}</span>
                <span className="text-xs opacity-60">posts</span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Click any hashtag to explore related content
        </p>
      </div>
    </div>
  );
};

export default HashtagSystem;