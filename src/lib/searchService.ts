import { supabase } from "@/integrations/supabase/client";

export type InsightCategory = 
  | "Business Updates"
  | "Product / Project Announcements"
  | "Partnerships & Collaborations"
  | "Investments & Funding"
  | "Academic Research & Tie-ups"
  | "Patent & IP Activity"
  | "Startup & Innovation News"
  | "Suppliers, Logistics & Raw Materials";

export interface SearchResult {
  source: string;
  id: string;
  title: string;
  abstract?: string;
  authors?: string;
  date?: string;
  status?: string;
  phase?: string;
  enrollment?: string;
  url: string;
  insightCategory?: InsightCategory;
}

export interface SearchOptions {
  query: string;
  maxResults: number;
  sources: {
    ieee: boolean;
    clinical: boolean;
    googleScholar: boolean;
    patents: boolean;
    news: boolean;
  };
}

// Local categorization function to tag results
function categorizeResult(result: SearchResult): InsightCategory {
  const text = `${result.title} ${result.abstract || ''}`.toLowerCase();
  
  // Patent & IP Activity
  if (result.source === 'EPO' || result.source === 'Patents' || 
      text.includes('patent') || text.includes('intellectual property') || 
      text.includes('ip rights') || text.includes('licensing agreement')) {
    return "Patent & IP Activity";
  }
  
  // Academic Research & Tie-ups
  if (result.source === 'IEEE' || result.source === 'GoogleScholar' ||
      text.includes('research') || text.includes('study') || 
      text.includes('university') || text.includes('journal') ||
      text.includes('scientific') || text.includes('academic')) {
    return "Academic Research & Tie-ups";
  }
  
  // Partnerships & Collaborations
  if (text.includes('partnership') || text.includes('collaboration') ||
      text.includes('joint venture') || text.includes('mou') ||
      text.includes('alliance') || text.includes('partners with')) {
    return "Partnerships & Collaborations";
  }
  
  // Investments & Funding
  if (text.includes('investment') || text.includes('funding') ||
      text.includes('acquisition') || text.includes('merger') ||
      text.includes('raised') || text.includes('series') || 
      text.includes('ipo') || text.includes('venture capital')) {
    return "Investments & Funding";
  }
  
  // Startup & Innovation News
  if (text.includes('startup') || text.includes('start-up') ||
      text.includes('incubator') || text.includes('accelerator') ||
      text.includes('disruptive') || text.includes('emerging')) {
    return "Startup & Innovation News";
  }
  
  // Product / Project Announcements
  if (text.includes('launch') || text.includes('announces') ||
      text.includes('new product') || text.includes('project') ||
      text.includes('milestone') || text.includes('facility') ||
      text.includes('unveils') || text.includes('introduces')) {
    return "Product / Project Announcements";
  }
  
  // Suppliers, Logistics & Raw Materials
  if (text.includes('supply chain') || text.includes('supplier') ||
      text.includes('logistics') || text.includes('raw material') ||
      text.includes('commodity') || text.includes('procurement') ||
      text.includes('manufacturing') || text.includes('sourcing')) {
    return "Suppliers, Logistics & Raw Materials";
  }
  
  // Default to Business Updates
  return "Business Updates";
}

export const searchAllSources = async (options: SearchOptions): Promise<SearchResult[]> => {
  const { query, maxResults, sources } = options;
  const allResults: SearchResult[] = [];

  const searchPromises: Promise<any>[] = [];

  if (sources.ieee) {
    searchPromises.push(
      supabase.functions.invoke('search-ieee', {
        body: { query, maxResults }
      })
    );
  }

  if (sources.clinical) {
    searchPromises.push(
      supabase.functions.invoke('search-clinical-trials', {
        body: { query, maxResults }
      })
    );
  }

  if (sources.googleScholar) {
    searchPromises.push(
      supabase.functions.invoke('search-google-scholar', {
        body: { query, maxResults }
      })
    );
  }

  if (sources.patents) {
    searchPromises.push(
      supabase.functions.invoke('search-patents', {
        body: { query, maxResults }
      })
    );
  }

  if (sources.news) {
    searchPromises.push(
      supabase.functions.invoke('search-news', {
        body: { query, maxResults }
      })
    );
  }

  try {
    const responses = await Promise.allSettled(searchPromises);

    responses.forEach((response) => {
      if (response.status === 'fulfilled') {
        const { data, error } = response.value;
        if (!error && data?.results) {
          allResults.push(...data.results);
        } else if (error) {
          console.error('Search error:', error);
        }
      } else {
        console.error('Search promise rejected:', response.reason);
      }
    });

    // Categorize all results with insight categories
    const categorizedResults = allResults.map(result => ({
      ...result,
      insightCategory: result.insightCategory || categorizeResult(result)
    }));

    return categorizedResults;
  } catch (error) {
    console.error('Error searching sources:', error);
    throw error;
  }
};

export const synthesizeResults = async (query: string, results: SearchResult[]): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('synthesize-results', {
      body: { query, results }
    });

    if (error) {
      console.error('Synthesis error:', error);
      throw new Error('Failed to generate synthesis');
    }

    return data?.synthesis || 'Unable to generate synthesis';
  } catch (error) {
    console.error('Error synthesizing results:', error);
    throw error;
  }
};

export const saveSearch = async (
  query: string,
  sources: any,
  maxResults: number,
  results: SearchResult[],
  synthesis: string
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to save searches');
  }

  const { error } = await supabase.from('saved_searches').insert([{
    user_id: user.id,
    query,
    sources: sources as any,
    max_results: maxResults,
    results: results as any,
    synthesis
  }]);

  if (error) {
    console.error('Error saving search:', error);
    throw error;
  }
};