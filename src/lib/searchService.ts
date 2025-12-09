import { supabase } from "@/integrations/supabase/client";

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

    return allResults;
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