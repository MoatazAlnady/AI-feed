import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-RECORDING-NOTIFICATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");

    const resend = new Resend(RESEND_API_KEY);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { recording_id } = await req.json();
    if (!recording_id) throw new Error("recording_id is required");
    logStep("Recording ID received", { recording_id });

    // Fetch recording with event details
    const { data: recording, error: fetchError } = await supabaseClient
      .from('event_recordings')
      .select('*, events(id, title, event_date)')
      .eq('id', recording_id)
      .single();

    if (fetchError || !recording) {
      throw new Error(`Recording not found: ${fetchError?.message}`);
    }
    logStep("Recording fetched", { eventId: recording.event_id });

    // Fetch attendees for this event
    const { data: attendees, error: attendeesError } = await supabaseClient
      .from('event_attendees')
      .select('user_id')
      .eq('event_id', recording.event_id)
      .eq('status', 'attending');

    if (attendeesError) {
      throw new Error(`Failed to fetch attendees: ${attendeesError.message}`);
    }
    logStep("Attendees fetched", { count: attendees?.length || 0 });

    if (!attendees || attendees.length === 0) {
      logStep("No attendees to notify");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No attendees to notify" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fetch user emails
    const userIds = attendees.map(a => a.user_id);
    const { data: users, error: usersError } = await supabaseClient
      .from('user_profiles')
      .select('id, full_name')
      .in('id', userIds);

    // Get auth emails
    const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
    const emailMap = new Map(authUsers?.users?.map(u => [u.id, u.email]) || []);
    const nameMap = new Map(users?.map(u => [u.id, u.full_name]) || []);

    logStep("User data fetched", { emailCount: emailMap.size });

    const eventTitle = recording.events?.title || "Live Stream";
    const eventDate = recording.events?.event_date 
      ? new Date(recording.events.event_date).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      : "";
    const recordingUrl = `https://lovable-platform-boost.lovable.app/event/${recording.event_id}?tab=recording`;
    const summaryPreview = recording.summary 
      ? recording.summary.substring(0, 500) + (recording.summary.length > 500 ? "..." : "")
      : "";

    // Send emails to all attendees
    let sentCount = 0;
    for (const attendee of attendees) {
      const email = emailMap.get(attendee.user_id);
      const name = nameMap.get(attendee.user_id) || "there";

      if (!email) continue;

      try {
        await resend.emails.send({
          from: "AI Feed <onboarding@resend.dev>",
          to: [email],
          subject: `Recording Available: ${eventTitle}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📹 Recording Now Available!</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="font-size: 16px;">Hi ${name}!</p>
                
                <p style="font-size: 16px;">Great news! The recording from <strong>${eventTitle}</strong>${eventDate ? ` (${eventDate})` : ""} is now available with a full transcript and summary.</p>
                
                ${summaryPreview ? `
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                  <h3 style="margin: 0 0 10px 0; color: #667eea;">📝 Summary Preview</h3>
                  <p style="margin: 0; color: #555; font-size: 14px;">${summaryPreview}</p>
                </div>
                ` : ""}
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${recordingUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Watch Recording
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666;">You can also:</p>
                <ul style="font-size: 14px; color: #666;">
                  <li>Read the full transcript</li>
                  <li>View the detailed summary</li>
                  <li>Download the transcript as a file</li>
                </ul>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                  You received this email because you attended "${eventTitle}".<br>
                  AI Feed - Your AI-Powered Community Platform
                </p>
              </div>
            </body>
            </html>
          `,
        });
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${email}:`, emailError);
      }
    }

    logStep("Emails sent", { sentCount, total: attendees.length });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Notifications sent to ${sentCount} attendees`,
      sent_count: sentCount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
