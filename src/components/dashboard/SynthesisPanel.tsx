import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Copy, TrendingUp, Target, Briefcase, Lightbulb, AlertTriangle, Zap } from "lucide-react";
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
    { label: "Market Momentum", value: momentum, icon: TrendingUp, color: momentum === "High" ? "text-primary" : "text-foreground" },
    { label: "Competitive Intensity", value: competitive, icon: Target, color: competitive === "Intense" ? "text-primary" : "text-foreground" },
    { label: "Commercial Readiness", value: commercial, icon: Briefcase, color: commercial === "Advanced" ? "text-primary" : "text-foreground" },
    { label: "IP & Innovation", value: innovation, icon: Lightbulb, color: innovation === "Strong" ? "text-primary" : "text-foreground" },
  ];

  return (
    <div className="bg-surface-command rounded-xl p-5 mb-6 border border-border/30">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Executive Snapshot</h4>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-surface-elevated rounded-lg p-3 border border-border/20">
            <div className="flex items-center gap-2 mb-1">
              <metric.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground font-medium">{metric.label}</span>
            </div>
            <span className={`text-lg font-bold ${metric.color}`}>{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExecutiveSignal = ({ synthesis }: { synthesis: string }) => {
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
    <div className="bg-primary/10 border-l-4 border-primary rounded-r-lg p-5 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Executive Signal</span>
          <p className="text-sm text-foreground mt-2 leading-relaxed font-medium">{cleanInsight}</p>
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
    <Card className="flex flex-col h-[calc(100vh-6rem)] shadow-intel bg-surface-dark border-border/30">
      <CardHeader className="shrink-0 pb-4 border-b border-border/30 bg-surface-command/60">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-primary rounded-lg">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">Executive Intelligence Brief</CardTitle>
        </div>
        <CardDescription className="text-sm text-muted-foreground pl-12">
          CXO-level synthesis of market signals, competition, and commercialization
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        {isSearching ? (
          <div className="space-y-4 p-6">
            <div className="bg-surface-command/50 rounded-xl p-5 space-y-3 border border-border/20">
              <Skeleton className="h-3 w-32 bg-muted/40" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 bg-muted/40" />
                <Skeleton className="h-16 bg-muted/40" />
                <Skeleton className="h-16 bg-muted/40" />
                <Skeleton className="h-16 bg-muted/40" />
              </div>
            </div>
            <Skeleton className="h-4 w-full bg-muted/40" />
            <Skeleton className="h-4 w-full bg-muted/40" />
            <Skeleton className="h-4 w-3/4 bg-muted/40" />
          </div>
        ) : synthesis ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 px-6 py-5">
              <ExecutiveSnapshot results={results} />
              <ExecutiveSignal synthesis={synthesis} />
              
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <div className="mt-6 mb-3 pb-2 border-b border-border/20">
                        <h2 className="text-base font-bold text-primary m-0 uppercase tracking-wide">{children}</h2>
                      </div>
                    ),
                    h3: ({ children }) => <h3 className="text-sm font-semibold mt-4 mb-2 text-foreground">{children}</h3>,
                    p: ({ children }) => <p className="text-sm text-foreground/90 leading-relaxed mb-3">{children}</p>,
                    ul: ({ children }) => <ul className="text-sm space-y-2 mb-3 list-disc pl-5">{children}</ul>,
                    li: ({ children }) => <li className="text-foreground/90">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                  }}
                >
                  {synthesis}
                </ReactMarkdown>
              </div>
            </ScrollArea>
            
            <div className="shrink-0 px-6 py-4 border-t border-border/20 space-y-3 bg-surface-command/30">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-card/50 hover:bg-card border-border/40 text-foreground"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Brief
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-elevated"
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
          <div className="text-center py-16 text-muted-foreground px-6">
            <div className="p-4 bg-surface-command/50 rounded-full w-fit mx-auto mb-4 border border-border/20">
              <Sparkles className="h-8 w-8 opacity-60" />
            </div>
            <p className="text-base font-semibold text-foreground/80">Executive intelligence brief</p>
            <p className="text-sm mt-2">Analysis will appear after search completes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
