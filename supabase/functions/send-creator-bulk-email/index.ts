import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-CREATOR-BULK-EMAIL] ${step}${detailsStr}`);
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

    const creatorId = userData.user.id;

    const { subject, html_template, send_push_notification } = await req.json();
    
    if (!subject || !html_template) {
      throw new Error("subject and html_template are required");
    }

    logStep("Processing bulk email", { creatorId, subject, sendPush: send_push_notification });

    // Fetch creator profile for name
    const { data: creatorProfile } = await supabaseClient
      .from('user_profiles')
      .select('full_name, profile_photo')
      .eq('id', creatorId)
      .single();

    const creatorName = creatorProfile?.full_name || 'A Creator';

    // Fetch all active subscribers
    const { data: subscribers, error: subError } = await supabaseClient
      .from('creator_newsletter_subscribers')
      .select('subscriber_id')
      .eq('creator_id', creatorId)
      .eq('is_active', true);

    if (subError) {
      throw new Error(`Failed to fetch subscribers: ${subError.message}`);
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active subscribers", sent_count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Found subscribers", { count: subscribers.length });

    // Fetch subscriber profiles and emails
    const subscriberIds = subscribers.map(s => s.subscriber_id);
    
    const { data: profiles } = await supabaseClient
      .from('user_profiles')
      .select('id, full_name')
      .in('id', subscriberIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // Fetch emails using admin API
    const resend = new Resend(resendApiKey);
    let sentCount = 0;
    const errors: string[] = [];

    for (const sub of subscribers) {
      try {
        const { data: authUser } = await supabaseClient.auth.admin.getUserById(sub.subscriber_id);
        const email = authUser?.user?.email;
        
        if (!email) {
          logStep("No email for subscriber", { subscriberId: sub.subscriber_id });
          continue;
        }

        const profile = profileMap.get(sub.subscriber_id);
        const firstName = profile?.full_name?.split(' ')[0] || 'there';
        const fullName = profile?.full_name || 'Subscriber';

        // Replace placeholders
        const personalizedHtml = html_template
          .replace(/\{\{name\}\}/g, firstName)
          .replace(/\{\{full_name\}\}/g, fullName)
          .replace(/\{\{subscriber_email\}\}/g, email)
          .replace(/\{\{creator_name\}\}/g, creatorName);

        const personalizedSubject = subject
          .replace(/\{\{name\}\}/g, firstName)
          .replace(/\{\{full_name\}\}/g, fullName)
          .replace(/\{\{creator_name\}\}/g, creatorName);

        // Send email
        const { error: emailError } = await resend.emails.send({
          from: `${creatorName} via AI Feed <notifications@aifeed.app>`,
          to: [email],
          subject: personalizedSubject,
          html: personalizedHtml,
        });

        if (emailError) {
          errors.push(`Failed to send to ${email}: ${emailError.message}`);
          continue;
        }

        sentCount++;

        // Optionally create push notification
        if (send_push_notification) {
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: sub.subscriber_id,
              type: 'creator_update',
              title: personalizedSubject,
              message: `New update from ${creatorName}`,
              is_read: false,
              metadata: { creator_id: creatorId }
            });
        }

        logStep("Email sent", { to: email, sentCount });

      } catch (err: any) {
        errors.push(`Error for ${sub.subscriber_id}: ${err.message}`);
      }
    }

    logStep("Bulk email complete", { sentCount, errorsCount: errors.length });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent to ${sentCount} subscribers`, 
        sent_count: sentCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    logStep("Error occurred", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
