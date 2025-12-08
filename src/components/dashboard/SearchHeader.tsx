import { Search, Settings, Layers, History, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchHeaderProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  user?: any;
  onHistoryClick?: () => void;
  onSignOut?: () => void;
}

export const SearchHeader = ({
  query,
  setQuery,
  onSearch,
  isSearching,
  user,
  onHistoryClick,
  onSignOut
}: SearchHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Market Insights Engine</h1>
              <p className="text-sm text-muted-foreground">Unified Market, Startup & Technology Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <>
                <Button variant="outline" onClick={onHistoryClick} className="gap-2">
                  <History className="h-4 w-4" />
                  History
                </Button>
                <Button variant="outline" onClick={onSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            )}
            <Button variant="outline" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && onSearch()} 
              placeholder="Market / Technology / Keyword Search... (e.g., Renewable Energy, Hydrogen Storage, Carbon Capture)" 
              className="pl-10 h-12 text-base" 
            />
          </div>
          <Button onClick={onSearch} disabled={isSearching} className="px-8 h-12">
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>
    </header>
  );
};