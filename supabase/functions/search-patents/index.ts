import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback: Use USPTO PatentsView API (free, no auth required)
async function searchPatentsView(query: string, maxResults: number): Promise<any[]> {
  console.log('Using USPTO PatentsView fallback');
  
  try {
    const searchUrl = `https://api.patentsview.org/patents/query`;
    
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: { "_text_any": { "patent_title": query, "patent_abstract": query } },
        f: ["patent_number", "patent_title", "patent_abstract", "patent_date", "assignee_organization"],
        o: { "per_page": maxResults },
        s: [{ "patent_date": "desc" }]
      })
    });

    if (!response.ok) {
      console.error('PatentsView error:', response.status);
      return [];
    }

    const data = await response.json();
    
    return (data.patents || []).map((patent: any) => ({
      source: 'Patents',
      id: patent.patent_number || `us-${Date.now()}-${Math.random()}`,
      title: patent.patent_title || 'No title',
      abstract: patent.patent_abstract || 'Abstract not available',
      authors: patent.assignees?.[0]?.assignee_organization || 'Unknown assignee',
      date: patent.patent_date || 'Unknown',
      url: `https://patents.google.com/patent/US${patent.patent_number}`
    }));
  } catch (error) {
    console.error('PatentsView fallback error:', error);
    return [];
  }
}

// Second fallback: Use Lens.org public API
async function searchLensPatents(query: string, maxResults: number): Promise<any[]> {
  console.log('Using Lens.org fallback');
  
  try {
    // Use the Lens.org free search
    const searchUrl = `https://api.lens.org/patent/search`;
    
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          match: { title: query }
        },
        size: maxResults,
        sort: [{ date_published: "desc" }]
      })
    });

    if (!response.ok) {
      console.error('Lens.org error:', response.status);
      return [];
    }

    const data = await response.json();
    
    return (data.data || []).map((patent: any) => ({
      source: 'Patents',
      id: patent.lens_id || patent.doc_number || `lens-${Date.now()}-${Math.random()}`,
      title: patent.title || 'No title',
      abstract: patent.abstract || 'Abstract not available',
      authors: patent.applicants?.[0]?.name || 'Unknown applicant',
      date: patent.date_published || 'Unknown',
      url: `https://www.lens.org/lens/patent/${patent.lens_id}`
    }));
  } catch (error) {
    console.error('Lens.org fallback error:', error);
    return [];
  }
}

// Third fallback: Google Patents via SerpApi-style scraping simulation with OpenAlex patents
async function searchOpenAlexPatents(query: string, maxResults: number): Promise<any[]> {
  console.log('Using OpenAlex works fallback for patent-related publications');
  
  try {
    const searchUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query + ' patent')}&per-page=${maxResults}&filter=type:article&sort=publication_date:desc`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'mailto:research@innovationinsights.com'
      }
    });

    if (!response.ok) {
      console.error('OpenAlex error:', response.status);
      return [];
    }

    const data = await response.json();
    
    return (data.results || []).slice(0, maxResults).map((work: any) => ({
      source: 'Patents',
      id: work.id?.replace('https://openalex.org/', '') || `oalex-${Date.now()}-${Math.random()}`,
      title: work.title || 'No title',
      abstract: 'View source for details',
      authors: work.authorships?.slice(0, 3).map((a: any) => a.author?.display_name).filter(Boolean).join(', ') || 'Unknown',
      date: work.publication_date || 'Unknown',
      url: work.primary_location?.landing_page_url || work.doi || '#'
    }));
  } catch (error) {
    console.error('OpenAlex fallback error:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, maxResults = 10 } = await req.json();

    console.log(`Searching patents for: ${query}, max results: ${maxResults}`);

    const EPO_CONSUMER_KEY = Deno.env.get('EPO_OPS_CONSUMER_KEY');
    const EPO_CONSUMER_SECRET = Deno.env.get('EPO_OPS_CONSUMER_SECRET');

    let results: any[] = [];

    // Try EPO first if credentials are available
    if (EPO_CONSUMER_KEY && EPO_CONSUMER_SECRET) {
      try {
        console.log('Attempting EPO API...');
        
        const tokenResponse = await fetch('https://ops.epo.org/3.2/auth/accesstoken', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${EPO_CONSUMER_KEY}:${EPO_CONSUMER_SECRET}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials'
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          const accessToken = tokenData.access_token;

          const searchUrl = `https://ops.epo.org/3.2/rest-services/published-data/search?q=${encodeURIComponent(query)}&Range=1-${maxResults}`;
          
          const searchResponse = await fetch(searchUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          });

          if (searchResponse.ok) {
            const data = await searchResponse.json();
            const worldPatentData = data['ops:world-patent-data'];
            const biblioSearch = worldPatentData?.['ops:biblio-search'];
            const searchResult = biblioSearch?.['ops:search-result'];
            
            if (searchResult) {
              let publications = searchResult['ops:publication-reference'];
              
              if (publications && publications.length > 0) {
                const patentsToFetch = publications.slice(0, Math.min(maxResults, 10));
                
                for (const pub of patentsToFetch) {
                  try {
                    const docId = pub['document-id'];
                    const docNumber = docId?.['doc-number']?.['$'] || docId?.['doc-number'] || '';
                    const country = docId?.['country']?.['$'] || docId?.['country'] || '';
                    const kind = docId?.['kind']?.['$'] || docId?.['kind'] || '';
                    const date = docId?.['date']?.['$'] || docId?.['date'] || '';

                    const patentId = `${country}${docNumber}${kind}`;
                    
                    let formattedDate = 'N/A';
                    if (date && date.length >= 8) {
                      formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
                    }
                    
                    results.push({
                      source: 'Patents',
                      id: patentId,
                      title: `Patent ${patentId}`,
                      abstract: 'View patent for full details',
                      authors: 'View patent for details',
                      date: formattedDate,
                      url: `https://worldwide.espacenet.com/patent/search/family/publication/?q=${docNumber}`
                    });
                    
                  } catch (docError) {
                    console.error('Error processing patent:', docError);
                  }
                }
                
                console.log(`Found ${results.length} patents from EPO`);
              }
            }
          }
        } else {
          console.log('EPO authentication failed, using fallback');
        }
      } catch (epoError) {
        console.error('EPO API error:', epoError);
      }
    }

    // Fallback to USPTO PatentsView if EPO didn't return results
    if (results.length === 0) {
      results = await searchPatentsView(query, maxResults);
    }

    // Second fallback to OpenAlex
    if (results.length === 0) {
      results = await searchOpenAlexPatents(query, maxResults);
    }

    console.log(`Returning ${results.length} patent results`);

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