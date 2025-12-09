import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IndustryNewsResult {
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
    const { query, maxResults = 20 } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching industry news for: ${query}, max results: ${maxResults}`);

    // Industry News sources: PV Tech, Heatmap News, Oil & Gas Journal, RigZone, OGN, Oil & Gas IQ, Recharge News, CleanTechnica, Energy Digital Magazine
    const industrySources = 'site:pv-tech.org OR site:heatmap.news OR site:ogj.com OR site:rigzone.com OR site:oilandgasnewsworldwide.com OR site:oilandgasiq.com OR site:rechargenews.com OR site:cleantechnica.com OR site:energydigital.com';
    const encodedQuery = encodeURIComponent(`${query} (${industrySources})`);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en&gl=US&ceid=US:en`;

    console.log('Fetching from Google News RSS for industry sources');

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarketIntelligence/1.0)',
      }
    });

    if (!response.ok) {
      console.error('Google News RSS error:', response.status);
      throw new Error(`Industry news fetch failed: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log('RSS response length:', xmlText.length);

    const results: IndustryNewsResult[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    const decodeHtmlEntities = (text: string): string => {
      return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    while ((match = itemRegex.exec(xmlText)) !== null && count < maxResults) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
      const rawTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
      const title = decodeHtmlEntities(rawTitle);
      
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      const link = linkMatch ? linkMatch[1].trim() : '';
      
      const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
      
      let cleanTitle = title;
      let publisher = 'Industry News';
      const sourceMatch = title.match(/^(.*?)\s*-\s*([^-]+)$/);
      if (sourceMatch) {
        cleanTitle = sourceMatch[1].trim();
        publisher = sourceMatch[2].trim();
      }

      const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s);
      let description = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : '';
      description = decodeHtmlEntities(description);

      if (title && link) {
        let formattedDate = '';
        try {
          const date = new Date(pubDate);
          formattedDate = date.toISOString().split('T')[0];
        } catch {
          formattedDate = pubDate;
        }

        results.push({
          source: 'IndustryNews',
          id: `industry-news-${count + 1}-${Date.now()}`,
          title: cleanTitle,
          abstract: description || `Latest industry news from ${publisher}`,
          authors: publisher,
          date: formattedDate,
          url: link,
          publisher: publisher
        });
        count++;
      }
    }

    console.log(`Found ${results.length} industry news articles`);

    return new Response(
      JSON.stringify({ results, count: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-clinical-trials (industry news):', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, results: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
