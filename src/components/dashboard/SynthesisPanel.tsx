import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SearchResult } from "@/lib/searchService";
import { exportToPDF } from "@/lib/exportService";
import ReactMarkdown from "react-markdown";

interface SynthesisPanelProps {
  synthesis: string;
  isSearching: boolean;
  query: string;
  results: SearchResult[];
}

export const SynthesisPanel = ({ synthesis, isSearching, query, results }: SynthesisPanelProps) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(synthesis);
    toast({
      title: "Copied to clipboard",
      description: "AI synthesis has been copied to your clipboard.",
    });
  };

  const handleExport = async () => {
    try {
      await exportToPDF(query, results, synthesis);
      toast({
        title: "Export successful",
        description: "Report has been downloaded as HTML (printable to PDF)",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the report",
        variant: "destructive"
      });
    }
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
        ) : synthesis ? (
          <>
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => <h2 className="text-base font-semibold mt-4 mb-2 text-primary">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1.5 text-foreground">{children}</h3>,
                  p: ({ children }) => <p className="text-sm text-foreground leading-relaxed mb-2">{children}</p>,
                  ul: ({ children }) => <ul className="text-sm space-y-1 mb-2 list-disc pl-4">{children}</ul>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                }}
              >
                {synthesis}
              </ReactMarkdown>
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
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Generated from {results.length} sources • Powered by AI
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">AI synthesis will appear here after search</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
