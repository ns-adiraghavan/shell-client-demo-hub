import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to reconstruct abstract from OpenAlex inverted index
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  if (!invertedIndex) return '';
  
  const positions: [number, string][] = [];
  for (const [word, indices] of Object.entries(invertedIndex)) {
    for (const index of indices) {
      positions.push([index, word]);
    }
  }
  
  positions.sort((a, b) => a[0] - b[0]);
  const text = positions.map(p => p[1]).join(' ');
  return text.length > 600 ? text.slice(0, 600) + '...' : text;
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

    console.log(`Searching IEEE Xplore for: ${query}, max results: ${maxResults}`);

    // IEEE Xplore API - using the open access endpoint
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
          results = (data.articles || []).map((article: any) => {
            let dateStr = 'Unknown';
            if (article.publication_date) {
              const pubDate = article.publication_date.replace(/\D/g, '');
              if (pubDate.length >= 8) {
                dateStr = `${pubDate.slice(0, 4)}-${pubDate.slice(4, 6)}-${pubDate.slice(6, 8)}`;
              } else if (pubDate.length >= 4) {
                dateStr = `${pubDate.slice(0, 4)}-01-01`;
              }
            } else if (article.publication_year) {
              dateStr = `${article.publication_year}-01-01`;
            }
            
            const authorsWithAffiliations = article.authors?.authors?.map((a: any) => {
              const name = a.full_name || 'Unknown';
              const affiliation = a.affiliation || a.org || '';
              return affiliation ? `${name} (${affiliation})` : name;
            }).join(', ') || 'Unknown';
            
            return {
              source: 'IEEE',
              id: article.article_number || article.doi || `ieee-${Date.now()}-${Math.random()}`,
              title: article.title || 'No title',
              abstract: article.abstract || 'Abstract not available',
              authors: authorsWithAffiliations,
              date: dateStr,
              url: article.html_url || `https://ieeexplore.ieee.org/document/${article.article_number}`
            };
          });
        }
      } catch (error) {
        console.error('IEEE API error:', error);
      }
    }
    
    // Primary fallback: Use OpenAlex API (better abstract coverage)
    if (results.length === 0) {
      console.log('Using OpenAlex fallback for IEEE publications');
      
      // Filter for IEEE publisher (member ID or publisher name)
      const openAlexUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&filter=primary_location.source.publisher:IEEE&per-page=${maxResults}&sort=publication_date:desc`;
      
      try {
        const response = await fetch(openAlexUrl, {
          headers: {
            'User-Agent': 'mailto:research@innovationinsights.com'
          }
        });

        if (response.ok) {
          const data = await response.json();
          results = (data.results || []).map((work: any) => {
            // Extract date
            let dateStr = 'Unknown';
            if (work.publication_date) {
              dateStr = work.publication_date;
            } else if (work.publication_year) {
              dateStr = `${work.publication_year}-01-01`;
            }
            
            // Extract abstract - OpenAlex uses inverted index
            let abstractText = '';
            if (work.abstract_inverted_index) {
              abstractText = reconstructAbstract(work.abstract_inverted_index);
            }
            
            // Extract authors with affiliations
            const authorsWithAffiliations = work.authorships?.map((a: any) => {
              const name = a.author?.display_name || 'Unknown';
              const institution = a.institutions?.[0]?.display_name || '';
              return institution ? `${name} (${institution})` : name;
            }).slice(0, 5).join(', ') || 'Unknown';
            
            return {
              source: 'IEEE',
              id: work.id?.replace('https://openalex.org/', '') || `ieee-${Date.now()}-${Math.random()}`,
              title: work.title || 'No title',
              abstract: abstractText || 'Abstract not available',
              authors: authorsWithAffiliations,
              date: dateStr,
              url: work.primary_location?.landing_page_url || (work.doi ? `https://doi.org/${work.doi}` : '#')
            };
          });
          
          console.log(`OpenAlex returned ${results.length} IEEE results`);
        }
      } catch (error) {
        console.error('OpenAlex fallback error:', error);
      }
    }
    
    // Secondary fallback: Use CrossRef API
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
          results = (data.message?.items || []).map((item: any) => {
            // Parse date-parts array properly
            let dateStr = 'Unknown';
            const dateParts = item['published-online']?.['date-parts']?.[0] || 
                              item.deposited?.['date-parts']?.[0] || 
                              item.published?.['date-parts']?.[0] || 
                              item.created?.['date-parts']?.[0];
            if (dateParts && Array.isArray(dateParts)) {
              const [year, month, day] = dateParts;
              if (year && month && day) {
                dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              } else if (year && month) {
                dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
              } else if (year) {
                dateStr = `${year}-01-01`;
              }
            }
            
            // Extract abstract from multiple possible fields
            let abstractText = '';
            if (item.abstract) {
              abstractText = item.abstract.replace(/<[^>]*>/g, '').trim();
            } else if (item.description) {
              abstractText = item.description.replace(/<[^>]*>/g, '').trim();
            } else if (item.subtitle && item.subtitle.length > 0) {
              abstractText = Array.isArray(item.subtitle) ? item.subtitle.join(' ') : item.subtitle;
            }
            
            // Extract authors with affiliations where available
            const authorsWithAffiliations = item.author?.map((a: any) => {
              const name = `${a.given || ''} ${a.family || ''}`.trim();
              const affiliation = a.affiliation?.[0]?.name || '';
              return affiliation ? `${name} (${affiliation})` : name;
            }).slice(0, 5).join(', ') || 'Unknown';
            
            return {
              source: 'IEEE',
              id: item.DOI || `ieee-${Date.now()}-${Math.random()}`,
              title: Array.isArray(item.title) ? item.title[0] : (item.title || 'No title'),
              abstract: abstractText || 'Abstract not available',
              authors: authorsWithAffiliations,
              date: dateStr,
              url: item.URL || `https://doi.org/${item.DOI}`
            };
          });
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