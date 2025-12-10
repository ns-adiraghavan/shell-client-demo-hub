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

    const systemPrompt = `You are an energy industry analyst and competitive intelligence expert specializing in oil, natural gas, petrochemicals, and energy infrastructure. Your audience is C-suite executives at major energy enterprises. Analyze the provided visualization data and provide strategic insights.

ANALYSIS STRUCTURE:
1. **Innovation & Research Momentum**: Interpret publication and patent trends - accelerating/decelerating R&D activity, key inflection points in technology development
2. **Development Stage Assessment**: Based on source distribution (patents vs academic papers vs news), determine:
   - Early research phase (mostly academic papers, university research)
   - Technology development phase (increasing patents, pilot projects)
   - Commercial deployment (news coverage, project announcements, partnerships)
   - Mature/scaling phase (multiple commercial projects, industry-wide adoption)
3. **Competitive Landscape Signals**: What the data distribution reveals about:
   - Which companies/NOCs/IOCs are leading
   - Technology provider positioning
   - Regional concentration of activity
4. **Market & Commercial Insights**: 
   - Patent activity indicating IP strategies and technology leadership
   - Project announcements suggesting capital deployment priorities
   - News coverage indicating commercial momentum and market interest
5. **Key Highlights**: 2-3 most significant recent developments with strategic implications for energy sector players

Be specific, data-driven, and highlight actionable intelligence for energy executives. Use bullet points for clarity.`;

    const userPrompt = `Analyze these visualization metrics for "${query}":

PUBLICATION TIMELINE:
${JSON.stringify(chartData.publicationTrend, null, 2)}

SOURCE DISTRIBUTION:
${JSON.stringify(chartData.sourceBreakdown, null, 2)}

PROJECT/STUDY TYPE DISTRIBUTION:
${JSON.stringify(chartData.studyTypeDistribution, null, 2)}

RECENT KEY RESULTS:
${recentResults}

Provide strategic interpretation for energy industry executives focusing on:
- What stage is this technology/sector at in terms of commercial readiness?
- Is innovation momentum building or waning?
- What do the sources tell us about competitive positioning in the energy sector?
- Highlight 2-3 commercially significant recent developments for oil/gas/petrochemical stakeholders`;

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
