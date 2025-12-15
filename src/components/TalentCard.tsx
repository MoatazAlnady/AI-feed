import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VerificationBadge from '@/components/VerificationBadge';
import {
  MapPin,
  Building2,
  FolderPlus,
  MessageSquare,
  Languages,
} from 'lucide-react';

interface TalentProfile {
  id: string;
  full_name: string | null;
  job_title: string | null;
  company: string | null;
  company_page_id?: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  profile_photo: string | null;
  verified: boolean;
  interests: string[] | null;
  languages: { language: string; proficiency: number }[] | null;
  contact_visible: boolean;
}

interface TalentCardProps {
  talent: TalentProfile;
  isSelected?: boolean;
  onSelect: (talent: TalentProfile) => void;
  onSaveToProject: (talent: TalentProfile) => void;
  onSendMessage: (talent: TalentProfile) => void;
}

const TalentCard = ({ talent, isSelected, onSelect, onSaveToProject, onSendMessage }: TalentCardProps) => {
  const { t } = useTranslation();

  const initials = talent.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  const displayLocation = talent.location || [talent.city, talent.country].filter(Boolean).join(', ');
  const displaySkills = talent.interests?.slice(0, 4) || [];
  const remainingSkills = (talent.interests?.length || 0) - 4;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected 
          ? 'ring-2 ring-primary border-primary' 
          : 'hover:border-primary/50'
      }`}
      onClick={() => onSelect(talent)}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Avatar */}
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarImage src={talent.profile_photo || ''} alt={talent.full_name || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate">
                {talent.full_name || 'Unknown'}
              </h3>
              {talent.verified && <VerificationBadge size="sm" />}
            </div>

            {talent.job_title && (
              <p className="text-sm font-medium text-primary truncate">
                {talent.job_title}
              </p>
            )}

            {talent.company && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                {talent.company_page_id ? (
                  <Link 
                    to={`/company/${talent.company_page_id}`}
                    className="hover:text-primary hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {talent.company}
                  </Link>
                ) : (
                  <span className="truncate">{talent.company}</span>
                )}
              </div>
            )}

            {displayLocation && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{displayLocation}</span>
              </div>
            )}

            {/* Languages summary */}
            {talent.languages && talent.languages.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Languages className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {talent.languages.map(l => l.language).join(', ')}
                </span>
              </div>
            )}

            {/* Skills */}
            {displaySkills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {displaySkills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs px-2 py-0">
                    {skill}
                  </Badge>
                ))}
                {remainingSkills > 0 && (
                  <Badge variant="outline" className="text-xs px-2 py-0">
                    +{remainingSkills}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onSendMessage(talent);
              }}
              title={t('talentSearch.sendMessage', 'Send Message')}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onSaveToProject(talent);
              }}
              title={t('talentSearch.saveToProject', 'Save to Project')}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bio preview */}
        {talent.bio && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {talent.bio}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TalentCard;
