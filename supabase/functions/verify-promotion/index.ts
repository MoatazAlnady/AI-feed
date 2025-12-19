import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PROMOTION] ${step}${detailsStr}`);
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
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { sessionId, promotionId } = await req.json();
    logStep("Received verification request", { sessionId, promotionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Retrieved session", { status: session.payment_status, paymentIntent: session.payment_intent });

    if (session.payment_status !== 'paid') {
      logStep("Payment not completed");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get the promotion
    const { data: promotion, error: fetchError } = await supabaseClient
      .from('promotions')
      .select('*')
      .eq('id', promotionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !promotion) {
      logStep("Promotion not found", { promotionId, error: fetchError });
      throw new Error("Promotion not found");
    }

    // Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + promotion.duration);

    // Update promotion to active
    const { error: updateError } = await supabaseClient
      .from('promotions')
      .update({
        status: 'active',
        stripe_payment_intent_id: session.payment_intent as string,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })
      .eq('id', promotionId);

    if (updateError) {
      logStep("Error updating promotion", updateError);
      throw new Error("Failed to activate promotion");
    }

    logStep("Promotion activated successfully", { promotionId, startDate, endDate });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Promotion activated successfully",
      promotion: {
        id: promotionId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-promotion", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
