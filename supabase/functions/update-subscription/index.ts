import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs for different tiers and billing periods
const PRICE_IDS = {
  silver: {
    monthly: "price_1RX5CeRrxvqauhEOjR8SFMWm",
    yearly: "price_1RX5CeRrxvqauhEOr8tl0WrB",
  },
  gold: {
    monthly: "price_1RX5CeRrxvqauhEOhpuRSJwL",
    yearly: "price_1RX5CeRrxvqauhEOxFMHlJbh",
  },
};

// Helper to detect billing period from price ID
const YEARLY_PRICE_IDS = [PRICE_IDS.silver.yearly, PRICE_IDS.gold.yearly];
const SILVER_PRICE_IDS = [PRICE_IDS.silver.monthly, PRICE_IDS.silver.yearly];
const GOLD_PRICE_IDS = [PRICE_IDS.gold.monthly, PRICE_IDS.gold.yearly];

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[UPDATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { targetTier, preview = false } = await req.json();
    if (!targetTier || !["silver", "gold"].includes(targetTier)) {
      throw new Error("Invalid target tier. Must be 'silver' or 'gold'");
    }
    logStep("Request parsed", { targetTier, preview });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get current subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Also check for trialing subscriptions
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
      if (trialingSubscriptions.data.length === 0) {
        throw new Error("No active subscription found");
      }
      subscriptions.data = trialingSubscriptions.data;
    }

    const subscription = subscriptions.data[0];
    const currentPriceId = subscription.items.data[0].price.id;
    const subscriptionItemId = subscription.items.data[0].id;
    logStep("Found current subscription", { subscriptionId: subscription.id, currentPriceId });

    // Determine current tier
    const currentTier = SILVER_PRICE_IDS.includes(currentPriceId) ? "silver" : "gold";
    if (currentTier === targetTier) {
      throw new Error(`You are already on the ${targetTier} plan`);
    }
    logStep("Tier change detected", { currentTier, targetTier });

    // Determine billing period (keep the same)
    const isYearly = YEARLY_PRICE_IDS.includes(currentPriceId);
    const billingPeriod = isYearly ? "yearly" : "monthly";
    const newPriceId = PRICE_IDS[targetTier as "silver" | "gold"][billingPeriod];
    logStep("New price determined", { billingPeriod, newPriceId });

    const isUpgrade = targetTier === "gold";

    if (preview) {
      // Get proration preview without making changes
      try {
        const previewInvoice = await stripe.invoices.retrieveUpcoming({
          customer: customerId,
          subscription: subscription.id,
          subscription_items: [
            {
              id: subscriptionItemId,
              price: newPriceId,
            },
          ],
          subscription_proration_behavior: "always_invoice",
        });

        // Calculate proration details
        const prorationItems = previewInvoice.lines.data.filter(
          (line) => line.proration
        );

        let credit = 0;
        let charge = 0;

        prorationItems.forEach((item) => {
          if (item.amount < 0) {
            credit += Math.abs(item.amount);
          } else {
            charge += item.amount;
          }
        });

        const amountDue = previewInvoice.amount_due;

        logStep("Preview calculated", { credit, charge, amountDue, isUpgrade });

        return new Response(
          JSON.stringify({
            preview: true,
            success: true,
            isUpgrade,
            currentTier,
            targetTier,
            billingPeriod,
            credit: credit / 100, // Convert to dollars
            charge: charge / 100,
            amountDue: amountDue / 100,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } catch (previewError) {
        logStep("Preview error, using estimate", { error: String(previewError) });
        // If preview fails, provide an estimate
        const currentPrice = SILVER_PRICE_IDS.includes(currentPriceId)
          ? (isYearly ? 200 : 20)
          : (isYearly ? 300 : 30);
        const newPrice = targetTier === "silver"
          ? (isYearly ? 200 : 20)
          : (isYearly ? 300 : 30);

        return new Response(
          JSON.stringify({
            preview: true,
            success: true,
            isUpgrade,
            currentTier,
            targetTier,
            billingPeriod,
            credit: 0,
            charge: 0,
            amountDue: isUpgrade ? newPrice - currentPrice : 0,
            estimated: true,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    // Actually update the subscription
    const prorationBehavior = isUpgrade ? "always_invoice" : "create_prorations";
    
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: prorationBehavior,
    });

    logStep("Subscription updated successfully", {
      newSubscriptionId: updatedSubscription.id,
      newPriceId,
      prorationBehavior,
    });

    return new Response(
      JSON.stringify({
        success: true,
        isUpgrade,
        currentTier,
        targetTier,
        billingPeriod,
        message: isUpgrade
          ? "Successfully upgraded! Any payment difference has been charged."
          : "Successfully downgraded! Credit will be applied to your next invoice.",
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in update-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
