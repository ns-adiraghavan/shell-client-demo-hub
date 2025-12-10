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
  insightCategories?: InsightCategory[];
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

// Parse date strings from various formats into Date objects
// Handles: "YYYY-MM-DD", "YYYY", "Month YYYY", "DD Month YYYY", "Month DD, YYYY", etc.
export function parseResultDate(dateStr?: string): Date | null {
  if (!dateStr || dateStr === 'Unknown' || dateStr === '' || dateStr === 'N/A') {
    return null;
  }
  
  const trimmed = dateStr.trim();
  
  // Try ISO format first (YYYY-MM-DD)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const date = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try YYYYMMDD format (common in patents)
  const compactMatch = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    const date = new Date(parseInt(compactMatch[1]), parseInt(compactMatch[2]) - 1, parseInt(compactMatch[3]));
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try year-only format
  const yearOnlyMatch = trimmed.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    const year = parseInt(yearOnlyMatch[1]);
    // Validate year is reasonable (1900-current year)
    if (year >= 1900 && year <= new Date().getFullYear()) {
      return new Date(year, 0, 1); // January 1st of that year
    }
    return null;
  }
  
  // Month name patterns
  const months: Record<string, number> = {
    'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
    'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5, 'july': 6, 'jul': 6,
    'august': 7, 'aug': 7, 'september': 8, 'sep': 8, 'sept': 8, 'october': 9, 'oct': 9,
    'november': 10, 'nov': 10, 'december': 11, 'dec': 11
  };
  
  // Try "Month YYYY" or "Mon YYYY" format
  const monthYearMatch = trimmed.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const monthStr = monthYearMatch[1].toLowerCase();
    const year = parseInt(monthYearMatch[2]);
    if (months[monthStr] !== undefined && year >= 1900 && year <= new Date().getFullYear()) {
      return new Date(year, months[monthStr], 1);
    }
  }
  
  // Try "DD Month YYYY" format
  const dayMonthYearMatch = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (dayMonthYearMatch) {
    const day = parseInt(dayMonthYearMatch[1]);
    const monthStr = dayMonthYearMatch[2].toLowerCase();
    const year = parseInt(dayMonthYearMatch[3]);
    if (months[monthStr] !== undefined && year >= 1900 && year <= new Date().getFullYear()) {
      return new Date(year, months[monthStr], day);
    }
  }
  
  // Try "Month DD, YYYY" format
  const monthDayYearMatch = trimmed.match(/^([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthDayYearMatch) {
    const monthStr = monthDayYearMatch[1].toLowerCase();
    const day = parseInt(monthDayYearMatch[2]);
    const year = parseInt(monthDayYearMatch[3]);
    if (months[monthStr] !== undefined && year >= 1900 && year <= new Date().getFullYear()) {
      return new Date(year, months[monthStr], day);
    }
  }
  
  // Try standard Date parse as last resort
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    // Validate the parsed date is reasonable
    const year = parsed.getFullYear();
    if (year >= 1900 && year <= new Date().getFullYear()) {
      return parsed;
    }
  }
  
  return null;
}

// Local categorization function to tag results with multiple categories
function categorizeResult(result: SearchResult): InsightCategory[] {
  const text = `${result.title} ${result.abstract || ''}`.toLowerCase();
  const categories: InsightCategory[] = [];
  
  // Patent & IP Activity
  if (result.source === 'EPO' || result.source === 'Patents' || 
      text.includes('patent') || text.includes('intellectual property') || 
      text.includes('ip rights') || text.includes('licensing agreement')) {
    categories.push("Patent & IP Activity");
  }
  
  // Academic Research & Tie-ups
  if (result.source === 'IEEE' || result.source === 'Google Scholar' ||
      text.includes('research') || text.includes('study') || 
      text.includes('university') || text.includes('journal') ||
      text.includes('scientific') || text.includes('academic')) {
    categories.push("Academic Research & Tie-ups");
  }
  
  // Partnerships & Collaborations
  if (text.includes('partnership') || text.includes('collaboration') ||
      text.includes('joint venture') || text.includes('mou') ||
      text.includes('alliance') || text.includes('partners with')) {
    categories.push("Partnerships & Collaborations");
  }
  
  // Investments & Funding
  if (text.includes('investment') || text.includes('funding') ||
      text.includes('acquisition') || text.includes('merger') ||
      text.includes('raised') || text.includes('series') || 
      text.includes('ipo') || text.includes('venture capital')) {
    categories.push("Investments & Funding");
  }
  
  // Startup & Innovation News
  if (text.includes('startup') || text.includes('start-up') ||
      text.includes('incubator') || text.includes('accelerator') ||
      text.includes('disruptive') || text.includes('emerging')) {
    categories.push("Startup & Innovation News");
  }
  
  // Product / Project Announcements
  if (text.includes('launch') || text.includes('announces') ||
      text.includes('new product') || text.includes('project') ||
      text.includes('milestone') || text.includes('facility') ||
      text.includes('unveils') || text.includes('introduces')) {
    categories.push("Product / Project Announcements");
  }
  
  // Suppliers, Logistics & Raw Materials
  if (text.includes('supply chain') || text.includes('supplier') ||
      text.includes('logistics') || text.includes('raw material') ||
      text.includes('commodity') || text.includes('procurement') ||
      text.includes('manufacturing') || text.includes('sourcing')) {
    categories.push("Suppliers, Logistics & Raw Materials");
  }
  
  // Default to Business Updates if no other category matched
  if (categories.length === 0) {
    categories.push("Business Updates");
  }
  
  return categories;
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

    // Categorize all results with insight categories (multiple per result)
    const categorizedResults = allResults.map(result => ({
      ...result,
      insightCategories: result.insightCategories || categorizeResult(result)
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