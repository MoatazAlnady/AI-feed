import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { GroupNotificationEmail } from "../_shared/email-templates/group-notification.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GroupNotificationRequest {
  recipientEmail: string;
  recipientName: string;
  groupName: string;
  notificationType: 'announcement' | 'invite' | 'mention' | 'new_member' | 'post';
  content?: string;
  groupUrl: string;
  senderName: string;
  groupImage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-group-notification: Request received", { method: req.method });
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientEmail, 
      recipientName, 
      groupName, 
      notificationType, 
      content, 
      groupUrl,
      senderName,
      groupImage
    }: GroupNotificationRequest = await req.json();

    console.log("send-group-notification: Processing notification", { 
      recipientEmail, 
      groupName, 
      notificationType,
      senderName 
    });

    if (!recipientEmail || !groupName || !notificationType) {
      console.error("send-group-notification: Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate subject based on notification type
    let subject: string;
    switch (notificationType) {
      case 'announcement':
        subject = `📢 New announcement in ${groupName}`;
        break;
      case 'invite':
        subject = `🎉 You've been invited to join ${groupName}`;
        break;
      case 'mention':
        subject = `💬 ${senderName} mentioned you in ${groupName}`;
        break;
      case 'new_member':
        subject = `👋 ${senderName} joined ${groupName}`;
        break;
      case 'post':
        subject = `📝 New post in ${groupName}`;
        break;
      default:
        subject = `Update from ${groupName}`;
    }

    // Render React Email template
    const html = await renderAsync(
      React.createElement(GroupNotificationEmail, {
        recipientName: recipientName || 'there',
        groupName,
        groupImage,
        notificationType,
        senderName,
        content,
        actionUrl: groupUrl,
      })
    );

    console.log("send-group-notification: Sending email via Resend", { to: recipientEmail, subject });

    const emailResponse = await resend.emails.send({
      from: "AI Feed <notifications@resend.dev>",
      to: [recipientEmail],
      subject,
      html,
    });

    console.log("send-group-notification: Email sent successfully", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-group-notification: Error occurred", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);