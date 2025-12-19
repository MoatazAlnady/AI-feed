import React, { useState } from 'react';
import { Heart, ThumbsUp, Laugh, Lightbulb, Trophy, Handshake, ThumbsDown, Brain } from 'lucide-react';

interface CommentReactionsProps {
  commentId: string;
  reactions: {
    [key: string]: {
      count: number;
      users: string[];
    };
  };
  userReaction?: string;
  onReact: (commentId: string, reaction: string) => void;
  compact?: boolean;
}

const CommentReactions: React.FC<CommentReactionsProps> = ({
  commentId,
  reactions,
  userReaction,
  onReact,
  compact = true
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);

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
    onReact(commentId, reactionType);
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
    <div className="flex items-center space-x-1">
      <div className="relative">
        {/* Main reaction button */}
        <button
          onClick={() => handleReactionClick(userReaction || 'like')}
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => setShowReactionPicker(false)}
          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded transition-colors ${
            userReaction 
              ? 'bg-blue-50 dark:bg-blue-900/20' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {React.createElement(getUserReactionIcon(), {
            className: `${compact ? 'h-4 w-4' : 'h-5 w-5'} ${getUserReactionColor()}`
          })}
        </button>

        {/* Reaction picker */}
        {showReactionPicker && (
          <div 
            className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1.5 flex space-x-0.5 z-[9999]"
            onMouseEnter={() => setShowReactionPicker(true)}
            onMouseLeave={() => setShowReactionPicker(false)}
          >
            {reactionTypes.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleReactionClick(reaction.type)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors group"
                title={reaction.label}
              >
                <reaction.icon className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} ${reaction.color} group-hover:scale-110 transition-transform`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reaction count and display */}
      {totalReactions > 0 && (
        <div className="flex items-center space-x-0.5">
          <div className="flex -space-x-0.5">
            {topReactions.map(([type, data]) => {
              const reactionType = reactionTypes.find(r => r.type === type);
              if (!reactionType) return null;
              
              return (
                <div
                  key={type}
                  className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700`}
                >
                  <reactionType.icon className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} ${reactionType.color}`} />
                </div>
              );
            })}
          </div>
          <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>
            {totalReactions}
          </span>
        </div>
      )}
    </div>
  );
};

export default CommentReactions;
