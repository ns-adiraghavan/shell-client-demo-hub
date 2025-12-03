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
    const { query, maxResults = 10 } = await req.json();

    const EPO_CONSUMER_KEY = Deno.env.get('EPO_OPS_CONSUMER_KEY');
    const EPO_CONSUMER_SECRET = Deno.env.get('EPO_OPS_CONSUMER_SECRET');

    if (!EPO_CONSUMER_KEY || !EPO_CONSUMER_SECRET) {
      console.error('EPO credentials not configured');
      return new Response(
        JSON.stringify({ error: 'EPO API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching EPO for: ${query}, max results: ${maxResults}`);

    // Get OAuth token from EPO
    const tokenResponse = await fetch('https://ops.epo.org/3.2/auth/accesstoken', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${EPO_CONSUMER_KEY}:${EPO_CONSUMER_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('EPO token error:', tokenResponse.status, errorText);
      throw new Error(`Failed to authenticate with EPO: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Search patents using OPS API with bibliographic data
    const searchUrl = `https://ops.epo.org/3.2/rest-services/published-data/search?q=${encodeURIComponent(query)}&Range=1-${maxResults}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('EPO search error:', searchResponse.status, errorText);
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await searchResponse.json();
    
    // Parse EPO response format
    const worldPatentData = data['ops:world-patent-data'];
    const biblioSearch = worldPatentData?.['ops:biblio-search'];
    const searchResult = biblioSearch?.['ops:search-result'];
    
    if (!searchResult) {
      console.log('No search results in response');
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    let publications = searchResult['ops:publication-reference'];
    
    if (!publications || publications.length === 0) {
      console.log('No publications found in search result');
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing ${publications.length} patent publications`);
    
    // Fetch full bibliographic data for each patent (limited to avoid rate limits)
    const results = [];
    const patentsToFetch = publications.slice(0, Math.min(maxResults, 10));
    
    for (const pub of patentsToFetch) {
      try {
        const docId = pub['document-id'];
        const docNumber = docId?.['doc-number']?.['$'] || docId?.['doc-number'] || '';
        const country = docId?.['country']?.['$'] || docId?.['country'] || '';
        const kind = docId?.['kind']?.['$'] || docId?.['kind'] || '';
        const date = docId?.['date']?.['$'] || docId?.['date'] || '';

        const patentId = `${country}${docNumber}${kind}`;
        
        // Fetch full bibliographic data including title and abstract
        const biblioUrl = `https://ops.epo.org/3.2/rest-services/published-data/publication/epodoc/${country}${docNumber}/biblio`;
        
        const biblioResponse = await fetch(biblioUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });

        let title = `Patent ${patentId}`;
        let abstract = '';
        let applicants = '';

        if (biblioResponse.ok) {
          const biblioData = await biblioResponse.json();
          const exchangeDoc = biblioData?.['ops:world-patent-data']?.['exchange-documents']?.['exchange-document'];
          
          // Handle array or single object
          const doc = Array.isArray(exchangeDoc) ? exchangeDoc[0] : exchangeDoc;
          
          if (doc) {
            // Extract title
            const biblioSection = doc['bibliographic-data'];
            const inventionTitle = biblioSection?.['invention-title'];
            if (inventionTitle) {
              if (Array.isArray(inventionTitle)) {
                const enTitle = inventionTitle.find((t: any) => t['@lang'] === 'en');
                title = enTitle?.['$'] || inventionTitle[0]?.['$'] || title;
              } else {
                title = inventionTitle['$'] || title;
              }
            }
            
            // Extract applicants
            const parties = biblioSection?.['parties'];
            const applicantList = parties?.['applicants']?.['applicant'];
            if (applicantList) {
              const appArray = Array.isArray(applicantList) ? applicantList : [applicantList];
              const names = appArray
                .slice(0, 3)
                .map((a: any) => a['applicant-name']?.['name']?.['$'] || '')
                .filter(Boolean);
              applicants = names.join('; ') || 'View patent for details';
            }
            
            // Extract abstract
            const abstractSection = doc['abstract'];
            if (abstractSection) {
              const absArray = Array.isArray(abstractSection) ? abstractSection : [abstractSection];
              const enAbstract = absArray.find((a: any) => a['@lang'] === 'en') || absArray[0];
              if (enAbstract?.['p']) {
                const pContent = enAbstract['p'];
                if (Array.isArray(pContent)) {
                  abstract = pContent.map((p: any) => p['$'] || '').join(' ');
                } else {
                  abstract = pContent['$'] || '';
                }
              }
            }
          }
        }

        // Format date
        let formattedDate = 'N/A';
        if (date && date.length >= 8) {
          formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
        }
        
        results.push({
          source: 'Patents',
          id: patentId,
          title: title,
          abstract: abstract || 'Abstract not available - view patent for full details',
          authors: applicants || 'View patent for details',
          date: formattedDate,
          url: `https://worldwide.espacenet.com/patent/search/family/publication/?q=${docNumber}`
        });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (docError) {
        console.error('Error processing patent publication:', docError);
        continue;
      }
    }

    console.log(`Found ${results.length} patent results with details`);

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
