import React, { useState, useEffect } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { User, UserPlus, MessageCircle, MapPin, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCreatorProfileLink } from '@/utils/profileUtils';

interface ProfileHoverCardProps {
  userId: string;
  children: React.ReactNode;
  onProfileClick?: () => void;
}

interface UserProfile {
  id: string;
  full_name: string;
  handle?: string;
  profile_photo?: string;
  job_title?: string;
  company?: string;
  location?: string;
  bio?: string;
}

const ProfileHoverCard: React.FC<ProfileHoverCardProps> = ({
  userId,
  children,
  onProfileClick,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasRequestPending, setHasRequestPending] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && userId !== user?.id) {
      fetchProfile();
      checkConnectionStatus();
    }
    
    // Listen for connection request processing events
    const handleConnectionRequestProcessed = () => {
      if (userId && userId !== user?.id) {
        checkConnectionStatus();
      }
    };
    window.addEventListener('connectionRequestProcessed', handleConnectionRequestProcessed);

    return () => {
      window.removeEventListener('connectionRequestProcessed', handleConnectionRequestProcessed);
    };
  }, [userId, user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, handle, profile_photo, job_title, company, location, bio')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

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

  const sendConnectionRequest = async () => {
    if (!user || !profile) return;

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
          message: `Hi ${profile.full_name}, I'd like to connect with you!`
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

      // Auto-follow (ignore duplicates)
      try {
        await (supabase as any)
          .from('follows')
          .upsert({ follower_id: user.id, following_id: userId }, { onConflict: 'follower_id,following_id', ignoreDuplicates: true } as any);
      } catch (followErr: any) {
        console.warn('Auto-follow skipped or failed:', followErr?.message || followErr);
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    } finally {
      setLoading(false);
    }
  };

  if (!profile || userId === user?.id) {
    return <>{children}</>;
  }

  const handleProfileNavigation = () => {
    if (profile) {
      navigate(getCreatorProfileLink({ id: profile.id, handle: profile.handle }));
    }
    if (onProfileClick) {
      onProfileClick();
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span onClick={handleProfileNavigation} className="cursor-pointer">
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Avatar className="h-12 w-12">
              {profile.profile_photo ? (
                <AvatarImage src={profile.profile_photo} />
              ) : (
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{profile.full_name}</h4>
              {profile.job_title && (
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Briefcase className="h-3 w-3 mr-1" />
                  <span className="truncate">
                    {profile.job_title}
                    {profile.company && ` at ${profile.company}`}
                  </span>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {profile.bio}
            </p>
          )}

          <div className="flex space-x-2">
            {isConnected ? (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={async () => {
                  try {
                    if (typeof window !== 'undefined' && (window as any).chatDock?.open) {
                      await (window as any).chatDock.open(userId);
                      toast.success(`Opening chat with ${profile.full_name}`);
                    } else {
                      toast.error('Chat system not ready. Please try again.');
                    }
                  } catch (error) {
                    console.error('Error opening chat:', error);
                    toast.error('Failed to open chat');
                  }
                }}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Message
              </Button>
            ) : hasRequestPending ? (
              <Button size="sm" variant="outline" disabled className="flex-1">
                Request Sent
              </Button>
            ) : (
              <Button 
                size="sm" 
                onClick={sendConnectionRequest}
                disabled={loading}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Connect
              </Button>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default ProfileHoverCard;