import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Image,
  Video,
  Link as LinkIcon,
  Send,
  User,
  Edit3,
  Trash2,
  Check,
  X,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { makeHashtagsClickable } from '@/utils/hashtagUtils';
import { getCreatorProfileLink } from '@/utils/profileUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PostReactions from './PostReactions';
import CommentReactions from './CommentReactions';
import PostOptionsMenu from './PostOptionsMenu';
import SharePostModal from './SharePostModal';
import LinkPreview from './LinkPreview';
import ProfileHoverCard from './ProfileHoverCard';
import MentionInput from './MentionInput';
import PremiumBadge from './PremiumBadge';
import ArticleCard from './feed/ArticleCard';
import SharedArticleCard from './feed/SharedArticleCard';
import FeedToolCard from './feed/FeedToolCard';
import SharedToolCard from './feed/SharedToolCard';
import FeedGroupCard from './feed/FeedGroupCard';
import SharedGroupCard from './feed/SharedGroupCard';
import FeedEventCard from './feed/FeedEventCard';
import SharedEventCard from './feed/SharedEventCard';
import FeedDiscussionCard from './feed/FeedDiscussionCard';
import SharedDiscussionCard from './feed/SharedDiscussionCard';
import ShareToolModal from './ShareToolModal';
import ShareGroupModal from './ShareGroupModal';
import ShareEventModal from './ShareEventModal';
import ShareDiscussionModal from './ShareDiscussionModal';
import TranslateButton from './TranslateButton';
import { trackUserAction } from '@/hooks/useViewTimeTracking';

interface Post {
  id: string;
  user_id: string;
  author: {
    name: string;
    avatar: string;
    title: string;
    verified: boolean;
    topVoice: boolean;
    handle?: string;
    premium_tier?: string | null;
    role_id?: number;
    account_type?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
  shares: number;
  share_count?: number;
  image?: string;
  video?: string;
  link?: string;
  tags: string[];
  liked: boolean;
  bookmarked: boolean;
  created_at: string;
  updated_at: string;
  canEdit: boolean;
  view_count?: number;
  reach_score?: number;
  sharedPostId?: string; // ID of the shared_posts record for reshared posts
  detected_language?: string | null;
}

interface Comment {
  id: string;
  user_id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    handle?: string;
    premium_tier?: string | null;
    role_id?: number;
    account_type?: string;
  };
  content: string;
  timestamp: string;
  created_at: string;
  likes: number;
  canEdit: boolean;
  reactions: { [key: string]: { count: number; users: string[] } };
  userReaction?: string;
  parent_comment_id?: string;
  replies?: Comment[];
}

const NewsFeed: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, any>>(new Map());
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [shareModalPost, setShareModalPost] = useState<Post | null>(null);
  const [shareModalArticle, setShareModalArticle] = useState<any>(null);
  const [shareModalTool, setShareModalTool] = useState<any>(null);
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [postReactions, setPostReactions] = useState<{ [key: string]: { [key: string]: { count: number; users: string[] } } }>({});
  const [userReactions, setUserReactions] = useState<{ [key: string]: string }>({});
  const [commentSort, setCommentSort] = useState<{ [key: string]: 'relevant' | 'recent' }>({});
  const [editingComment, setEditingComment] = useState<{ postId: string; commentId: string } | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ postId: string; commentId: string; authorName: string } | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [shareModalGroup, setShareModalGroup] = useState<any>(null);
  const [shareModalEvent, setShareModalEvent] = useState<{ event: any; eventType: string } | null>(null);
  const [shareModalDiscussion, setShareModalDiscussion] = useState<any>(null);
  const [translatedPosts, setTranslatedPosts] = useState<Record<string, string>>({});
  const [userGroupMemberships, setUserGroupMemberships] = useState<string[]>([]);

  // Get user interests for personalized feed
  const userInterests = user?.user_metadata?.interests || [];

  useEffect(() => {
    console.log('Current user:', user);
    // Show newsletter popup for unsubscribed registered users
    if (user && !user.user_metadata?.newsletter_subscription) {
      setShowNewsletterPopup(true);
    }
    ensureUserProfile();
    fetchPosts();
    fetchUserGroupMemberships();

    // Set up real-time subscriptions
    let postsChannel: any;
    let sharedPostsChannel: any;
    let refreshInterval: NodeJS.Timeout;

    if (user) {
      // Subscribe to new posts
      postsChannel = supabase
        .channel('posts_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        }, (payload) => {
          console.log('New post detected:', payload);
          // Fetch posts again to include the new post
          fetchPosts();
        })
        .subscribe();

      // Subscribe to new shared posts
      sharedPostsChannel = supabase
        .channel('shared_posts_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'shared_posts'
        }, (payload) => {
          console.log('New shared post detected:', payload);
          // Fetch posts again to include the new shared post
          fetchPosts();
        })
        .subscribe();

      // Set up automatic refresh every 10 minutes
      refreshInterval = setInterval(() => {
        console.log('Auto-refreshing newsfeed...');
        fetchPosts();
      }, 10 * 60 * 1000); // 10 minutes
    }

    return () => {
      // Clean up subscriptions and interval
      if (postsChannel) {
        supabase.removeChannel(postsChannel);
      }
      if (sharedPostsChannel) {
        supabase.removeChannel(sharedPostsChannel);
      }
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [user]);

  const fetchUserGroupMemberships = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (!error && data) {
        setUserGroupMemberships(data.map(m => m.group_id));
      }
    } catch (error) {
      console.error('Error fetching group memberships:', error);
    }
  };

  const ensureUserProfile = async () => {
    if (!user) return;
    
    try {
      // Check if user profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        console.log('Creating user profile for:', user.id);
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'AI Enthusiast',
            account_type: 'creator'
          });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        } else {
          console.log('User profile created successfully');
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  const fetchPosts = async () => {
    setIsRefreshing(true);
    try {
      console.log('Fetching posts...');
      
      // Fetch regular posts with reach score, view count, share count, and detected_language
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, reach_score, view_count, share_count, detected_language')
        .order('reach_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) {
        console.error('Error fetching posts:', postsError);
      }

      // Fetch shared posts with original post, article, tool, group, event, and discussion data
      const { data: sharedPostsData, error: sharedError } = await supabase
        .from('shared_posts')
        .select(`
          *,
          original_post:posts!shared_posts_original_post_id_fkey(*),
          original_article:articles!shared_posts_original_article_id_fkey(*),
          original_tool:tools!shared_posts_original_tool_id_fkey(*),
          original_group:groups!shared_posts_original_group_id_fkey(*),
          original_event:events!shared_posts_original_event_id_fkey(*),
          original_discussion:group_discussions!shared_posts_original_discussion_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (sharedError) {
        console.error('Error fetching shared posts:', sharedError);
      }

      // Fetch articles from followed creators
      let articlesData: any[] = [];
      const { data: followsData } = user ? await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id) : { data: [] };
      
      const followedIds = (followsData || []).map(f => f.following_id);
      
      if (followedIds.length > 0) {
        const { data: articles, error: articlesError } = await supabase
          .from('articles')
          .select('id, title, excerpt, featured_image_url, published_at, user_id, category, views, share_count, author, detected_language')
          .eq('status', 'published')
          .in('user_id', followedIds)
          .order('published_at', { ascending: false })
          .limit(15);

        if (!articlesError && articles) {
          articlesData = articles.map(article => ({
            ...article,
            type: 'article',
            created_at: article.published_at
          }));
        }
      }

      // Fetch tools from followed creators
      let toolsData: any[] = [];
      if (followedIds.length > 0) {
        const { data: tools, error: toolsError } = await supabase
          .from('tools')
          .select('*')
          .eq('status', 'approved')
          .in('user_id', followedIds)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!toolsError && tools) {
          toolsData = tools.map(tool => ({
            ...tool,
            type: 'tool',
            created_at: tool.created_at
          }));
        }
      }

      // Fetch public groups from followed creators
      let groupsData: any[] = [];
      if (followedIds.length > 0) {
        const { data: groups, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .eq('is_private', false)
          .in('creator_id', followedIds)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!groupsError && groups) {
          groupsData = groups.map(group => ({
            ...group,
            type: 'group',
            created_at: group.created_at
          }));
        }
      }

      // Fetch events from followed creators (unified events table)
      let eventsData: any[] = [];
      if (followedIds.length > 0) {
        const { data: eventsFetched, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .or(`creator_id.in.(${followedIds.join(',')}),organizer_id.in.(${followedIds.join(',')})`)
          .order('created_at', { ascending: false })
          .limit(15);

        if (!eventsError && eventsFetched) {
          eventsData = eventsFetched.map(event => ({
            ...event,
            type: event.group_id ? 'group_event' : 'standalone_event',
            created_at: event.created_at
          }));
        }
      }

      // Fetch public discussions from followed creators
      let discussionsData: any[] = [];
      if (followedIds.length > 0) {
        const { data: discussions, error: discussionsError } = await supabase
          .from('group_discussions')
          .select('*, groups!inner(name)')
          .eq('is_public', true)
          .in('author_id', followedIds)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!discussionsError && discussions) {
          discussionsData = discussions.map(discussion => ({
            ...discussion,
            type: 'discussion',
            groupName: (discussion as any).groups?.name,
            created_at: discussion.created_at
          }));
        }
      }

      const allPosts: any[] = [];
      if (postsData) allPosts.push(...postsData.map(post => ({ ...post, type: 'original' })));
      
      // Handle shared posts, shared articles, tools, groups, events, and discussions
      if (sharedPostsData) {
        sharedPostsData.forEach(share => {
          if (share.content_type === 'tool' && share.original_tool) {
            allPosts.push({
              ...share.original_tool,
              type: 'shared_tool',
              shared_by: share.user_id,
              share_text: share.share_text,
              shared_at: share.created_at,
              sharedPostId: share.id
            });
          } else if (share.content_type === 'article' && share.original_article) {
            allPosts.push({
              ...share.original_article,
              type: 'shared_article',
              shared_by: share.user_id,
              share_text: share.share_text,
              shared_at: share.created_at,
              sharedPostId: share.id
            });
          } else if (share.content_type === 'group' && share.original_group) {
            allPosts.push({
              ...share.original_group,
              type: 'shared_group',
              shared_by: share.user_id,
              share_text: share.share_text,
              shared_at: share.created_at,
              sharedPostId: share.id
            });
          } else if ((share.content_type === 'group_event' || share.content_type === 'standalone_event' || share.content_type === 'event') && share.original_event) {
            allPosts.push({
              ...share.original_event,
              type: share.original_event.group_id ? 'shared_group_event' : 'shared_standalone_event',
              shared_by: share.user_id,
              share_text: share.share_text,
              shared_at: share.created_at,
              sharedPostId: share.id
            });
          } else if (share.content_type === 'discussion' && share.original_discussion) {
            allPosts.push({
              ...share.original_discussion,
              type: 'shared_discussion',
              shared_by: share.user_id,
              share_text: share.share_text,
              shared_at: share.created_at,
              sharedPostId: share.id,
              groupName: (share.original_discussion as any).groups?.name
            });
          } else if (share.original_post) {
            allPosts.push({
              ...share.original_post,
              type: 'shared',
              shared_by: share.user_id,
              share_text: share.share_text,
              shared_at: share.created_at,
              sharedPostId: share.id
            });
          }
        });
      }
      
      if (articlesData) allPosts.push(...articlesData);
      if (toolsData) allPosts.push(...toolsData);
      if (groupsData) allPosts.push(...groupsData);
      if (eventsData) allPosts.push(...eventsData);
      if (discussionsData) allPosts.push(...discussionsData);

      // Sort all posts by creation time
      allPosts.sort((a, b) => {
        const getDate = (item: any) => {
          if (['shared', 'shared_article', 'shared_tool', 'shared_group', 'shared_group_event', 'shared_standalone_event', 'shared_discussion'].includes(item.type)) {
            return new Date(item.shared_at);
          }
          if (item.type === 'article') {
            return new Date(item.published_at);
          }
          return new Date(item.created_at);
        };
        return getDate(b).getTime() - getDate(a).getTime();
      });

      console.log('All posts data:', allPosts);

      if (!allPosts || allPosts.length === 0) {
        console.log('No posts found');
        setPosts([]);
        return;
      }

      // Fetch user profiles for each post (including sharers for shared posts, articles, tools, groups, events, discussions)
      const userIds = [...new Set(allPosts.flatMap(post => [
        post.user_id,
        post.creator_id,
        post.created_by,
        post.author_id,
        ['shared', 'shared_article', 'shared_tool', 'shared_group', 'shared_group_event', 'shared_standalone_event', 'shared_discussion'].includes(post.type) ? post.shared_by : null,
      ]).filter(Boolean))];
      console.log('User IDs from posts:', userIds);
      let userProfiles = [];
      
      if (userIds.length > 0) {
        console.log('Querying user_profiles for IDs:', userIds);
        const { data: profiles, error: profileError } = await supabase
          .rpc('get_public_profiles_by_ids', { ids: userIds });

        console.log('Profile query result:', { profiles, profileError });
        
        if (profileError) {
          console.error('Error fetching user profiles:', profileError);
        } else {
          console.log('Fetched profiles:', profiles);
          userProfiles = profiles || [];
        }
      }

      const profilesMapLocal = new Map(userProfiles.map(profile => [profile.id, profile]));
      setProfilesMap(profilesMapLocal); // Store in state for render access

      // Fetch user's followed creators with status for prioritization
      let followedCreators: { following_id: string; follow_status: string }[] = [];
      let userCountry = '';
      let userLanguage = 'en';
      let userInterestsFromDb: string[] = [];

      // Fetch user's behavioral engagement preferences for feed personalization
      let engagementPrefs: { preference_type: string; preference_value: string; engagement_score: number }[] = [];

      if (user) {
        const { data: followsData } = await supabase
          .from('follows')
          .select('following_id, follow_status')
          .eq('follower_id', user.id);
        followedCreators = followsData || [];

        // Fetch user profile for country, language, and interests
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('country, preferred_language, interests')
          .eq('id', user.id)
          .single();
        
        userCountry = userProfile?.country || '';
        userLanguage = userProfile?.preferred_language || localStorage.getItem('preferredLocale') || 'en';
        userInterestsFromDb = userProfile?.interests || [];

        // Fetch engagement preferences for personalized feed scoring
        const { data: prefs } = await supabase
          .from('user_engagement_preferences')
          .select('preference_type, preference_value, engagement_score')
          .eq('user_id', user.id)
          .order('engagement_score', { ascending: false })
          .limit(100);
        engagementPrefs = prefs || [];
      }

      const favoriteCreators = new Set(
        followedCreators.filter(f => f.follow_status === 'favorite').map(f => f.following_id)
      );
      const normalFollows = new Set(
        followedCreators.filter(f => f.follow_status === 'normal' || f.follow_status === 'following').map(f => f.following_id)
      );

      // Filter posts based on user interests if user has interests
      let filteredPosts = allPosts;
      const combinedInterests = [...new Set([...userInterests, ...userInterestsFromDb])];
      
      if (combinedInterests.length > 0) {
        filteredPosts = allPosts.filter(post => {
          // Always show user's own posts
          if (user && (post.user_id === user.id || post.shared_by === user.id)) {
            return true;
          }

          // Always show posts from followed creators
          if (favoriteCreators.has(post.user_id) || normalFollows.has(post.user_id)) {
            return true;
          }

          // Check if post content matches user interests
          const postContent = (post.content || '').toLowerCase();
          const matchesInterests = combinedInterests.some(interest => 
            postContent.includes(interest.toLowerCase())
          );

          // Check if post author has similar interests
          const authorProfile = profilesMap.get(post.user_id);
          const authorInterests = authorProfile?.interests || [];
          const hasCommonInterests = combinedInterests.some(interest =>
            authorInterests.includes(interest)
          );

          return matchesInterests || hasCommonInterests;
        });
      }

      // Priority-based sorting: favorites + interests + same language + same country
      filteredPosts.sort((a, b) => {
        const getCreatorId = (item: any) => item.user_id || item.creator_id || item.author_id || item.shared_by;
        const creatorA = profilesMapLocal.get(getCreatorId(a));
        const creatorB = profilesMapLocal.get(getCreatorId(b));

        // Calculate priority scores
        const calculateScore = (item: any, creator: any) => {
          let score = 0;
          const creatorId = getCreatorId(item);
          const isFavorite = favoriteCreators.has(creatorId);
          const isFollowed = normalFollows.has(creatorId);
          
          // Check interests match
          const itemInterests = item.interests || item.tags || [];
          const matchesInterests = combinedInterests.some((interest: string) => 
            itemInterests.some((i: string) => i.toLowerCase().includes(interest.toLowerCase()))
          );

          // Check language match
          const creatorLanguage = creator?.preferred_language || item.detected_language || 'en';
          const sameLanguage = creatorLanguage === userLanguage;

          // Check country match
          const creatorCountry = creator?.country || '';
          const sameCountry = creatorCountry && userCountry && creatorCountry === userCountry;

          // Priority scoring (higher = shown first)
          if (isFavorite && matchesInterests && sameLanguage && sameCountry) {
            score = 100; // Highest priority
          } else if (isFavorite && matchesInterests && sameLanguage) {
            score = 90; // Second priority
          } else if (isFavorite && matchesInterests) {
            score = 80;
          } else if (isFollowed && matchesInterests && sameLanguage && sameCountry) {
            score = 75;
          } else if (isFollowed && matchesInterests && sameLanguage) {
            score = 70;
          } else if (isFollowed && matchesInterests) {
            score = 60;
          } else if (isFavorite || isFollowed) {
            score = 50;
          } else if (sameLanguage && sameCountry) {
            score = 40;
          } else if (sameLanguage) {
            score = 30;
          } else {
            score = 10;
          }

          // Add time decay (newer content gets slight boost)
          const createdAt = item.type?.includes('shared') ? item.shared_at : item.created_at;
          const ageInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
          score += Math.max(0, 5 - ageInHours / 24); // Up to 5 bonus for content < 24 hours old

          // Add viral/trending score based on overall engagement (Phase 1)
          const engagementCount = (item.likes_count || item.likes || 0) + 
                                  (item.comments_count || 0) * 2 + 
                                  (item.share_count || 0) * 3;
          const viralScore = Math.min(15, Math.log10(engagementCount + 1) * 5);
          score += viralScore;

          // Boost rapidly trending content (high engagement in short time)
          if (ageInHours < 24 && engagementCount > 10) {
            const trendingVelocity = engagementCount / Math.max(1, ageInHours);
            score += Math.min(10, trendingVelocity);
          }

          // Add behavioral engagement-based personalization
          if (engagementPrefs.length > 0) {
            // Boost content from creators user frequently engages with
            const creatorPref = engagementPrefs.find(
              p => p.preference_type === 'creator' && p.preference_value === creatorId
            );
            if (creatorPref) {
              score += Math.min(25, creatorPref.engagement_score / 4);
            }
            
            // Boost content with hashtags/tags user has engaged with
            const itemTags = item.tags || item.interests || [];
            for (const tag of itemTags) {
              const tagPref = engagementPrefs.find(
                p => p.preference_type === 'hashtag' && 
                     p.preference_value.toLowerCase() === String(tag).toLowerCase()
              );
              if (tagPref) {
                score += Math.min(8, tagPref.engagement_score / 8);
                break; // Only count one tag match to avoid over-boosting
              }
            }
            
            // Boost content types user prefers
            const contentType = item.type === 'article' ? 'article' : 
                                item.type === 'tool' ? 'tool' : 
                                item.type === 'event' ? 'event' : 'post';
            const typePref = engagementPrefs.find(
              p => p.preference_type === 'content_type' && p.preference_value === contentType
            );
            if (typePref) {
              score += Math.min(12, typePref.engagement_score / 6);
            }
          }

          return score;
        };

        const scoreA = calculateScore(a, creatorA);
        const scoreB = calculateScore(b, creatorB);

        // First sort by priority, then by date for same priority
        if (Math.abs(scoreB - scoreA) > 0.5) {
          return scoreB - scoreA;
        }

        const dateA = new Date(a.type?.includes('shared') ? a.shared_at : a.created_at);
        const dateB = new Date(b.type?.includes('shared') ? b.shared_at : b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      const formattedPosts = filteredPosts.map(post => {
        // Skip articles - they're rendered separately
        if (post.type === 'article' || post.type === 'shared_article') {
          return post;
        }
        
        const profile = profilesMapLocal.get(post.user_id);
        const sharedByProfile = post.type === 'shared' ? profilesMapLocal.get(post.shared_by) : null;
        console.log(`Post ${post.id}: user_id = ${post.user_id}, found profile:`, profile);
        
        // If no profile found, try to get user data from auth context for current user
        let authorName = 'Anonymous User';
        let authorTitle = 'AI Enthusiast';
        
        if (profile) {
          authorName = profile.full_name || 'Anonymous User';
          authorTitle = profile.job_title || 'AI Enthusiast';
        } else if (user && post.user_id === user.id) {
          // Use auth user data if it's the current user's post
          authorName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous User';
          authorTitle = 'AI Enthusiast';
        }
        
        return {
          id: post.id,
          user_id: post.user_id,
          author: {
            name: authorName,
            avatar: profile?.profile_photo || '',
            title: authorTitle,
            verified: profile?.verified || false,
            topVoice: profile?.ai_feed_top_voice || false,
            handle: profile?.handle,
            premium_tier: profile?.premium_tier || null,
            role_id: profile?.role_id,
            account_type: profile?.account_type
          },
          content: post.content,
          timestamp: new Date(post.created_at).toLocaleDateString(),
          likes: post.likes || 0,
          comments: [] as Comment[],
          shares: post.shares || 0,
          share_count: post.share_count || 0,
          image: post.image_url,
          video: post.video_url,
          link: post.link_url,
          tags: [],
          liked: false,
          bookmarked: false,
          created_at: post.created_at,
          updated_at: post.updated_at,
          canEdit: user ? post.user_id === user.id : false,
          view_count: post.view_count || 0,
          reach_score: post.reach_score || 0,
          sharedPostId: post.sharedPostId, // Include sharedPostId for reshared posts
          // Shared post specific fields
          type: post.type || 'original',
          sharedBy: post.type === 'shared' ? {
            name: sharedByProfile?.full_name || 'Someone',
            avatar: sharedByProfile?.profile_photo || '',
            title: sharedByProfile?.job_title || 'AI Enthusiast',
            handle: sharedByProfile?.handle
          } : undefined,
          shareText: post.share_text || '',
          sharedAt: post.shared_at ? new Date(post.shared_at).toLocaleDateString() : undefined
        } as Post & { 
          type?: 'original' | 'shared';
          sharedBy?: { name: string; avatar: string; title: string; handle?: string };
          shareText?: string;
          sharedAt?: string;
        };
      });

      console.log('Formatted posts:', formattedPosts);

      // Fetch comments for each post
      const postsWithComments = await Promise.all(
        formattedPosts.map(async (post) => {
          const extendedPost = post as Post & { sharedPostId?: string };
          const comments = await fetchCommentsForPost(post.id, extendedPost.sharedPostId);
          return { ...post, comments };
        })
      );

      setPosts(postsWithComments);

      // Fetch reactions for all posts
      postsWithComments.forEach(post => {
        fetchPostReactions(post.id);
        // Check user's existing reactions
        if (user) {
          fetchUserReaction(post.id);
        }
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchCommentsForPost = async (postId: string, sharedPostId?: string): Promise<Comment[]> => {
    try {
      // Query comments - for reshared posts, filter by shared_post_id; for original posts, filter by post_id with no shared_post_id
      let query = supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_comment_id', null) // Only fetch top-level comments
        .order('created_at', { ascending: true });

      if (sharedPostId) {
        query = query.eq('shared_post_id', sharedPostId);
      } else {
        query = query.is('shared_post_id', null);
      }

      const { data: commentsData, error } = await query;

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      if (!commentsData || commentsData.length === 0) {
        return [];
      }

      // Fetch replies for each comment
      const commentIds = commentsData.map(c => c.id);
      const { data: repliesData } = await supabase
        .from('post_comments')
        .select('*')
        .in('parent_comment_id', commentIds)
        .order('created_at', { ascending: true });

      // Fetch user profiles for all comment authors
      const allUserIds = [...new Set([
        ...commentsData.map(c => c.user_id),
        ...(repliesData || []).map(r => r.user_id)
      ])];

      const { data: profiles } = await supabase.rpc('get_public_profiles_by_ids', { ids: allUserIds });
      const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

      // Fetch reactions for all comments and replies
      const allCommentIds = [...commentIds, ...(repliesData || []).map(r => r.id)];
      const { data: reactionsData } = await supabase
        .from('comment_reactions')
        .select('*')
        .in('comment_id', allCommentIds);

      // Group reactions by comment_id
      const reactionsMap = new Map<string, { [key: string]: { count: number; users: string[] } }>();
      (reactionsData || []).forEach(reaction => {
        if (!reactionsMap.has(reaction.comment_id)) {
          reactionsMap.set(reaction.comment_id, {});
        }
        const commentReactions = reactionsMap.get(reaction.comment_id)!;
        if (!commentReactions[reaction.reaction_type]) {
          commentReactions[reaction.reaction_type] = { count: 0, users: [] };
        }
        commentReactions[reaction.reaction_type].count++;
        commentReactions[reaction.reaction_type].users.push(reaction.user_id);
      });

      // Format replies
      const formatComment = (comment: any): Comment => {
        const profile = profilesMap.get(comment.user_id);
        const reactions = reactionsMap.get(comment.id) || {};
        const userReaction = user ? Object.entries(reactions).find(
          ([_, r]) => r.users.includes(user.id)
        )?.[0] : undefined;

        return {
          id: comment.id,
          user_id: comment.user_id,
          author: {
            id: comment.user_id,
            name: profile?.full_name || 'Anonymous',
            avatar: profile?.profile_photo || '',
            handle: profile?.handle
          },
          content: comment.content,
          timestamp: new Date(comment.created_at).toLocaleDateString(),
          created_at: comment.created_at,
          likes: comment.likes || 0,
          canEdit: user ? comment.user_id === user.id : false,
          reactions,
          userReaction,
          parent_comment_id: comment.parent_comment_id
        };
      };

      // Group replies by parent
      const repliesByParent = new Map<string, Comment[]>();
      (repliesData || []).forEach(reply => {
        const parentId = reply.parent_comment_id;
        if (!repliesByParent.has(parentId)) {
          repliesByParent.set(parentId, []);
        }
        repliesByParent.get(parentId)!.push(formatComment(reply));
      });

      // Format top-level comments with their replies
      return commentsData.map(comment => ({
        ...formatComment(comment),
        replies: repliesByParent.get(comment.id) || []
      }));
    } catch (error) {
      console.error('Error in fetchCommentsForPost:', error);
      return [];
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    // Navigate to search with hashtag
    window.location.href = `/tools?search=${encodeURIComponent(hashtag)}`;
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            liked: !post.liked, 
            likes: post.liked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
  };

  const handleBookmark = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, bookmarked: !post.bookmarked }
        : post
    ));
  };

  const handleShare = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setShareModalPost(post);
    }
  };

  const handleShareComplete = async (postId: string) => {
    // Update the post share_count immediately in local state
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId 
        ? { ...post, share_count: (post.share_count || 0) + 1 }
        : post
    ));

    // Track engagement for behavioral learning
    if (user) {
      const post = posts.find(p => p.id === postId);
      await trackUserAction(user.id, 'share', {
        creatorId: post?.user_id,
        contentType: 'post',
        tags: post?.tags || []
      });
    }
  };

  const handleEditPost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setEditingPost(postId);
      setEditContent(post.content);
    }
  };

  const handleSaveEdit = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: editContent, updated_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, content: editContent }
          : post
      ));
      setEditingPost(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditContent('');
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  // Helper to get unique key for comment state (separates reshared posts)
  const getCommentKey = (postId: string, sharedPostId?: string) => sharedPostId || postId;

  const handleComment = async (postId: string, sharedPostId?: string, parentCommentId?: string) => {
    const commentKey = getCommentKey(postId, sharedPostId);
    const commentText = parentCommentId ? replyContent : newComment[commentKey];
    if (!commentText?.trim() || !user) return;

    try {
      const insertData: any = {
        post_id: postId,
        user_id: user.id,
        content: commentText.trim()
      };

      // If this is a comment on a reshared post, link it to the shared_post
      if (sharedPostId) {
        insertData.shared_post_id = sharedPostId;
      }

      // If this is a reply, add parent_comment_id
      if (parentCommentId) {
        insertData.parent_comment_id = parentCommentId;
      }

      const { data: commentData, error } = await supabase
        .from('post_comments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Track engagement for behavioral learning
      const post = posts.find(p => p.id === postId);
      trackUserAction(user.id, 'comment', {
        creatorId: post?.user_id,
        contentType: 'post',
        tags: post?.tags || []
      });

      // Get current user's profile
      const { data: profiles } = await supabase.rpc('get_public_profiles_by_ids', { ids: [user.id] });
      const profile = profiles?.[0];

      const newCommentObj: Comment = {
        id: commentData.id,
        user_id: user.id,
        author: {
          id: user.id,
          name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
          avatar: profile?.profile_photo || user?.user_metadata?.profile_photo || '',
          handle: profile?.handle
        },
        content: commentText,
        timestamp: 'Just now',
        created_at: commentData.created_at,
        likes: 0,
        canEdit: true,
        reactions: {},
        userReaction: undefined,
        parent_comment_id: parentCommentId
      };

      if (parentCommentId) {
        // Add reply to parent comment
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.map(c => 
                c.id === parentCommentId 
                  ? { ...c, replies: [...(c.replies || []), newCommentObj] }
                  : c
              )
            };
          }
          return post;
        }));
        setReplyingTo(null);
        setReplyContent('');
      } else {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, comments: [...post.comments, newCommentObj] }
            : post
        ));
        setNewComment({ ...newComment, [commentKey]: '' });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleReply = (postId: string, commentId: string, authorName: string, authorHandle?: string) => {
    setReplyingTo({ postId, commentId, authorName });
    // Auto-mention the user being replied to
    const mention = `@${authorName}`;
    setReplyContent(`${mention} `);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  const handleEditComment = (postId: string, commentId: string, content: string) => {
    setEditingComment({ postId, commentId });
    setEditCommentContent(content);
  };

  const handleSaveCommentEdit = async (postId: string, commentId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ content: editCommentContent, updated_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) throw error;

      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              comments: post.comments.map(c => 
                c.id === commentId ? { ...c, content: editCommentContent } : c
              ) 
            }
          : post
      ));
      setEditingComment(null);
      setEditCommentContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments: post.comments.filter(c => c.id !== commentId) }
          : post
      ));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleCommentReaction = async (commentId: string, reactionType: string) => {
    if (!user) return;

    try {
      const { data: existingReaction, error: fetchError } = await supabase
        .from('comment_reactions')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing reaction:', fetchError);
        return;
      }

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          await supabase.from('comment_reactions').delete().eq('id', existingReaction.id);
        } else {
          await supabase.from('comment_reactions').update({ reaction_type: reactionType }).eq('id', existingReaction.id);
        }
      } else {
        await supabase.from('comment_reactions').insert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: reactionType
        });
      }

      // Refresh comments to get updated reactions
      fetchPosts();
    } catch (error) {
      console.error('Error handling comment reaction:', error);
    }
  };

  const getSortedComments = (comments: Comment[], postId: string) => {
    const sortBy = commentSort[postId] || 'recent';
    if (sortBy === 'relevant') {
      return [...comments].sort((a, b) => {
        const aReactions = Object.values(a.reactions || {}).reduce((sum, r) => sum + r.count, 0);
        const bReactions = Object.values(b.reactions || {}).reduce((sum, r) => sum + r.count, 0);
        return bReactions - aReactions;
      });
    }
    return [...comments].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const toggleComments = (postId: string) => {
    setShowComments({ ...showComments, [postId]: !showComments[postId] });
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    if (!user) return;

    try {
      // Check if user already has a reaction on this post
      const { data: existingReaction, error: fetchError } = await supabase
        .from('post_reactions')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing reaction:', fetchError);
        return;
      }

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction if clicking the same type
          const { error: deleteError } = await supabase
            .from('post_reactions')
            .delete()
            .eq('id', existingReaction.id);

          if (deleteError) throw deleteError;

          // Update local state
          setUserReactions(prev => {
            const newState = { ...prev };
            delete newState[postId];
            return newState;
          });
        } else {
          // Update reaction type
          const { error: updateError } = await supabase
            .from('post_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existingReaction.id);

          if (updateError) throw updateError;

          // Update local state
          setUserReactions(prev => ({ ...prev, [postId]: reactionType }));
        }
      } else {
        // Create new reaction
        const { error: insertError } = await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType
          });

        if (insertError) throw insertError;

        // Update local state
        setUserReactions(prev => ({ ...prev, [postId]: reactionType }));

        // Track engagement for behavioral learning
        const post = posts.find(p => p.id === postId);
        trackUserAction(user.id, 'like', {
          creatorId: post?.user_id,
          contentType: 'post',
          tags: post?.tags || []
        });
      }

      // Refresh post reactions
      fetchPostReactions(postId);
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const fetchPostReactions = async (postId: string) => {
    try {
      const { data: reactions, error } = await supabase
        .from('post_reactions')
        .select('reaction_type, user_id')
        .eq('post_id', postId);

      if (error) throw error;

      // Group reactions by type
      const groupedReactions: { [key: string]: { count: number; users: string[] } } = {};
      
      reactions?.forEach(reaction => {
        if (!groupedReactions[reaction.reaction_type]) {
          groupedReactions[reaction.reaction_type] = { count: 0, users: [] };
        }
        groupedReactions[reaction.reaction_type].count++;
        groupedReactions[reaction.reaction_type].users.push(reaction.user_id);
      });

      setPostReactions(prev => ({ ...prev, [postId]: groupedReactions }));
    } catch (error) {
      console.error('Error fetching post reactions:', error);
    }
  };

  const fetchUserReaction = async (postId: string) => {
    if (!user) return;

    try {
      const { data: reaction, error } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user reaction:', error);
        return;
      }

      if (reaction) {
        setUserReactions(prev => ({ ...prev, [postId]: reaction.reaction_type }));
      }
    } catch (error) {
      console.error('Error fetching user reaction:', error);
    }
  };

  const trackPostView = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('track_post_view', {
        post_id_param: postId,
        user_id_param: user.id,
        ip_address_param: null,
        user_agent_param: navigator.userAgent
      });

      if (error) {
        console.error('Error tracking post view:', error);
      }
    } catch (error) {
      console.error('Error tracking post view:', error);
    }
  };

  // Track view when post comes into view
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute('data-post-id');
            if (postId) {
              trackPostView(postId);
            }
          }
        });
      },
      { threshold: 0.5 } // Track when 50% of post is visible
    );

    Object.values(postRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [posts, user]);

  if (posts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Personalized Feed Header */}
        {userInterests.length > 0 && (
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-4 border border-primary-200 dark:border-primary-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Personalized for You</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Based on your interests: {userInterests.slice(0, 3).join(', ')}
              {userInterests.length > 3 && ` and ${userInterests.length - 3} more`}
            </p>
          </div>
        )}

        {/* Empty State */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
          <MessageCircle className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No posts yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Be the first to share something with the community! Posts from people you follow and content matching your interests will appear here.
          </p>
          <button className="bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">
            Create Your First Post
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personalized Feed Header */}
      {userInterests.length > 0 && (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-4 border border-primary-200 dark:border-primary-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Personalized for You</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Based on your interests: {userInterests.slice(0, 3).join(', ')}
            {userInterests.length > 3 && ` and ${userInterests.length - 3} more`}
          </p>
        </div>
      )}

      {/* Refresh Indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-center space-x-2 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="text-sm text-blue-700 dark:text-blue-300">Refreshing feed...</span>
        </div>
      )}

      {posts.map((post: any, index: number) => {
        // Handle Article type
        if (post.type === 'article') {
          return (
            <ArticleCard
              key={`article-${post.id}`}
              article={post}
              onShare={(article) => setShareModalArticle(article)}
            />
          );
        }

        // Handle Shared Article type
        if (post.type === 'shared_article') {
          const sharedByProfile = profilesMap.get(post.shared_by);
          return (
            <SharedArticleCard
              key={`shared-article-${post.id}-${index}`}
              article={post}
              sharedBy={{
                id: post.shared_by,
                name: sharedByProfile?.full_name || 'Someone',
                avatar: sharedByProfile?.avatar_url,
                handle: sharedByProfile?.handle
              }}
              shareText={post.share_text || ''}
              sharedAt={new Date(post.shared_at).toLocaleDateString()}
              onShare={(article) => setShareModalArticle(article)}
            />
          );
        }

        // Helper function to check if a tool was recently added
        const isRecentlyAdded = (dateString: string) => {
          const date = new Date(dateString);
          const now = new Date();
          const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
          return diffHours < 48; // Tool added within last 48 hours
        };

        // Handle Tool type (from followed creators)
        if (post.type === 'tool') {
          const toolAuthorProfile = profilesMap.get(post.user_id);
          return (
            <FeedToolCard
              key={`tool-${post.id}`}
              tool={post}
              author={toolAuthorProfile ? {
                id: post.user_id,
                name: toolAuthorProfile.full_name || 'Creator',
                avatar: toolAuthorProfile.profile_photo,
                handle: toolAuthorProfile.handle
              } : undefined}
              onShare={(tool) => setShareModalTool(tool)}
              isNew={isRecentlyAdded(post.created_at)}
            />
          );
        }

        // Handle Shared Tool type
        if (post.type === 'shared_tool') {
          const sharedByProfile = profilesMap.get(post.shared_by);
          return (
            <SharedToolCard
              key={`shared-tool-${post.id}-${index}`}
              tool={post}
              sharedBy={{
                id: post.shared_by,
                name: sharedByProfile?.full_name || 'Someone',
                avatar: sharedByProfile?.profile_photo,
                handle: sharedByProfile?.handle
              }}
              shareText={post.share_text || ''}
              sharedAt={new Date(post.shared_at).toLocaleDateString()}
              onShare={(tool) => setShareModalTool(tool)}
            />
          );
        }

        // Handle Group type (from followed creators)
        if (post.type === 'group') {
          const creatorProfile = profilesMap.get(post.creator_id);
          return (
            <FeedGroupCard
              key={`group-${post.id}`}
              group={post}
              creator={creatorProfile ? {
                id: post.creator_id,
                name: creatorProfile.full_name || 'Creator',
                avatar: creatorProfile.profile_photo,
                handle: creatorProfile.handle
              } : undefined}
              onShare={(group) => setShareModalGroup(group)}
              isNew={isRecentlyAdded(post.created_at)}
              isMember={userGroupMemberships.includes(post.id)}
              onChat={(groupId) => navigate(`/messages?group=${groupId}`)}
            />
          );
        }

        // Handle Shared Group type
        if (post.type === 'shared_group') {
          const sharedByProfile = profilesMap.get(post.shared_by);
          return (
            <SharedGroupCard
              key={`shared-group-${post.id}-${index}`}
              group={post}
              sharedBy={{
                id: post.shared_by,
                name: sharedByProfile?.full_name || 'Someone',
                avatar: sharedByProfile?.profile_photo,
                handle: sharedByProfile?.handle
              }}
              shareText={post.share_text || ''}
              sharedAt={new Date(post.shared_at).toLocaleDateString()}
              onShare={(group) => setShareModalGroup(group)}
              isMember={userGroupMemberships.includes(post.id)}
              onChat={(groupId) => navigate(`/messages?group=${groupId}`)}
            />
          );
        }

        // Handle Group Event type
        if (post.type === 'group_event') {
          const creatorProfile = profilesMap.get(post.created_by);
          return (
            <FeedEventCard
              key={`group-event-${post.id}`}
              event={post}
              creator={creatorProfile ? {
                id: post.created_by,
                name: creatorProfile.full_name || 'Creator',
                avatar: creatorProfile.profile_photo,
                handle: creatorProfile.handle
              } : undefined}
              groupName={post.groupName}
              onShare={(event) => setShareModalEvent({ event, eventType: event.group_id ? 'group_event' : 'standalone_event' })}
              isNew={isRecentlyAdded(post.created_at)}
            />
          );
        }

        // Handle Standalone Event type
        if (post.type === 'standalone_event') {
          const creatorProfile = profilesMap.get(post.creator_id);
          return (
            <FeedEventCard
              key={`standalone-event-${post.id}`}
              event={post}
              creator={creatorProfile ? {
                id: post.creator_id,
                name: creatorProfile.full_name || 'Creator',
                avatar: creatorProfile.profile_photo,
                handle: creatorProfile.handle
              } : undefined}
              onShare={(event) => setShareModalEvent({ event, eventType: event.group_id ? 'group_event' : 'standalone_event' })}
              isNew={isRecentlyAdded(post.created_at)}
            />
          );
        }

        // Handle Shared Group Event type
        if (post.type === 'shared_group_event') {
          const sharedByProfile = profilesMap.get(post.shared_by);
          return (
            <SharedEventCard
              key={`shared-group-event-${post.id}-${index}`}
              event={post}
              sharedBy={{
                id: post.shared_by,
                name: sharedByProfile?.full_name || 'Someone',
                avatar: sharedByProfile?.profile_photo,
                handle: sharedByProfile?.handle
              }}
              shareText={post.share_text || ''}
              sharedAt={new Date(post.shared_at).toLocaleDateString()}
              onShare={(event) => setShareModalEvent({ event, eventType: event.group_id ? 'group_event' : 'standalone_event' })}
            />
          );
        }

        // Handle Shared Standalone Event type
        if (post.type === 'shared_standalone_event') {
          const sharedByProfile = profilesMap.get(post.shared_by);
          return (
            <SharedEventCard
              key={`shared-standalone-event-${post.id}-${index}`}
              event={post}
              sharedBy={{
                id: post.shared_by,
                name: sharedByProfile?.full_name || 'Someone',
                avatar: sharedByProfile?.profile_photo,
                handle: sharedByProfile?.handle
              }}
              shareText={post.share_text || ''}
              sharedAt={new Date(post.shared_at).toLocaleDateString()}
              onShare={(event) => setShareModalEvent({ event, eventType: event.group_id ? 'group_event' : 'standalone_event' })}
            />
          );
        }

        // Handle Discussion type
        if (post.type === 'discussion') {
          const authorProfile = profilesMap.get(post.author_id);
          return (
            <FeedDiscussionCard
              key={`discussion-${post.id}`}
              discussion={post}
              groupName={post.groupName || 'Group'}
              author={authorProfile ? {
                id: post.author_id,
                name: authorProfile.full_name || 'Author',
                avatar: authorProfile.profile_photo,
                handle: authorProfile.handle
              } : undefined}
              onShare={(discussion) => setShareModalDiscussion({ ...discussion, groupName: post.groupName })}
              isNew={isRecentlyAdded(post.created_at)}
            />
          );
        }

        // Handle Shared Discussion type
        if (post.type === 'shared_discussion') {
          const sharedByProfile = profilesMap.get(post.shared_by);
          return (
            <SharedDiscussionCard
              key={`shared-discussion-${post.id}-${index}`}
              discussion={post}
              groupName={post.groupName || 'Group'}
              sharedBy={{
                id: post.shared_by,
                name: sharedByProfile?.full_name || 'Someone',
                avatar: sharedByProfile?.profile_photo,
                handle: sharedByProfile?.handle
              }}
              shareText={post.share_text || ''}
              sharedAt={new Date(post.shared_at).toLocaleDateString()}
              onShare={(discussion) => setShareModalDiscussion({ ...discussion, groupName: post.groupName })}
            />
          );
        }

        // Regular posts and shared posts
        return (
        <div 
          key={post.type === 'shared' ? `shared-${post.id}-${index}` : post.id}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6"
          ref={(el) => { postRefs.current[post.id] = el; }}
          data-post-id={post.id}
        >
          {/* Reshared Post Header - Shows resharer profile at top */}
          {post.type === 'shared' && post.sharedBy && (
            <div className="mb-4 border-b border-border pb-4">
              <div className="flex items-start space-x-3">
                <ProfileHoverCard userId={post.shared_by}>
                  <Link to={getCreatorProfileLink({ id: post.shared_by, handle: post.sharedBy?.handle })} className="flex-shrink-0">
                    {post.sharedBy?.avatar ? (
                      <img
                        src={post.sharedBy.avatar}
                        alt={post.sharedBy.name}
                        className="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-primary transition-all"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center hover:ring-2 hover:ring-primary transition-all">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </Link>
                </ProfileHoverCard>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <ProfileHoverCard userId={post.shared_by}>
                      <Link 
                        to={getCreatorProfileLink({ id: post.shared_by, handle: post.sharedBy?.handle })}
                        className="font-semibold text-foreground hover:underline"
                      >
                        {post.sharedBy?.name || 'Someone'}
                      </Link>
                    </ProfileHoverCard>
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">shared this</span>
                  </div>
                  {post.shareText && (
                    <p className="text-foreground mt-2 text-sm italic">
                      "{post.shareText}"
                    </p>
                  )}
                  <span className="text-xs text-muted-foreground">{post.sharedAt}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-start space-x-4">
            {/* Clickable Avatar with ProfileHoverCard */}
            <ProfileHoverCard userId={post.user_id}>
              <Link to={getCreatorProfileLink({ id: post.user_id, handle: post.author.handle })} className="flex-shrink-0">
                {post.author.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full object-cover hover:ring-2 hover:ring-primary transition-all"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center hover:ring-2 hover:ring-primary transition-all">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
              </Link>
            </ProfileHoverCard>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                {/* Clickable Author Name with ProfileHoverCard */}
                <ProfileHoverCard userId={post.user_id}>
                  <Link to={getCreatorProfileLink({ id: post.user_id, handle: post.author.handle })} className="hover:underline">
                    <h3 className="font-semibold text-foreground">{post.author.name}</h3>
                  </Link>
                </ProfileHoverCard>
                <PremiumBadge 
                  tier={
                    (post.author.role_id === 1 || post.author.account_type === 'admin') 
                      ? 'gold' 
                      : (post.author.premium_tier as 'silver' | 'gold' | null)
                  } 
                  size="sm" 
                />
                {post.author.verified && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{post.author.title} • {post.timestamp}</p>
                  {/* Show view count only to post author */}
                  {user && post.user_id === user.id && post.view_count !== undefined && (
                    <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
                      <Eye className="h-3 w-3" />
                      <span>{post.view_count} views</span>
                    </div>
                  )}
                </div>
                <PostOptionsMenu
                  postId={post.id}
                  authorId={post.user_id}
                  contentType="post"
                  contentTitle={post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')}
                  onEdit={() => handleEditPost(post.id)}
                  onDelete={() => handleDeletePost(post.id)}
                  onShare={() => handleShare(post.id)}
                  isBookmarked={post.bookmarked}
                  onBookmark={() => handleBookmark(post.id)}
                />
              </div>
              
              <div className="text-gray-800 dark:text-gray-200 mb-4">
                {editingPost === post.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveEdit(post.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  post.content
                )}
              </div>
              
              {post.image && (
                <img
                  src={post.image}
                  alt="Post content"
                  className="w-full h-64 object-cover rounded-xl mb-4"
                />
              )}

              {post.video && (
                <div className="w-full rounded-xl overflow-hidden mb-4 aspect-video">
                  <iframe 
                    src={post.video} 
                    className="w-full h-full" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              {post.link && (
                <div className="mb-4">
                  <LinkPreview url={post.link} />
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex space-x-6">
                  {/* Post Reactions */}
                  <PostReactions
                    postId={post.id}
                    reactions={postReactions[post.id] || {}}
                    userReaction={userReactions[post.id]}
                    onReact={handleReaction}
                  />
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{post.comments.length}</span>
                  </button>
                  <button 
                    onClick={() => handleShare(post.id)}
                    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                    <span>{post.share_count || 0}</span>
                  </button>
                  {/* Show view count to the left of bookmark */}
                  {user && post.user_id === user.id && post.view_count !== undefined && (
                    <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                      <Eye className="h-4 w-4" />
                      <span>{post.view_count}</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleBookmark(post.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      post.bookmarked 
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' 
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 ${post.bookmarked ? 'fill-current' : ''}`} />
                  </button>
                  <PostOptionsMenu
                    postId={post.id}
                    authorId={post.user_id}
                    contentType="post"
                    contentTitle={post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')}
                    onEdit={() => handleEditPost(post.id)}
                    onDelete={() => handleDeletePost(post.id)}
                    onShare={() => handleShare(post.id)}
                    isBookmarked={post.bookmarked}
                    onBookmark={() => handleBookmark(post.id)}
                  />
                </div>
              </div>

              {/* Comments Section */}
              {showComments[post.id] && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {/* Comment Sorting - Always show */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                    </span>
                    <select
                      value={commentSort[post.id] || 'recent'}
                      onChange={(e) => setCommentSort({ ...commentSort, [post.id]: e.target.value as 'relevant' | 'recent' })}
                      className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="relevant">Most Relevant</option>
                    </select>
                  </div>

                  <div className="space-y-4 mb-4">
                    {getSortedComments(post.comments.filter(c => !c.parent_comment_id), post.id).map((comment) => (
                      <div key={comment.id} className="space-y-2">
                        <div className="flex items-start space-x-3">
                          {/* Avatar with fallback */}
                          {comment.author.avatar ? (
                            <Link to={getCreatorProfileLink({ id: comment.author.id, handle: comment.author.handle })}>
                              <img
                                src={comment.author.avatar}
                                alt={comment.author.name}
                                className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            </Link>
                          ) : (
                            <Link to={getCreatorProfileLink({ id: comment.author.id, handle: comment.author.handle })}>
                              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                <User className="h-4 w-4 text-white" />
                              </div>
                            </Link>
                          )}
                          <div className="flex-1">
                            {editingComment?.postId === post.id && editingComment?.commentId === comment.id ? (
                              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                                <input
                                  type="text"
                                  value={editCommentContent}
                                  onChange={(e) => setEditCommentContent(e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                                  autoFocus
                                />
                                <div className="flex items-center space-x-2 mt-2">
                                  <button
                                    onClick={() => handleSaveCommentEdit(post.id, comment.id)}
                                    className="text-xs text-green-600 hover:text-green-700 flex items-center"
                                  >
                                    <Check className="h-3 w-3 mr-1" /> Save
                                  </button>
                                  <button
                                    onClick={() => setEditingComment(null)}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                                  >
                                    <X className="h-3 w-3 mr-1" /> Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center space-x-2">
                                      <Link 
                                        to={getCreatorProfileLink({ id: comment.author.id, handle: comment.author.handle })}
                                        className="font-medium text-sm text-gray-900 dark:text-white hover:underline"
                                      >
                                        {comment.author.name}
                                      </Link>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {comment.timestamp}
                                      </span>
                                    </div>
                                    {comment.canEdit && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleEditComment(post.id, comment.id, comment.content)}>
                                            <Edit3 className="h-4 w-4 mr-2" /> Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={() => handleDeleteComment(post.id, comment.id)}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-800 dark:text-gray-200">
                                    {comment.content}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3 mt-1 ml-3">
                                  <CommentReactions
                                    commentId={comment.id}
                                    reactions={comment.reactions || {}}
                                    userReaction={comment.userReaction}
                                    onReact={handleCommentReaction}
                                  />
                                <button 
                                    onClick={() => handleReply(post.id, comment.id, comment.author.name, comment.author.handle)}
                                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                  >
                                    Reply
                                  </button>
                                </div>

                                {/* Reply Input with MentionInput */}
                                {replyingTo?.postId === post.id && replyingTo?.commentId === comment.id && (
                                  <div className="mt-2 ml-3 flex items-start space-x-2">
                                    <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                      <User className="h-3 w-3 text-white" />
                                    </div>
                                    <div className="flex-1 flex space-x-2">
                                      <MentionInput
                                        value={replyContent}
                                        onChange={setReplyContent}
                                        placeholder={`Reply to ${replyingTo.authorName}...`}
                                        wrapperClassName="flex-1"
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        contentType="comment"
                                        contentId={comment.id}
                                        rows={1}
                                        autoFocus
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleComment(post.id, (post as any).sharedPostId, comment.id);
                                          }
                                        }}
                                      />
                                      <button
                                        onClick={() => handleComment(post.id, (post as any).sharedPostId, comment.id)}
                                        className="px-2 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex-shrink-0"
                                      >
                                        <Send className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={cancelReply}
                                        className="px-2 py-1.5 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Nested Replies */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="ml-8 mt-2 space-y-2">
                                    {comment.replies.map((reply) => (
                                      <div key={reply.id} className="space-y-1">
                                        <div className="flex items-start space-x-2">
                                          {reply.author.avatar ? (
                                            <Link to={getCreatorProfileLink({ id: reply.author.id, handle: reply.author.handle })}>
                                              <img
                                                src={reply.author.avatar}
                                                alt={reply.author.name}
                                                className="w-6 h-6 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                              />
                                            </Link>
                                          ) : (
                                            <Link to={getCreatorProfileLink({ id: reply.author.id, handle: reply.author.handle })}>
                                              <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                                <User className="h-3 w-3 text-white" />
                                              </div>
                                            </Link>
                                          )}
                                          <div className="flex-1">
                                            <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-2">
                                              <div className="flex items-center space-x-2 mb-1">
                                                <Link 
                                                  to={getCreatorProfileLink({ id: reply.author.id, handle: reply.author.handle })}
                                                  className="font-medium text-xs text-gray-900 dark:text-white hover:underline"
                                                >
                                                  {reply.author.name}
                                                </Link>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                  {reply.timestamp}
                                                </span>
                                              </div>
                                              <div className="text-xs text-gray-800 dark:text-gray-200">
                                                {reply.content}
                                              </div>
                                            </div>
                                            {/* Reactions for replies */}
                                            <div className="flex items-center space-x-3 mt-1 ml-2">
                                              <CommentReactions
                                                commentId={reply.id}
                                                reactions={reply.reactions || {}}
                                                userReaction={reply.userReaction}
                                                onReact={handleCommentReaction}
                                                compact
                                              />
                                              <button 
                                                onClick={() => handleReply(post.id, comment.id, reply.author.name, reply.author.handle)}
                                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                              >
                                                Reply
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment with MentionInput */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 flex space-x-2">
                      <MentionInput
                        value={newComment[getCommentKey(post.id, post.sharedPostId)] || ''}
                        onChange={(value) => setNewComment({ ...newComment, [getCommentKey(post.id, post.sharedPostId)]: value })}
                        placeholder="Write a comment..."
                        wrapperClassName="flex-1"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        contentType="comment"
                        contentId={post.sharedPostId || post.id}
                        rows={1}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleComment(post.id, (post as any).sharedPostId);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleComment(post.id, (post as any).sharedPostId)}
                        className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex-shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })}

      {/* Share Modal for Posts */}
      {shareModalPost && (
        <SharePostModal
          isOpen={!!shareModalPost}
          onClose={() => setShareModalPost(null)}
          post={shareModalPost}
          onShare={() => {
            handleShareComplete(shareModalPost.id); // Update share count
            fetchPosts(); // Refresh posts to show the shared post
            setShareModalPost(null);
          }}
        />
      )}

      {/* Share Modal for Articles */}
      {shareModalArticle && (
        <SharePostModal
          isOpen={!!shareModalArticle}
          onClose={() => setShareModalArticle(null)}
          article={{
            id: shareModalArticle.id,
            title: shareModalArticle.title,
            excerpt: shareModalArticle.excerpt,
            featured_image_url: shareModalArticle.featured_image_url,
            user_id: shareModalArticle.user_id,
            category: shareModalArticle.category,
            author: shareModalArticle.author
          }}
          onShare={() => {
            fetchPosts();
            setShareModalArticle(null);
          }}
        />
      )}

      {/* Share Modal for Tools */}
      {shareModalTool && (
        <ShareToolModal
          isOpen={!!shareModalTool}
          onClose={() => setShareModalTool(null)}
          tool={{
            id: shareModalTool.id,
            name: shareModalTool.name,
            description: shareModalTool.description,
            logo_url: shareModalTool.logo_url,
            website: shareModalTool.website
          }}
          onShare={() => {
            fetchPosts();
            setShareModalTool(null);
          }}
        />
      )}

      {/* Share Modal for Groups */}
      {shareModalGroup && (
        <ShareGroupModal
          isOpen={!!shareModalGroup}
          onClose={() => setShareModalGroup(null)}
          group={shareModalGroup}
          onShare={() => {
            fetchPosts();
            setShareModalGroup(null);
          }}
        />
      )}

      {/* Share Modal for Events */}
      {shareModalEvent && (
        <ShareEventModal
          isOpen={!!shareModalEvent}
          onClose={() => setShareModalEvent(null)}
          event={shareModalEvent.event}
          eventType={shareModalEvent.eventType as 'group_event' | 'standalone_event'}
          onShare={() => {
            fetchPosts();
            setShareModalEvent(null);
          }}
        />
      )}

      {/* Share Modal for Discussions */}
      {shareModalDiscussion && (
        <ShareDiscussionModal
          isOpen={!!shareModalDiscussion}
          onClose={() => setShareModalDiscussion(null)}
          discussion={shareModalDiscussion}
          groupName={shareModalDiscussion.groupName || 'Group'}
          onShare={() => {
            fetchPosts();
            setShareModalDiscussion(null);
          }}
        />
      )}
    </div>
  );
};

export default NewsFeed;