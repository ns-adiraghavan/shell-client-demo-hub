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

    console.log(`Searching IEEE Xplore for: ${query}, max results: ${maxResults}`);

    // IEEE Xplore API - using the open access endpoint
    // Note: For production, you'd want to use the official API with an API key
    const searchUrl = `https://ieeexploreapi.ieee.org/api/v1/search/articles?querytext=${encodeURIComponent(query)}&max_records=${maxResults}&start_record=1&sort_order=desc&sort_field=publication_date`;
    
    const apiKey = Deno.env.get('IEEE_API_KEY');
    
    let results: any[] = [];
    
    if (apiKey) {
      // Use official API if key is available
      try {
        const response = await fetch(searchUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': apiKey
          }
        });

        if (response.ok) {
          const data = await response.json();
          results = (data.articles || []).map((article: any) => ({
            source: 'IEEE',
            id: article.article_number || article.doi || `ieee-${Date.now()}-${Math.random()}`,
            title: article.title || 'No title',
            abstract: article.abstract || 'Abstract not available',
            authors: article.authors?.authors?.map((a: any) => a.full_name).join(', ') || 'Unknown',
            date: article.publication_date || article.publication_year || 'Unknown',
            url: article.html_url || `https://ieeexplore.ieee.org/document/${article.article_number}`
          }));
        }
      } catch (error) {
        console.error('IEEE API error:', error);
      }
    }
    
    // Fallback: Use CrossRef API to find IEEE publications
    if (results.length === 0) {
      console.log('Using CrossRef fallback for IEEE publications');
      
      const crossRefUrl = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&filter=member:263&rows=${maxResults}&sort=published&order=desc`;
      
      try {
        const response = await fetch(crossRefUrl, {
          headers: {
            'User-Agent': 'InnovationInsightsEngine/1.0 (mailto:research@example.com)'
          }
        });

        if (response.ok) {
          const data = await response.json();
          results = (data.message?.items || []).map((item: any) => ({
            source: 'IEEE',
            id: item.DOI || `ieee-${Date.now()}-${Math.random()}`,
            title: Array.isArray(item.title) ? item.title[0] : (item.title || 'No title'),
            abstract: item.abstract?.replace(/<[^>]*>/g, '') || 'Abstract not available',
            authors: item.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`).slice(0, 5).join(', ') || 'Unknown',
            date: item.published?.['date-parts']?.[0]?.join('-') || item.created?.['date-parts']?.[0]?.join('-') || 'Unknown',
            url: item.URL || `https://doi.org/${item.DOI}`
          }));
        }
      } catch (error) {
        console.error('CrossRef fallback error:', error);
      }
    }

    console.log(`Found ${results.length} IEEE publications`);

    return new Response(
      JSON.stringify({ results, count: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-ieee:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, results: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});