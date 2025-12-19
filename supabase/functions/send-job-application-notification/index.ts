import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { JobApplicationEmail } from "../_shared/email-templates/job-application.tsx";

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
  candidatePhoto?: string;
  coverLetter?: string;
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
      candidatePhoto,
      coverLetter,
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

    // Render React Email template
    const html = await renderAsync(
      React.createElement(JobApplicationEmail, {
        employerName: employerName || 'there',
        jobTitle,
        companyName,
        candidateName,
        candidateEmail,
        candidateTitle,
        candidatePhoto,
        coverLetter,
        applicationUrl,
      })
    );

    console.log("send-job-application-notification: Sending email via Resend", { to: employerEmail, subject });

    const emailResponse = await resend.emails.send({
      from: "AI Feed Jobs <jobs@resend.dev>",
      to: [employerEmail],
      subject,
      html,
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