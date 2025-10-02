import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';

interface User {
  id: string;
  display_name: string;
  avatar_url?: string;
  handle?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMention?: (userId: string, username: string) => void;
  placeholder?: string;
  className?: string;
  contentType: 'comment' | 'post' | 'message';
  contentId: string;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onMention,
  placeholder = "Type a message...",
  className = "",
  contentType,
  contentId
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  // Search users for mentions
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, full_name, avatar_url, profile_photo, handle')
        .or(`display_name.ilike.%${query}%,full_name.ilike.%${query}%,handle.ilike.%${query}%`)
        .limit(5);

      if (!error && data) {
        // Map fields to match the expected format, with proper fallbacks
        const mappedData = data.map(profile => ({
          id: profile.id,
          display_name: profile.display_name || profile.full_name || 'Unknown',
          avatar_url: profile.avatar_url || profile.profile_photo,
          handle: profile.handle
        }));
        setSuggestions(mappedData);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      
      // Check if we're in a valid mention context (no spaces after @)
      if (!textAfterAt.includes(' ') && textAfterAt.length <= 20) {
        setMentionStart(lastAtIndex);
        setMentionQuery(textAfterAt);
        setShowSuggestions(true);
        setSelectedIndex(0);
        searchUsers(textAfterAt);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle key navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Insert mention into text
  const insertMention = async (selectedUser: User) => {
    const mention = `@${selectedUser.handle || selectedUser.display_name}`;
    const newValue = value.slice(0, mentionStart) + mention + ' ' + value.slice(mentionStart + mentionQuery.length + 1);
    
    onChange(newValue);
    setShowSuggestions(false);

    // Create mention record
    try {
      await supabase.from('mentions').insert({
        content_type: contentType,
        content_id: contentId,
        mentioned_user_id: selectedUser.id,
        mentioner_user_id: user?.id
      });

      // Trigger mention callback
      if (onMention) {
        onMention(selectedUser.id, selectedUser.display_name);
      }
    } catch (error) {
      console.error('Error creating mention:', error);
    }

    // Restore focus and cursor position
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPosition = mentionStart + mention.length + 1;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`resize-none ${className}`}
        rows={3}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full mb-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => insertMention(suggestion)}
              className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                {suggestion.avatar_url ? (
                  <img
                    src={suggestion.avatar_url}
                    alt={suggestion.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {suggestion.display_name[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {suggestion.display_name}
                </p>
                {suggestion.handle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{suggestion.handle}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;