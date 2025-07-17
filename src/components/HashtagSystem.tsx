import React, { useState, useEffect } from 'react';
import { Hash, TrendingUp } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { Badge } from './ui/badge';

interface HashtagSystemProps {
  onHashtagClick?: (hashtag: string) => void;
  className?: string;
}

interface Interest {
  id: string;
  name: string;
  category: string;
  color: string;
}

const HashtagSystem: React.FC<HashtagSystemProps> = ({ onHashtagClick, className = '' }) => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('*')
          .eq('content_key', 'interests')
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setInterests((data.content_value as any[]).map(item => item as Interest));
        }
      } catch (error) {
        console.error('Error fetching interests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, []);

  const handleInterestClick = (interestName: string) => {
    if (onHashtagClick) {
      onHashtagClick(`#${interestName}`);
    } else {
      // Default behavior: search for the interest
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('search', `#${interestName}`);
      window.location.search = searchParams.toString();
    }
  };

  const categories = [...new Set(interests.map(i => i.category))];

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Hash className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Popular Topics</h3>
        </div>
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Hash className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Popular Topics</h3>
      </div>
      
      {interests.length === 0 ? (
        <div className="text-center py-8">
          <Hash className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No interests available yet. Check back later!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map(category => {
            const categoryInterests = interests.filter(i => i.category === category);
            if (categoryInterests.length === 0) return null;
            
            return (
              <div key={category}>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  {category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {categoryInterests.slice(0, 6).map(interest => (
                    <Badge
                      key={interest.id}
                      onClick={() => handleInterestClick(interest.name)}
                      className="cursor-pointer bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      #{interest.name}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Click any topic to explore related content
        </p>
      </div>
    </div>
  );
};

export default HashtagSystem;