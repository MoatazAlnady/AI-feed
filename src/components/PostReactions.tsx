import React, { useState, useRef, useEffect } from 'react';
import { Heart, ThumbsUp, Laugh, Lightbulb, Trophy, Handshake, ThumbsDown, Smile, Brain } from 'lucide-react';

interface PostReactionsProps {
  postId: string;
  reactions: {
    [key: string]: {
      count: number;
      users: string[];
    };
  };
  userReaction?: string;
  onReact: (postId: string, reaction: string) => void;
}

const PostReactions: React.FC<PostReactionsProps> = ({
  postId,
  reactions,
  userReaction,
  onReact
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const showReactions = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowReactionPicker(true);
  };

  const hideReactions = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowReactionPicker(false);
    }, 300);
  };

  const reactionTypes = [
    { type: 'like', icon: ThumbsUp, label: 'Like', color: 'text-blue-500', emoji: '👍' },
    { type: 'love', icon: Heart, label: 'Love', color: 'text-red-500', emoji: '❤️' },
    { type: 'insightful', icon: Lightbulb, label: 'Insightful', color: 'text-orange-500', emoji: '💡' },
    { type: 'smart', icon: Brain, label: 'Smart', color: 'text-blue-500', emoji: '🧠' },
    { type: 'bravo', icon: Trophy, label: 'Bravo', color: 'text-yellow-500', emoji: '👏' },
    { type: 'support', icon: Handshake, label: 'Support', color: 'text-green-500', emoji: '🤝' },
    { type: 'funny', icon: Laugh, label: 'Funny', color: 'text-pink-500', emoji: '😂' },
    { type: 'unlike', icon: ThumbsDown, label: 'Unlike', color: 'text-gray-500', emoji: '👎' }
  ];

  const totalReactions = Object.values(reactions).reduce((sum, reaction) => sum + reaction.count, 0);
  const topReactions = Object.entries(reactions)
    .filter(([_, data]) => data.count > 0)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 3);

  const handleReactionClick = (reactionType: string) => {
    onReact(postId, reactionType);
    setShowReactionPicker(false);
  };

  const getUserReactionIcon = () => {
    if (!userReaction) return ThumbsUp;
    const reaction = reactionTypes.find(r => r.type === userReaction);
    return reaction?.icon || ThumbsUp;
  };

  const getUserReactionColor = () => {
    if (!userReaction) return 'text-gray-500 dark:text-gray-400';
    const reaction = reactionTypes.find(r => r.type === userReaction);
    return reaction?.color || 'text-gray-500 dark:text-gray-400';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        {/* Main reaction button */}
        <button
          onClick={() => handleReactionClick(userReaction || 'like')}
          onMouseEnter={showReactions}
          onMouseLeave={hideReactions}
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-colors ${
            userReaction 
              ? 'bg-primary/10' 
              : 'hover:bg-muted'
          }`}
        >
          {React.createElement(getUserReactionIcon(), {
            className: `h-5 w-5 ${getUserReactionColor()}`
          })}
        </button>

        {/* Reaction picker */}
        {showReactionPicker && (
          <div 
            className="absolute bottom-full left-0 mb-2 bg-card rounded-lg shadow-lg border border-border p-2 flex space-x-1 z-[9999]"
            onMouseEnter={showReactions}
            onMouseLeave={hideReactions}
          >
            {reactionTypes.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleReactionClick(reaction.type)}
                className="p-2 hover:bg-muted rounded-lg transition-colors group"
                title={reaction.label}
              >
                <reaction.icon className={`h-6 w-6 ${reaction.color} group-hover:scale-110 transition-transform`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reaction count and display */}
      {totalReactions > 0 && (
        <div className="flex items-center space-x-1">
          <div className="flex -space-x-1">
            {topReactions.map(([type, data]) => {
              const reactionType = reactionTypes.find(r => r.type === type);
              if (!reactionType) return null;
              
              return (
                <div
                  key={type}
                  className="w-6 h-6 bg-card rounded-full flex items-center justify-center border border-border"
                >
                  <reactionType.icon className={`h-3 w-3 ${reactionType.color}`} />
                </div>
              );
            })}
          </div>
          <span className="text-sm text-muted-foreground">
            {totalReactions}
          </span>
        </div>
      )}
    </div>
  );
};

export default PostReactions;