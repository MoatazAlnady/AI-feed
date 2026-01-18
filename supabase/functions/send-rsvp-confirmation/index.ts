import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-RSVP-CONFIRMATION] ${step}${detailsStr}`);
};

// Generate ICS calendar content
function generateICSContent(event: {
  title: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  location?: string | null;
  isOnline?: boolean;
  onlineLink?: string | null;
}): string {
  const formatDate = (date: Date) => 
    date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const uid = `${Date.now()}-${Math.random().toString(36).substring(7)}@aifeed.app`;
  const endDate = event.endDate || new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
  const location = event.isOnline && event.onlineLink ? event.onlineLink : (event.location || '');
  const description = (event.description || '').replace(/\n/g, '\\n').substring(0, 1000);

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Feed//Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${description}
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

// Generate Google Calendar URL
function generateGoogleCalendarUrl(event: {
  title: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  location?: string | null;
  isOnline?: boolean;
  onlineLink?: string | null;
}): string {
  const formatGoogleDate = (date: Date) => 
    date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const endDate = event.endDate || new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000);
  const location = event.isOnline && event.onlineLink ? event.onlineLink : (event.location || '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(endDate)}`,
    details: event.description || '',
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Process email template with variables
function processEmailTemplate(template: string, variables: Record<string, string>): string {
  let processed = template;
  for (const [key, value] of Object.entries(variables)) {
    processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return processed;
}

// Default RSVP confirmation email template
function getDefaultEmailTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RSVP Confirmed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">You're going! 🎉</h1>
      </div>
      
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          Hi {{attendeeName}},
        </p>
        
        <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
          Your RSVP has been confirmed for <strong>{{eventTitle}}</strong>
        </p>
        
        <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px; font-size: 20px; color: #333;">Event Details</h2>
          
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 14px; color: #666;">📅 <strong>Date:</strong> {{eventDate}}</span>
          </div>
          
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 14px; color: #666;">🕐 <strong>Time:</strong> {{eventTime}}</span>
          </div>
          
          <div style="display: flex; align-items: center;">
            <span style="font-size: 14px; color: #666;">📍 <strong>Location:</strong> {{eventLocation}}</span>
          </div>
        </div>
        
        <div style="margin-bottom: 24px;">
          <p style="font-size: 14px; color: #666; margin-bottom: 12px;">
            Add this event to your calendar:
          </p>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <a href="{{googleCalendarUrl}}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">
              📆 Google Calendar
            </a>
            <a href="{{outlookUrl}}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #0078D4; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">
              📧 Outlook
            </a>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 12px;">
            Or download the attached .ics file to add to any calendar app.
          </p>
        </div>
        
        <a href="{{eventUrl}}" style="display: block; text-align: center; padding: 14px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
          View Event Details
        </a>
      </div>
      
      <div style="padding: 20px; text-align: center; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #999; margin: 0;">
          You received this email because you RSVP'd to an event on AI Feed.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!resendApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const { event_id, user_id } = await req.json();
    
    if (!event_id || !user_id) {
      throw new Error("event_id and user_id are required");
    }

    logStep("Processing RSVP confirmation", { event_id, user_id });

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch event details from unified events table
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      logStep("Event not found", { error: eventError });
      throw new Error("Event not found");
    }

    // Check if RSVP email is enabled for this event
    if (event.rsvp_email_enabled === false) {
      logStep("RSVP email disabled for this event");
      return new Response(
        JSON.stringify({ success: true, message: "RSVP email disabled for this event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Event found", { title: event.title, rsvp_email_enabled: event.rsvp_email_enabled });

    // Fetch user details
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('full_name')
      .eq('id', user_id)
      .single();

    const { data: userData } = await supabaseClient.auth.admin.getUserById(user_id);
    const userEmail = userData?.user?.email;

    if (!userEmail) {
      logStep("User email not found");
      throw new Error("User email not found");
    }

    logStep("User found", { email: userEmail, name: userProfile?.full_name });

    // Parse event dates
    const startDate = new Date(event.event_date);
    const endDate = event.event_end_date ? new Date(event.event_end_date) : null;

    const eventData = {
      title: event.title,
      description: event.description,
      startDate,
      endDate,
      location: event.location,
      isOnline: event.is_online || event.event_type === 'online',
      onlineLink: event.online_link || event.live_stream_url,
    };

    // Generate calendar content and URLs
    const icsContent = generateICSContent(eventData);
    const googleCalendarUrl = generateGoogleCalendarUrl(eventData);
    
    // Generate Outlook URL
    const outlookParams = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      startdt: startDate.toISOString(),
      enddt: (endDate || new Date(startDate.getTime() + 2 * 60 * 60 * 1000)).toISOString(),
      body: event.description || '',
      location: eventData.isOnline && eventData.onlineLink ? eventData.onlineLink : (event.location || ''),
    });
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams.toString()}`;

    // Determine event URL based on whether it has a group_id
    const eventUrl = event.group_id 
      ? `https://aifeed.app/event/${event_id}`
      : `https://aifeed.app/standalone-event/${event_id}`;

    // Format dates for display
    const formatOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const displayDate = startDate.toLocaleDateString('en-US', formatOptions);
    const displayTime = startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    const displayLocation = eventData.isOnline 
      ? (eventData.onlineLink ? 'Online Event' : 'Online') 
      : (event.location || 'TBD');

    // Prepare template variables
    const templateVariables = {
      attendeeName: userProfile?.full_name || 'there',
      eventTitle: event.title,
      eventDate: displayDate,
      eventTime: displayTime,
      eventLocation: displayLocation,
      eventUrl: eventUrl,
      googleCalendarUrl: googleCalendarUrl,
      outlookUrl: outlookUrl,
    };

    // Use custom template or default
    const template = event.rsvp_email_template || getDefaultEmailTemplate();
    const emailHtml = processEmailTemplate(template, templateVariables);

    // Send email with ICS attachment
    const resend = new Resend(resendApiKey);
    
    // Convert ICS content to base64
    const icsBase64 = btoa(icsContent);
    
    const { error: emailError } = await resend.emails.send({
      from: "AI Feed <notifications@aifeed.app>",
      to: [userEmail],
      subject: `You're going to "${event.title}"! 🎉`,
      html: emailHtml,
      attachments: [
        {
          filename: `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`,
          content: icsBase64,
          content_type: 'text/calendar',
        }
      ],
    });

    if (emailError) {
      logStep("Email sending failed", { error: emailError });
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    logStep("RSVP confirmation email sent successfully", { to: userEmail });

    return new Response(
      JSON.stringify({ success: true, message: "RSVP confirmation email sent" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep("Error occurred", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
