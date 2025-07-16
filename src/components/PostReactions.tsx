import React, { useState } from 'react';
import { Heart, ThumbsUp, Laugh, Angry, Frown, Plus } from 'lucide-react';

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

  const reactionTypes = [
    { type: 'like', icon: ThumbsUp, label: 'Like', color: 'text-blue-500', emoji: '👍' },
    { type: 'insightful', icon: Heart, label: 'Insightful', color: 'text-orange-500', emoji: '💡' },
    { type: 'celebrate', icon: Laugh, label: 'Celebrate', color: 'text-green-500', emoji: '🎉' },
    { type: 'support', icon: Heart, label: 'Support', color: 'text-purple-500', emoji: '❤️' },
    { type: 'funny', icon: Laugh, label: 'Funny', color: 'text-yellow-500', emoji: '😂' }
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
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => setShowReactionPicker(false)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            userReaction 
              ? 'bg-blue-50 dark:bg-blue-900/20' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {React.createElement(getUserReactionIcon(), {
            className: `h-5 w-5 ${getUserReactionColor()}`
          })}
          <span className={`text-sm font-medium ${
            userReaction 
              ? getUserReactionColor()
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {userReaction ? reactionTypes.find(r => r.type === userReaction)?.label : 'Like'}
          </span>
        </button>

        {/* Reaction picker */}
        {showReactionPicker && (
          <div 
            className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex space-x-1 z-[9999]"
            onMouseEnter={() => setShowReactionPicker(true)}
            onMouseLeave={() => setShowReactionPicker(false)}
          >
            {reactionTypes.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleReactionClick(reaction.type)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
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
                  className="w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700"
                >
                  <reactionType.icon className={`h-3 w-3 ${reactionType.color}`} />
                </div>
              );
            })}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {totalReactions}
          </span>
        </div>
      )}
    </div>
  );
};

export default PostReactions;