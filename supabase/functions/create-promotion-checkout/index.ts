import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Promotion credit packages
const PROMOTION_PACKAGES = {
  "25": {
    priceId: "price_1SgAR3HdycB2B7zvw2FOVFyB",
    amount: 2500,
    credits: 25
  },
  "50": {
    priceId: "price_1SgARIHdycB2B7zvImEI80jF",
    amount: 5000,
    credits: 50
  },
  "100": {
    priceId: "price_1SgARPHdycB2B7zvNtdS6pdv",
    amount: 10000,
    credits: 100
  }
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PROMOTION-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
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

    const body = await req.json();
    const { 
      contentType, 
      contentId, 
      contentTitle, 
      budget, 
      duration, 
      objective, 
      targetingData 
    } = body;

    logStep("Received promotion data", { contentType, contentId, budget, duration, objective });

    // Determine which package to use based on budget
    let selectedPackage;
    const budgetNum = parseInt(budget);
    if (budgetNum >= 100) {
      selectedPackage = PROMOTION_PACKAGES["100"];
    } else if (budgetNum >= 50) {
      selectedPackage = PROMOTION_PACKAGES["50"];
    } else {
      selectedPackage = PROMOTION_PACKAGES["25"];
    }
    logStep("Selected package", selectedPackage);

    // Create pending promotion in database
    const { data: promotion, error: promotionError } = await supabaseClient
      .from('promotions')
      .insert({
        user_id: user.id,
        content_type: contentType,
        content_id: String(contentId),
        content_title: contentTitle,
        budget: parseFloat(budget),
        duration: parseInt(duration),
        objective: objective,
        targeting_data: targetingData,
        status: 'pending_payment'
      })
      .select()
      .single();

    if (promotionError) {
      logStep("Error creating promotion", promotionError);
      throw new Error(`Failed to create promotion: ${promotionError.message}`);
    }
    logStep("Created pending promotion", { promotionId: promotion.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://lovable.dev";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: selectedPackage.priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/promotion-success?session_id={CHECKOUT_SESSION_ID}&promotion_id=${promotion.id}`,
      cancel_url: `${origin}/newsfeed?promotion_cancelled=true`,
      metadata: {
        user_id: user.id,
        promotion_id: promotion.id,
        content_type: contentType,
        content_id: String(contentId)
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update promotion with stripe session id
    await supabaseClient
      .from('promotions')
      .update({ stripe_session_id: session.id })
      .eq('id', promotion.id);

    return new Response(JSON.stringify({ url: session.url, promotionId: promotion.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-promotion-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
