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
    const { query, maxResults } = await req.json();

    const EPO_CONSUMER_KEY = Deno.env.get('EPO_OPS_CONSUMER_KEY');
    const EPO_CONSUMER_SECRET = Deno.env.get('EPO_OPS_CONSUMER_SECRET');

    if (!EPO_CONSUMER_KEY || !EPO_CONSUMER_SECRET) {
      console.error('EPO credentials not configured');
      return new Response(
        JSON.stringify({ error: 'EPO API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching EPO for: ${query}, max results: ${maxResults}`);

    // Get OAuth token from EPO
    const tokenResponse = await fetch('https://ops.epo.org/3.2/auth/accesstoken', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${EPO_CONSUMER_KEY}:${EPO_CONSUMER_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('EPO token error:', tokenResponse.status, errorText);
      throw new Error(`Failed to authenticate with EPO: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Search patents using OPS API
    const searchUrl = `https://ops.epo.org/3.2/rest-services/published-data/search?q=${encodeURIComponent(query)}&Range=1-${maxResults}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('EPO search error:', searchResponse.status, errorText);
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await searchResponse.json();
    console.log('EPO API Response structure:', JSON.stringify(data).substring(0, 500));
    
    // Parse EPO response format
    const results = [];
    const worldPatentData = data['ops:world-patent-data'];
    const biblioSearch = worldPatentData?.['ops:biblio-search'];
    const searchResult = biblioSearch?.['ops:search-result'];
    
    console.log('Search result available:', !!searchResult);
    
    if (!searchResult) {
      console.log('No search results in response');
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // EPO returns publication-reference array
    let publications = searchResult['ops:publication-reference'];
    
    if (!publications || publications.length === 0) {
      console.log('No publications found in search result');
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing ${publications.length} patent publications`);
    
    for (const pub of publications.slice(0, maxResults)) {
      try {
        const docId = pub['document-id'];
        
        const docNumber = docId?.['doc-number']?.['$'] || docId?.['doc-number'] || 'N/A';
        const country = docId?.['country']?.['$'] || docId?.['country'] || '';
        const kind = docId?.['kind']?.['$'] || docId?.['kind'] || '';
        const date = docId?.['date']?.['$'] || docId?.['date'] || '';

        // For basic search results, we only get minimal data
        // We'll need to fetch full details for each patent if needed
        const patentId = `${country}${docNumber}${kind}`;
        
        results.push({
          source: 'Patents',
          id: patentId,
          title: `Patent ${patentId}`,
          abstract: '',
          authors: 'View patent for details',
          date: date ? `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}` : 'N/A',
          url: `https://worldwide.espacenet.com/patent/search/family/publication/?q=${docNumber}`
        });
      } catch (docError) {
        console.error('Error processing patent publication:', docError);
        continue;
      }
    }

    console.log(`Found ${results.length} patent results`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-patents:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, results: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
