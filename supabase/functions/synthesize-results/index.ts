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

    // Sort results by date (newest first) and group by source
    const sortedResults = [...results].sort((a, b) => {
      const dateA = new Date(a.date || '1900').getTime();
      const dateB = new Date(b.date || '1900').getTime();
      return dateB - dateA;
    });

    // Prepare context from results with dates for chronological narrative
    const context = sortedResults.slice(0, 50).map((result: any, idx: number) => {
      const dateInfo = result.date ? `(${result.date})` : '';
      return `[${idx + 1}] ${result.source} ${dateInfo} - ${result.id}: ${result.title}\n${result.abstract || result.status || 'No abstract'}`;
    }).join('\n\n');

    // Create synthesis prompt for chronological narrative
    const systemPrompt = `You are an expert biomedical research and competitive intelligence analyst. Your task is to create a comprehensive narrative that tells the STORY of developments from recent to historical, weaving together research, patents, clinical trials, and industry news.

CRITICAL FORMATTING RULES:
- Use clean markdown with proper headings (## for main sections, ### for subsections)
- Use bullet points with proper spacing
- Do NOT use ** for bold within sentences - use it only for emphasis on key terms
- Keep paragraphs readable with line breaks between them
- Use numbered lists for sequential items

REQUIRED SECTIONS (in this order):

## 🔥 Latest Commercial & Market Highlights
- Most significant recent developments with COMMERCIAL implications
- Breaking news on licensing deals, partnerships, acquisitions
- Recent regulatory decisions, approvals, or setbacks
- Court rulings, IP disputes, patent challenges

## Key Entities & Market Players
List the main companies, institutions, and organizations involved:
- **Company/Institution Name**: Brief description of their role, headquarters location, and current activities
- Group by type: Pharmaceutical companies, Biotech startups, Research institutions, Regulatory bodies

## Geographic & Jurisdictional Insights
Break down developments by region:
- **United States**: FDA activities, US-based trials, American companies
- **Europe**: EMA decisions, European patents, EU market access
- **Asia-Pacific**: China, Japan, India regulatory landscape, regional players
- **Other Regions**: Emerging markets, global partnerships

## Current Landscape (Most Recent)
- Latest industry news and market developments
- Recent patent filings and their implications
- Current clinical trial status and results

## Development Timeline & Stage Analysis
For each major player, indicate their current stage:
- Research/Discovery → Preclinical → Phase I → Phase II → Phase III → Regulatory Review → Approved → Commercialized
- Note partnerships and licensing deals at each stage

## Historical Foundation
- Foundational research that enabled current work
- Early patents and original inventors
- Evolution of the science over time

## Competitive & Commercial Intelligence
- Key players and their market positions
- IP landscape and freedom to operate considerations
- Licensing opportunities and partnership dynamics
- Competitive rivalries and strategic moves

## Strategic Overview
- Summary of the landscape
- Opportunities and gaps identified
- Risk factors and challenges

CITATION RULES:
- ALWAYS use [number] citations (e.g., [1], [2], [3])
- Every factual claim MUST have a citation

NARRATIVE STYLE:
- Write as a cohesive story connecting developments
- Be strictly factual - no speculation
- Include specific dates where available
- Name key companies, institutions, and researchers`;

    const userPrompt = `Analyze these research results about "${query}" and create a chronological narrative synthesis. The results are sorted by date (newest first).

SOURCES (organized by date, newest first):
${context}

Create a comprehensive narrative that:
1. Tells the story from current state back to historical foundations
2. Connects research → patents → trials → commercialization
3. Identifies key trends, players, and competitive dynamics
4. Uses numbered citations throughout [1], [2], etc.
5. Provides strategic insights and landscape overview`;

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
        max_tokens: 3000
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
