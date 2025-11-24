import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface SynthesisPanelProps {
  isSearching: boolean;
}

export const SynthesisPanel = ({ isSearching }: SynthesisPanelProps) => {
  const { toast } = useToast();

  const synthesis = `Recent research indicates that GLP-1 receptor agonists like semaglutide may offer neuroprotective benefits for Parkinson's disease through multiple mechanisms. Studies show potential for reducing neuroinflammation, improving mitochondrial function, and promoting neuronal survival.

Several Phase II clinical trials are currently evaluating semaglutide's efficacy in early Parkinson's disease, with preliminary results suggesting improvements in motor function and quality of life markers. The drug's established safety profile from diabetes treatment provides a favorable foundation for repurposing.

However, larger-scale trials are needed to confirm these findings and establish optimal dosing regimens for neurological applications. The intersection of metabolic and neurodegenerative pathways presents an exciting frontier for therapeutic development.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(synthesis);
    toast({
      title: "Copied to clipboard",
      description: "AI synthesis has been copied to your clipboard.",
    });
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>AI Synthesis</CardTitle>
        </div>
        <CardDescription>
          Comprehensive summary of all sources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSearching ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {synthesis}
              </p>
            </div>
            
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Generated from 90 sources • Powered by AI
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
