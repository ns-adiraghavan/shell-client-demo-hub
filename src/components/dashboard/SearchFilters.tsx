import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Database, FileText, Microscope, Scale } from "lucide-react";

interface SearchFiltersProps {
  sources: {
    pubmed: boolean;
    clinical: boolean;
    arxiv: boolean;
    patents: boolean;
  };
  setSources: (sources: any) => void;
  maxResults: number;
  setMaxResults: (value: number) => void;
}

export const SearchFilters = ({ sources, setSources, maxResults, setMaxResults }: SearchFiltersProps) => {
  const sourceOptions = [
    { id: "pubmed", label: "PubMed", icon: Microscope },
    { id: "clinical", label: "ClinicalTrials.gov", icon: FileText },
    { id: "arxiv", label: "arXiv / Preprints", icon: Database },
    { id: "patents", label: "Patents (EPO)", icon: Scale },
  ];

  const handleSourceToggle = (sourceId: string) => {
    setSources((prev: any) => ({ ...prev, [sourceId]: !prev[sourceId] }));
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
        
        <div className="flex-1 min-w-[200px]">
          <Label className="text-sm font-medium mb-2 block">Max Results: {maxResults}</Label>
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
