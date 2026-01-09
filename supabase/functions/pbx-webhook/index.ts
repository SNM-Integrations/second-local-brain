import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://pccvvqmrwbcdjgkyteqn.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { event, phone } = body;

    console.log('PBX webhook received:', { event, phone });

    // Validate required fields
    if (!event || !phone) {
      return new Response(JSON.stringify({ error: 'Missing required fields: event and phone' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate event type
    const validEvents = ['ringing', 'answered', 'hangup'];
    if (!validEvents.includes(event)) {
      return new Response(JSON.stringify({ error: `Invalid event. Must be one of: ${validEvents.join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize phone number for matching (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Find lead by phone number (try multiple formats)
    const { data: leads, error: findError } = await supabase
      .from('contacts')
      .select('id, name, phone, call_started_at, contact_type')
      .eq('contact_type', 'lead')
      .or(`phone.eq.${phone},phone.eq.${normalizedPhone},phone.ilike.%${normalizedPhone.slice(-9)}%`)
      .limit(1);

    if (findError) {
      console.error('Error finding lead:', findError);
      throw findError;
    }

    if (!leads || leads.length === 0) {
      console.log('No lead found for phone:', phone);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No lead found with this phone number',
        phone 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lead = leads[0];
    console.log('Found lead:', lead.name, lead.id);

    // Build update based on event type
    let updateData: Record<string, any> = {};
    
    switch (event) {
      case 'ringing':
        updateData = {
          call_status: 'ringing',
          call_started_at: null, // Reset until answered
        };
        break;
        
      case 'answered':
        updateData = {
          call_status: 'in_call',
          call_started_at: new Date().toISOString(),
        };
        break;
        
      case 'hangup':
        // Calculate duration if we have a start time
        let duration = null;
        if (lead.call_started_at) {
          const startTime = new Date(lead.call_started_at).getTime();
          const endTime = Date.now();
          duration = Math.round((endTime - startTime) / 1000); // seconds
        }
        
        updateData = {
          call_status: 'call_done',
          last_call_duration: duration,
          last_call_at: new Date().toISOString(),
        };
        break;
    }

    // Update the lead
    const { error: updateError } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', lead.id);

    if (updateError) {
      console.error('Error updating lead:', updateError);
      throw updateError;
    }

    console.log('Lead updated successfully:', lead.id, updateData);

    return new Response(JSON.stringify({
      success: true,
      lead_id: lead.id,
      lead_name: lead.name,
      event,
      ...updateData,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('PBX webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
