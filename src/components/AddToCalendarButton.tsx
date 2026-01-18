import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Download, ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  CalendarEvent,
  downloadICSFile,
  generateGoogleCalendarUrl,
  generateOutlookUrl,
  generateYahooCalendarUrl,
  createCalendarEventFromDB,
} from '@/utils/calendarUtils';

interface AddToCalendarButtonProps {
  event: {
    title: string;
    description?: string | null;
    event_date: string;
    event_end_date?: string | null;
    location?: string | null;
    is_online?: boolean | null;
    online_link?: string | null;
    timezone?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  };
  isAttending?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showOnlyIfAttending?: boolean;
}

const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({
  event,
  isAttending = true,
  variant = 'outline',
  size = 'default',
  className = '',
  showOnlyIfAttending = true,
}) => {
  const { t } = useTranslation();

  // Don't render if user is not attending and showOnlyIfAttending is true
  if (showOnlyIfAttending && !isAttending) {
    return null;
  }

  const calendarEvent = createCalendarEventFromDB(event);

  const handleDownloadICS = () => {
    try {
      downloadICSFile(calendarEvent);
      toast.success(t('calendar.downloadStarted', 'Calendar file downloaded'));
    } catch (error) {
      console.error('Error downloading ICS file:', error);
      toast.error(t('calendar.downloadError', 'Failed to download calendar file'));
    }
  };

  const handleOpenGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(calendarEvent);
    window.open(url, '_blank');
  };

  const handleOpenOutlook = () => {
    const url = generateOutlookUrl(calendarEvent);
    window.open(url, '_blank');
  };

  const handleOpenYahoo = () => {
    const url = generateYahooCalendarUrl(calendarEvent);
    window.open(url, '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Calendar className="h-4 w-4 mr-2" />
          {t('calendar.addToCalendar', 'Add to Calendar')}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleOpenGoogleCalendar}>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M22.54 12.49c0-.79-.07-1.54-.19-2.27H12v4.51h5.92a5.02 5.02 0 01-2.19 3.31v2.77h3.54c2.07-1.91 3.27-4.72 3.27-8.32z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.77c-.98.66-2.23 1.06-3.74 1.06-2.88 0-5.32-1.95-6.19-4.57H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.81 14.06a6.2 6.2 0 010-3.92V7.3H2.18a10 10 0 000 9.4l3.63-2.64z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.3l3.63 2.84c.87-2.62 3.31-4.76 6.19-4.76z" fill="#EA4335"/>
            </svg>
            <span>{t('calendar.googleCalendar', 'Google Calendar')}</span>
          </div>
          <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleOpenOutlook}>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 01-.588.234h-8.522v-6.4l1.454 1.09c.097.06.209.091.336.091.127 0 .239-.03.336-.091l6.984-5.248V7.35l-7.32 5.496-7.32-5.496V18.67H.826a.806.806 0 01-.588-.234.763.763 0 01-.238-.576V4.74c0-.268.104-.478.313-.629.21-.15.447-.213.71-.187h7.62l7.357 5.541 7.357-5.541h.818c.127 0 .247.042.362.126.115.084.187.174.218.27l.015.12-.015.15v2.797h.245z" fill="#0072C6"/>
            </svg>
            <span>{t('calendar.outlookCalendar', 'Outlook')}</span>
          </div>
          <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleOpenYahoo}>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" fill="#6001D2"/>
              <path d="M18.5 7.5L14 12l4.5 4.5-1.5 1.5L12 13.5 7 18l-1.5-1.5L10 12 5.5 7.5 7 6l5 4.5 5-4.5 1.5 1.5z" fill="#fff"/>
            </svg>
            <span>{t('calendar.yahooCalendar', 'Yahoo Calendar')}</span>
          </div>
          <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleDownloadICS}>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>{t('calendar.downloadICS', 'Download .ics file')}</span>
          </div>
        </DropdownMenuItem>
        
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground">
            {t('calendar.icsHelp', 'Works with Apple Calendar, Google, and other apps')}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddToCalendarButton;
