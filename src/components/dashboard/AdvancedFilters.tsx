import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Filter } from "lucide-react";

export interface AdvancedFilterOptions {
  dateFrom: string;
  dateTo: string;
  studyTypes: string[];
  booleanOperator: "AND" | "OR";
  minImpactFactor: number;
}

interface AdvancedFiltersProps {
  filters: AdvancedFilterOptions;
  setFilters: (filters: AdvancedFilterOptions) => void;
}

const studyTypeOptions = [
  { id: "clinical-trial", label: "Clinical Trials" },
  { id: "meta-analysis", label: "Meta-Analysis" },
  { id: "randomized", label: "Randomized Controlled Trial" },
  { id: "cohort", label: "Cohort Study" },
  { id: "case-control", label: "Case-Control Study" },
  { id: "review", label: "Systematic Review" },
];

export const AdvancedFilters = ({ filters, setFilters }: AdvancedFiltersProps) => {
  const handleStudyTypeToggle = (typeId: string) => {
    const newTypes = filters.studyTypes.includes(typeId)
      ? filters.studyTypes.filter((t) => t !== typeId)
      : [...filters.studyTypes, typeId];
    setFilters({ ...filters, studyTypes: newTypes });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Advanced Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date From
          </Label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date To
          </Label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </div>

        {/* Boolean Operator */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Boolean Operator</Label>
          <Select
            value={filters.booleanOperator}
            onValueChange={(value: "AND" | "OR") =>
              setFilters({ ...filters, booleanOperator: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND (all terms)</SelectItem>
              <SelectItem value="OR">OR (any term)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Impact Factor */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Min Impact Factor</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={filters.minImpactFactor}
            onChange={(e) =>
              setFilters({ ...filters, minImpactFactor: parseFloat(e.target.value) || 0 })
            }
            placeholder="e.g., 5.0"
          />
        </div>
      </div>

      {/* Study Types */}
      <div className="mt-4 space-y-2">
        <Label className="text-sm font-medium">Study Types</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {studyTypeOptions.map((type) => (
            <div key={type.id} className="flex items-center gap-2">
              <Checkbox
                id={type.id}
                checked={filters.studyTypes.includes(type.id)}
                onCheckedChange={() => handleStudyTypeToggle(type.id)}
              />
              <Label
                htmlFor={type.id}
                className="text-sm cursor-pointer font-normal"
              >
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
