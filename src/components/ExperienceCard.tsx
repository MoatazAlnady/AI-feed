import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Edit, Trash2, Calendar } from 'lucide-react';
import type { UserExperience } from './AddExperienceModal';

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface ExperienceCardProps {
  experience: UserExperience;
  onEdit: () => void;
  onDelete: () => void;
}

const ExperienceCard: React.FC<ExperienceCardProps> = ({
  experience,
  onEdit,
  onDelete
}) => {
  const formatDate = (month: number | null | undefined, year: number | null | undefined) => {
    if (!year) return '';
    if (month && month >= 1 && month <= 12) {
      return `${months[month - 1]} ${year}`;
    }
    return year.toString();
  };

  const getDateRange = () => {
    const start = formatDate(experience.start_month, experience.start_year);
    if (experience.is_current) {
      return `${start} - Present`;
    }
    const end = formatDate(experience.end_month, experience.end_year);
    return end ? `${start} - ${end}` : start;
  };

  const getDuration = () => {
    if (!experience.start_year) return '';
    
    const startDate = new Date(
      experience.start_year,
      (experience.start_month || 1) - 1
    );
    
    const endDate = experience.is_current
      ? new Date()
      : experience.end_year
        ? new Date(experience.end_year, (experience.end_month || 12) - 1)
        : new Date();
    
    const months = Math.max(0, 
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth())
    );
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0 && remainingMonths > 0) {
      return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} yr${years > 1 ? 's' : ''}`;
    } else if (remainingMonths > 0) {
      return `${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
    }
    return '';
  };

  const employmentTypeLabels: Record<string, string> = {
    'full-time': 'Full-time',
    'part-time': 'Part-time',
    'contract': 'Contract',
    'freelance': 'Freelance',
    'internship': 'Internship'
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between gap-4">
          <div className="flex gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 shrink-0 bg-muted rounded-lg flex items-center justify-center">
              {experience.company_logo_url ? (
                <img 
                  src={experience.company_logo_url} 
                  alt={experience.company} 
                  className="w-10 h-10 rounded object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate">{experience.job_title}</h4>
              <p className="text-sm text-muted-foreground">{experience.company}</p>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {getDateRange()}
                </span>
                {getDuration() && (
                  <span className="text-muted-foreground/70">· {getDuration()}</span>
                )}
                {experience.employment_type && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {employmentTypeLabels[experience.employment_type] || experience.employment_type}
                  </Badge>
                )}
              </div>
              
              {experience.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {experience.location}
                </p>
              )}
              
              {experience.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                  {experience.description}
                </p>
              )}
              
              {experience.skills_used && experience.skills_used.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {experience.skills_used.slice(0, 6).map(skill => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {experience.skills_used.length > 6 && (
                    <Badge variant="secondary" className="text-xs">
                      +{experience.skills_used.length - 6} more
                    </Badge>
                  )}
                </div>
              )}
              
              {experience.source === 'cv_import' && (
                <Badge variant="outline" className="text-xs mt-2 text-muted-foreground">
                  Imported from CV
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperienceCard;
