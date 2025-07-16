import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import VerificationBadge from '@/components/VerificationBadge';
import { Link } from 'react-router-dom';

export default function TopCreators() {
  const { data: creators, isLoading } = useQuery({
    queryKey: ['top-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, profile_photo, verified, ai_nexus_top_voice, job_title, total_engagement')
        .not('full_name', 'is', null)
        .not('full_name', 'eq', '')
        .order('total_engagement', { ascending: false })
        .limit(10);

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
              to={`/user/${creator.id}`}
              className="flex-shrink-0 text-center group"
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
                {(creator.verified || creator.ai_nexus_top_voice) && (
                  <div className="absolute -top-1 -right-1">
                    <VerificationBadge 
                      type={creator.verified && creator.ai_nexus_top_voice ? 'both' : creator.ai_nexus_top_voice ? 'top-voice' : 'verified'}
                      size="sm"
                    />
                  </div>
                )}
              </div>
              <div className="mt-2 max-w-[80px] text-center">
                <p className="text-xs font-medium text-foreground truncate">
                  {creator.full_name}
                </p>
                {creator.job_title && (
                  <p className="text-xs text-muted-foreground truncate">
                    {creator.job_title}
                  </p>
                )}
              </div>
            </Link>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}