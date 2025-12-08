import { Search, Settings, Layers, History, LogOut, Radar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SituationRoomToggle } from "./SituationRoomToggle";
import { cn } from "@/lib/utils";

interface SearchHeaderProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  user?: any;
  onHistoryClick?: () => void;
  onSignOut?: () => void;
  situationRoomMode?: boolean;
  onSituationRoomToggle?: () => void;
}

export const SearchHeader = ({
  query,
  setQuery,
  onSearch,
  isSearching,
  user,
  onHistoryClick,
  onSignOut,
  situationRoomMode = false,
  onSituationRoomToggle
}: SearchHeaderProps) => {
  return (
    <header className={cn(
      "sticky top-0 z-10 border-b border-border/40 transition-all duration-300",
      situationRoomMode ? "bg-surface-command-dark" : "bg-surface-command"
    )}>
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-2.5 rounded-lg shadow-elevated transition-all duration-300",
              situationRoomMode ? "bg-primary animate-beacon-glow" : "bg-primary"
            )}>
              <Radar className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {situationRoomMode ? "Situation Room" : "Market Insights Engine"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {situationRoomMode ? "Executive Command Center • Live Intelligence" : "Unified Market, Startup & Technology Intelligence"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onSituationRoomToggle && (
              <SituationRoomToggle 
                isActive={situationRoomMode} 
                onToggle={onSituationRoomToggle} 
              />
            )}
            {user && !situationRoomMode && (
              <>
                <Button 
                  variant="ghost" 
                  onClick={onHistoryClick} 
                  className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <History className="h-4 w-4" />
                  History
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={onSignOut} 
                  className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            )}
            {!situationRoomMode && (
              <Button 
                variant="ghost" 
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Command Center Search - Hidden in Situation Room */}
        {!situationRoomMode && (
          <div className="bg-surface-dark rounded-xl p-4 shadow-command border border-border/30">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  value={query} 
                  onChange={e => setQuery(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && onSearch()} 
                  placeholder="Market / Technology / Keyword Search... (e.g., Renewable Energy, Hydrogen Storage, Carbon Capture)" 
                  className="pl-12 h-14 text-base bg-surface-elevated border-border/40 text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-all" 
                />
              </div>
              <Button 
                onClick={onSearch} 
                disabled={isSearching} 
                className="px-10 h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-elevated transition-all"
              >
                {isSearching ? "Scanning..." : "Search Intelligence"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
