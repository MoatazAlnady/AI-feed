import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[extract-tool-info] Starting extraction`, { requestId, domain: parsedUrl.hostname });

    // Step 1: Fetch categories and subcategories from DB
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: categoriesData } = await supabaseClient
      .from('categories')
      .select('name, sub_categories(name)')
      .order('name');

    const categoryTree = (categoriesData || []).map((c: any) => {
      const subs = (c.sub_categories || []).map((s: any) => s.name).join(', ');
      return `- ${c.name}: ${subs || '(no subcategories)'}`;
    }).join('\n');

    const categoryNames = (categoriesData || []).map((c: any) => c.name);
    const allSubcategoryNames = (categoriesData || []).flatMap((c: any) =>
      (c.sub_categories || []).map((s: any) => s.name)
    );

    console.log(`[extract-tool-info] Loaded ${categoryNames.length} categories`, { requestId });

    // Step 2: Fetch the website HTML
    const fetchResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIFeedBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!fetchResponse.ok) {
      console.warn(`[extract-tool-info] Fetch failed`, { requestId, status: fetchResponse.status });
      return new Response(
        JSON.stringify({ error: 'Failed to fetch website', status: fetchResponse.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await fetchResponse.text();

    // Step 3: Extract meta tags
    const ogTitle = extractMeta(html, 'og:title') || extractTitle(html) || '';
    const ogDescription = extractMeta(html, 'og:description') || extractMeta(html, 'description') || '';
    const ogImage = extractMeta(html, 'og:image') || '';

    // Step 4: Strip scripts/styles and extract text content
    let textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    textContent = textContent.substring(0, 8000);

    // Step 5: Call Lovable AI with tool-calling for structured output
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert at analyzing AI tool websites and classifying them into the correct category.

Given the text content of a website, extract structured information about the AI tool. Be accurate and concise.

## Available Categories and Sub-Categories (from the platform database):
${categoryTree}

## Classification Rules:
- You MUST select EXACTLY ONE category from the list above. Use the exact category name.
- You MUST select EXACTLY ONE sub-category that belongs to that category. Use the exact sub-category name.
- Choose the most specific and relevant category/sub-category pair for the tool.
- If unsure between categories, prefer the one that best describes the tool's PRIMARY function.

## Pricing Type Rules:
- "free": The tool is completely free with no paid options
- "freemium": Has a free tier/plan AND paid plans with more features
- "one_time_payment": Requires a single purchase (lifetime license, one-time fee)
- "subscription": Requires recurring payment (monthly/yearly plans)
- "contact": Enterprise or custom pricing where you need to contact sales

## Free Plan Rules:
- ONLY set free_plan when pricing_type is "one_time_payment" or "subscription"
- Set to "Yes" if the tool offers a free tier, free trial, or free credits
- Set to "No" if there is no free option at all
- Leave as empty string "" for "free", "freemium", or "contact" pricing types

## Tool Type Rules:
- Select ALL that apply from: Web App, Desktop App, Mobile App, Chrome Extension, VS Code Extension, API, CLI Tool, Plugin
- Most tools are at least "Web App"
- If the tool has a mobile app (iOS/Android), include "Mobile App"
- If it offers an API for developers, include "API"
- If it has a browser extension, include "Chrome Extension"`;

    const userPrompt = `Analyze this website and extract tool information.

URL: ${url}
Page Title: ${ogTitle}
Meta Description: ${ogDescription}

Page Content:
${textContent}

Extract the tool's details accurately. Classify into the correct category and sub-category from the available options.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tool_info",
              description: "Extract structured information about an AI tool from its website content.",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "The name of the tool" },
                  description: { type: "string", description: "A clear description of the tool (200-500 characters)" },
                  suggested_category: {
                    type: "string",
                    enum: categoryNames.length > 0 ? categoryNames : undefined,
                    description: "The best matching category name from the available categories"
                  },
                  suggested_subcategory: {
                    type: "string",
                    enum: allSubcategoryNames.length > 0 ? allSubcategoryNames : undefined,
                    description: "The best matching sub-category name that belongs to the selected category"
                  },
                  pricing_type: {
                    type: "string",
                    enum: ["free", "freemium", "one_time_payment", "subscription", "contact"],
                    description: "The pricing model of the tool"
                  },
                  free_plan: {
                    type: "string",
                    enum: ["Yes", "No", ""],
                    description: "Whether a free plan or free credits are available. Only relevant for one_time_payment or subscription pricing."
                  },
                  features: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key features of the tool (3-8 features)"
                  },
                  pros: {
                    type: "array",
                    items: { type: "string" },
                    description: "Advantages/pros of the tool (2-5 items)"
                  },
                  cons: {
                    type: "array",
                    items: { type: "string" },
                    description: "Disadvantages/cons of the tool (1-3 items)"
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Relevant tags/keywords for the tool (3-6 tags)"
                  },
                  tool_type: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["Web App", "Desktop App", "Mobile App", "Chrome Extension", "VS Code Extension", "API", "CLI Tool", "Plugin"]
                    },
                    description: "What type of tool this is (can be multiple)"
                  }
                },
                required: ["name", "description", "suggested_category", "suggested_subcategory", "pricing_type", "features", "pros", "cons", "tags", "tool_type"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_tool_info" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errorText = await aiResponse.text();
      console.error(`[extract-tool-info] AI gateway error`, { requestId, status, errorText });

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error(`[extract-tool-info] No tool call in AI response`, { requestId });
      throw new Error("AI did not return structured data");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    // Add logo URL from og:image
    let logoUrl = ogImage;
    if (logoUrl && !logoUrl.startsWith('http')) {
      logoUrl = new URL(logoUrl, url).toString();
    }

    const result = {
      ...extractedData,
      logo_url: logoUrl,
      website: url,
    };

    const duration = Date.now() - startTime;
    console.log(`[extract-tool-info] Extraction complete`, { requestId, duration: `${duration}ms`, name: result.name, category: result.suggested_category, subcategory: result.suggested_subcategory });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[extract-tool-info] Error`, { requestId, error: error.message, duration: `${duration}ms` });
    return new Response(
      JSON.stringify({ error: 'Failed to extract tool information', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractMeta(html: string, property: string): string | null {
  let match = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'));
  if (match) return match[1];
  match = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'));
  if (match) return match[1];
  match = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i'));
  if (match) return match[1];
  match = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i'));
  if (match) return match[1];
  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}
