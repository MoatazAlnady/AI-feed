import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRANSCRIBE-RECORDING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { recording_id } = await req.json();
    if (!recording_id) throw new Error("recording_id is required");
    logStep("Recording ID received", { recording_id });

    // Fetch recording details
    const { data: recording, error: fetchError } = await supabaseClient
      .from('event_recordings')
      .select('*')
      .eq('id', recording_id)
      .single();

    if (fetchError || !recording) {
      throw new Error(`Recording not found: ${fetchError?.message}`);
    }
    logStep("Recording fetched", { url: recording.recording_url });

    // Update status to transcribing
    await supabaseClient
      .from('event_recordings')
      .update({ status: 'transcribing' })
      .eq('id', recording_id);

    // Download the recording
    logStep("Downloading recording...");
    const audioResponse = await fetch(recording.recording_url);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download recording: ${audioResponse.status}`);
    }
    const audioBlob = await audioResponse.blob();
    logStep("Recording downloaded", { size: audioBlob.size });

    // Call ElevenLabs Scribe API for transcription
    logStep("Starting transcription with ElevenLabs Scribe...");
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    formData.append("model_id", "scribe_v2");
    formData.append("tag_audio_events", "false");
    formData.append("diarize", "true");

    const transcriptionResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      throw new Error(`ElevenLabs API error: ${transcriptionResponse.status} - ${errorText}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    logStep("Transcription completed", { 
      textLength: transcriptionResult.text?.length,
      language: transcriptionResult.language_code 
    });

    // Format transcript with timestamps if available
    let formattedTranscript = transcriptionResult.text || "";
    if (transcriptionResult.words && transcriptionResult.words.length > 0) {
      // Group words by speaker if diarization is available
      const segments: { speaker?: string; text: string; start: number }[] = [];
      let currentSegment = { speaker: "", text: "", start: 0 };

      for (const word of transcriptionResult.words) {
        if (word.speaker !== currentSegment.speaker && currentSegment.text) {
          segments.push({ ...currentSegment });
          currentSegment = { speaker: word.speaker || "", text: word.text, start: word.start };
        } else {
          if (!currentSegment.text) {
            currentSegment.start = word.start;
            currentSegment.speaker = word.speaker || "";
          }
          currentSegment.text += (currentSegment.text ? " " : "") + word.text;
        }
      }
      if (currentSegment.text) {
        segments.push(currentSegment);
      }

      // Format with timestamps
      formattedTranscript = segments.map(seg => {
        const mins = Math.floor(seg.start / 60);
        const secs = Math.floor(seg.start % 60);
        const timestamp = `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
        const speaker = seg.speaker ? `Speaker ${seg.speaker}: ` : "";
        return `${timestamp} ${speaker}${seg.text}`;
      }).join("\n\n");
    }

    // Update recording with transcript
    const { error: updateError } = await supabaseClient
      .from('event_recordings')
      .update({
        transcript: formattedTranscript,
        transcript_language: transcriptionResult.language_code || 'en',
        status: 'summarizing'
      })
      .eq('id', recording_id);

    if (updateError) {
      throw new Error(`Failed to update recording: ${updateError.message}`);
    }
    logStep("Recording updated with transcript");

    // Trigger summarization
    logStep("Triggering summarization...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    await fetch(`${supabaseUrl}/functions/v1/summarize-transcript`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ recording_id }),
    });

    logStep("Summarization triggered");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Transcription completed, summarization started",
      transcript_length: formattedTranscript.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    // Try to update status to failed
    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { recording_id } = await req.clone().json().catch(() => ({}));
      if (recording_id) {
        await supabaseClient
          .from('event_recordings')
          .update({ status: 'failed', error_message: errorMessage })
          .eq('id', recording_id);
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
