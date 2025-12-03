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
    const { query, results } = await req.json();
    
    if (!query || !results || !Array.isArray(results)) {
      return new Response(
        JSON.stringify({ error: 'Query and results array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Synthesizing ${results.length} results for query: ${query}`);

    // Prepare context from results
    const context = results.slice(0, 50).map((result: any, idx: number) => {
      return `[${idx + 1}] ${result.source} (${result.id}): ${result.title}\n${result.abstract || result.status || ''}`;
    }).join('\n\n');

    // Create synthesis prompt
    const systemPrompt = `You are an expert biomedical research and industry intelligence synthesizer. Your task is to create a comprehensive, factual summary that bridges research findings with commercial and competitive landscape insights.

Guidelines:
- Write 4-7 concise paragraphs organized by theme
- Structure your synthesis to cover:
  1. Research Foundation: Key scientific findings from academic sources (PubMed, arXiv)
  2. Clinical Development: Status of clinical trials, phases, and outcomes
  3. IP Landscape: Patent activity and innovation trends
  4. Commercial Intelligence: Industry news, partnerships, licensing deals, market developments
  5. Competitive Analysis: Key players, market positioning, and strategic moves
- ALWAYS cite sources using [number] format (e.g., [1], [2], [3])
- Include multiple citations when discussing related findings
- Connect the dots between early research, patents, trials, and commercialization
- Highlight potential market opportunities or competitive threats
- Note regulatory developments (FDA, EMA) when mentioned in news
- Identify gaps between research progress and commercial development
- Keep strictly factual, no speculation
- Write in clear, professional language suitable for strategic decision-making
- Ensure every claim is backed by numbered citations`;

    const userPrompt = `Based on the following research results about "${query}", provide a comprehensive synthesis:

${context}

Create a well-structured synthesis that answers the research question and highlights key findings.`;

    // Call Lovable AI
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
        max_tokens: 2000
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
      throw new Error(`AI synthesis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const synthesis = aiData.choices?.[0]?.message?.content || 'Unable to generate synthesis';

    console.log('Synthesis completed successfully');

    return new Response(
      JSON.stringify({ synthesis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in synthesize-results:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
