import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsResult {
  source: string;
  id: string;
  title: string;
  abstract: string;
  authors: string;
  date: string;
  url: string;
  publisher?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, maxResults = 10 } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching news for: ${query}, maxResults: ${maxResults}`);

    // Use Google News RSS feed (free, no API key required)
    const encodedQuery = encodeURIComponent(`${query} biotech OR pharma OR healthcare OR clinical OR FDA`);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
    
    console.log('Fetching from Google News RSS:', rssUrl);
    
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ResearchApp/1.0)',
      }
    });

    if (!response.ok) {
      console.error('Google News RSS error:', response.status);
      throw new Error(`News fetch failed: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log('RSS response length:', xmlText.length);

    // Parse RSS XML
    const results: NewsResult[] = [];
    
    // Extract items from RSS feed using regex (Deno edge functions don't have DOM parser)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xmlText)) !== null && count < maxResults) {
      const itemXml = match[1];
      
      // Extract title
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
      
      // Extract link
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      const link = linkMatch ? linkMatch[1].trim() : '';
      
      // Extract publication date
      const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
      
      // Extract source/publisher from title (Google News format: "Title - Source")
      let cleanTitle = title;
      let publisher = 'News';
      const sourceMatch = title.match(/^(.*?)\s*-\s*([^-]+)$/);
      if (sourceMatch) {
        cleanTitle = sourceMatch[1].trim();
        publisher = sourceMatch[2].trim();
      }

      // Extract description/snippet
      const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s);
      let description = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : '';
      // Clean HTML tags from description
      description = description.replace(/<[^>]*>/g, '').trim();

      if (title && link) {
        // Format date
        let formattedDate = '';
        try {
          const date = new Date(pubDate);
          formattedDate = date.toISOString().split('T')[0];
        } catch {
          formattedDate = pubDate;
        }

        results.push({
          source: 'News',
          id: `news-${count + 1}-${Date.now()}`,
          title: cleanTitle,
          abstract: description || `Latest news from ${publisher}`,
          authors: publisher,
          date: formattedDate,
          url: link,
          publisher: publisher
        });
        count++;
      }
    }

    console.log(`Found ${results.length} news articles`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, results: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
