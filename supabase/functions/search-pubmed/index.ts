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

    console.log(`Searching PubMed for: ${query}, max results: ${maxResults}`);

    // Step 1: Search for article IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (PharmaAI Research Dashboard)'
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`PubMed search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const ids = searchData.esearchresult?.idlist || [];

    if (ids.length === 0) {
      return new Response(
        JSON.stringify({ results: [], count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Fetch article summaries
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    
    const summaryResponse = await fetch(summaryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (PharmaAI Research Dashboard)'
      }
    });

    if (!summaryResponse.ok) {
      throw new Error(`PubMed summary fetch failed: ${summaryResponse.status}`);
    }

    const summaryData = await summaryResponse.json();
    const result = summaryData.result;

    const articles = ids.map((id: string) => {
      const article = result[id];
      if (!article) return null;

      return {
        source: 'PubMed',
        id: id,
        title: article.title || 'No title',
        abstract: article.sorttitle || article.title || 'No abstract available',
        authors: article.authors?.map((a: any) => a.name).join(', ') || 'Unknown',
        date: article.pubdate || 'Unknown',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      };
    }).filter(Boolean);

    console.log(`Found ${articles.length} PubMed articles`);

    return new Response(
      JSON.stringify({ results: articles, count: articles.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-pubmed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
