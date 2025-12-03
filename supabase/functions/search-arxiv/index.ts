import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`arXiv API attempt ${attempt}/${maxRetries}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (PharmaAI Research Dashboard)'
        }
      });
      
      if (response.ok) {
        return response;
      }
      
      console.log(`arXiv API returned ${response.status} on attempt ${attempt}`);
      
      if (response.status === 503 && attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await sleep(1000 * attempt);
        continue;
      }
      
      return null;
    } catch (error) {
      console.error(`arXiv fetch error on attempt ${attempt}:`, error);
      if (attempt < maxRetries) {
        await sleep(1000 * attempt);
      }
    }
  }
  return null;
}

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

    console.log(`Searching arXiv for: ${query}, max results: ${maxResults}`);

    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}`;
    
    const response = await fetchWithRetry(url);

    if (!response) {
      console.log('arXiv API unavailable, returning empty results');
      return new Response(
        JSON.stringify({ results: [], count: 0, warning: 'arXiv API temporarily unavailable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const xmlText = await response.text();
    
    // Parse XML to extract entries
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const entries = [...xmlText.matchAll(entryRegex)];

    const results = entries.map((match) => {
      const entry = match[1];
      
      const getTag = (tag: string) => {
        const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const match = entry.match(regex);
        return match ? match[1].trim() : '';
      };

      const id = getTag('id').split('/').pop() || 'Unknown';
      const title = getTag('title').replace(/\n/g, ' ').trim();
      const summary = getTag('summary').replace(/\n/g, ' ').trim();
      const published = getTag('published').split('T')[0];

      // Extract authors
      const authorRegex = /<author>[\s\S]*?<name>([^<]+)<\/name>/g;
      const authors = [...entry.matchAll(authorRegex)].map(m => m[1].trim()).join(', ');

      return {
        source: 'arXiv',
        id: id,
        title: title,
        abstract: summary,
        authors: authors || 'Unknown',
        date: published,
        url: `https://arxiv.org/abs/${id}`
      };
    });

    console.log(`Found ${results.length} arXiv preprints`);

    return new Response(
      JSON.stringify({ results, count: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-arxiv:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
