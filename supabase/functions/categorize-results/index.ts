import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INSIGHT_CATEGORIES = [
  "Business Updates",
  "Product / Project Announcements",
  "Partnerships & Collaborations",
  "Investments & Funding",
  "Academic Research & Tie-ups",
  "Patent & IP Activity",
  "Startup & Innovation News",
  "Suppliers, Logistics & Raw Materials"
] as const;

type InsightCategory = typeof INSIGHT_CATEGORIES[number];

interface SearchResult {
  source: string;
  id: string;
  title: string;
  abstract?: string;
  authors?: string;
  date?: string;
  url: string;
}

function categorizeResult(result: SearchResult): InsightCategory {
  const text = `${result.title} ${result.abstract || ''}`.toLowerCase();
  
  // Patent & IP Activity
  if (result.source === 'EPO' || result.source === 'Patents' || 
      text.includes('patent') || text.includes('intellectual property') || 
      text.includes('ip rights') || text.includes('licensing agreement') ||
      text.includes('patent filed') || text.includes('patent granted')) {
    return "Patent & IP Activity";
  }
  
  // Academic Research & Tie-ups
  if (result.source === 'IEEE' || result.source === 'GoogleScholar' ||
      text.includes('research') || text.includes('study') || 
      text.includes('university') || text.includes('journal') ||
      text.includes('scientific') || text.includes('published') ||
      text.includes('academic') || text.includes('conference paper')) {
    return "Academic Research & Tie-ups";
  }
  
  // Partnerships & Collaborations
  if (text.includes('partnership') || text.includes('collaboration') ||
      text.includes('joint venture') || text.includes('mou') ||
      text.includes('memorandum of understanding') || text.includes('alliance') ||
      text.includes('strategic partnership') || text.includes('teaming up') ||
      text.includes('partners with') || text.includes('collaborates')) {
    return "Partnerships & Collaborations";
  }
  
  // Investments & Funding
  if (text.includes('investment') || text.includes('funding') ||
      text.includes('acquisition') || text.includes('merger') ||
      text.includes('raised') || text.includes('series a') || 
      text.includes('series b') || text.includes('ipo') ||
      text.includes('private equity') || text.includes('venture capital') ||
      text.includes('m&a') || text.includes('buys') || text.includes('acquires')) {
    return "Investments & Funding";
  }
  
  // Startup & Innovation News
  if (text.includes('startup') || text.includes('start-up') ||
      text.includes('incubator') || text.includes('accelerator') ||
      text.includes('disruptive') || text.includes('emerging company') ||
      text.includes('new entrant') || text.includes('innovation hub') ||
      text.includes('tech startup') || text.includes('founder')) {
    return "Startup & Innovation News";
  }
  
  // Product / Project Announcements
  if (text.includes('launch') || text.includes('announces') ||
      text.includes('new product') || text.includes('project') ||
      text.includes('milestone') || text.includes('facility') ||
      text.includes('plant') || text.includes('opens') ||
      text.includes('unveils') || text.includes('introduces') ||
      text.includes('commissioned') || text.includes('inaugurated')) {
    return "Product / Project Announcements";
  }
  
  // Suppliers, Logistics & Raw Materials
  if (text.includes('supply chain') || text.includes('supplier') ||
      text.includes('logistics') || text.includes('raw material') ||
      text.includes('commodity') || text.includes('procurement') ||
      text.includes('manufacturing') || text.includes('distribution') ||
      text.includes('shipment') || text.includes('inventory') ||
      text.includes('sourcing') || text.includes('materials')) {
    return "Suppliers, Logistics & Raw Materials";
  }
  
  // Default to Business Updates
  return "Business Updates";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { results } = await req.json();
    
    if (!results || !Array.isArray(results)) {
      return new Response(
        JSON.stringify({ error: 'Results array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Categorizing ${results.length} results`);

    const categorizedResults = results.map((result: SearchResult) => ({
      ...result,
      insightCategory: categorizeResult(result)
    }));

    console.log('Categorization completed successfully');

    return new Response(
      JSON.stringify({ results: categorizedResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in categorize-results:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
