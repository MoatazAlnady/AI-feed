import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import VerificationBadge from '@/components/VerificationBadge';
import {
  X,
  ExternalLink,
  MessageSquare,
  FolderPlus,
  MapPin,
  Briefcase,
  Building2,
  Globe,
  Github,
  Linkedin,
  Twitter,
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
  website?: string | null;
  github?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  contact_visible?: boolean;
}

interface TalentProfilePreviewProps {
  talent: TalentProfile | null;
  onClose: () => void;
  onSaveToProject: (talent: TalentProfile) => void;
  onSendMessage: (talent: TalentProfile) => void;
}

const getProficiencyLabel = (level: number): string => {
  switch (level) {
    case 1: return 'Beginner';
    case 2: return 'Elementary';
    case 3: return 'Intermediate';
    case 4: return 'Advanced';
    case 5: return 'Native';
    default: return 'Unknown';
  }
};

const TalentProfilePreview = ({ talent, onClose, onSaveToProject, onSendMessage }: TalentProfilePreviewProps) => {
  const { t } = useTranslation();

  if (!talent) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-card rounded-lg border">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{t('talentSearch.selectTalent', 'Select a Talent')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('talentSearch.selectTalentDesc', 'Click on a talent card to view their full profile here')}
        </p>
      </div>
    );
  }

  const initials = talent.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  const displayLocation = talent.location || [talent.city, talent.country].filter(Boolean).join(', ');

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <h3 className="font-semibold">{t('talentSearch.profilePreview', 'Profile Preview')}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={talent.profile_photo || ''} alt={talent.full_name || ''} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{talent.full_name || 'Unknown'}</h2>
              {talent.verified && <VerificationBadge />}
            </div>
            {talent.job_title && (
              <p className="text-primary font-medium">{talent.job_title}</p>
            )}
            {talent.company && (
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <Building2 className="h-4 w-4" />
                {talent.company_page_id ? (
                  <Link 
                    to={`/company/${talent.company_page_id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {talent.company}
                  </Link>
                ) : (
                  <span>{talent.company}</span>
                )}
              </div>
            )}
            {displayLocation && (
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{displayLocation}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={() => onSendMessage(talent)} 
              className="flex-1"
              variant="outline"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('talentSearch.sendMessage', 'Message')}
            </Button>
            <Button 
              onClick={() => onSaveToProject(talent)}
              className="flex-1"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              {t('talentSearch.saveToProject', 'Save')}
            </Button>
          </div>

          <Separator />

          {/* Bio */}
          {talent.bio && (
            <div>
              <h4 className="font-semibold mb-2">{t('talentSearch.about', 'About')}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{talent.bio}</p>
            </div>
          )}

          {/* Skills */}
          {talent.interests && talent.interests.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">{t('talentSearch.skills', 'Skills & Interests')}</h4>
              <div className="flex flex-wrap gap-2">
                {talent.interests.map((skill, idx) => (
                  <Badge key={idx} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {talent.languages && talent.languages.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Languages className="h-4 w-4" />
                {t('talentSearch.languages', 'Languages')}
              </h4>
              <div className="space-y-2">
                {talent.languages.map((lang, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{lang.language}</span>
                    <Badge variant="outline" className="text-xs">
                      {getProficiencyLabel(lang.proficiency)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {(talent.website || talent.github || talent.linkedin || talent.twitter) && (
            <div>
              <h4 className="font-semibold mb-2">{t('talentSearch.links', 'Links')}</h4>
              <div className="space-y-2">
                {talent.website && (
                  <a 
                    href={talent.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="truncate">{talent.website}</span>
                  </a>
                )}
                {talent.linkedin && (
                  <a 
                    href={talent.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {talent.github && (
                  <a 
                    href={talent.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Github className="h-4 w-4" />
                    <span>GitHub</span>
                  </a>
                )}
                {talent.twitter && (
                  <a 
                    href={talent.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Twitter className="h-4 w-4" />
                    <span>Twitter</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button asChild variant="outline" className="w-full">
          <Link to={`/creator/${talent.id}`} target="_blank">
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('talentSearch.viewFullProfile', 'View Full Profile')}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default TalentProfilePreview;
