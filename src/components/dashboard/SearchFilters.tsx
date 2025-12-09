import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Database, FileText, GraduationCap, Scale, Newspaper } from "lucide-react";

interface SearchFiltersProps {
  sources: {
    ieee: boolean;
    clinical: boolean;
    googleScholar: boolean;
    patents: boolean;
    news: boolean;
  };
  setSources: (sources: any) => void;
  maxResults: number;
  setMaxResults: (value: number) => void;
}

export const SearchFilters = ({ sources, setSources, maxResults, setMaxResults }: SearchFiltersProps) => {
  const sourceOptions = [
    { id: "ieee", label: "IEEE Xplore", icon: Database },
    { id: "clinical", label: "Industry News", icon: FileText },
    { id: "googleScholar", label: "Google Scholar", icon: GraduationCap },
    { id: "patents", label: "Patents (EPO)", icon: Scale },
    { id: "news", label: "Business News", icon: Newspaper },
  ];

  const handleSourceToggle = (sourceId: string) => {
    setSources((prev: any) => ({ ...prev, [sourceId]: !prev[sourceId] }));
  };

  const handleMaxResultsInput = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(100, Math.max(5, numValue));
      setMaxResults(clampedValue);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex gap-4 flex-wrap">
          {sourceOptions.map((source) => {
            const Icon = source.icon;
            return (
              <div key={source.id} className="flex items-center gap-2">
                <Checkbox 
                  id={source.id} 
                  checked={sources[source.id as keyof typeof sources]}
                  onCheckedChange={() => handleSourceToggle(source.id)}
                />
                <Label 
                  htmlFor={source.id} 
                  className="flex items-center gap-2 cursor-pointer text-sm font-medium"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {source.label}
                </Label>
              </div>
            );
          })}
        </div>
        
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-3 mb-2">
            <Label className="text-sm font-medium">Max Results:</Label>
            <Input
              type="number"
              min={5}
              max={100}
              value={maxResults}
              onChange={(e) => handleMaxResultsInput(e.target.value)}
              className="w-20 h-8 text-sm bg-background"
            />
          </div>
          <Slider 
            value={[maxResults]} 
            max={100} 
            min={5} 
            step={5}
            onValueChange={(value) => setMaxResults(value[0])}
          />
        </div>
      </div>
    </Card>
  );
};