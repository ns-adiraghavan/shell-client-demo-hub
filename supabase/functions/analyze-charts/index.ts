import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, chartData, results } = await req.json();
    
    if (!chartData) {
      return new Response(
        JSON.stringify({ error: 'Chart data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Analyzing charts for query: ${query}`);

    // Build context about recent significant results
    const recentResults = results?.slice(0, 20).map((r: any, i: number) => 
      `[${i + 1}] ${r.source} (${r.date || 'N/A'}): ${r.title}`
    ).join('\n') || '';

    const systemPrompt = `You are a pharmaceutical industry analyst and competitive intelligence expert. Analyze the provided visualization data and provide strategic insights.

ANALYSIS STRUCTURE:
1. **Research Momentum Analysis**: Interpret publication trends - accelerating/decelerating research activity, key inflection points
2. **Development Stage Assessment**: Based on source distribution (patents vs trials vs papers), determine:
   - Early research phase (mostly papers/preprints)
   - Pre-clinical/IP building phase (increasing patents)
   - Clinical development (trial activity)
   - Commercialization stage (news, regulatory filings)
3. **Competitive Landscape Signals**: What the data distribution reveals about competition
4. **Market & Commercial Insights**: 
   - Patent activity indicating IP strategies
   - Trial phases suggesting timeline to market
   - News coverage indicating commercial momentum
5. **Key Highlights**: 2-3 most significant recent developments with commercial implications

Be specific, data-driven, and highlight actionable intelligence. Use bullet points for clarity.`;

    const userPrompt = `Analyze these visualization metrics for "${query}":

PUBLICATION TIMELINE:
${JSON.stringify(chartData.publicationTrend, null, 2)}

SOURCE DISTRIBUTION:
${JSON.stringify(chartData.sourceBreakdown, null, 2)}

CLINICAL TRIAL PHASES:
${JSON.stringify(chartData.studyTypeDistribution, null, 2)}

RECENT KEY RESULTS:
${recentResults}

Provide strategic interpretation focusing on:
- What stage is this therapeutic/technology at?
- Is momentum building or waning?
- What do the sources tell us about competitive positioning?
- Highlight 2-3 commercially significant recent developments`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content || 'Unable to generate analysis';

    console.log('Chart analysis completed');

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-charts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
