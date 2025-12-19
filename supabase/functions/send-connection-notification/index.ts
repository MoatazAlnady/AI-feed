import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { ConnectionRequestEmail } from "../_shared/email-templates/connection-request.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConnectionNotificationRequest {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderTitle?: string;
  senderPhoto?: string;
  profileUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-connection-notification: Request received", { method: req.method });
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientEmail, 
      recipientName, 
      senderName, 
      senderTitle,
      senderPhoto,
      profileUrl 
    }: ConnectionNotificationRequest = await req.json();

    console.log("send-connection-notification: Processing notification", { 
      recipientEmail, 
      senderName,
      senderTitle 
    });

    if (!recipientEmail || !senderName || !profileUrl) {
      console.error("send-connection-notification: Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const subject = `🤝 ${senderName} wants to connect with you`;

    // Render React Email template
    const html = await renderAsync(
      React.createElement(ConnectionRequestEmail, {
        recipientName: recipientName || 'there',
        senderName,
        senderTitle,
        senderPhoto,
        acceptUrl: profileUrl,
        viewProfileUrl: profileUrl,
      })
    );

    console.log("send-connection-notification: Sending email via Resend", { to: recipientEmail, subject });

    const emailResponse = await resend.emails.send({
      from: "AI Feed <notifications@resend.dev>",
      to: [recipientEmail],
      subject,
      html,
    });

    console.log("send-connection-notification: Email sent successfully", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-connection-notification: Error occurred", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);