import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Copy, TrendingUp, Target, Briefcase, Lightbulb, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const ExecutiveSnapshot = ({ results }: { results: SearchResult[] }) => {
  const newsCount = results.filter(r => r.source === 'News').length;
  const patentCount = results.filter(r => r.source === 'Patents').length;
  const researchCount = results.filter(r => r.source === 'PubMed' || r.source === 'arXiv').length;
  const projectCount = results.filter(r => r.source === 'ClinicalTrials').length;
  
  const momentum = results.length > 15 ? "High" : results.length > 5 ? "Moderate" : "Low";
  const competitive = newsCount > 5 ? "Intense" : newsCount > 2 ? "Active" : "Limited";
  const commercial = projectCount > 3 ? "Advanced" : projectCount > 0 ? "Developing" : "Early Stage";
  const innovation = patentCount > 3 ? "Strong" : patentCount > 0 ? "Active" : "Emerging";

  const metrics = [
    { label: "Market Momentum", value: momentum, icon: TrendingUp },
    { label: "Competitive Intensity", value: competitive, icon: Target },
    { label: "Commercial Readiness", value: commercial, icon: Briefcase },
    { label: "IP & Innovation Activity", value: innovation, icon: Lightbulb },
  ];

  return (
    <div className="bg-muted/40 rounded-lg p-4 mb-5">
      <h4 className="text-caption font-semibold text-muted-foreground uppercase tracking-wide mb-3">Executive Snapshot</h4>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center gap-2">
            <metric.icon className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <span className="text-xs text-muted-foreground block truncate">{metric.label}</span>
              <span className="text-sm font-semibold text-foreground">{metric.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExecutiveSignal = ({ synthesis }: { synthesis: string }) => {
  // Extract a key insight from synthesis
  const lines = synthesis.split('\n').filter(line => line.trim());
  const keyInsight = lines.find(line => 
    line.includes('significant') || 
    line.includes('opportunity') || 
    line.includes('growth') ||
    line.includes('emerging') ||
    line.includes('leading')
  ) || lines[1] || "Multiple market signals detected across intelligence sources.";
  
  const cleanInsight = keyInsight.replace(/^[#*\-\s]+/, '').replace(/\*\*/g, '').slice(0, 180);

  return (
    <div className="bg-primary/8 border border-primary/20 rounded-lg p-4 mb-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">Executive Signal</span>
          <p className="text-sm text-foreground mt-1 leading-relaxed">{cleanInsight}</p>
        </div>
      </div>
    </div>
  );
};

export const SynthesisPanel = ({ synthesis, isSearching, query, results }: SynthesisPanelProps) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(synthesis);
    toast({
      title: "Copied to clipboard",
      description: "Executive intelligence brief has been copied to your clipboard.",
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
    <Card className="flex flex-col h-[calc(100vh-6rem)] shadow-card border-border/60">
      <CardHeader className="shrink-0 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-title">Executive Intelligence Brief</CardTitle>
        </div>
        <CardDescription className="text-caption">
          CXO-level synthesis of market signals, competition, and commercialization
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        {isSearching ? (
          <div className="space-y-4 p-6">
            <div className="bg-muted/40 rounded-lg p-4 space-y-3">
              <Skeleton className="h-3 w-32" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : synthesis ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 px-6 py-4">
              <ExecutiveSnapshot results={results} />
              <ExecutiveSignal synthesis={synthesis} />
              
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <div className="mt-6 mb-3 pb-2 border-b border-border/30">
                        <h2 className="text-subtitle font-semibold text-primary m-0">{children}</h2>
                      </div>
                    ),
                    h3: ({ children }) => <h3 className="text-body font-semibold mt-4 mb-2 text-foreground">{children}</h3>,
                    p: ({ children }) => <p className="text-body text-foreground leading-relaxed mb-3">{children}</p>,
                    ul: ({ children }) => <ul className="text-body space-y-1.5 mb-3 list-disc pl-5">{children}</ul>,
                    li: ({ children }) => <li className="text-foreground">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                  }}
                >
                  {synthesis}
                </ReactMarkdown>
              </div>
            </ScrollArea>
            
            <div className="shrink-0 px-6 py-4 border-t border-border/40 space-y-3 bg-muted/20">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-card hover:bg-muted border-border/60"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Brief
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Synthesized from {results.length} intelligence sources
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground px-6">
            <div className="p-3 bg-muted/40 rounded-full w-fit mx-auto mb-3">
              <Sparkles className="h-6 w-6 opacity-60" />
            </div>
            <p className="text-body font-medium">Executive intelligence brief</p>
            <p className="text-caption mt-1">Analysis will appear after search completes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
