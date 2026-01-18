import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import React from "npm:react@18.3.1";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22/render";
import EventInvitationEmail from "../_shared/email-templates/event-invitation.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-EVENT-INVITATION] ${step}${detailsStr}`);
};

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !userData.user) {
      throw new Error("Invalid authentication");
    }

    const { invitation_id } = await req.json();
    
    if (!invitation_id) {
      throw new Error("invitation_id is required");
    }

    logStep("Processing invitation", { invitation_id });

    // Fetch the invitation with related data
    const { data: invitation, error: invError } = await supabaseClient
      .from('event_invitations')
      .select('*')
      .eq('id', invitation_id)
      .single();

    if (invError || !invitation) {
      throw new Error("Invitation not found");
    }

    logStep("Invitation found", { 
      event_id: invitation.event_id,
      event_type: invitation.event_type 
    });

    // Fetch invitee email and name
    const { data: invitee } = await supabaseClient
      .from('user_profiles')
      .select('id, full_name')
      .eq('id', invitation.invitee_id)
      .single();

    const { data: inviteeAuth } = await supabaseClient.auth.admin.getUserById(invitation.invitee_id);
    const inviteeEmail = inviteeAuth?.user?.email;

    if (!inviteeEmail) {
      throw new Error("Invitee email not found");
    }

    // Fetch inviter info
    const { data: inviter } = await supabaseClient
      .from('user_profiles')
      .select('full_name, profile_photo')
      .eq('id', invitation.inviter_id)
      .single();

    // Fetch event details from unified events table
    const { data: eventData, error: eventError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', invitation.event_id)
      .single();

    if (eventError || !eventData) {
      logStep("Event not found in unified table", { error: eventError });
      throw new Error("Event not found");
    }

    logStep("Event details fetched", { title: eventData.title });

    // Determine event URL based on whether it has a group_id
    const eventUrl = eventData.group_id 
      ? `https://aifeed.app/event/${invitation.event_id}`
      : `https://aifeed.app/standalone-event/${invitation.event_id}`;

    // Render email
    const emailHtml = await renderAsync(
      React.createElement(EventInvitationEmail, {
        inviteeName: invitee?.full_name || 'there',
        inviterName: inviter?.full_name || 'Someone',
        inviterPhoto: inviter?.profile_photo,
        eventTitle: eventData.title,
        eventDate: eventData.event_date,
        eventTime: eventData.start_time,
        eventLocation: eventData.is_online ? 'Online Event' : eventData.location,
        eventUrl: eventUrl,
      })
    );

    // Send email
    const resend = new Resend(resendApiKey);
    const { error: emailError } = await resend.emails.send({
      from: "AI Feed <notifications@aifeed.app>",
      to: [inviteeEmail],
      subject: `${inviter?.full_name || 'Someone'} invited you to "${eventData.title}"`,
      html: emailHtml,
    });

    if (emailError) {
      logStep("Email sending failed", { error: emailError });
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    logStep("Email sent successfully", { to: inviteeEmail });

    return new Response(
      JSON.stringify({ success: true, message: "Invitation email sent" }),
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
