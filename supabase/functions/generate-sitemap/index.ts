import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://aifeed.app";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

const generateSitemapXml = (urls: SitemapUrl[]): string => {
  const urlEntries = urls.map(url => `
    <url>
      <loc>${url.loc}</loc>
      ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
      <changefreq>${url.changefreq}</changefreq>
      <priority>${url.priority.toFixed(1)}</priority>
    </url>`
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log("generate-sitemap: Generating dynamic sitemap...");

    const urls: SitemapUrl[] = [];

    // Static pages
    const staticPages = [
      { path: "/", changefreq: "daily" as const, priority: 1.0 },
      { path: "/tools", changefreq: "daily" as const, priority: 0.9 },
      { path: "/categories", changefreq: "weekly" as const, priority: 0.8 },
      { path: "/blog", changefreq: "daily" as const, priority: 0.8 },
      { path: "/jobs", changefreq: "daily" as const, priority: 0.7 },
      { path: "/community", changefreq: "daily" as const, priority: 0.7 },
      { path: "/talent", changefreq: "weekly" as const, priority: 0.6 },
      { path: "/about", changefreq: "monthly" as const, priority: 0.5 },
      { path: "/guidelines", changefreq: "monthly" as const, priority: 0.4 },
    ];

    staticPages.forEach(page => {
      urls.push({
        loc: `${BASE_URL}${page.path}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: page.changefreq,
        priority: page.priority,
      });
    });

    // Fetch published tools
    const { data: tools, error: toolsError } = await supabase
      .from("tools")
      .select("id, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(500);

    if (toolsError) {
      console.error("Error fetching tools:", toolsError);
    } else if (tools) {
      console.log(`generate-sitemap: Found ${tools.length} tools`);
      tools.forEach(tool => {
        urls.push({
          loc: `${BASE_URL}/tools/${tool.id}`,
          lastmod: tool.updated_at ? new Date(tool.updated_at).toISOString().split('T')[0] : undefined,
          changefreq: "weekly",
          priority: 0.7,
        });
      });
    }

    // Fetch published articles
    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .select("id, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(500);

    if (articlesError) {
      console.error("Error fetching articles:", articlesError);
    } else if (articles) {
      console.log(`generate-sitemap: Found ${articles.length} articles`);
      articles.forEach(article => {
        const lastMod = article.updated_at || article.published_at;
        urls.push({
          loc: `${BASE_URL}/articles/${article.id}`,
          lastmod: lastMod ? new Date(lastMod).toISOString().split('T')[0] : undefined,
          changefreq: "monthly",
          priority: 0.6,
        });
      });
    }

    // Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .order("name");

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
    } else if (categories) {
      console.log(`generate-sitemap: Found ${categories.length} categories`);
      categories.forEach(category => {
        urls.push({
          loc: `${BASE_URL}/tools?category=${category.slug}`,
          lastmod: category.updated_at ? new Date(category.updated_at).toISOString().split('T')[0] : undefined,
          changefreq: "weekly",
          priority: 0.6,
        });
      });
    }

    console.log(`generate-sitemap: Generated sitemap with ${urls.length} URLs`);

    const sitemapXml = generateSitemapXml(urls);

    return new Response(sitemapXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("generate-sitemap: Error occurred", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
