import React, { useState, useEffect } from 'react';
import { 
  User, 
  UserPlus, 
  UserCheck, 
  MessageCircle, 
  MapPin, 
  Briefcase, 
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Mail,
  Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChatDock } from '../context/ChatDockContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';


interface UserProfileCardProps {
  userId: string;
  name: string;
  title?: string;
  company?: string;
  location?: string;
  bio?: string;
  profilePhoto?: string;
  isFollowing?: boolean;
  showContactInfo?: boolean;
  socialLinks?: {
    website?: string;
    github?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  onFollow?: () => void;
  onMessage?: () => void;
  onConnect?: () => void;
  className?: string;
  handle?: string; // Add handle prop for profile routing
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  userId,
  name,
  title,
  company,
  location,
  bio,
  profilePhoto,
  isFollowing = false,
  showContactInfo = false,
  socialLinks = {},
  contactInfo = {},
  onFollow,
  onMessage,
  onConnect,
  className = '',
  handle
}) => {
  const { user } = useAuth();
  const { openChatWith } = useChatDock(); // Move hook to component level
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasRequestPending, setHasRequestPending] = useState(false);

  const isOwnProfile = user?.id === userId;

  // Get theme-aware button styles
  const getButtonStyles = (theme: string) => ({
    light: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      color: '#111827'
    },
    dark: {
      backgroundColor: '#0f172a',
      borderColor: '#334155', 
      color: '#e2e8f0'
    }
  });

  const getHoverStyles = (theme: string) => ({
    light: '#f3f4f6',
    dark: '#1e293b'
  });

  useEffect(() => {
    if (user && userId && !isOwnProfile) {
      checkConnectionStatus();
    }
    
    // Listen for connection request processing events
    const handleConnectionRequestProcessed = () => {
      if (user && userId && !isOwnProfile) {
        checkConnectionStatus();
      }
    };
    window.addEventListener('connectionRequestProcessed', handleConnectionRequestProcessed);

    return () => {
      window.removeEventListener('connectionRequestProcessed', handleConnectionRequestProcessed);
    };
  }, [user, userId, isOwnProfile]);

  const checkConnectionStatus = async () => {
    if (!user) return;

    try {
      // Check if connected
      const { data: connectionData } = await supabase
        .rpc('are_users_connected', { user1_id: user.id, user2_id: userId });

      setIsConnected(connectionData || false);

      // Check for pending request
      const { data: requestData } = await supabase
        .from('connection_requests')
        .select('id')
        .eq('requester_id', user.id)
        .eq('recipient_id', userId)
        .eq('status', 'pending')
        .maybeSingle();

      setHasRequestPending(!!requestData);
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const handleFollow = async () => {
    if (!onFollow) return;
    setLoading(true);
    try {
      await onFollow();
      setFollowing(!following);
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'github': return Github;
      case 'linkedin': return Linkedin;
      case 'twitter': return Twitter;
      case 'instagram': return Instagram;
      case 'youtube': return Youtube;
      case 'website': return Globe;
      default: return ExternalLink;
    }
  };

  const getSocialUrl = (platform: string, value: string) => {
    if (value.startsWith('http')) return value;
    
    switch (platform) {
      case 'github': return `https://github.com/${value}`;
      case 'linkedin': return `https://linkedin.com/in/${value}`;
      case 'twitter': return `https://twitter.com/${value}`;
      case 'instagram': return `https://instagram.com/${value}`;
      case 'youtube': return `https://youtube.com/@${value}`;
      default: return value;
    }
  };

  const sendConnectionRequest = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Check usage limits
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: usageData } = await supabase
        .from('user_usage')
        .select('connection_requests_sent')
        .eq('user_id', user.id)
        .eq('month_year', currentMonth)
        .maybeSingle();

      const currentRequests = usageData?.connection_requests_sent || 0;
      if (currentRequests >= 50) {
        toast.error('Monthly connection request limit reached (50). Upgrade to premium for unlimited requests.');
        return;
      }

      // Send connection request
      const { error } = await supabase
        .from('connection_requests')
        .insert({
          requester_id: user.id,
          recipient_id: userId,
          message: `Hi ${name}, I'd like to connect with you!`
        });

      if (error) throw error;

      // Update usage
      await supabase
        .from('user_usage')
        .upsert({
          user_id: user.id,
          month_year: currentMonth,
          connection_requests_sent: currentRequests + 1
        });

      setHasRequestPending(true);
      toast.success('Connection request sent!');
      
      if (onConnect) {
        onConnect();
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!user) {
      toast.error('Please log in to send messages');
      return;
    }

    if (!userId) {
      toast.error('Invalid user ID');
      return;
    }

    if (onMessage) {
      onMessage();
    } else {
      try {
        await openChatWith(userId, { createIfMissing: true });
        toast.success(`Opening chat with ${name}`);
      } catch (error) {
        console.error('Error opening chat:', error);
        toast.error('Failed to open chat');
      }
    }
  };

  // Generate profile link - use handle if available, otherwise fallback to userId
  const getProfileLink = () => {
    if (handle) {
      return `/creator/${handle}`;
    }
    return `/creator/${userId}`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        {/* Profile Photo */}
        <Link to={getProfileLink()} className="flex-shrink-0">
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt={name}
              className="w-16 h-16 rounded-full object-cover hover:ring-2 hover:ring-primary-300 transition-all cursor-pointer"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center hover:ring-2 hover:ring-primary-300 transition-all cursor-pointer">
              <User className="h-8 w-8 text-white" />
            </div>
          )}
        </Link>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <Link to={getProfileLink()} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate cursor-pointer">{name}</h3>
          </Link>
          
          {title && (
            <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
              <Briefcase className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-sm truncate">
                {title}{company && ` at ${company}`}
              </span>
            </div>
          )}
          
          {location && (
            <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-sm truncate">{location}</span>
            </div>
          )}
          
          {bio && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">{bio}</p>
          )}

          {/* Social Links */}
          {Object.keys(socialLinks).length > 0 && (
            <div className="flex items-center space-x-2 mt-3">
              {Object.entries(socialLinks).map(([platform, value]) => {
                if (!value) return null;
                const Icon = getSocialIcon(platform);
                return (
                  <a
                    key={platform}
                    href={getSocialUrl(platform, value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={`${platform}: ${value}`}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Contact Info (only if user chose to show it) */}
          {showContactInfo && (contactInfo.email || contactInfo.phone) && (
            <div className="mt-3 space-y-1">
              {contactInfo.email && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              )}
              {contactInfo.phone && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isOwnProfile && (
        <div className="mt-6 flex w-full items-center justify-center gap-3">
          {/* Connection status button */}
          {isConnected ? (
            <div className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              <UserCheck className="h-4 w-4" />
              <span>Connected</span>
            </div>
          ) : hasRequestPending ? (
            <button
              disabled
              className="flex items-center space-x-1 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium"
            >
              <UserCheck className="h-4 w-4" />
              <span>Request Sent</span>
            </button>
          ) : (
            <button
              onClick={sendConnectionRequest}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              <UserPlus className="h-4 w-4" />
              <span>Connect</span>
            </button>
          )}

          {/* Always show message button */}
          <button
            onClick={handleMessage}
            className="flex items-center space-x-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Message</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileCard;