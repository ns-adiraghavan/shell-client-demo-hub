import { Search, Settings, Codepen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
interface SearchHeaderProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  isSearching: boolean;
}
export const SearchHeader = ({
  query,
  setQuery,
  onSearch,
  isSearching
}: SearchHeaderProps) => {
  return <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Codepen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pharma Insights Engine</h1>
              <p className="text-sm text-muted-foreground">Biomedical Literature Synthesizer</p>
            </div>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch()} placeholder="Enter research topic or drug-disease query..." className="pl-10 h-12 text-base" />
          </div>
          <Button onClick={onSearch} disabled={isSearching} className="px-8 h-12">
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>
    </header>;
};