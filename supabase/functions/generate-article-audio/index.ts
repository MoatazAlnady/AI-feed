import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${step}`, details ? JSON.stringify(details, null, 2) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { article_id, regenerate = false } = await req.json();

    if (!article_id) {
      throw new Error("article_id is required");
    }

    logStep("Starting audio generation for article", { article_id, regenerate });

    // Fetch article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, content, audio_url, audio_content_hash')
      .eq('id', article_id)
      .single();

    if (articleError || !article) {
      throw new Error(`Article not found: ${articleError?.message}`);
    }

    // Strip HTML and clean content for TTS
    const cleanContent = (html: string): string => {
      let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      
      // Limit content length for TTS (ElevenLabs has limits)
      if (text.length > 5000) {
        text = text.substring(0, 5000) + "...";
      }
      
      return text;
    };

    const cleanedContent = cleanContent(article.content);
    
    // Generate content hash
    const encoder = new TextEncoder();
    const data = encoder.encode(cleanedContent);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    logStep("Content hash calculated", { contentHash, existingHash: article.audio_content_hash });

    // Check if we need to regenerate
    if (!regenerate && article.audio_url && article.audio_content_hash === contentHash) {
      logStep("Audio already exists and content unchanged, skipping generation");
      return new Response(
        JSON.stringify({ 
          success: true, 
          audio_url: article.audio_url,
          message: "Audio already up to date" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use a professional voice for articles
    const voiceId = "JBFqnCBsd6RMkjVDRZzb"; // George - professional male voice

    // Prepare text with title
    const fullText = `${article.title}. ${cleanedContent}`;

    logStep("Calling ElevenLabs TTS API", { textLength: fullText.length });

    // Call ElevenLabs TTS
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: fullText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true
          }
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      logStep("ElevenLabs API error", { status: ttsResponse.status, error: errorText });
      throw new Error(`ElevenLabs API error: ${ttsResponse.status} - ${errorText}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    logStep("Audio generated", { size: audioBuffer.byteLength });

    // Upload to Supabase Storage
    const fileName = `${article_id}/${Date.now()}.mp3`;
    
    const { error: uploadError } = await supabase.storage
      .from('article-audio')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('article-audio')
      .getPublicUrl(fileName);

    logStep("Audio uploaded to storage", { publicUrl });

    // Update article with audio URL and hash
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        audio_url: publicUrl,
        audio_generated_at: new Date().toISOString(),
        audio_content_hash: contentHash
      })
      .eq('id', article_id);

    if (updateError) {
      throw new Error(`Failed to update article: ${updateError.message}`);
    }

    logStep("Article updated with audio URL");

    return new Response(
      JSON.stringify({ 
        success: true, 
        audio_url: publicUrl,
        message: "Audio generated successfully" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep("Error generating audio", { error: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});