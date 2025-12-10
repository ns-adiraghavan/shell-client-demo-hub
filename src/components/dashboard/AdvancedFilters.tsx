import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Info } from "lucide-react";

export interface AdvancedFilterOptions {
  dateFrom: string;
  dateTo: string;
  insightCategories: string[];
  booleanOperator: "AND" | "OR" | "NOT";
  minMarketImpact: number;
}

interface AdvancedFiltersProps {
  filters: AdvancedFilterOptions;
  setFilters: (filters: AdvancedFilterOptions) => void;
}

export const AdvancedFilters = ({ filters, setFilters }: AdvancedFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Date From
          </Label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">Filter by announcement, publication, or filing date</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Date To
          </Label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">Filter by announcement, publication, or news date</p>
        </div>

        {/* Keyword Match Logic */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Keyword Match Logic</Label>
          <Select
            value={filters.booleanOperator}
            onValueChange={(value: "AND" | "OR" | "NOT") =>
              setFilters({ ...filters, booleanOperator: value })
            }
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND (all terms)</SelectItem>
              <SelectItem value="OR">OR (any term)</SelectItem>
              <SelectItem value="NOT">NOT (exclude terms)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Market Impact Score */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            Minimum Market Impact Score
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  <p className="font-medium mb-1">Market Impact Score (0-10)</p>
                  <p className="text-muted-foreground">
                    AI-calculated score based on: source credibility, entity prominence, 
                    commercial relevance, geographic reach, and recency. Higher scores 
                    indicate stronger market signals for strategic decision-making.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={filters.minMarketImpact}
            onChange={(e) =>
              setFilters({ ...filters, minMarketImpact: parseFloat(e.target.value) || 0 })
            }
            placeholder="e.g., 5.0"
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">Filters weak signals vs high-impact developments</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground italic">
        Note: Insight category filtering is available in the Live Intelligence Feed section below.
      </p>
    </div>
  );
};
