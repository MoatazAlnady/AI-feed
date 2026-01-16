import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs to tier mapping
const SILVER_PRICE_IDS = [
  "price_1Sg9TEHdycB2B7zvMXuIhd2P", // Silver monthly
  "price_1Sg9TRHdycB2B7zvgMaPc1x0", // Silver yearly
];

const GOLD_PRICE_IDS = [
  "price_1Sq1qpHdycB2B7zvsq09zgcf", // Gold monthly
  "price_1Sq1qrHdycB2B7zvC41Lpu4h", // Gold yearly
];

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

function detectTierFromPriceId(priceId: string): 'silver' | 'gold' | null {
  if (GOLD_PRICE_IDS.includes(priceId)) return 'gold';
  if (SILVER_PRICE_IDS.includes(priceId)) return 'silver';
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, updating user as not subscribed");
      
      // Update user profile to not premium
      await supabaseClient
        .from('user_profiles')
        .update({ is_premium: false, premium_until: null, premium_tier: null })
        .eq('id', user.id);
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        premium_tier: null,
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    // Also check for trialing subscriptions
    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 10,
    });

    const allSubscriptions = [...subscriptions.data, ...trialingSubscriptions.data];
    const hasActiveSub = allSubscriptions.length > 0;

    let subscriptionTier: 'monthly' | 'yearly' | null = null;
    let premiumTier: 'silver' | 'gold' | null = null;
    let subscriptionEnd: string | null = null;
    let isTrialing = false;

    if (hasActiveSub) {
      // Find the highest tier subscription (gold > silver)
      let bestSubscription = allSubscriptions[0];
      let bestTier: 'silver' | 'gold' | null = null;
      
      for (const sub of allSubscriptions) {
        const priceId = sub.items.data[0].price.id;
        const tier = detectTierFromPriceId(priceId);
        
        if (tier === 'gold') {
          bestSubscription = sub;
          bestTier = 'gold';
          break; // Gold is the highest, no need to continue
        } else if (tier === 'silver' && bestTier !== 'gold') {
          bestSubscription = sub;
          bestTier = 'silver';
        }
      }
      
      const subscription = bestSubscription;
      premiumTier = bestTier;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      isTrialing = subscription.status === 'trialing';
      
      // Determine billing cycle
      const interval = subscription.items.data[0].price.recurring?.interval;
      subscriptionTier = interval === 'year' ? 'yearly' : 'monthly';
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        subscriptionTier,
        premiumTier,
        endDate: subscriptionEnd,
        isTrialing 
      });

      // Update user profile as premium with tier
      await supabaseClient
        .from('user_profiles')
        .update({ 
          is_premium: true, 
          premium_until: subscriptionEnd,
          premium_tier: premiumTier
        })
        .eq('id', user.id);
      
      logStep("Updated user profile to premium", { premiumTier });
    } else {
      logStep("No active subscription found");
      
      // Update user profile to not premium
      await supabaseClient
        .from('user_profiles')
        .update({ is_premium: false, premium_until: null, premium_tier: null })
        .eq('id', user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      premium_tier: premiumTier,
      subscription_end: subscriptionEnd,
      is_trialing: isTrialing,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
