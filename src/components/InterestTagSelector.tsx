import React, { useState, useEffect } from 'react';
import { Hash, X, Plus } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { supabase } from '../integrations/supabase/client';

interface Interest {
  id: string;
  name: string;
  category: string;
  color: string;
}

interface InterestTagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const InterestTagSelector: React.FC<InterestTagSelectorProps> = ({
  selectedTags,
  onTagsChange
}) => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterests();
  }, []);

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

  const toggleTag = (tagName: string) => {
    const updated = selectedTags.includes(tagName)
      ? selectedTags.filter(tag => tag !== tagName)
      : [...selectedTags, tagName];
    
    onTagsChange(updated);
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      onTagsChange([...selectedTags, customTag.trim()]);
      setCustomTag('');
      setShowCustomInput(false);
    }
  };

  const handleCustomTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTag();
    }
    if (e.key === 'Escape') {
      setCustomTag('');
      setShowCustomInput(false);
    }
  };

  const categories = [...new Set(interests.map(i => i.category))];

  if (loading) {
    return (
      <div className="mb-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
          <div className="flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Tags & Interests
      </label>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tag, index) => (
              <Badge
                key={index}
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-1"
              >
                #{tag}
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="ml-1 hover:text-gray-900 dark:hover:text-gray-200"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Interest Categories */}
      <div className="space-y-3">
        {categories.map(category => {
          const categoryInterests = interests.filter(i => i.category === category);
          return (
            <div key={category}>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {category}
              </h4>
              <div className="flex flex-wrap gap-2">
                {categoryInterests.map(interest => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleTag(interest.name)}
                    className={`px-3 py-1 text-sm rounded-full border transition-all ${
                      selectedTags.includes(interest.name)
                        ? 'bg-gray-600 text-white border-gray-600'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    #{interest.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Tag Input */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        {showCustomInput ? (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={handleCustomTagKeyPress}
                placeholder="Add custom tag"
                className="pl-10"
                autoFocus
              />
            </div>
            <Button
              type="button"
              onClick={addCustomTag}
              disabled={!customTag.trim()}
              size="sm"
            >
              Add
            </Button>
            <Button
              type="button"
              onClick={() => {
                setCustomTag('');
                setShowCustomInput(false);
              }}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => setShowCustomInput(true)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Tag
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Select from your interests or add custom tags to help others discover your content
      </p>
    </div>
  );
};

export default InterestTagSelector;