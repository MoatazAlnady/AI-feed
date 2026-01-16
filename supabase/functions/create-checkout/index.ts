import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stripe price IDs for premium subscriptions
const PRICE_IDS = {
  silver: {
    monthly: "price_1Sg9TEHdycB2B7zvMXuIhd2P", // $20/month
    yearly: "price_1Sg9TRHdycB2B7zvgMaPc1x0",   // $200/year
  },
  gold: {
    monthly: "price_1Sq1qpHdycB2B7zvsq09zgcf", // $30/month
    yearly: "price_1Sq1qrHdycB2B7zvC41Lpu4h",   // $300/year
  }
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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

    const { billingPeriod, tier = 'silver' } = await req.json();
    
    // Validate tier
    if (!['silver', 'gold'].includes(tier)) {
      throw new Error("Invalid tier. Must be 'silver' or 'gold'");
    }
    
    const tierPrices = PRICE_IDS[tier as 'silver' | 'gold'];
    const priceId = billingPeriod === 'yearly' ? tierPrices.yearly : tierPrices.monthly;
    logStep("Selected plan", { tier, billingPeriod, priceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });

      // Check if already has active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      // Also check for trialing subscriptions
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
      
      const allActive = [...subscriptions.data, ...trialingSubscriptions.data];
      
      if (allActive.length > 0) {
        // Check if trying to upgrade from silver to gold
        const currentSub = allActive[0];
        const currentPriceId = currentSub.items.data[0].price.id;
        const isSilverPrice = Object.values(PRICE_IDS.silver).includes(currentPriceId);
        const isUpgradingToGold = tier === 'gold' && isSilverPrice;
        
        if (!isUpgradingToGold) {
          logStep("User already has active subscription");
          return new Response(
            JSON.stringify({ error: "You already have an active subscription. Use the customer portal to manage your subscription." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        
        logStep("Upgrading from Silver to Gold");
      }
    }

    const origin = req.headers.get("origin") || "https://lovable.dev";

    // Create checkout session with 7-day trial for yearly plan
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/upgrade`,
      metadata: {
        user_id: user.id,
        billing_period: billingPeriod,
        tier: tier,
      },
    };

    // Add 7-day trial for yearly subscriptions
    if (billingPeriod === 'yearly') {
      sessionConfig.subscription_data = {
        trial_period_days: 7,
        metadata: {
          tier: tier,
        },
      };
      logStep("Added 7-day trial for yearly plan");
    } else {
      sessionConfig.subscription_data = {
        metadata: {
          tier: tier,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
