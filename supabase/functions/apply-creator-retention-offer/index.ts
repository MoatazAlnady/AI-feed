import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[APPLY-CREATOR-RETENTION-OFFER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !userData.user) {
      throw new Error("Invalid authentication");
    }

    logStep("User authenticated", { userId: userData.user.id });

    const { offer_id, subscription_id } = await req.json();
    
    if (!offer_id || !subscription_id) {
      throw new Error("offer_id and subscription_id are required");
    }

    logStep("Processing offer", { offer_id, subscription_id });

    // Fetch the offer details
    const { data: offer, error: offerError } = await supabaseClient
      .from('creator_retention_offers')
      .select('*')
      .eq('id', offer_id)
      .eq('is_active', true)
      .single();

    if (offerError || !offer) {
      throw new Error("Offer not found or inactive");
    }

    logStep("Offer found", { title: offer.title, discount_percent: offer.discount_percent });

    // Fetch the subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('creator_subscriptions')
      .select('*, creator_subscription_tiers(*)')
      .eq('id', subscription_id)
      .eq('subscriber_id', userData.user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      throw new Error("Active subscription not found");
    }

    logStep("Subscription found", { 
      stripe_subscription_id: subscription.stripe_subscription_id,
      tier: subscription.creator_subscription_tiers?.name
    });

    // If there's a Stripe subscription, apply the discount
    if (subscription.stripe_subscription_id && offer.discount_percent) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

      // Create or get coupon
      const couponId = `creator_retention_${offer.id.substring(0, 8)}`;
      let coupon;
      
      try {
        coupon = await stripe.coupons.retrieve(couponId);
        logStep("Existing coupon found", { couponId });
      } catch {
        // Create new coupon
        coupon = await stripe.coupons.create({
          id: couponId,
          percent_off: offer.discount_percent,
          duration: 'repeating',
          duration_in_months: offer.discount_months || 1,
          name: offer.title,
        });
        logStep("Created new coupon", { couponId });
      }

      // Apply coupon to subscription
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        coupon: coupon.id,
      });

      logStep("Coupon applied to subscription");
    }

    // Record the accepted offer
    await supabaseClient
      .from('creator_cancellation_responses')
      .insert({
        subscription_id: subscription_id,
        subscriber_id: userData.user.id,
        creator_id: subscription.creator_id,
        responses: {},
        offer_shown_id: offer_id,
        offer_accepted: true,
        cancelled: false,
      });

    logStep("Offer acceptance recorded");

    // Calculate next billing date
    const discountMonths = offer.discount_months || 1;
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + discountMonths);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Retention offer applied successfully",
        offer_title: offer.title,
        discount_percent: offer.discount_percent,
        discount_months: offer.discount_months,
        next_billing_date: nextBillingDate.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep("Error occurred", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
