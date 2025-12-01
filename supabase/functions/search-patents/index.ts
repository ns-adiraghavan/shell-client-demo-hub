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
    const { query, maxResults } = await req.json();

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

    // Search patents using OPS API
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
    console.log('EPO API Response structure:', JSON.stringify(data).substring(0, 500));
    
    // Parse EPO response format - handle both array and single document
    const results = [];
    const worldPatentData = data['ops:world-patent-data'];
    const biblioSearch = worldPatentData?.['ops:biblio-search'];
    const searchResult = biblioSearch?.['ops:search-result'];
    
    console.log('Search result available:', !!searchResult);
    
    if (!searchResult) {
      console.log('No search results in response');
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    let documents = searchResult['exchange-documents'];
    
    // Handle single document (not in array)
    if (documents && !Array.isArray(documents)) {
      documents = [documents];
    }
    
    if (!documents || documents.length === 0) {
      console.log('No documents found in search result');
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing ${documents.length} patent documents`);
    
    for (const doc of documents.slice(0, maxResults)) {
      try {
        const exchangeDoc = doc['exchange-document'] || doc;
        const biblio = exchangeDoc['bibliographic-data'];
        if (!biblio) {
          console.log('Skipping document without bibliographic data');
          continue;
        }

        const publicationRef = biblio['publication-reference']?.['document-id'];
        const docId = Array.isArray(publicationRef) ? publicationRef[0] : publicationRef;
        
        const docNumber = docId?.['doc-number']?.['$'] || docId?.['doc-number'] || 'N/A';
        const country = docId?.['country']?.['$'] || docId?.['country'] || '';
        const kind = docId?.['kind']?.['$'] || docId?.['kind'] || '';
        const date = docId?.['date']?.['$'] || docId?.['date'] || '';

        // Handle title - can be array or single object
        let title = 'No title available';
        const inventionTitle = biblio['invention-title'];
        if (inventionTitle) {
          if (Array.isArray(inventionTitle)) {
            title = inventionTitle[0]?.['$'] || inventionTitle[0] || title;
          } else {
            title = inventionTitle['$'] || inventionTitle || title;
          }
        }
        
        // Handle abstract
        let abstract = '';
        const abstractData = biblio['abstract'];
        if (abstractData) {
          if (Array.isArray(abstractData)) {
            const firstAbstract = abstractData[0];
            if (firstAbstract?.['p']) {
              const pData = Array.isArray(firstAbstract['p']) ? firstAbstract['p'][0] : firstAbstract['p'];
              abstract = pData?.['$'] || pData || '';
            }
          } else if (abstractData['p']) {
            const pData = Array.isArray(abstractData['p']) ? abstractData['p'][0] : abstractData['p'];
            abstract = pData?.['$'] || pData || '';
          }
        }
        
        // Handle applicants
        const parties = biblio['parties'];
        let applicantNames = 'Unknown';
        if (parties?.['applicants']?.['applicant']) {
          const applicants = Array.isArray(parties['applicants']['applicant']) 
            ? parties['applicants']['applicant'] 
            : [parties['applicants']['applicant']];
          
          applicantNames = applicants
            .map((a: any) => {
              const name = a['applicant-name']?.['name'];
              return name?.['$'] || name || '';
            })
            .filter(Boolean)
            .join(', ') || 'Unknown';
        }

        results.push({
          source: 'Patents',
          id: `${country}${docNumber}${kind}`,
          title: title,
          abstract: abstract ? abstract.substring(0, 500) : '',
          authors: applicantNames,
          date: date ? `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}` : 'N/A',
          url: `https://worldwide.espacenet.com/patent/search/family/publication/?q=${docNumber}`
        });
      } catch (docError) {
        console.error('Error processing patent document:', docError);
        continue;
      }
    }

    console.log(`Found ${results.length} patent results`);

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
