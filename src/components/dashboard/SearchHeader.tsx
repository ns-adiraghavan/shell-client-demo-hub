import { useState, useEffect } from "react";
import { Search, History, LogOut, Radar, ChevronDown, ChevronUp } from "lucide-react";
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
  showWelcome?: boolean;
  hasResults?: boolean;
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
  onSituationRoomToggle,
  showWelcome = false,
  hasResults = false
}: SearchHeaderProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [manuallyExpanded, setManuallyExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only auto-collapse if we have results, not manually expanded, and scrolling down past 100px
      if (hasResults && !isSearching && !manuallyExpanded && currentScrollY > 100) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasResults, isSearching, manuallyExpanded]);

  // Expand when searching starts
  useEffect(() => {
    if (isSearching) {
      setIsCollapsed(false);
      setManuallyExpanded(false);
    }
  }, [isSearching]);

  const handleExpand = () => {
    setIsCollapsed(false);
    setManuallyExpanded(true);
  };

  const handleCollapse = () => {
    setIsCollapsed(true);
    setManuallyExpanded(false);
  };

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
                {situationRoomMode ? "Situation Room" : "Innovation Insights Engine"}
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
          </div>
        </div>
        
        {/* Command Center Search - Hidden in Situation Room */}
        {!situationRoomMode && (
          <div className="relative">
            {/* Collapsed state toggle */}
            {hasResults && isCollapsed && (
              <Button
                variant="outline"
                onClick={handleExpand}
                className="w-full flex items-center justify-center gap-2 h-12 bg-surface-dark border-border/40 hover:bg-surface-elevated"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">New Search</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            
            {/* Expanded search bar */}
            <div className={cn(
              "bg-surface-dark rounded-xl p-4 shadow-command border border-border/30 transition-all duration-300",
              hasResults && isCollapsed ? "hidden" : "block"
            )}>
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
              {hasResults && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCollapse}
                  className="mt-2 w-full text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse Search
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};