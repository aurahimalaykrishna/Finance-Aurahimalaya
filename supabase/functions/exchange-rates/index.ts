import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { from, to, amount } = await req.json();

    if (!from || !to) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: from, to' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Converting ${amount || 1} ${from} to ${to}`);

    // Using exchangerate-api.com free tier (no API key required)
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Exchange rate API error:', errorText);
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }

    const data = await response.json();
    
    const rate = data.rates[to.toUpperCase()];
    
    if (!rate) {
      return new Response(
        JSON.stringify({ error: `Currency ${to} not found` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const convertedAmount = amount ? (amount * rate) : rate;

    console.log(`Rate: 1 ${from} = ${rate} ${to}, Converted: ${convertedAmount}`);

    return new Response(
      JSON.stringify({
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate,
        amount: amount || 1,
        convertedAmount,
        lastUpdated: data.date,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in exchange-rates function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
