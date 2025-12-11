import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    console.log(`Searching Google Scholar for: ${query}, max results: ${maxResults}`);

    let results: any[] = [];
    
    // Use SerpApi for Google Scholar if API key is available
    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    
    if (serpApiKey) {
      try {
        const serpUrl = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(query)}&num=${maxResults}&api_key=${serpApiKey}`;
        
        const response = await fetch(serpUrl);
        
        if (response.ok) {
          const data = await response.json();
          results = (data.organic_results || []).map((item: any) => ({
            source: 'Google Scholar',
            id: item.result_id || `gs-${Date.now()}-${Math.random()}`,
            title: item.title || 'No title',
            abstract: item.snippet || 'Abstract not available',
            authors: item.publication_info?.authors?.map((a: any) => a.name).join(', ') || item.publication_info?.summary?.split(' - ')[0] || 'Unknown',
            date: item.publication_info?.summary?.match(/\b(19|20)\d{2}\b/)?.[0] || 'Unknown',
            url: item.link || '#'
          }));
        }
      } catch (error) {
        console.error('SerpApi error:', error);
      }
    }
    
    // Fallback: Use Semantic Scholar API (free, no API key required)
    if (results.length === 0) {
      console.log('Using Semantic Scholar fallback');
      
      try {
        // Request more fields including tldr for better abstract fallback
        const semanticUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${maxResults}&fields=paperId,title,abstract,authors,authors.affiliations,year,url,venue,citationCount,externalIds,openAccessPdf,tldr`;
        
        const response = await fetch(semanticUrl, {
          headers: {
            'User-Agent': 'InnovationInsightsEngine/1.0'
          }
        });

        if (response.ok) {
          const data = await response.json();
          results = (data.data || []).map((paper: any) => {
            // Prioritize actual publication URLs over intermediary links
            let publicationUrl = '#';
            
            // First priority: Open access PDF or landing page
            if (paper.openAccessPdf?.url) {
              publicationUrl = paper.openAccessPdf.url;
            }
            // Second priority: DOI link (actual publication)
            else if (paper.externalIds?.DOI) {
              publicationUrl = `https://doi.org/${paper.externalIds.DOI}`;
            }
            // Third priority: ArXiv link
            else if (paper.externalIds?.ArXiv) {
              publicationUrl = `https://arxiv.org/abs/${paper.externalIds.ArXiv}`;
            }
            // Fourth priority: PubMed link
            else if (paper.externalIds?.PubMed) {
              publicationUrl = `https://pubmed.ncbi.nlm.nih.gov/${paper.externalIds.PubMed}`;
            }
            // Fifth priority: Direct URL from paper data
            else if (paper.url) {
              publicationUrl = paper.url;
            }
            // Last resort: Semantic Scholar page
            else if (paper.paperId) {
              publicationUrl = `https://www.semanticscholar.org/paper/${paper.paperId}`;
            }
            
            // Build abstract - try multiple sources
            let abstractText = paper.abstract;
            if (!abstractText || abstractText === 'Abstract not available') {
              // Fallback to tldr (auto-generated summary)
              if (paper.tldr?.text) {
                abstractText = paper.tldr.text;
              }
            }
            
            // Build authors with affiliations where available
            const authorsWithAffiliations = paper.authors?.map((a: any) => {
              const name = a.name || 'Unknown';
              const affiliation = a.affiliations?.[0] || '';
              return affiliation ? `${name} (${affiliation})` : name;
            }).slice(0, 5).join(', ') || 'Unknown';
            
            return {
              source: 'Google Scholar',
              id: paper.paperId || `scholar-${Date.now()}-${Math.random()}`,
              title: paper.title || 'No title',
              abstract: abstractText || 'Abstract not available',
              authors: authorsWithAffiliations,
              date: paper.year?.toString() || 'Unknown',
              url: publicationUrl
            };
          });
        }
      } catch (error) {
        console.error('Semantic Scholar fallback error:', error);
      }
    }
    
    // Second fallback: Use OpenAlex API
    if (results.length === 0) {
      console.log('Using OpenAlex fallback');
      
      try {
        const openAlexUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${maxResults}&sort=publication_date:desc`;
        
        const response = await fetch(openAlexUrl, {
          headers: {
            'User-Agent': 'mailto:research@example.com'
          }
        });

        if (response.ok) {
          const data = await response.json();
          results = (data.results || []).map((work: any) => ({
            source: 'Google Scholar',
            id: work.id?.replace('https://openalex.org/', '') || `scholar-${Date.now()}-${Math.random()}`,
            title: work.title || 'No title',
            abstract: work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : 'Abstract not available',
            authors: work.authorships?.map((a: any) => a.author?.display_name).filter(Boolean).slice(0, 5).join(', ') || 'Unknown',
            date: work.publication_date || work.publication_year?.toString() || 'Unknown',
            url: work.primary_location?.landing_page_url || work.doi || '#'
          }));
        }
      } catch (error) {
        console.error('OpenAlex fallback error:', error);
      }
    }

    console.log(`Found ${results.length} scholarly articles`);

    return new Response(
      JSON.stringify({ results, count: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-google-scholar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, results: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to reconstruct abstract from OpenAlex inverted index
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  if (!invertedIndex) return 'Abstract not available';
  
  const positions: [number, string][] = [];
  for (const [word, indices] of Object.entries(invertedIndex)) {
    for (const index of indices) {
      positions.push([index, word]);
    }
  }
  
  positions.sort((a, b) => a[0] - b[0]);
  return positions.map(p => p[1]).join(' ').slice(0, 500) + '...';
}