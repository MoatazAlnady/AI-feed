import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRANSLATE-CONTENT] ${step}${detailsStr}`);
};

// Language names for better prompts
const languageNames: { [key: string]: string } = {
  en: 'English',
  ar: 'Arabic',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  tr: 'Turkish',
  fa: 'Persian',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !lovableApiKey) {
      throw new Error("Missing required environment variables");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { content_type, content_id, target_language, text_to_translate, source_language } = await req.json();
    
    if (!content_type || !content_id || !target_language || !text_to_translate) {
      throw new Error("content_type, content_id, target_language, and text_to_translate are required");
    }

    logStep("Processing translation request", { content_type, content_id, target_language });

    // Check cache first
    const { data: cached } = await supabaseClient
      .from('content_translations')
      .select('translated_text')
      .eq('content_type', content_type)
      .eq('content_id', content_id)
      .eq('target_language', target_language)
      .single();

    if (cached) {
      logStep("Cache hit", { content_id, target_language });
      return new Response(
        JSON.stringify({ 
          success: true, 
          translated_text: cached.translated_text,
          from_cache: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Cache miss, calling AI for translation");

    // Detect source language if not provided
    let detectedSource = source_language || 'auto';
    const targetLangName = languageNames[target_language] || target_language;

    // Call Lovable AI for translation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the given text to ${targetLangName}. 
Preserve the original meaning, tone, and formatting (including markdown, links, etc).
Only output the translated text, nothing else. Do not add explanations or notes.`
          },
          {
            role: "user",
            content: text_to_translate
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Translation service unavailable" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
        );
      }
      throw new Error(`AI translation failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const translatedText = aiResponse.choices?.[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error("No translation received from AI");
    }

    logStep("Translation received", { length: translatedText.length });

    // Cache the translation
    const { error: cacheError } = await supabaseClient
      .from('content_translations')
      .upsert({
        content_type,
        content_id,
        source_language: detectedSource,
        target_language,
        original_text: text_to_translate,
        translated_text: translatedText,
        translated_at: new Date().toISOString()
      }, {
        onConflict: 'content_type,content_id,target_language'
      });

    if (cacheError) {
      logStep("Cache error (non-fatal)", { error: cacheError.message });
    } else {
      logStep("Translation cached");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        translated_text: translatedText,
        from_cache: false 
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
