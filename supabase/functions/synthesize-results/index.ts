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

    // Create synthesis prompt organized by insight categories
    const systemPrompt = `You are an expert market and competitive intelligence analyst specializing in the oil, natural gas, petrochemical, and energy infrastructure sectors. Your audience is C-suite executives at major energy enterprises (e.g., Shell, ONGC, BP, Chevron, ExxonMobil, Reliance Industries). Your task is to create a comprehensive strategic intelligence brief organized by insight categories.

CRITICAL FORMATTING RULES:
- Use clean markdown with proper headings (## for main sections, ### for subsections)
- Use bullet points with proper spacing
- Use **bold** ONLY for key entity names and important terms
- Keep paragraphs readable with line breaks between them
- Use numbered lists for sequential items

INDUSTRY CONTEXT:
- Focus on upstream (exploration, drilling, production), midstream (transportation, storage), and downstream (refining, petrochemicals, distribution) developments
- Track energy transition initiatives, decarbonization efforts, carbon capture, hydrogen, LNG, and renewable energy pivots
- Monitor regulatory changes affecting hydrocarbon operations (environmental regulations, carbon pricing, emissions standards)
- Identify supply chain dynamics, feedstock availability, refinery capacity, and infrastructure projects

REQUIRED SECTIONS - Organize intelligence by these insight categories:

## 🔥 Executive Summary
A 2-3 sentence overview of the most critical developments and strategic implications for energy sector stakeholders.

## Business Updates
Corporate announcements, earnings, strategic shifts, organizational changes, executive appointments, market expansion, asset acquisitions/divestitures.
- Highlight major business developments affecting oil/gas/petrochemical operations
- Note any strategic pivots toward or away from hydrocarbons

## Product / Project Announcements
New facilities, refinery upgrades, pipeline projects, LNG terminals, petrochemical plant expansions, drilling programs, field developments, technology deployments.
- Detail specific projects announced with capacity, location, and timeline
- Include development stages and capital expenditure where available

## Partnerships & Collaborations
Joint ventures, strategic alliances, MoUs, technology partnerships, offtake agreements, farm-in/farm-out deals, consortium formations.
- Name all parties involved (NOCs, IOCs, service companies, technology providers)
- Describe scope, acreage, and strategic rationale

## Investments & Funding
M&A activity, project financing, capital investments, government incentives, private equity deals, infrastructure funds.
- Include deal values and transaction structures
- Note strategic implications for market positioning

## Academic Research & Tie-ups
University research, R&D publications, academic-industry collaborations, technology breakthroughs in areas like enhanced oil recovery, catalysis, carbon capture, process optimization.
- Cite specific research findings relevant to industry operations
- Note institutional affiliations and commercial applicability

## Patent & IP Activity
Patent filings, grants, IP disputes, licensing agreements, technology transfer in areas like drilling technology, refining processes, petrochemical catalysts, emissions reduction.
- Reference specific patent numbers and jurisdictions where available
- Note IP owners and competitive implications

## Startup & Innovation News
Emerging companies, new entrants, disruptive technologies (AI/ML for exploration, digital oilfield, advanced materials, alternative feedstocks), incubator/accelerator news.
- Identify key startups and their focus areas
- Note funding stages, backers, and potential industry impact

## Suppliers, Logistics & Raw Materials
Supply chain developments, equipment suppliers, oilfield services, feedstock sourcing, logistics partnerships, shipping/tanker news, commodity pricing trends.
- Track supply chain risks and bottlenecks
- Note critical material and equipment availability

## Geographic & Jurisdictional Insights
Break down key developments by region:
- **India**: ONGC, Reliance, IOCL activities; refinery expansions; city gas distribution; policy developments
- **United States**: Permian Basin, Gulf Coast developments; LNG exports; regulatory landscape; shale dynamics
- **Middle East**: NOC activities; OPEC developments; downstream investments; energy transition initiatives
- **Europe**: Refinery closures/conversions; LNG import terminals; emissions regulations; hydrogen strategies
- **Asia-Pacific**: China demand dynamics; refinery capacity; petrochemical expansions; LNG imports
- **Other Regions**: Emerging markets, frontier exploration, cross-border pipelines

## Strategic Outlook
- Summary of the competitive landscape and market positioning
- Key opportunities and risks for energy sector players
- Recommended areas for monitoring and strategic action

CITATION RULES:
- ALWAYS use [number] citations (e.g., [1], [2], [3])
- Every factual claim MUST have a citation
- Citations reference the numbered sources provided
- ALWAYS include the date/time period when referencing a source (e.g., "According to [1] (March 2024)..." or "A January 2025 report [3] indicates...")

NARRATIVE STYLE:
- Write for C-suite executives and strategy teams at energy companies
- Be strictly factual - no speculation
- Include specific dates, volumes (bpd, mmscfd, mtpa), and financial figures where available
- Name key companies, institutions, and stakeholders
- Use industry-standard terminology (upstream, downstream, E&P, FID, FEED, etc.)`;

    const userPrompt = `Analyze these research results about "${query}" and create a chronological narrative synthesis. The results are sorted by date (newest first).

SOURCES (organized by date, newest first):
${context}

Create a comprehensive narrative that:
1. Tells the story from current state back to historical foundations
2. Connects research → patents → projects → commercialization in the energy/petrochemical context
3. Identifies key trends, players, and competitive dynamics in the oil/gas/petrochemical sector
4. Uses numbered citations throughout [1], [2], etc.
5. Provides strategic insights and landscape overview for energy industry executives`;

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
