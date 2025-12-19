import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      console.warn(`[fetch-link-metadata] Missing URL parameter`, { requestId });
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      console.warn(`[fetch-link-metadata] Invalid URL`, { requestId, url });
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[fetch-link-metadata] Request started`, { 
      requestId, 
      timestamp: new Date().toISOString(),
      domain: parsedUrl.hostname 
    });

    const fetchStartTime = Date.now();
    
    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    const fetchDuration = Date.now() - fetchStartTime;

    if (!response.ok) {
      console.warn(`[fetch-link-metadata] Fetch failed`, { requestId, status: response.status, fetchDuration: `${fetchDuration}ms` });
      return new Response(
        JSON.stringify({ error: 'Failed to fetch URL', status: response.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    const parseStartTime = Date.now();

    // Parse metadata
    const metadata = {
      url: url,
      title: extractMeta(html, 'og:title') || extractTitle(html) || parsedUrl.hostname,
      description: extractMeta(html, 'og:description') || extractMeta(html, 'description') || '',
      image: extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image') || '',
      siteName: extractMeta(html, 'og:site_name') || parsedUrl.hostname,
      favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
    };

    // Make image URL absolute if it's relative
    if (metadata.image && !metadata.image.startsWith('http')) {
      metadata.image = new URL(metadata.image, url).toString();
    }

    const parseDuration = Date.now() - parseStartTime;
    const totalDuration = Date.now() - startTime;

    console.log(`[fetch-link-metadata] Request completed`, { 
      requestId,
      domain: parsedUrl.hostname,
      fetchDuration: `${fetchDuration}ms`,
      parseDuration: `${parseDuration}ms`,
      totalDuration: `${totalDuration}ms`,
      hasTitle: !!metadata.title,
      hasDescription: !!metadata.description,
      hasImage: !!metadata.image
    });

    return new Response(
      JSON.stringify(metadata),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[fetch-link-metadata] Request failed`, { requestId, error: error.message, duration: `${duration}ms` });
    return new Response(
      JSON.stringify({ error: 'Failed to fetch metadata', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractMeta(html: string, property: string): string | null {
  // Try og: or twitter: meta tags
  let match = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'));
  if (match) return match[1];
  
  // Try name attribute
  match = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'));
  if (match) return match[1];
  
  // Try reversed order (content before property/name)
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
