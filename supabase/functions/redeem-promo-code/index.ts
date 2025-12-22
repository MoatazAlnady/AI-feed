import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[REDEEM-PROMO] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting promo code redemption');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user from the token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      logStep('User authentication failed', { error: userError?.message });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('User authenticated', { userId: user.id });

    // Get the promo code from the request body
    const { code } = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Promo code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    logStep('Validating promo code', { code: normalizedCode });

    // Find the promo code
    const { data: promoCode, error: promoError } = await supabaseClient
      .from('promo_codes')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (promoError || !promoCode) {
      logStep('Promo code not found', { error: promoError?.message });
      return new Response(
        JSON.stringify({ error: 'Invalid promo code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if promo code is active
    if (!promoCode.is_active) {
      logStep('Promo code is inactive');
      return new Response(
        JSON.stringify({ error: 'This promo code is no longer active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if promo code is within valid date range
    const now = new Date();
    if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
      logStep('Promo code not yet valid');
      return new Response(
        JSON.stringify({ error: 'This promo code is not yet valid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
      logStep('Promo code expired');
      return new Response(
        JSON.stringify({ error: 'This promo code has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if max uses reached
    if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
      logStep('Promo code max uses reached');
      return new Response(
        JSON.stringify({ error: 'This promo code has reached its maximum uses' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has already redeemed this code
    const { data: existingRedemption } = await supabaseClient
      .from('promo_code_redemptions')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', user.id)
      .single();

    if (existingRedemption) {
      logStep('User already redeemed this code');
      return new Response(
        JSON.stringify({ error: 'You have already redeemed this promo code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate premium expiry date based on discount type and value
    let premiumUntil: Date;
    const currentDate = new Date();
    
    if (promoCode.discount_type === 'free_year' || promoCode.discount_type === 'free_months') {
      const monthsToAdd = promoCode.discount_value || 12;
      premiumUntil = new Date(currentDate);
      premiumUntil.setMonth(premiumUntil.getMonth() + monthsToAdd);
    } else {
      // Default to 1 year
      premiumUntil = new Date(currentDate);
      premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
    }

    logStep('Calculated premium expiry', { premiumUntil: premiumUntil.toISOString() });

    // Create redemption record
    const { error: redemptionError } = await supabaseClient
      .from('promo_code_redemptions')
      .insert({
        promo_code_id: promoCode.id,
        user_id: user.id,
        premium_granted_until: premiumUntil.toISOString()
      });

    if (redemptionError) {
      logStep('Error creating redemption', { error: redemptionError.message });
      return new Response(
        JSON.stringify({ error: 'Failed to redeem promo code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user's premium status
    const { error: updateUserError } = await supabaseClient
      .from('user_profiles')
      .update({
        is_premium: true,
        premium_until: premiumUntil.toISOString()
      })
      .eq('id', user.id);

    if (updateUserError) {
      logStep('Error updating user premium status', { error: updateUserError.message });
      return new Response(
        JSON.stringify({ error: 'Failed to update premium status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment the current_uses counter on the promo code
    const { error: incrementError } = await supabaseClient
      .from('promo_codes')
      .update({ current_uses: promoCode.current_uses + 1 })
      .eq('id', promoCode.id);

    if (incrementError) {
      logStep('Error incrementing promo code uses', { error: incrementError.message });
      // Non-critical error, continue
    }

    logStep('Promo code redeemed successfully', { 
      userId: user.id, 
      code: normalizedCode,
      premiumUntil: premiumUntil.toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Promo code redeemed successfully!',
        premium_until: premiumUntil.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep('Unexpected error', { error: error.message });
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
