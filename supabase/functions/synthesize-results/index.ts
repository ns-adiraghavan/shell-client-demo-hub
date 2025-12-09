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
    const systemPrompt = `You are an expert market and competitive intelligence analyst for energy and infrastructure enterprises. Your task is to create a comprehensive strategic intelligence brief organized by insight categories.

CRITICAL FORMATTING RULES:
- Use clean markdown with proper headings (## for main sections, ### for subsections)
- Use bullet points with proper spacing
- Use **bold** ONLY for key entity names and important terms
- Keep paragraphs readable with line breaks between them
- Use numbered lists for sequential items

REQUIRED SECTIONS - Organize intelligence by these insight categories:

## 🔥 Executive Summary
A 2-3 sentence overview of the most critical developments and strategic implications.

## Business Updates
General corporate announcements, earnings, strategic shifts, organizational changes, executive appointments, market expansion news.
- Highlight major business developments
- Note any strategic pivots or organizational changes

## Product / Project Announcements
New product launches, project milestones, technology demonstrations, infrastructure developments, facility openings.
- Detail specific products or projects announced
- Include development stages and timelines

## Partnerships & Collaborations
Joint ventures, strategic alliances, MoUs, research collaborations, technology partnerships, supply agreements.
- Name all parties involved
- Describe scope and strategic rationale

## Investments & Funding
M&A activity, funding rounds, capital investments, project financing, government grants, venture capital deals.
- Include deal values where available
- Note investors and strategic implications

## Academic Research & Tie-ups
University research, R&D publications, academic-industry collaborations, scientific breakthroughs, conference presentations.
- Cite specific research findings
- Note institutional affiliations

## Patent & IP Activity
Patent filings, grants, IP disputes, licensing agreements, technology transfer, freedom-to-operate developments.
- Reference specific patent numbers where available
- Note jurisdictions and IP owners

## Startup & Innovation News
Emerging companies, new entrants, disruptive technologies, incubator/accelerator news, innovation ecosystem developments.
- Identify key startups and their focus areas
- Note funding stages and backers

## Suppliers, Logistics & Raw Materials
Supply chain developments, material sourcing, logistics partnerships, commodity news, manufacturing capacity updates.
- Track supply chain risks and opportunities
- Note critical material developments

## Geographic & Jurisdictional Insights
Break down key developments by region:
- **India**: Regulatory actions, local players, policy developments
- **United States**: Federal/state activities, major projects, regulatory landscape
- **Europe**: EU regulations, regional developments, cross-border initiatives
- **Asia-Pacific**: Regional trends, emerging markets, key players
- **Other Regions**: Global developments, emerging markets

## Strategic Outlook
- Summary of the competitive landscape
- Key opportunities and risks identified
- Recommended areas for monitoring

CITATION RULES:
- ALWAYS use [number] citations (e.g., [1], [2], [3])
- Every factual claim MUST have a citation
- Citations reference the numbered sources provided

NARRATIVE STYLE:
- Write for C-suite executives and strategy teams
- Be strictly factual - no speculation
- Include specific dates and numbers where available
- Name key companies, institutions, and stakeholders`;

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
