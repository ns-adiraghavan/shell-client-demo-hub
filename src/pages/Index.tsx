import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SearchHeader } from "@/components/dashboard/SearchHeader";
import { SearchFilters } from "@/components/dashboard/SearchFilters";
import { AdvancedFilters, AdvancedFilterOptions } from "@/components/dashboard/AdvancedFilters";
import { ResultsTabs } from "@/components/dashboard/ResultsTabs";
import { SynthesisPanel } from "@/components/dashboard/SynthesisPanel";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DocumentUpload } from "@/components/dashboard/DocumentUpload";
import { DataVisualization } from "@/components/dashboard/DataVisualization";
import { DocumentChat } from "@/components/dashboard/DocumentChat";
import { Button } from "@/components/ui/button";
import { searchAllSources, synthesizeResults, saveSearch, SearchResult } from "@/lib/searchService";
import { toast } from "sonner";
import { History, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState("semaglutide Parkinson's disease");
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
    studyTypes: [],
    booleanOperator: "AND",
    minImpactFactor: 0,
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <SearchHeader 
              query={query}
              setQuery={setQuery}
              onSearch={() => handleSearch()}
              isSearching={isSearching}
            />
          </div>
          {user && (
            <div className="flex items-center gap-2 ml-4">
              <Button variant="outline" onClick={() => navigate("/history")} className="gap-2">
                <History className="h-4 w-4" />
                History
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
        
        <SearchFilters 
          sources={sources} 
          setSources={setSources} 
          maxResults={maxResults} 
          setMaxResults={setMaxResults} 
        />
        
        <AdvancedFilters filters={advancedFilters} setFilters={setAdvancedFilters} />
        
        {hasSearched && (
          <>
            <StatsCards counts={getCounts()} isSearching={isSearching} />
            
            <DataVisualization results={results} isLoading={isSearching} />
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ResultsTabs 
                  results={results} 
                  isSearching={isSearching}
                  query={query}
                />
                <DocumentChat />
              </div>
              <div>
                <SynthesisPanel 
                  synthesis={synthesis}
                  isSearching={isSynthesizing}
                  query={query}
                  results={results}
                />
              </div>
            </div>
          </>
        )}
        
        {!hasSearched && (
          <div className="space-y-8">
            <div className="text-center py-12">
              <div className="max-w-2xl mx-auto space-y-4">
                <h2 className="text-3xl font-bold text-foreground">
                  Welcome to PharmaAI Research Dashboard
                </h2>
                <p className="text-lg text-muted-foreground">
                  Search across PubMed, ClinicalTrials.gov, arXiv, and patent databases. 
                  Get AI-powered synthesis of biomedical literature.
                </p>
                <div className="pt-6">
                  <button 
                    onClick={() => handleSearch()}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Start Your Search
                  </button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="search" className="max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search">Quick Start</TabsTrigger>
                <TabsTrigger value="upload">Upload Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="search" className="space-y-4 pt-4">
                <div className="text-center p-8 bg-card rounded-lg border">
                  <h3 className="text-xl font-semibold mb-3">How to Use</h3>
                  <ol className="text-left max-w-md mx-auto space-y-2 text-muted-foreground">
                    <li>1. Enter your research topic or drug-disease query above</li>
                    <li>2. Select which databases to search</li>
                    <li>3. Click Search to get results from multiple sources</li>
                    <li>4. Review the AI-generated synthesis and detailed results</li>
                    <li>5. Export your findings as PDF or CSV</li>
                  </ol>
                </div>
              </TabsContent>
              <TabsContent value="upload" className="pt-4">
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
