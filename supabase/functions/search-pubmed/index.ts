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
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=date`;
    
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

    // Step 2: Fetch full article data using efetch (includes abstracts)
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
    
    const fetchResponse = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (PharmaAI Research Dashboard)'
      }
    });

    if (!fetchResponse.ok) {
      throw new Error(`PubMed fetch failed: ${fetchResponse.status}`);
    }

    const xmlText = await fetchResponse.text();
    
    // Parse XML to extract articles with abstracts
    const articles = [];
    const articleMatches = xmlText.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g);
    
    for (const match of articleMatches) {
      const articleXml = match[1];
      
      // Extract PMID
      const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      const pmid = pmidMatch ? pmidMatch[1] : '';
      
      // Extract title
      const titleMatch = articleXml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
      let title = titleMatch ? titleMatch[1] : 'No title';
      // Clean HTML tags from title
      title = title.replace(/<[^>]*>/g, '').trim();
      
      // Extract abstract - combine all AbstractText elements
      let abstract = '';
      const abstractSection = articleXml.match(/<Abstract>([\s\S]*?)<\/Abstract>/);
      if (abstractSection) {
        const abstractTexts = abstractSection[1].matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g);
        const parts = [];
        for (const absMatch of abstractTexts) {
          let text = absMatch[1].replace(/<[^>]*>/g, '').trim();
          if (text) parts.push(text);
        }
        abstract = parts.join(' ');
      }
      
      // Extract authors
      const authorList: string[] = [];
      const authorMatches = articleXml.matchAll(/<Author[^>]*>[\s\S]*?<LastName>([\s\S]*?)<\/LastName>[\s\S]*?<ForeName>([\s\S]*?)<\/ForeName>[\s\S]*?<\/Author>/g);
      for (const authorMatch of authorMatches) {
        const lastName = authorMatch[1].trim();
        const foreName = authorMatch[2].trim();
        authorList.push(`${foreName} ${lastName}`);
      }
      const authors = authorList.length > 0 ? authorList.slice(0, 5).join(', ') + (authorList.length > 5 ? ' et al.' : '') : 'Unknown';
      
      // Extract publication date
      let pubDate = 'Unknown';
      const pubDateMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>(?:[\s\S]*?<Month>(\w+|\d+)<\/Month>)?/);
      if (pubDateMatch) {
        const year = pubDateMatch[1];
        const month = pubDateMatch[2] || '';
        pubDate = month ? `${year} ${month}` : year;
      }
      
      // Extract journal
      const journalMatch = articleXml.match(/<Title>([\s\S]*?)<\/Title>/);
      const journal = journalMatch ? journalMatch[1].trim() : '';
      
      if (pmid) {
        articles.push({
          source: 'PubMed',
          id: pmid,
          title: title,
          abstract: abstract || 'Abstract not available',
          authors: authors,
          date: pubDate,
          journal: journal,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
        });
      }
    }

    console.log(`Found ${articles.length} PubMed articles with abstracts`);

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
