import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  SlidersHorizontal, 
  Briefcase, 
  Rocket, 
  Handshake, 
  TrendingUp, 
  GraduationCap, 
  FileText, 
  Lightbulb 
} from "lucide-react";

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

const insightCategoryOptions = [
  { id: "business-updates", label: "Business Updates", icon: Briefcase },
  { id: "product-announcements", label: "Product / Project Announcements", icon: Rocket },
  { id: "partnerships", label: "Partnerships & Collaborations", icon: Handshake },
  { id: "investments", label: "Investments & Funding", icon: TrendingUp },
  { id: "academic-research", label: "Academic Research & Tie-ups", icon: GraduationCap },
  { id: "patent-ip", label: "Patent & IP Activity", icon: FileText },
  { id: "startup-innovation", label: "Startup & Innovation News", icon: Lightbulb },
];

export const AdvancedFilters = ({ filters, setFilters }: AdvancedFiltersProps) => {
  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.insightCategories.includes(categoryId)
      ? filters.insightCategories.filter((c) => c !== categoryId)
      : [...filters.insightCategories, categoryId];
    setFilters({ ...filters, insightCategories: newCategories });
  };

  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Advanced Filters</h3>
      </div>

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
          <Label className="text-sm font-medium text-foreground">Minimum Market Impact Score</Label>
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

      {/* Insight Categories */}
      <div className="mt-4 space-y-2">
        <Label className="text-sm font-medium text-foreground">Insight Categories</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {insightCategoryOptions.map((category) => {
            const Icon = category.icon;
            const isChecked = filters.insightCategories.includes(category.id);
            return (
              <div 
                key={category.id} 
                className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                  isChecked ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                }`}
              >
                <Checkbox
                  id={category.id}
                  checked={isChecked}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor={category.id}
                  className="text-sm cursor-pointer font-normal flex items-center gap-2"
                >
                  <Icon className={`h-4 w-4 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                  {category.label}
                </Label>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
