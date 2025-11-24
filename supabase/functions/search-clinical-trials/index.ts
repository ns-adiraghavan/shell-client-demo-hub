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
    const { query, maxResults = 20 } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching ClinicalTrials for: ${query}, max results: ${maxResults}`);

    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&pageSize=${maxResults}&format=json`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (PharmaAI Research Dashboard)'
      }
    });

    if (!response.ok) {
      throw new Error(`ClinicalTrials API failed: ${response.status}`);
    }

    const data = await response.json();
    const studies = data.studies || [];

    const results = studies.map((study: any) => {
      const protocol = study.protocolSection || {};
      const id = protocol.identificationModule?.nctId || 'Unknown';
      const title = protocol.identificationModule?.officialTitle || 
                   protocol.identificationModule?.briefTitle || 
                   'No title';
      const status = protocol.statusModule?.overallStatus || 'Unknown';
      const phase = protocol.designModule?.phases?.join(', ') || 'Not specified';
      const enrollment = protocol.designModule?.enrollmentInfo?.count || 'Unknown';

      return {
        source: 'ClinicalTrials',
        id: id,
        title: title,
        status: status,
        phase: phase,
        enrollment: `${enrollment} participants`,
        url: `https://clinicaltrials.gov/study/${id}`
      };
    });

    console.log(`Found ${results.length} clinical trials`);

    return new Response(
      JSON.stringify({ results, count: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-clinical-trials:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
