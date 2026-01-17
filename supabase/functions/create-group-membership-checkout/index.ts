import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-GROUP-MEMBERSHIP-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { groupId, groupName, membershipType, price, currency, frequency } = await req.json();
    logStep("Request body parsed", { groupId, membershipType, price, currency, frequency });

    if (!groupId || !price) {
      throw new Error("Missing required fields: groupId, price");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    const isSubscription = membershipType === 'subscription';
    const unitAmount = Math.round(price * 100);
    const currencyLower = (currency || 'usd').toLowerCase();

    const lineItem: any = {
      price_data: {
        currency: currencyLower,
        product_data: {
          name: `${groupName || 'Group'} Membership`,
          description: isSubscription 
            ? `${frequency === 'yearly' ? 'Annual' : 'Monthly'} membership`
            : 'One-time membership fee',
        },
        unit_amount: unitAmount,
      },
      quantity: 1,
    };

    if (isSubscription) {
      lineItem.price_data.recurring = {
        interval: frequency === 'yearly' ? 'year' : 'month'
      };
    }

    const origin = req.headers.get('origin') || 'https://lovable-platform-boost.lovable.app';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [lineItem],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${origin}/group/${groupId}?payment=success`,
      cancel_url: `${origin}/group/${groupId}?payment=canceled`,
      metadata: { 
        groupId, 
        userId: user.id, 
        membershipType,
        type: 'group_membership'
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
