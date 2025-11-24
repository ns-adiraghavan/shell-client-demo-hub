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

    console.log(`Searching arXiv for: ${query}, max results: ${maxResults}`);

    // Search arXiv API
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (PharmaAI Research Dashboard)'
      }
    });

    if (!response.ok) {
      throw new Error(`arXiv API failed: ${response.status}`);
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
