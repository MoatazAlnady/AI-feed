import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUMMARIZE-TRANSCRIPT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { recording_id } = await req.json();
    if (!recording_id) throw new Error("recording_id is required");
    logStep("Recording ID received", { recording_id });

    // Fetch recording with transcript
    const { data: recording, error: fetchError } = await supabaseClient
      .from('event_recordings')
      .select('*, events(title, description)')
      .eq('id', recording_id)
      .single();

    if (fetchError || !recording) {
      throw new Error(`Recording not found: ${fetchError?.message}`);
    }

    if (!recording.transcript) {
      throw new Error("No transcript available for summarization");
    }
    logStep("Recording fetched", { transcriptLength: recording.transcript.length });

    // Call Lovable AI for summarization
    logStep("Generating summary with Lovable AI...");
    const eventTitle = recording.events?.title || "Live Stream";
    const eventDescription = recording.events?.description || "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert summarizer for live stream recordings. Create a detailed yet concise summary that captures the key points.

Your summary should include:
- **Overview**: A 2-3 sentence overview of what the stream was about
- **Key Topics**: Main topics discussed with brief explanations
- **Key Takeaways**: The most important points attendees should remember
- **Action Items**: Any mentioned tasks, follow-ups, or calls to action
- **Notable Quotes**: Any memorable or important quotes (if applicable)

Format the summary in clean markdown. Be professional but engaging.
The event was titled: "${eventTitle}"
${eventDescription ? `Event description: ${eventDescription}` : ''}`
          },
          {
            role: "user",
            content: `Please summarize this transcript from the live stream:\n\n${recording.transcript}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const summary = result.choices?.[0]?.message?.content || "Summary could not be generated.";
    logStep("Summary generated", { summaryLength: summary.length });

    // Update recording with summary and mark as ready
    const { error: updateError } = await supabaseClient
      .from('event_recordings')
      .update({
        summary,
        status: 'ready',
        processed_at: new Date().toISOString()
      })
      .eq('id', recording_id);

    if (updateError) {
      throw new Error(`Failed to update recording: ${updateError.message}`);
    }
    logStep("Recording updated with summary");

    // Trigger notification to attendees
    logStep("Triggering attendee notifications...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    await fetch(`${supabaseUrl}/functions/v1/send-recording-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ recording_id }),
    });

    logStep("Notification triggered");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Summary generated and notifications sent",
      summary_length: summary.length
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
