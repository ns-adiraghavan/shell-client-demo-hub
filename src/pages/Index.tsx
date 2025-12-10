import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SearchHeader } from "@/components/dashboard/SearchHeader";
import { SearchFilters } from "@/components/dashboard/SearchFilters";
import { AdvancedFilters, AdvancedFilterOptions } from "@/components/dashboard/AdvancedFilters";
import { ResultsTabs } from "@/components/dashboard/ResultsTabs";
import { SynthesisPanel } from "@/components/dashboard/SynthesisPanel";
import { CompetitiveLandscape } from "@/components/dashboard/CompetitiveLandscape";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DocumentUpload } from "@/components/dashboard/DocumentUpload";
import { DataVisualization } from "@/components/dashboard/DataVisualization";
import { DocumentChat } from "@/components/dashboard/DocumentChat";
import { SectionNavigation } from "@/components/dashboard/SectionNavigation";
import { searchAllSources, synthesizeResults, saveSearch, SearchResult, parseResultDate } from "@/lib/searchService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [synthesis, setSynthesis] = useState("");
  const [maxResults, setMaxResults] = useState(20);
  const [sources, setSources] = useState({
    ieee: true,
    clinical: true,
    googleScholar: true,
    patents: true,
    news: true
  });
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterOptions>({
    dateFrom: "",
    dateTo: "",
    insightCategories: [],
    booleanOperator: "AND",
    minMarketImpact: 0,
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (location.state) {
      const { query: savedQuery, sources: savedSources, maxResults: savedMaxResults } = location.state as any;
      if (savedQuery) setQuery(savedQuery);
      if (savedSources) setSources(savedSources);
      if (savedMaxResults) setMaxResults(savedMaxResults);
      if (savedQuery) {
        handleSearch(savedQuery, savedSources, savedMaxResults);
      }
    }
  }, [location.state]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSearch = async (searchQuery?: string, searchSources?: any, searchMaxResults?: number) => {
    const finalQuery = searchQuery || query;
    const finalSources = searchSources || sources;
    const finalMaxResults = searchMaxResults || maxResults;
    
    if (!finalQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    const activeSourceCount = Object.values(finalSources).filter(Boolean).length;
    if (activeSourceCount === 0) {
      toast.error("Please select at least one data source");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setResults([]);
    setSynthesis("");

    try {
      const searchResults = await searchAllSources({
        query: finalQuery,
        maxResults: finalMaxResults,
        sources: finalSources
      });

      setResults(searchResults);

      if (searchResults.length > 0) {
        setIsSynthesizing(true);
        const synthesisText = await synthesizeResults(finalQuery, searchResults);
        setSynthesis(synthesisText);
        
        await saveSearch(finalQuery, finalSources, finalMaxResults, searchResults, synthesisText);
        toast.success("Search completed and saved!");
      } else {
        toast.info("No results found");
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
      setIsSynthesizing(false);
    }
  };

  // Apply date filters to results
  const filteredResults = useMemo(() => {
    if (!advancedFilters.dateFrom && !advancedFilters.dateTo) {
      return results;
    }
    
    const fromDate = advancedFilters.dateFrom ? new Date(advancedFilters.dateFrom) : null;
    const toDate = advancedFilters.dateTo ? new Date(advancedFilters.dateTo) : null;
    
    // Set toDate to end of day for inclusive comparison
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }
    
    const today = new Date();
    
    return results.filter(result => {
      const parsedDate = parseResultDate(result.date);
      
      // If date couldn't be parsed, include the result (don't filter it out)
      if (!parsedDate) return true;
      
      // Reject dates in the future (likely hallucinations/errors)
      if (parsedDate > today) {
        console.warn(`Filtered out future date: ${result.date} for result: ${result.title}`);
        return false;
      }
      
      // Apply date range filter
      if (fromDate && parsedDate < fromDate) return false;
      if (toDate && parsedDate > toDate) return false;
      
      return true;
    });
  }, [results, advancedFilters.dateFrom, advancedFilters.dateTo]);

  const getCounts = () => {
    return {
      ieee: filteredResults.filter(r => r.source === 'IEEE').length,
      industryNews: filteredResults.filter(r => r.source === 'IndustryNews').length,
      googleScholar: filteredResults.filter(r => r.source === 'Google Scholar').length,
      patents: filteredResults.filter(r => r.source === 'Patents').length,
      businessNews: filteredResults.filter(r => r.source === 'BusinessNews').length,
    };
  };

  return (
    <div className="min-h-screen transition-all duration-500 bg-surface-sunken">
      <SearchHeader
        query={query}
        setQuery={setQuery}
        onSearch={() => handleSearch()}
        isSearching={isSearching}
        user={user}
        onHistoryClick={() => navigate("/history")}
        onSignOut={handleSignOut}
        hasResults={hasSearched && results.length > 0}
      />
      
      <div className="container mx-auto px-6 py-8 space-y-8 transition-all duration-300">
        
        {/* Filters Section */}
        <div className="bg-card rounded-xl border border-border/30 shadow-card p-6">
          <SearchFilters 
            sources={sources} 
            setSources={setSources} 
            maxResults={maxResults} 
            setMaxResults={setMaxResults} 
          />
        </div>
        <details className="group bg-card rounded-xl border border-border/30 shadow-card">
          <summary className="p-4 cursor-pointer flex items-center justify-between font-medium text-foreground hover:bg-muted/50 rounded-xl transition-colors">
            <span className="flex items-center gap-2">
              <span>Advanced Filters</span>
            </span>
            <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="px-6 pb-6">
            <AdvancedFilters filters={advancedFilters} setFilters={setAdvancedFilters} />
          </div>
        </details>
        
        {/* Document Intelligence - Collapsible */}
        <details className="group bg-card rounded-xl border border-border/30 shadow-card">
          <summary className="p-4 cursor-pointer flex items-center justify-between font-medium text-foreground hover:bg-muted/50 rounded-xl transition-colors">
            <span className="flex items-center gap-2">
              <span>Document Intelligence</span>
              <span className="text-xs text-muted-foreground font-normal">(Upload files or connect external sources)</span>
            </span>
            <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="p-0">
            <DocumentUpload />
          </div>
        </details>
        
        {hasSearched && (
          <>
            {/* Jump-to Navigation */}
            <SectionNavigation hasResults={hasSearched} hasSynthesis={!!synthesis} />
            
            {/* KPI Cards */}
            <div id="stats">
              <StatsCards 
                counts={getCounts()} 
                isSearching={isSearching} 
              />
            </div>
            
            {/* Normal Mode Layout - Single Column Long Scroll */}
            {/* Executive Intelligence Brief */}
            <div id="synthesis">
              <SynthesisPanel 
                synthesis={synthesis}
                isSearching={isSynthesizing}
                query={query}
                results={filteredResults}
              />
            </div>
            
            {/* Competitive Landscape */}
            {synthesis && filteredResults.length > 0 && (
              <div id="landscape">
                <CompetitiveLandscape results={filteredResults} synthesis={synthesis} />
              </div>
            )}
            
            {/* Data Visualization */}
            <div id="visualization">
              <DataVisualization results={filteredResults} isLoading={isSearching} query={query} />
            </div>
            
            {/* Search Results - Full Width */}
            <div id="results">
              <ResultsTabs 
                results={filteredResults} 
                isSearching={isSearching}
                query={query}
              />
            </div>
            
            {/* Document AI - Full Width */}
            <div id="documents">
              <DocumentChat />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
