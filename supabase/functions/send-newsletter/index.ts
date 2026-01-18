import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONTENT_LIMITS = {
  articles: 5,
  posts: 5,
  tools: 5,
  jobs: 3,
  events: 3,
};

interface Subscriber {
  id: string;
  email: string;
  frequency: string;
  interests: string[];
  full_name?: string;
  user_id?: string;
  last_sent_at?: string;
  unsubscribe_token?: string;
}

interface ContentItem {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  type: string;
  created_at: string;
  author?: string;
  image_url?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Initialize Resend if API key is available
    const resend = resendApiKey ? new Resend(resendApiKey) : null;
    
    if (!resend) {
      console.warn("RESEND_API_KEY not configured - emails will be logged but not sent");
    }

    // Get the authorization header to verify admin access
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.log("No authenticated user, proceeding with scheduled job");
      } else {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('account_type')
          .eq('id', user.id)
          .single();
        
        if (profile?.account_type !== 'admin') {
          console.log("Non-admin user attempted to trigger newsletter, allowing for scheduled jobs");
        } else {
          console.log("Admin user triggered newsletter send");
        }
      }
    }

    // Determine which frequency to process
    const { frequency, issueId } = await req.json().catch(() => ({ frequency: "all", issueId: null }));
    console.log(`Processing newsletter for frequency: ${frequency}, issueId: ${issueId}`);

    // If specific issue ID is provided, send that issue
    if (issueId) {
      return await sendSpecificIssue(supabase, resend, issueId);
    }

    // Get date thresholds based on frequency
    const now = new Date();
    const getDateThreshold = (freq: string): Date => {
      const date = new Date(now);
      switch (freq) {
        case "daily":
          date.setDate(date.getDate() - 1);
          break;
        case "weekly":
          date.setDate(date.getDate() - 7);
          break;
        case "monthly":
          date.setMonth(date.getMonth() - 1);
          break;
        default:
          date.setDate(date.getDate() - 7);
      }
      return date;
    };

    // Determine which frequencies to process
    const frequenciesToProcess: string[] = [];
    if (frequency === "all") {
      const hour = now.getUTCHours();
      const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Daily newsletters sent at 8 AM UTC
      if (hour === 8) frequenciesToProcess.push("daily");
      
      // Semi-weekly: Tuesday (2) and Friday (5) at 8 AM UTC
      if ([2, 5].includes(dayOfWeek) && hour === 8) frequenciesToProcess.push("semi_weekly");
      
      // Biweekly: Monday (1), Wednesday (3), Friday (5) at 8 AM UTC
      if ([1, 3, 5].includes(dayOfWeek) && hour === 8) frequenciesToProcess.push("biweekly");
      
      // Weekly newsletters sent on Mondays at 8 AM UTC
      if (dayOfWeek === 1 && hour === 8) frequenciesToProcess.push("weekly");
      
      // Monthly newsletters sent on 1st of month at 8 AM UTC
      if (now.getUTCDate() === 1 && hour === 8) frequenciesToProcess.push("monthly");
    } else {
      frequenciesToProcess.push(frequency);
    }

    if (frequenciesToProcess.length === 0) {
      console.log("No newsletters to send at this time");
      return new Response(
        JSON.stringify({ message: "No newsletters to send at this time" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create newsletter batch record
    for (const freq of frequenciesToProcess) {
      console.log(`Processing ${freq} newsletter...`);
      
      const { data: batchData, error: batchError } = await supabase
        .from("newsletter_batches")
        .insert({ frequency: freq })
        .select()
        .single();

      if (batchError) {
        console.error("Error creating batch:", batchError);
        continue;
      }

      const batchId = batchData.id;
      const dateThreshold = getDateThreshold(freq);

      // Fetch subscribers for this frequency
      const { data: subscribers, error: subError } = await supabase
        .from("newsletter_subscribers")
        .select("*, unsubscribe_token")
        .eq("frequency", freq);

      if (subError) {
        console.error("Error fetching subscribers:", subError);
        continue;
      }

      console.log(`Found ${subscribers?.length || 0} subscribers for ${freq} frequency`);

      let successCount = 0;
      let errorCount = 0;

      // Process each subscriber
      for (const subscriber of (subscribers || []) as Subscriber[]) {
        try {
          // Get sent content IDs for this subscriber
          const { data: sentContent } = await supabase
            .from("newsletter_sent_content")
            .select("content_type, content_id")
            .eq("subscriber_id", subscriber.id);

          const sentContentMap: Record<string, string[]> = {};
          (sentContent || []).forEach((item: any) => {
            if (!sentContentMap[item.content_type]) {
              sentContentMap[item.content_type] = [];
            }
            sentContentMap[item.content_type].push(item.content_id);
          });

          const content: ContentItem[] = [];
          const contentToTrack: { type: string; id: string }[] = [];

          // Fetch articles
          let articlesQuery = supabase
            .from("articles")
            .select("id, title, excerpt, featured_image_url, author, created_at, tags")
            .eq("status", "published")
            .gte("created_at", dateThreshold.toISOString())
            .order("views", { ascending: false })
            .limit(CONTENT_LIMITS.articles);

          if (sentContentMap.article?.length) {
            articlesQuery = articlesQuery.not("id", "in", `(${sentContentMap.article.join(",")})`);
          }

          const { data: articles } = await articlesQuery;
          
          // Filter by interests if subscriber has any
          let filteredArticles = articles || [];
          if (subscriber.interests?.length) {
            filteredArticles = filteredArticles.filter((article: any) => {
              const articleTags = article.tags || [];
              return subscriber.interests.some(interest => 
                articleTags.some((tag: string) => 
                  tag.toLowerCase().includes(interest.toLowerCase()) ||
                  interest.toLowerCase().includes(tag.toLowerCase())
                ) ||
                article.title?.toLowerCase().includes(interest.toLowerCase())
              );
            });
          }

          filteredArticles.slice(0, CONTENT_LIMITS.articles).forEach((article: any) => {
            content.push({
              id: article.id,
              title: article.title,
              excerpt: article.excerpt || article.title,
              url: `/articles/${article.id}`,
              type: "article",
              created_at: article.created_at,
              author: article.author,
              image_url: article.featured_image_url
            });
            contentToTrack.push({ type: "article", id: article.id });
          });

          // Fetch tools
          let toolsQuery = supabase
            .from("tools")
            .select("id, name, description, logo_url, created_at, tags")
            .eq("status", "published")
            .gte("created_at", dateThreshold.toISOString())
            .order("average_rating", { ascending: false })
            .limit(CONTENT_LIMITS.tools);

          if (sentContentMap.tool?.length) {
            toolsQuery = toolsQuery.not("id", "in", `(${sentContentMap.tool.join(",")})`);
          }

          const { data: tools } = await toolsQuery;

          let filteredTools = tools || [];
          if (subscriber.interests?.length) {
            filteredTools = filteredTools.filter((tool: any) => {
              const toolTags = tool.tags || [];
              return subscriber.interests.some(interest =>
                toolTags.some((tag: string) =>
                  tag.toLowerCase().includes(interest.toLowerCase())
                ) ||
                tool.name?.toLowerCase().includes(interest.toLowerCase()) ||
                tool.description?.toLowerCase().includes(interest.toLowerCase())
              );
            });
          }

          filteredTools.slice(0, CONTENT_LIMITS.tools).forEach((tool: any) => {
            content.push({
              id: tool.id,
              title: tool.name,
              excerpt: tool.description?.substring(0, 150) || tool.name,
              url: `/tools/${tool.id}`,
              type: "tool",
              created_at: tool.created_at,
              image_url: tool.logo_url
            });
            contentToTrack.push({ type: "tool", id: tool.id });
          });

          // Fetch jobs
          let jobsQuery = supabase
            .from("jobs")
            .select("id, title, company, description, location, created_at")
            .gte("created_at", dateThreshold.toISOString())
            .order("created_at", { ascending: false })
            .limit(CONTENT_LIMITS.jobs);

          if (sentContentMap.job?.length) {
            jobsQuery = jobsQuery.not("id", "in", `(${sentContentMap.job.join(",")})`);
          }

          const { data: jobs } = await jobsQuery;

          (jobs || []).forEach((job: any) => {
            content.push({
              id: job.id,
              title: job.title,
              excerpt: `${job.company} • ${job.location}`,
              url: `/jobs/${job.id}`,
              type: "job",
              created_at: job.created_at
            });
            contentToTrack.push({ type: "job", id: job.id });
          });

          // Fetch upcoming events
          let eventsQuery = supabase
            .from("events")
            .select("id, title, description, event_date, location, is_online, created_at, interests")
            .eq("is_public", true)
            .gte("event_date", new Date().toISOString())
            .order("event_date", { ascending: true })
            .limit(CONTENT_LIMITS.events);

          if (sentContentMap.event?.length) {
            eventsQuery = eventsQuery.not("id", "in", `(${sentContentMap.event.join(",")})`);
          }

          const { data: events } = await eventsQuery;

          let filteredEvents = events || [];
          if (subscriber.interests?.length) {
            filteredEvents = filteredEvents.filter((event: any) => {
              const eventInterests = event.interests || [];
              return subscriber.interests.some(interest =>
                eventInterests.some((tag: string) =>
                  tag.toLowerCase().includes(interest.toLowerCase())
                ) ||
                event.title?.toLowerCase().includes(interest.toLowerCase()) ||
                event.description?.toLowerCase().includes(interest.toLowerCase())
              );
            });
          }

          filteredEvents.slice(0, CONTENT_LIMITS.events).forEach((event: any) => {
            const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            content.push({
              id: event.id,
              title: event.title,
              excerpt: `${eventDate} • ${event.is_online ? 'Online' : event.location || 'TBD'}`,
              url: `/events/${event.id}`,
              type: "event",
              created_at: event.created_at
            });
            contentToTrack.push({ type: "event", id: event.id });
          });

          // Fetch posts (viral content first)
          let postsQuery = supabase
            .from("posts")
            .select("id, content, user_id, reach_score, view_count, share_count, created_at, tags")
            .gte("created_at", dateThreshold.toISOString())
            .order("reach_score", { ascending: false })
            .limit(CONTENT_LIMITS.posts);

          if (sentContentMap.post?.length) {
            postsQuery = postsQuery.not("id", "in", `(${sentContentMap.post.join(",")})`);
          }

          const { data: posts } = await postsQuery;

          let filteredPosts = posts || [];
          if (subscriber.interests?.length) {
            filteredPosts = filteredPosts.filter((post: any) => {
              const postTags = post.tags || [];
              return subscriber.interests.some(interest =>
                postTags.some((tag: string) =>
                  tag.toLowerCase().includes(interest.toLowerCase())
                ) ||
                post.content?.toLowerCase().includes(interest.toLowerCase())
              );
            });
          }

          filteredPosts.slice(0, CONTENT_LIMITS.posts).forEach((post: any) => {
            content.push({
              id: post.id,
              title: "Trending Post",
              excerpt: post.content?.substring(0, 150) || "Check out this trending post",
              url: `/posts/${post.id}`,
              type: "post",
              created_at: post.created_at
            });
            contentToTrack.push({ type: "post", id: post.id });
          });

          // Skip if no content to send
          if (content.length === 0) {
            console.log(`No new content for subscriber ${subscriber.email}`);
            continue;
          }

          // Generate newsletter HTML with unsubscribe token
          const baseUrl = "https://fbhhumtpdfalgkhzirew.lovable.app";
          const newsletterHtml = generateNewsletterHtml(
            subscriber.full_name || subscriber.email.split("@")[0],
            content,
            freq,
            baseUrl,
            subscriber.unsubscribe_token
          );

          // Send email via Resend if configured
          if (resend) {
            try {
              const { error: emailError } = await resend.emails.send({
                from: "AI Feed <newsletter@resend.dev>",
                to: [subscriber.email],
                subject: `🤖 AI Feed ${freq.charAt(0).toUpperCase() + freq.slice(1)} Digest`,
                html: newsletterHtml,
              });

              if (emailError) {
                console.error(`Failed to send email to ${subscriber.email}:`, emailError);
                errorCount++;
                continue;
              }

              console.log(`Email sent successfully to ${subscriber.email}`);
            } catch (emailErr) {
              console.error(`Error sending email to ${subscriber.email}:`, emailErr);
              errorCount++;
              continue;
            }
          } else {
            // Log the newsletter (fallback when Resend not configured)
            console.log(`Newsletter generated for ${subscriber.email}:`, {
              contentCount: content.length,
              types: [...new Set(content.map(c => c.type))],
              hasUnsubscribeToken: !!subscriber.unsubscribe_token
            });
          }

          // Track sent content
          for (const item of contentToTrack) {
            await supabase.from("newsletter_sent_content").insert({
              subscriber_id: subscriber.id,
              content_type: item.type,
              content_id: item.id,
              newsletter_batch_id: batchId
            }).catch(() => {}); // Ignore duplicates
          }

          // Update subscriber's last_sent_at
          await supabase
            .from("newsletter_subscribers")
            .update({ last_sent_at: new Date().toISOString() })
            .eq("id", subscriber.id);

          successCount++;
        } catch (error) {
          console.error(`Error processing subscriber ${subscriber.email}:`, error);
          errorCount++;
        }
      }

      // Update batch with results
      await supabase
        .from("newsletter_batches")
        .update({
          total_subscribers: subscribers?.length || 0,
          success_count: successCount,
          error_count: errorCount,
          completed_at: new Date().toISOString()
        })
        .eq("id", batchId);

      console.log(`${freq} newsletter batch completed: ${successCount} success, ${errorCount} errors`);
    }

    return new Response(
      JSON.stringify({ 
        message: "Newsletter processing completed",
        frequencies: frequenciesToProcess 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Newsletter error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Send a specific newsletter issue to its recipients
async function sendSpecificIssue(supabase: any, resend: any, issueId: string) {
  console.log(`Sending specific newsletter issue: ${issueId}`);
  
  // Get the issue details
  const { data: issue, error: issueError } = await supabase
    .from("newsletter_issues")
    .select("*")
    .eq("id", issueId)
    .single();

  if (issueError || !issue) {
    console.error("Issue not found:", issueError);
    return new Response(
      JSON.stringify({ error: "Newsletter issue not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get issue items
  const { data: issueItems } = await supabase
    .from("newsletter_issue_items")
    .select("*")
    .eq("issue_id", issueId)
    .order("sort_order");

  // Get recipients
  const { data: recipients } = await supabase
    .from("newsletter_issue_recipients")
    .select("subscriber_id, newsletter_subscribers(*)")
    .eq("issue_id", issueId);

  if (!recipients || recipients.length === 0) {
    console.error("No recipients for issue");
    return new Response(
      JSON.stringify({ error: "No recipients for this newsletter issue" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const baseUrl = "https://fbhhumtpdfalgkhzirew.lovable.app";
  let successCount = 0;
  let errorCount = 0;

  for (const recipient of recipients) {
    const subscriber = recipient.newsletter_subscribers;
    if (!subscriber) continue;

    try {
      const html = generateCustomIssueHtml(
        subscriber.full_name || subscriber.email.split("@")[0],
        issue,
        issueItems || [],
        baseUrl,
        subscriber.unsubscribe_token
      );

      if (resend) {
        const { error: emailError } = await resend.emails.send({
          from: "AI Feed <newsletter@resend.dev>",
          to: [subscriber.email],
          subject: issue.subject || issue.title,
          html,
        });

        if (emailError) {
          console.error(`Failed to send to ${subscriber.email}:`, emailError);
          errorCount++;
          continue;
        }
      }

      // Log delivery
      await supabase.from("newsletter_delivery_log").insert({
        issue_id: issueId,
        subscriber_id: subscriber.id,
        status: "sent",
        sent_at: new Date().toISOString()
      });

      successCount++;
    } catch (err) {
      console.error(`Error sending to ${subscriber.email}:`, err);
      errorCount++;
    }
  }

  // Update issue status
  await supabase
    .from("newsletter_issues")
    .update({ 
      status: "sent",
      scheduled_for: new Date().toISOString()
    })
    .eq("id", issueId);

  return new Response(
    JSON.stringify({ 
      message: "Newsletter issue sent",
      successCount,
      errorCount
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function generateCustomIssueHtml(
  subscriberName: string,
  issue: any,
  items: any[],
  baseUrl: string,
  unsubscribeToken?: string
): string {
  const unsubscribeUrl = unsubscribeToken 
    ? `${baseUrl}/unsubscribe?token=${unsubscribeToken}`
    : `${baseUrl}/unsubscribe`;

  const itemsHtml = items.map(item => `
    <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
      <span style="display: inline-block; background: #e0e7ff; color: #4f46e5; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-bottom: 8px;">${item.content_type}</span>
      <h3 style="margin: 0 0 8px; font-size: 16px;">
        <a href="${baseUrl}${item.url_snapshot}" style="color: #1f2937; text-decoration: none;">${item.title_snapshot}</a>
      </h3>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">${item.blurb_snapshot}</p>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${issue.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff;">
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #fff; padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0 0 10px; font-size: 28px;">🤖 ${issue.title}</h1>
      <p style="margin: 0; opacity: 0.9;">Hi ${subscriberName}!</p>
    </div>
    
    <div style="padding: 30px 20px;">
      ${issue.intro_text ? `<p style="margin-bottom: 20px;">${issue.intro_text}</p>` : ''}
      
      ${itemsHtml}
      
      ${issue.outro_text ? `<p style="margin-top: 20px;">${issue.outro_text}</p>` : ''}
      
      <div style="text-align: center;">
        <a href="${baseUrl}/newsfeed" style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">Explore More on AI Feed →</a>
      </div>
    </div>
    
    <div style="background: #1f2937; color: #9ca3af; padding: 30px 20px; text-align: center;">
      <p>
        <a href="${baseUrl}/settings" style="color: #6366f1; text-decoration: none;">Manage Preferences</a> | 
        <a href="${unsubscribeUrl}" style="color: #6366f1; text-decoration: none;">Unsubscribe</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px;">© ${new Date().getFullYear()} AI Feed. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateNewsletterHtml(
  subscriberName: string, 
  content: ContentItem[], 
  frequency: string,
  baseUrl: string,
  unsubscribeToken?: string
): string {
  const articleItems = content.filter(c => c.type === "article");
  const toolItems = content.filter(c => c.type === "tool");
  const jobItems = content.filter(c => c.type === "job");
  const eventItems = content.filter(c => c.type === "event");
  const postItems = content.filter(c => c.type === "post");

  const frequencyLabel = frequency.charAt(0).toUpperCase() + frequency.slice(1);
  
  // Build unsubscribe URL with token
  const unsubscribeUrl = unsubscribeToken 
    ? `${baseUrl}/unsubscribe?token=${unsubscribeToken}`
    : `${baseUrl}/unsubscribe`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Feed ${frequencyLabel} Digest</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #fff; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0 0 10px; font-size: 28px; }
    .header p { margin: 0; opacity: 0.9; }
    .content { padding: 30px 20px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #6366f1; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
    .item { background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
    .item h3 { margin: 0 0 8px; font-size: 16px; }
    .item h3 a { color: #1f2937; text-decoration: none; }
    .item h3 a:hover { color: #6366f1; }
    .item p { margin: 0; color: #6b7280; font-size: 14px; }
    .item .meta { font-size: 12px; color: #9ca3af; margin-top: 8px; }
    .badge { display: inline-block; background: #e0e7ff; color: #4f46e5; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 30px 20px; text-align: center; }
    .footer a { color: #6366f1; text-decoration: none; }
    .cta { display: inline-block; background: #6366f1; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 AI Feed ${frequencyLabel} Digest</h1>
      <p>Hi ${subscriberName}, here's what's new in AI!</p>
    </div>
    
    <div class="content">
      ${articleItems.length > 0 ? `
      <div class="section">
        <h2>📚 Featured Articles</h2>
        ${articleItems.map(article => `
        <div class="item">
          <h3><a href="${baseUrl}${article.url}">${article.title}</a></h3>
          <p>${article.excerpt}</p>
          ${article.author ? `<div class="meta">By ${article.author}</div>` : ''}
        </div>
        `).join('')}
      </div>
      ` : ''}
      
      ${toolItems.length > 0 ? `
      <div class="section">
        <h2>🛠️ New AI Tools</h2>
        ${toolItems.map(tool => `
        <div class="item">
          <h3><a href="${baseUrl}${tool.url}">${tool.title}</a></h3>
          <p>${tool.excerpt}</p>
        </div>
        `).join('')}
      </div>
      ` : ''}
      
      ${jobItems.length > 0 ? `
      <div class="section">
        <h2>💼 AI Job Opportunities</h2>
        ${jobItems.map(job => `
        <div class="item">
          <h3><a href="${baseUrl}${job.url}">${job.title}</a></h3>
          <p>${job.excerpt}</p>
        </div>
        `).join('')}
      </div>
      ` : ''}
      
      ${eventItems.length > 0 ? `
      <div class="section">
        <h2>📅 Upcoming Events</h2>
        ${eventItems.map(event => `
        <div class="item">
          <h3><a href="${baseUrl}${event.url}">${event.title}</a></h3>
          <p>${event.excerpt}</p>
        </div>
        `).join('')}
      </div>
      ` : ''}
      
      ${postItems.length > 0 ? `
      <div class="section">
        <h2>💬 Trending Posts</h2>
        ${postItems.map(post => `
        <div class="item">
          <h3><a href="${baseUrl}${post.url}">${post.title}</a></h3>
          <p>${post.excerpt}</p>
        </div>
        `).join('')}
      </div>
      ` : ''}
      
      <div style="text-align: center;">
        <a href="${baseUrl}/newsfeed" class="cta">Explore More on AI Feed →</a>
      </div>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you subscribed to ${frequency} updates.</p>
      <p>
        <a href="${baseUrl}/settings">Manage Preferences</a> | 
        <a href="${unsubscribeUrl}">Unsubscribe</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px;">© ${new Date().getFullYear()} AI Feed. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
