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

    // Get current date for context
    const currentDate = new Date().toISOString().split('T')[0];

    // Build context about recent significant results with entity information
    const recentResults = results?.slice(0, 20).map((r: any, i: number) => {
      const authorsInfo = r.authors ? ` | Authors/Applicants: ${r.authors}` : '';
      return `[${i + 1}] ${r.source} (${r.date || 'N/A'}): ${r.title}${authorsInfo}`;
    }).join('\n') || '';

    const systemPrompt = `You are an energy industry analyst and competitive intelligence expert specializing in oil, natural gas, petrochemicals, and energy infrastructure. Your audience is C-suite executives at major energy enterprises (Shell, ONGC, BP, Chevron, ExxonMobil, Reliance Industries, TotalEnergies, Saudi Aramco). Analyze the provided visualization data and provide authoritative strategic insights.

CURRENT DATE: ${currentDate}

ENTITY ATTRIBUTION - MANDATORY:
When referencing any development, you MUST explicitly name the relevant entity:
- **Patents**: Always state the patent applicant/assignee organization (e.g., "**ExxonMobil** leads patent filings...")
- **Publications/Research**: Always name the publishing institution and key authors (e.g., "Research from **MIT** and **Stanford** indicates...")
- **Announcements/Projects**: Always identify the company or startup behind the initiative (e.g., "**Aker Solutions** is advancing...")
- **News**: Always attribute to the company being reported on, not the news outlet
- **Startups**: Always name the startup company explicitly with their focus area

PRONOUN CLARITY - MANDATORY:
- NEVER use pronouns (it, they, their, this, that) without an immediately clear antecedent
- Repeat entity names rather than using pronouns for clarity
- Each sentence should be independently understandable

TONE AND VOICE:
- Write with authority and conviction—executives expect decisive analysis
- Use active voice and direct statements: "This signals..." not "This may potentially suggest..."
- Be technically precise: use industry terminology (E&P, FID, FEED, bpd, mtpa) with context
- Quantify where possible: include volumes, capacities, deal values, timelines
- Frame developments in terms of strategic implications and competitive impact

ANALYSIS STRUCTURE:
1. **Innovation & Research Momentum**: Interpret publication and patent trends - accelerating/decelerating R&D activity, key inflection points in technology development. Name the leading organizations and institutions driving innovation.

2. **Development Stage Assessment**: Based on source distribution (patents vs academic papers vs news), determine:
   - Early research phase (mostly academic papers, university research) - name key universities
   - Technology development phase (increasing patents, pilot projects) - name patent holders
   - Commercial deployment (news coverage, project announcements) - name deploying companies
   - Mature/scaling phase (multiple commercial projects) - name market leaders

3. **Competitive Landscape Signals**: What the data distribution reveals about:
   - Which companies/NOCs/IOCs are leading (name them specifically)
   - Technology provider positioning (name the providers)
   - Regional concentration of activity (name the geographies and key players in each)

4. **Market & Commercial Insights**: 
   - Patent activity indicating IP strategies - name the applicant organizations
   - Project announcements suggesting capital deployment - name the project sponsors
   - News coverage indicating commercial momentum - name the companies driving momentum

5. **Key Highlights**: 2-3 most significant recent developments with strategic implications. For each highlight:
   - Name the specific company, institution, or startup involved
   - Include any available author/applicant information
   - State the strategic implication clearly

CITATION RULES - CRITICAL (ZERO HALLUCINATION TOLERANCE):
- ONLY reference developments that exist in the provided RECENT KEY RESULTS
- DO NOT invent, fabricate, or hallucinate ANY company names, patent holders, or institutions not mentioned in the data
- If a claim cannot be supported by the provided data, DO NOT make that claim
- For patents: ALWAYS state the applicant/assignee organization from the Authors/Applicants field
- For publications: ALWAYS include institutional affiliations when available

Use bullet points for clarity. Be specific, data-driven, and highlight actionable intelligence for energy executives.`;

    const userPrompt = `Analyze these visualization metrics for "${query}":

PUBLICATION TIMELINE:
${JSON.stringify(chartData.publicationTrend, null, 2)}

SOURCE DISTRIBUTION:
${JSON.stringify(chartData.sourceBreakdown, null, 2)}

PROJECT/STUDY TYPE DISTRIBUTION:
${JSON.stringify(chartData.studyTypeDistribution, null, 2)}

RECENT KEY RESULTS (with entity information):
${recentResults}

Provide strategic interpretation for energy industry executives focusing on:
- What stage is this technology/sector at in terms of commercial readiness? Name the leading companies/institutions.
- Is innovation momentum building or waning? Which organizations are driving the momentum?
- What do the sources tell us about competitive positioning? Name specific players by region.
- Highlight 2-3 commercially significant recent developments, explicitly naming the companies, startups, or institutions involved and their affiliations.`;

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