import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvText, fileName } = await req.json();
    
    if (!cvText || cvText.trim().length === 0) {
      throw new Error("No CV text provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log(`Parsing CV: ${fileName}, text length: ${cvText.length}`);

    const systemPrompt = `You are a CV/Resume parser. Extract structured information from the provided CV text and return ONLY a valid JSON object with no additional text or markdown.

Extract the following fields:
- full_name: The person's full name (string or null)
- job_title: Current or most recent job title (string or null)
- company: Current or most recent company/organization (string or null)
- city: City of residence if mentioned (string or null)
- country: Country of residence if mentioned (string or null)
- bio: A brief professional summary, max 200 characters (string or null)
- skills: An array of technical and professional skills, up to 15 relevant skills (string[] or empty array)
- languages: An array of objects with {language: string, level: number} where level is 1-5 (array or empty array)

For skills, prioritize:
- AI/ML related skills (Machine Learning, Deep Learning, NLP, Computer Vision, etc.)
- Programming languages and frameworks
- Data science and analytics skills
- Cloud platforms and tools
- Soft skills relevant to tech

For language levels:
1 = Basic, 2 = Elementary, 3 = Intermediate, 4 = Advanced, 5 = Native/Fluent

If a field cannot be determined from the CV, use null for strings or empty array for arrays.

Return ONLY the JSON object, no explanation, no markdown code blocks.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this CV and extract the information:\n\n${cvText.substring(0, 15000)}` }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    console.log("AI response:", content.substring(0, 500));

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonString = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1].trim();
    } else {
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonString = objectMatch[0];
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      parsed = {};
    }

    // Validate and normalize the parsed data
    const normalizedData = {
      full_name: typeof parsed.full_name === 'string' ? parsed.full_name : null,
      job_title: typeof parsed.job_title === 'string' ? parsed.job_title : null,
      company: typeof parsed.company === 'string' ? parsed.company : null,
      city: typeof parsed.city === 'string' ? parsed.city : null,
      country: typeof parsed.country === 'string' ? parsed.country : null,
      bio: typeof parsed.bio === 'string' ? parsed.bio.substring(0, 200) : null,
      skills: Array.isArray(parsed.skills) ? parsed.skills.filter((s: any) => typeof s === 'string').slice(0, 15) : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages
        .filter((l: any) => l && typeof l.language === 'string' && typeof l.level === 'number')
        .map((l: any) => ({ language: l.language, level: Math.min(5, Math.max(1, Math.round(l.level))) }))
        : []
    };

    console.log("Parsed CV data:", JSON.stringify(normalizedData));

    return new Response(JSON.stringify({ success: true, data: normalizedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("CV parsing error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
