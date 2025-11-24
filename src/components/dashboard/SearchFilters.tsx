import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Database, FileText, Microscope, Scale } from "lucide-react";

export const SearchFilters = () => {
  const sources = [
    { id: "pubmed", label: "PubMed", icon: Microscope, enabled: true },
    { id: "clinical", label: "ClinicalTrials.gov", icon: FileText, enabled: true },
    { id: "arxiv", label: "arXiv / Preprints", icon: Database, enabled: true },
    { id: "patents", label: "Patents (EPO)", icon: Scale, enabled: false },
  ];

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex gap-4 flex-wrap">
          {sources.map((source) => {
            const Icon = source.icon;
            return (
              <div key={source.id} className="flex items-center gap-2">
                <Checkbox id={source.id} defaultChecked={source.enabled} />
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
          <Label className="text-sm font-medium mb-2 block">Max Results: 20</Label>
          <Slider defaultValue={[20]} max={100} min={5} step={5} />
        </div>
      </div>
    </Card>
  );
};
