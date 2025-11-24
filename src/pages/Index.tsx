import { useState } from "react";
import { SearchHeader } from "@/components/dashboard/SearchHeader";
import { SearchFilters } from "@/components/dashboard/SearchFilters";
import { ResultsTabs } from "@/components/dashboard/ResultsTabs";
import { SynthesisPanel } from "@/components/dashboard/SynthesisPanel";
import { StatsCards } from "@/components/dashboard/StatsCards";

const Index = () => {
  const [query, setQuery] = useState("semaglutide Parkinson's disease");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    setHasSearched(true);
    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
    }, 1500);
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
        <SearchFilters />
        
        {hasSearched && (
          <>
            <StatsCards isSearching={isSearching} />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ResultsTabs isSearching={isSearching} />
              </div>
              <div>
                <SynthesisPanel isSearching={isSearching} />
              </div>
            </div>
          </>
        )}
        
        {!hasSearched && (
          <div className="text-center py-20">
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
        )}
      </div>
    </div>
  );
};

export default Index;
