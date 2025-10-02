import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'en', context = 'general' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch real platform data to provide context to AI
    console.log('Fetching platform data for AI context...');
    
    // Fetch ONLY public data - respecting privacy settings
    const [toolsResult, articlesResult, categoriesResult, topCreatorsResult] = await Promise.all([
      supabase.from('tools').select('id, name, description, category:categories(name), pricing, tags').eq('status', 'published').limit(20),
      supabase.from('articles').select('id, title, excerpt, author, category').eq('status', 'published').limit(10),
      supabase.from('categories').select('id, name, description').limit(20),
      // Only fetch public creator profile fields (no private contact info or sensitive data)
      supabase.rpc('get_top_creators', { limit_param: 10 })
    ]);

    // Build database context string
    let dbContext = '\n\n=== REAL PLATFORM DATA (Use this to answer questions) ===\n\n';
    
    if (toolsResult.data && toolsResult.data.length > 0) {
      dbContext += '**Published AI Tools:**\n';
      toolsResult.data.forEach((tool: any) => {
        dbContext += `- ${tool.name}: ${tool.description?.substring(0, 100) || 'No description'}${tool.category?.name ? ` (Category: ${tool.category.name})` : ''}\n`;
      });
      dbContext += '\n';
    }

    if (articlesResult.data && articlesResult.data.length > 0) {
      dbContext += '**Published Articles:**\n';
      articlesResult.data.forEach((article: any) => {
        dbContext += `- ${article.title} by ${article.author}${article.excerpt ? `: ${article.excerpt.substring(0, 80)}...` : ''}\n`;
      });
      dbContext += '\n';
    }

    if (categoriesResult.data && categoriesResult.data.length > 0) {
      dbContext += '**Available Categories:**\n';
      categoriesResult.data.forEach((cat: any) => {
        dbContext += `- ${cat.name}${cat.description ? `: ${cat.description}` : ''}\n`;
      });
      dbContext += '\n';
    }

    if (topCreatorsResult.data && topCreatorsResult.data.length > 0) {
      dbContext += '**Top Creators (Public Profiles Only):**\n';
      topCreatorsResult.data.forEach((creator: any) => {
        // Only include publicly visible information
        dbContext += `- ${creator.full_name}${creator.job_title ? ` (${creator.job_title})` : ''} - Engagement: ${creator.total_engagement || 0}\n`;
      });
      dbContext += '\n';
    }

    dbContext += '=== CRITICAL PRIVACY & DATA INSTRUCTIONS ===\n';
    dbContext += 'ONLY reference the tools, articles, categories, and creators listed above.\n';
    dbContext += 'For creators: ONLY use the public profile data provided. DO NOT make assumptions about or reference any private data such as email, phone, private messages, unpublished content, or personal contact information.\n';
    dbContext += 'If asked about private creator information, politely explain that you can only provide publicly available information.\n';
    dbContext += 'If asked about something not in the database, politely explain that you can only provide information about published content on the platform.\n';
    dbContext += 'When recommending tools, articles, or creators, cite specific ones from the list above.\n\n';

    // Build context-aware system prompt
    let systemPrompt = `You are an AI assistant for AI Feed, a platform for discovering and sharing AI tools. 
Always respond in ${language} language. Keep responses clear, concise, and helpful.

${dbContext}`;

    if (context === 'creator') {
      systemPrompt += `\n\nYou're helping a content creator. Focus on:
- Recommending specific AI tools from our published database
- Referencing published articles on the platform
- How to submit and manage AI tools
- Writing articles about AI
- Understanding analytics and engagement
- Getting verified badges
- Community guidelines`;
    } else if (context === 'employer') {
      systemPrompt += `\n\nYou're helping an employer/recruiter. Focus on:
- Finding and searching for talent (reference real top creators from the database)
- Posting job opportunities
- Managing subscription plans
- Contacting candidates
- Best practices for hiring`;
    } else if (context === 'tool-submission') {
      systemPrompt += `\n\nYou're helping with AI tool submission. Provide:
- Examples based on existing published tools in our database
- Suggestions for tool descriptions
- Feature lists based on the tool category (use real categories from database)
- Pros and cons
- SEO-friendly content`;
    } else if (context === 'job-posting') {
      systemPrompt += `\n\nYou're helping with job posting. Provide:
- Job description templates
- Required skills suggestions
- Optimized job titles`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
