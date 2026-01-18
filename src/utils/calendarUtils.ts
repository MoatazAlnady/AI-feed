/**
 * Calendar Utilities for generating ICS files and calendar URLs
 * Supports Google Calendar, Outlook, and ICS file downloads
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  isOnline?: boolean;
  onlineLink?: string;
  organizer?: string;
  timezone?: string;
}

/**
 * Format date for ICS file (YYYYMMDDTHHMMSSZ format)
 */
const formatICSDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHMMSS format with timezone)
 */
const formatGoogleDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Escape special characters for ICS format
 */
const escapeICS = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Generate ICS file content (RFC 5545 compliant)
 */
export function generateICSContent(event: CalendarEvent): string {
  const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}@aifeed.app`;
  const startDate = formatICSDate(event.startDate);
  const endDate = event.endDate ? formatICSDate(event.endDate) : formatICSDate(new Date(event.startDate.getTime() + 60 * 60 * 1000)); // Default 1 hour duration
  
  const location = event.isOnline && event.onlineLink 
    ? event.onlineLink 
    : event.location || '';
    
  const description = [
    event.description || '',
    event.isOnline && event.onlineLink ? `\n\nJoin online: ${event.onlineLink}` : ''
  ].filter(Boolean).join('');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Feed//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${escapeICS(description)}`);
  }
  
  if (location) {
    lines.push(`LOCATION:${escapeICS(location)}`);
  }
  
  if (event.organizer) {
    lines.push(`ORGANIZER:${escapeICS(event.organizer)}`);
  }

  // Add URL for online events
  if (event.isOnline && event.onlineLink) {
    lines.push(`URL:${event.onlineLink}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = formatGoogleDate(event.startDate);
  const endDate = event.endDate 
    ? formatGoogleDate(event.endDate) 
    : formatGoogleDate(new Date(event.startDate.getTime() + 60 * 60 * 1000));
  
  const location = event.isOnline && event.onlineLink 
    ? event.onlineLink 
    : event.location || '';

  const description = [
    event.description || '',
    event.isOnline && event.onlineLink ? `\n\nJoin online: ${event.onlineLink}` : ''
  ].filter(Boolean).join('');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: description,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Web URL
 */
export function generateOutlookUrl(event: CalendarEvent): string {
  const location = event.isOnline && event.onlineLink 
    ? event.onlineLink 
    : event.location || '';

  const description = [
    event.description || '',
    event.isOnline && event.onlineLink ? `\n\nJoin online: ${event.onlineLink}` : ''
  ].filter(Boolean).join('');

  const endDate = event.endDate || new Date(event.startDate.getTime() + 60 * 60 * 1000);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: description,
    location: location,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Yahoo Calendar URL
 */
export function generateYahooCalendarUrl(event: CalendarEvent): string {
  const startDate = formatGoogleDate(event.startDate);
  const endDate = event.endDate 
    ? formatGoogleDate(event.endDate) 
    : formatGoogleDate(new Date(event.startDate.getTime() + 60 * 60 * 1000));

  const location = event.isOnline && event.onlineLink 
    ? event.onlineLink 
    : event.location || '';

  const description = [
    event.description || '',
    event.isOnline && event.onlineLink ? `\n\nJoin online: ${event.onlineLink}` : ''
  ].filter(Boolean).join('');

  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: startDate,
    et: endDate,
    desc: description,
    in_loc: location,
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/**
 * Download ICS file
 */
export function downloadICSFile(event: CalendarEvent): void {
  const content = generateICSContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate ICS content as a data URI for email attachments
 */
export function generateICSDataUri(event: CalendarEvent): string {
  const content = generateICSContent(event);
  const base64 = btoa(unescape(encodeURIComponent(content)));
  return `data:text/calendar;base64,${base64}`;
}

/**
 * Convert event data from database format to CalendarEvent
 */
export function createCalendarEventFromDB(dbEvent: {
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
}): CalendarEvent {
  let startDate = new Date(dbEvent.event_date);
  let endDate = dbEvent.event_end_date 
    ? new Date(dbEvent.event_end_date)
    : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour

  // If we have separate time fields, combine them
  if (dbEvent.start_time) {
    const [hours, minutes] = dbEvent.start_time.split(':').map(Number);
    startDate = new Date(startDate);
    startDate.setHours(hours, minutes, 0, 0);
  }

  if (dbEvent.end_time && dbEvent.event_end_date) {
    const [hours, minutes] = dbEvent.end_time.split(':').map(Number);
    endDate = new Date(endDate);
    endDate.setHours(hours, minutes, 0, 0);
  }

  return {
    title: dbEvent.title,
    description: dbEvent.description || undefined,
    startDate,
    endDate,
    location: dbEvent.location || undefined,
    isOnline: dbEvent.is_online || false,
    onlineLink: dbEvent.online_link || undefined,
    timezone: dbEvent.timezone || 'UTC',
  };
}

/**
 * Generate a unique meeting room ID for live streams
 */
export function generateMeetingRoomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let roomId = '';
  for (let i = 0; i < 3; i++) {
    if (i > 0) roomId += '-';
    for (let j = 0; j < 4; j++) {
      roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return roomId;
}

/**
 * Generate a meeting URL from room ID
 */
export function generateMeetingUrl(roomId: string): string {
  return `https://meet.aifeed.app/${roomId}`;
}
