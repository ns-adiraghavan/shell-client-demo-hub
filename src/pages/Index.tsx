import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { searchAllSources, synthesizeResults, saveSearch, SearchResult } from "@/lib/searchService";
import { toast } from "sonner";
import { History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState("Renewable Energy Hydrogen Storage");
  const [isSearching, setIsSearching] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [synthesis, setSynthesis] = useState("");
  const [maxResults, setMaxResults] = useState(20);
  const [sources, setSources] = useState({
    pubmed: true,
    clinical: true,
    arxiv: true,
    patents: false,
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

  const getCounts = () => {
    return {
      pubmed: results.filter(r => r.source === 'PubMed').length,
      clinical: results.filter(r => r.source === 'ClinicalTrials').length,
      arxiv: results.filter(r => r.source === 'arXiv').length,
      patents: results.filter(r => r.source === 'Patents').length,
      news: results.filter(r => r.source === 'News').length,
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader 
        query={query}
        setQuery={setQuery}
        onSearch={() => handleSearch()}
        isSearching={isSearching}
        user={user}
        onHistoryClick={() => navigate("/history")}
        onSignOut={handleSignOut}
      />
      
      <div className="container mx-auto px-6 py-8 space-y-8">
        
        <div className="bg-card rounded-xl border border-border/60 shadow-card p-6">
          <SearchFilters 
            sources={sources} 
            setSources={setSources} 
            maxResults={maxResults} 
            setMaxResults={setMaxResults} 
          />
        </div>
        <div className="bg-card rounded-xl border border-border/60 shadow-card p-6">
          <AdvancedFilters filters={advancedFilters} setFilters={setAdvancedFilters} />
        </div>
        
        {hasSearched && (
          <>
            <StatsCards counts={getCounts()} isSearching={isSearching} />
            
            {/* AI Insights & Competitive Landscape Row */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="max-h-[560px] overflow-y-auto">
                <SynthesisPanel 
                  synthesis={synthesis}
                  isSearching={isSynthesizing}
                  query={query}
                  results={results}
                />
              </div>
              {synthesis && results.length > 0 && (
                <div className="max-h-[560px] overflow-y-auto">
                  <CompetitiveLandscape results={results} synthesis={synthesis} />
                </div>
              )}
            </div>
            
            <DataVisualization results={results} isLoading={isSearching} query={query} />
            
            {/* Search Results & Document AI Row */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="max-h-[640px] overflow-y-auto">
                <ResultsTabs 
                  results={results} 
                  isSearching={isSearching}
                  query={query}
                />
              </div>
              <div className="max-h-[640px] overflow-y-auto">
                <DocumentChat />
              </div>
            </div>
          </>
        )}
        
        {!hasSearched && (
          <div className="space-y-10">
            <div className="text-center py-16">
              <div className="max-w-2xl mx-auto space-y-5">
                <h2 className="text-display text-foreground">
                  Welcome to Market Insights Engine
                </h2>
                <p className="text-subtitle text-muted-foreground">
                  Track business updates, innovation, investments, partnerships, research, and patents across global markets in one intelligent workspace.
                </p>
                <div className="pt-8">
                  <button 
                    onClick={() => handleSearch()}
                    className="px-10 py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-elevated"
                  >
                    Start Intelligence Scan
                  </button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="search" className="max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1 rounded-lg">
                <TabsTrigger value="search" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card">Quick Start</TabsTrigger>
                <TabsTrigger value="upload" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card">Upload Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="search" className="space-y-4 pt-6">
                <div className="text-center p-8 bg-card rounded-xl border border-border/60 shadow-card">
                  <h3 className="text-title mb-4 text-foreground">How to Use</h3>
                  <ol className="text-left max-w-lg mx-auto space-y-3 text-body text-muted-foreground">
                    <li className="flex gap-3"><span className="text-primary font-semibold">1.</span> Enter your market, technology, or competitive keyword above</li>
                    <li className="flex gap-3"><span className="text-primary font-semibold">2.</span> Select intelligence sources (Research, Projects, Patents, News)</li>
                    <li className="flex gap-3"><span className="text-primary font-semibold">3.</span> Click Search to aggregate insights across multiple sources</li>
                    <li className="flex gap-3"><span className="text-primary font-semibold">4.</span> Review AI-generated strategic synthesis and competitive landscape</li>
                    <li className="flex gap-3"><span className="text-primary font-semibold">5.</span> Export executive reports as PDF or raw data as CSV</li>
                  </ol>
                </div>
              </TabsContent>
              <TabsContent value="upload" className="pt-6">
                <DocumentUpload />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
