import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import VerificationBadge from '@/components/VerificationBadge';
import { Link } from 'react-router-dom';
import { getCreatorProfileLink } from '@/utils/profileUtils';

export default function TopCreators() {
  const { data: creators, isLoading } = useQuery({
    queryKey: ['top-creators'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_creators', { limit_param: 10 });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading || !creators?.length) return null;

  return (
    <section className="animate-fade-in">
      <div className="container max-w-6xl mx-auto">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Top AI Creators</h3>
        <div className="flex justify-center">
          <div className="flex space-x-4 overflow-x-auto pb-4 max-w-4xl">
          {creators.map((creator) => (
            <Link
              key={creator.id}
              to={getCreatorProfileLink({ id: creator.id, handle: creator.handle || undefined })}
              className="flex flex-col items-center justify-start gap-2 w-28 group"
            >
              <div className="relative">
                <Avatar className="w-16 h-16 border-2 border-muted group-hover:border-primary transition-colors">
                  <AvatarImage 
                    src={creator.profile_photo || ''} 
                    alt={creator.full_name || 'User'} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {creator.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {(creator.verified || creator.ai_feed_top_voice) && (
                  <div className="absolute -top-1 -right-1">
                    <VerificationBadge 
                      type={creator.verified && creator.ai_feed_top_voice ? 'both' : creator.ai_feed_top_voice ? 'top-voice' : 'verified'}
                      size="sm"
                    />
                  </div>
                )}
              </div>
              <p className="text-center text-sm leading-tight font-bold text-foreground break-words">
                {creator.full_name}
              </p>
            </Link>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}