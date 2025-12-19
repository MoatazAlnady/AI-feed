import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
  notificationType: 'announcement' | 'invite' | 'mention';
  content?: string;
  groupUrl: string;
  senderName: string;
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
      senderName 
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

    let subject: string;
    let htmlContent: string;

    switch (notificationType) {
      case 'announcement':
        subject = `📢 New announcement in ${groupName}`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a1a; font-size: 24px;">New Group Announcement</h1>
            <p style="color: #666; font-size: 16px;">Hello ${recipientName || 'there'},</p>
            <p style="color: #666; font-size: 16px;">
              <strong>${senderName}</strong> posted a new announcement in <strong>${groupName}</strong>:
            </p>
            ${content ? `<div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;"><p style="color: #333; margin: 0;">${content}</p></div>` : ''}
            <a href="${groupUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">View Announcement</a>
            <p style="color: #999; font-size: 14px; margin-top: 24px;">— AI Feed Team</p>
          </div>
        `;
        break;

      case 'invite':
        subject = `🎉 You've been invited to join ${groupName}`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a1a; font-size: 24px;">Group Invitation</h1>
            <p style="color: #666; font-size: 16px;">Hello ${recipientName || 'there'},</p>
            <p style="color: #666; font-size: 16px;">
              <strong>${senderName}</strong> has invited you to join the group <strong>${groupName}</strong>.
            </p>
            ${content ? `<div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;"><p style="color: #333; margin: 0;">${content}</p></div>` : ''}
            <a href="${groupUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Accept Invitation</a>
            <p style="color: #999; font-size: 14px; margin-top: 24px;">This invitation expires in 7 days.</p>
            <p style="color: #999; font-size: 14px;">— AI Feed Team</p>
          </div>
        `;
        break;

      case 'mention':
        subject = `💬 ${senderName} mentioned you in ${groupName}`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a1a; font-size: 24px;">You were mentioned</h1>
            <p style="color: #666; font-size: 16px;">Hello ${recipientName || 'there'},</p>
            <p style="color: #666; font-size: 16px;">
              <strong>${senderName}</strong> mentioned you in a discussion in <strong>${groupName}</strong>:
            </p>
            ${content ? `<div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;"><p style="color: #333; margin: 0;">${content}</p></div>` : ''}
            <a href="${groupUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">View Discussion</a>
            <p style="color: #999; font-size: 14px; margin-top: 24px;">— AI Feed Team</p>
          </div>
        `;
        break;

      default:
        console.error("send-group-notification: Unknown notification type", notificationType);
        return new Response(
          JSON.stringify({ error: "Unknown notification type" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }

    console.log("send-group-notification: Sending email via Resend", { to: recipientEmail, subject });

    const emailResponse = await resend.emails.send({
      from: "AI Feed <notifications@resend.dev>",
      to: [recipientEmail],
      subject,
      html: htmlContent,
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
