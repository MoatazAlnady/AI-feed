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
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching metadata for URL:', url);

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch URL', status: response.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

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

    console.log('Extracted metadata:', metadata);

    return new Response(
      JSON.stringify(metadata),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching link metadata:', error);
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
