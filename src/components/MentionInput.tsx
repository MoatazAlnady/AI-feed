import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import { User, Wrench, Users, Building2 } from 'lucide-react';

interface MentionEntity {
  id: string;
  display_name: string;
  avatar_url?: string;
  handle?: string;
  type: 'user' | 'tool' | 'group' | 'page';
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMention?: (entityId: string, entityName: string, entityType: string) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  contentType: 'comment' | 'post' | 'message' | 'article' | 'review';
  contentId: string;
  rows?: number;
  autoFocus?: boolean;
  onKeyPress?: (e: React.KeyboardEvent) => void;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onMention,
  placeholder = "Type a message...",
  className = "",
  wrapperClassName = "",
  contentType,
  contentId,
  rows = 3,
  autoFocus = false,
  onKeyPress
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionEntity[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Search all entities for mentions
  const searchEntities = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const results: MentionEntity[] = [];

      // Search users
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, display_name, full_name, avatar_url, profile_photo, handle')
        .or(`display_name.ilike.%${query}%,full_name.ilike.%${query}%,handle.ilike.%${query}%`)
        .limit(3);

      if (!usersError && users) {
        results.push(...users.map(profile => ({
          id: profile.id,
          display_name: profile.display_name || profile.full_name || 'Unknown',
          avatar_url: profile.avatar_url || profile.profile_photo,
          handle: profile.handle,
          type: 'user' as const
        })));
      }

      // Search tools
      const { data: tools, error: toolsError } = await supabase
        .from('tools')
        .select('id, name, logo_url')
        .ilike('name', `%${query}%`)
        .eq('status', 'approved')
        .limit(3);

      if (!toolsError && tools) {
        results.push(...tools.map(tool => ({
          id: tool.id,
          display_name: tool.name,
          avatar_url: tool.logo_url,
          handle: tool.name.toLowerCase().replace(/\s+/g, '-'),
          type: 'tool' as const
        })));
      }

      // Search groups
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name, cover_image')
        .ilike('name', `%${query}%`)
        .limit(3);

      if (!groupsError && groups) {
        results.push(...groups.map(group => ({
          id: group.id,
          display_name: group.name,
          avatar_url: group.cover_image,
          handle: group.name.toLowerCase().replace(/\s+/g, '-'),
          type: 'group' as const
        })));
      }

      // Search company pages
      const { data: pages, error: pagesError } = await supabase
        .from('company_pages')
        .select('id, name, logo_url, slug')
        .ilike('name', `%${query}%`)
        .limit(3);

      if (!pagesError && pages) {
        results.push(...pages.map(page => ({
          id: page.id,
          display_name: page.name,
          avatar_url: page.logo_url,
          handle: page.slug,
          type: 'page' as const
        })));
      }

      setSuggestions(results);
    } catch (error) {
      console.error('Error searching entities:', error);
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
        searchEntities(textAfterAt);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle key navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && !e.shiftKey && onKeyPress) {
        onKeyPress(e);
      }
      return;
    }

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
      case 'Tab':
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
    }
  };

  // Insert mention into text
  const insertMention = async (selectedEntity: MentionEntity) => {
    const mention = `@${selectedEntity.handle || selectedEntity.display_name.replace(/\s+/g, '')}`;
    const newValue = value.slice(0, mentionStart) + mention + ' ' + value.slice(mentionStart + mentionQuery.length + 1);
    
    onChange(newValue);
    setShowSuggestions(false);

    // Create mention record
    if (user && contentId) {
      try {
        await supabase.from('mentions').insert({
          content_type: contentType,
          content_id: contentId,
          mentioned_user_id: selectedEntity.id,
          mentioner_user_id: user.id
        });

        // Trigger mention callback
        if (onMention) {
          onMention(selectedEntity.id, selectedEntity.display_name, selectedEntity.type);
        }
      } catch (error) {
        console.error('Error creating mention:', error);
      }
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

  // Get icon for entity type
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4 text-muted-foreground" />;
      case 'tool':
        return <Wrench className="h-4 w-4 text-orange-500" />;
      case 'group':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'page':
        return <Building2 className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'user':
        return 'User';
      case 'tool':
        return 'Tool';
      case 'group':
        return 'Group';
      case 'page':
        return 'Company';
      default:
        return '';
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${wrapperClassName}`}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`resize-none ${className}`}
        rows={rows}
        autoFocus={autoFocus}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute bottom-full mb-1 w-full bg-background border border-border rounded-lg shadow-lg z-[9999] max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.id}`}
              type="button"
              onClick={() => insertMention(suggestion)}
              className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-accent transition-colors ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {suggestion.avatar_url ? (
                  <img
                    src={suggestion.avatar_url}
                    alt={suggestion.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getEntityIcon(suggestion.type)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {suggestion.display_name}
                </p>
                <div className="flex items-center space-x-2">
                  {suggestion.handle && (
                    <p className="text-xs text-muted-foreground truncate">
                      @{suggestion.handle}
                    </p>
                  )}
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {getTypeLabel(suggestion.type)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;