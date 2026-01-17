import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * Profile page that redirects to the unified CreatorProfile page.
 * This ensures a single profile view for all users.
 */
const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToCreatorProfile = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      try {
        // Fetch user's handle for a cleaner URL
        const { data } = await supabase
          .from('user_profiles')
          .select('handle')
          .eq('id', user.id)
          .single();

        // Redirect to creator profile using handle if available, otherwise ID
        const profilePath = data?.handle 
          ? `/creator/${data.handle}` 
          : `/creator/${user.id}`;
        
        navigate(profilePath, { replace: true });
      } catch (error) {
        console.error('Error fetching profile handle:', error);
        // Fallback to ID-based URL
        navigate(`/creator/${user.id}`, { replace: true });
      }
    };

    redirectToCreatorProfile();
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner />
    </div>
  );
};

export default Profile;
