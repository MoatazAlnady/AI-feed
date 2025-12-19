import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType, contentTitle, contentDescription, aiPrompt } = await req.json();

    console.log('AI Targeting request:', { contentType, contentTitle, aiPrompt });

    const systemPrompt = `You are an AI marketing strategist specializing in content promotion targeting. Based on the content information and user prompt provided, generate optimal targeting parameters for a promotional campaign.

You must respond with ONLY a valid JSON object (no markdown, no code blocks) with these exact fields:
{
  "targetAudience": ["array of 3-5 audience segments"],
  "interests": ["array of 5-8 relevant interests"],
  "selectedCountries": ["array of 3-5 relevant countries"],
  "ageFrom": "minimum age as string",
  "ageTo": "maximum age as string",
  "gender": "all|male|female",
  "devices": ["array from: mobile, desktop, tablet"],
  "languages": ["array of 2-4 languages"],
  "industries": ["array of 3-5 industries"],
  "scheduleDays": ["array from: monday, tuesday, wednesday, thursday, friday, saturday, sunday"],
  "scheduleStartTime": "HH:MM format",
  "scheduleEndTime": "HH:MM format"
}`;

    const userMessage = `Content Type: ${contentType}
Title: ${contentTitle}
Description: ${contentDescription || 'No description provided'}
User's targeting request: ${aiPrompt}

Generate the optimal targeting parameters for this promotional campaign.`;

    // Use Lovable AI Gateway
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n${userMessage}`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      
      // Return default targeting if API fails
      return new Response(JSON.stringify({
        targeting: getDefaultTargeting(contentType, contentTitle),
        source: 'fallback'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('AI response:', data);

    const aiContent = data.content?.[0]?.text || '';
    
    // Parse the JSON response
    let targeting;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        targeting = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      targeting = getDefaultTargeting(contentType, contentTitle);
    }

    // Validate and fill in missing fields
    targeting = {
      targetAudience: targeting.targetAudience || ['Tech Enthusiasts', 'AI Researchers', 'Developers'],
      interests: targeting.interests || ['Artificial Intelligence', 'Machine Learning', 'Technology'],
      selectedCountries: targeting.selectedCountries || ['United States', 'United Kingdom', 'Canada'],
      ageFrom: targeting.ageFrom || '25',
      ageTo: targeting.ageTo || '55',
      gender: targeting.gender || 'all',
      devices: targeting.devices || ['mobile', 'desktop'],
      languages: targeting.languages || ['English'],
      industries: targeting.industries || ['Technology', 'Software'],
      scheduleDays: targeting.scheduleDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      scheduleStartTime: targeting.scheduleStartTime || '09:00',
      scheduleEndTime: targeting.scheduleEndTime || '21:00'
    };

    return new Response(JSON.stringify({ targeting, source: 'ai' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-targeting function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      targeting: getDefaultTargeting('content', 'Unknown')
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getDefaultTargeting(contentType: string, contentTitle: string) {
  const defaults: Record<string, any> = {
    tool: {
      targetAudience: ['Developers', 'Tech Enthusiasts', 'Product Managers', 'Data Scientists'],
      interests: ['Artificial Intelligence', 'Machine Learning', 'Software Development', 'Productivity', 'Automation'],
      industries: ['Technology', 'Software', 'Startups', 'Enterprise']
    },
    article: {
      targetAudience: ['AI Researchers', 'Tech Writers', 'Industry Professionals', 'Students'],
      interests: ['AI Research', 'Technology News', 'Innovation', 'Data Science', 'Deep Learning'],
      industries: ['Technology', 'Education', 'Media', 'Research']
    },
    post: {
      targetAudience: ['AI Community', 'Tech Enthusiasts', 'Professionals', 'Entrepreneurs'],
      interests: ['AI News', 'Technology', 'Innovation', 'Startups', 'Networking'],
      industries: ['Technology', 'Startups', 'Consulting', 'Marketing']
    },
    job: {
      targetAudience: ['Job Seekers', 'AI Professionals', 'Engineers', 'Data Scientists'],
      interests: ['Career Growth', 'AI Jobs', 'Technology Careers', 'Professional Development'],
      industries: ['Technology', 'AI/ML', 'Software', 'Consulting']
    },
    profile: {
      targetAudience: ['Professionals', 'Recruiters', 'Industry Leaders', 'Collaborators'],
      interests: ['Professional Networking', 'AI Industry', 'Career Opportunities', 'Collaboration'],
      industries: ['Technology', 'AI/ML', 'Consulting', 'Startups']
    }
  };

  const base = defaults[contentType] || defaults.post;

  return {
    ...base,
    selectedCountries: ['United States', 'United Kingdom', 'Canada', 'Germany'],
    ageFrom: '25',
    ageTo: '55',
    gender: 'all',
    devices: ['mobile', 'desktop', 'tablet'],
    languages: ['English'],
    scheduleDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    scheduleStartTime: '09:00',
    scheduleEndTime: '21:00'
  };
}
