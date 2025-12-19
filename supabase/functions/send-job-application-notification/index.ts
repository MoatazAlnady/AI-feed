import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface JobApplicationNotificationRequest {
  employerEmail: string;
  employerName: string;
  jobTitle: string;
  companyName: string;
  candidateName: string;
  candidateEmail: string;
  candidateTitle?: string;
  applicationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-job-application-notification: Request received", { method: req.method });
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      employerEmail, 
      employerName, 
      jobTitle, 
      companyName,
      candidateName,
      candidateEmail,
      candidateTitle,
      applicationUrl 
    }: JobApplicationNotificationRequest = await req.json();

    console.log("send-job-application-notification: Processing notification", { 
      employerEmail, 
      jobTitle,
      candidateName 
    });

    if (!employerEmail || !jobTitle || !candidateName || !applicationUrl) {
      console.error("send-job-application-notification: Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const subject = `📋 New application for ${jobTitle}`;
    
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #a855f7); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; font-size: 24px; margin: 0;">New Job Application</h1>
          <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 8px 0 0 0;">${companyName}</p>
        </div>
        
        <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #666; font-size: 16px;">Hello ${employerName || 'there'},</p>
          <p style="color: #666; font-size: 16px;">
            You have received a new application for the position of <strong>${jobTitle}</strong>.
          </p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 18px;">Candidate Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 100px;">Name:</td>
                <td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${candidateName}</td>
              </tr>
              ${candidateTitle ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Title:</td>
                <td style="padding: 8px 0; color: #1a1a1a;">${candidateTitle}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #666;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:${candidateEmail}" style="color: #3b82f6; text-decoration: none;">${candidateEmail}</a></td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${applicationUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Application</a>
          </div>
          
          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              <strong>Quick Actions:</strong>
            </p>
            <p style="margin: 8px 0;">
              <a href="mailto:${candidateEmail}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">📧 Contact Candidate</a>
            </p>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 24px;">— AI Feed Team</p>
        </div>
      </div>
    `;

    console.log("send-job-application-notification: Sending email via Resend", { to: employerEmail, subject });

    const emailResponse = await resend.emails.send({
      from: "AI Feed Jobs <jobs@resend.dev>",
      to: [employerEmail],
      subject,
      html: htmlContent,
    });

    console.log("send-job-application-notification: Email sent successfully", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-job-application-notification: Error occurred", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
