import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[chat-find-or-create-dm] Incoming request');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn('[chat-find-or-create-dm] Unauthorized access attempt', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { otherUserId } = await req.json();
    console.log('[chat-find-or-create-dm] Auth user:', user.id, 'otherUserId:', otherUserId);

    if (!otherUserId || typeof otherUserId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing otherUserId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1) Try to find existing conversation using participant_1/participant_2 columns
    let conversationId: string | null = null;
    try {
      const { data: existingDirect, error: existingDirectError } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_1_id.eq.${user.id},participant_2_id.eq.${otherUserId}),` +
          `and(participant_1_id.eq.${otherUserId},participant_2_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existingDirectError) {
        console.warn('[chat-find-or-create-dm] Select by participant_1/2 failed:', existingDirectError.message);
      }

      if (existingDirect?.id) {
        conversationId = existingDirect.id as string;
        console.log('[chat-find-or-create-dm] Found existing conversation by participant columns:', conversationId);
      }
    } catch (e) {
      console.warn('[chat-find-or-create-dm] Error while selecting by participant columns:', e);
    }

    // 2) If not found, create conversation using participant_1/2 columns
    if (!conversationId) {
      console.log('[chat-find-or-create-dm] No existing conversation found. Creating a new one...');
      const { data: created, error: insertError } = await supabase
        .from('conversations')
        .insert({ participant_1_id: user.id, participant_2_id: otherUserId })
        .select('id')
        .single();

      if (insertError) {
        console.error('[chat-find-or-create-dm] Insert into conversations failed:', insertError.message);
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      conversationId = created!.id as string;
      console.log('[chat-find-or-create-dm] Created new conversation:', conversationId);
    }

    // 3) Ensure conversation_participants rows exist for both users (used by UI lists)
    try {
      // Current user participant
      const { data: cp1 } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cp1) {
        const { error: addCp1Err } = await supabase
          .from('conversation_participants')
          .insert({ conversation_id: conversationId, user_id: user.id });
        if (addCp1Err) {
          console.warn('[chat-find-or-create-dm] Failed to add current user to participants (non-fatal):', addCp1Err.message);
        }
      }

      // Other user participant
      const { data: cp2 } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', otherUserId)
        .maybeSingle();

      if (!cp2) {
        const { error: addCp2Err } = await supabase
          .from('conversation_participants')
          .insert({ conversation_id: conversationId, user_id: otherUserId });
        if (addCp2Err) {
          console.warn('[chat-find-or-create-dm] Failed to add other user to participants (non-fatal):', addCp2Err.message);
        }
      }
    } catch (e) {
      console.warn('[chat-find-or-create-dm] Error ensuring conversation_participants (non-fatal):', e);
    }

    console.log('[chat-find-or-create-dm] Returning conversationId:', conversationId);
    return new Response(
      JSON.stringify({ conversationId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[chat-find-or-create-dm] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
