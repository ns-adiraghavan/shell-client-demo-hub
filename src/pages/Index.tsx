import { useState } from "react";
import { SearchHeader } from "@/components/dashboard/SearchHeader";
import { SearchFilters } from "@/components/dashboard/SearchFilters";
import { ResultsTabs } from "@/components/dashboard/ResultsTabs";
import { SynthesisPanel } from "@/components/dashboard/SynthesisPanel";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DocumentUpload } from "@/components/dashboard/DocumentUpload";
import { searchAllSources, synthesizeResults, saveSearch, SearchResult } from "@/lib/searchService";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
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
    patents: false
  });
  const { toast } = useToast();

  const handleSearch = async (searchQuery?: string, searchSources?: any, searchMaxResults?: number) => {
    const finalQuery = searchQuery || query;
    const finalSources = searchSources || sources;
    const finalMaxResults = searchMaxResults || maxResults;
    if (!query.trim()) {
      toast({
        title: "Empty query",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setResults([]);
    setSynthesis("");

    try {
      const searchResults = await searchAllSources({
        query,
        maxResults,
        sources
      });

      setResults(searchResults);

      if (searchResults.length > 0) {
        setIsSynthesizing(true);
        const synthesisText = await synthesizeResults(query, searchResults);
        setSynthesis(synthesisText);
        
        // Auto-save search (optional - requires auth)
        try {
          await saveSearch(query, sources, maxResults, searchResults, synthesisText);
        } catch (err) {
          // Silent fail if not authenticated
          console.log('Search not saved:', err);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "There was an error performing the search. Please try again.",
        variant: "destructive"
      });
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
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader 
        query={query}
        setQuery={setQuery}
        onSearch={handleSearch}
        isSearching={isSearching}
      />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
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
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ResultsTabs 
                  results={results} 
                  isSearching={isSearching}
                  query={query}
                />
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
                    onClick={handleSearch}
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
