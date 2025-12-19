import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
    
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a; font-size: 24px;">New Connection Request</h1>
        <p style="color: #666; font-size: 16px;">Hello ${recipientName || 'there'},</p>
        <p style="color: #666; font-size: 16px;">
          <strong>${senderName}</strong>${senderTitle ? `, ${senderTitle},` : ''} wants to connect with you on AI Feed.
        </p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 12px; margin: 20px 0; display: flex; align-items: center;">
          ${senderPhoto 
            ? `<img src="${senderPhoto}" alt="${senderName}" style="width: 60px; height: 60px; border-radius: 50%; margin-right: 16px;" />`
            : `<div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #a855f7); margin-right: 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">${senderName.charAt(0).toUpperCase()}</div>`
          }
          <div>
            <p style="margin: 0; font-weight: 600; color: #1a1a1a;">${senderName}</p>
            ${senderTitle ? `<p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">${senderTitle}</p>` : ''}
          </div>
        </div>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${profileUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-right: 12px;">Accept Request</a>
          <a href="${profileUrl}" style="display: inline-block; background: #f3f4f6; color: #374151; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Profile</a>
        </div>
        
        <p style="color: #999; font-size: 14px; margin-top: 24px;">
          If you didn't expect this connection request, you can safely ignore this email.
        </p>
        <p style="color: #999; font-size: 14px;">— AI Feed Team</p>
      </div>
    `;

    console.log("send-connection-notification: Sending email via Resend", { to: recipientEmail, subject });

    const emailResponse = await resend.emails.send({
      from: "AI Feed <notifications@resend.dev>",
      to: [recipientEmail],
      subject,
      html: htmlContent,
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
