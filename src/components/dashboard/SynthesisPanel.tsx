import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Copy, TrendingUp, Target, Briefcase, Lightbulb, AlertTriangle, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { SearchResult } from "@/lib/searchService";
import { exportToPDF } from "@/lib/exportService";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface SynthesisPanelProps {
  synthesis: string;
  isSearching: boolean;
  query: string;
  results: SearchResult[];
  situationRoomMode?: boolean;
}

const ExecutiveSnapshot = ({ results, situationRoomMode = false }: { results: SearchResult[]; situationRoomMode?: boolean }) => {
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
    <div className={cn(
      "bg-surface-command rounded-xl mb-6 border border-border/30",
      situationRoomMode ? "p-8" : "p-5"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Zap className={cn("text-primary", situationRoomMode ? "h-6 w-6" : "h-4 w-4")} />
        <h4 className={cn(
          "font-bold text-primary uppercase tracking-wider",
          situationRoomMode ? "text-base" : "text-sm"
        )}>Executive Snapshot</h4>
      </div>
      <div className={cn("grid grid-cols-2 gap-4", situationRoomMode && "gap-6")}>
        {metrics.map((metric) => (
          <div key={metric.label} className={cn(
            "bg-surface-elevated rounded-lg border border-border/20",
            situationRoomMode ? "p-5" : "p-3"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <metric.icon className={cn("text-primary shrink-0", situationRoomMode ? "h-5 w-5" : "h-4 w-4")} />
              <span className={cn("text-muted-foreground font-medium", situationRoomMode ? "text-sm" : "text-xs")}>{metric.label}</span>
            </div>
            <span className={cn("font-bold", metric.color, situationRoomMode ? "text-2xl" : "text-lg")}>{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExecutiveSignal = ({ synthesis, situationRoomMode = false }: { synthesis: string; situationRoomMode?: boolean }) => {
  const lines = synthesis.split('\n').filter(line => line.trim());
  const keyInsight = lines.find(line => 
    line.includes('significant') || 
    line.includes('opportunity') || 
    line.includes('growth') ||
    line.includes('emerging') ||
    line.includes('leading')
  ) || lines[1] || "Multiple market signals detected across intelligence sources.";
  
  // Clean the insight and ensure we don't cut off mid-sentence
  const rawInsight = keyInsight.replace(/^[#*\-\s]+/, '').replace(/\*\*/g, '');
  let cleanInsight = rawInsight;
  
  // If longer than 280 chars, try to end at a sentence boundary
  if (rawInsight.length > 280) {
    const sentenceEnd = rawInsight.substring(0, 300).lastIndexOf('.');
    if (sentenceEnd > 100) {
      cleanInsight = rawInsight.substring(0, sentenceEnd + 1);
    } else {
      cleanInsight = rawInsight.substring(0, 280) + '...';
    }
  }

  return (
    <div className={cn(
      "bg-primary/10 border-l-4 border-primary rounded-r-lg mb-6",
      situationRoomMode ? "p-6 animate-pulse-subtle" : "p-5"
    )}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={cn(
          "text-primary shrink-0 mt-0.5",
          situationRoomMode ? "h-6 w-6" : "h-5 w-5"
        )} />
        <div>
          <span className={cn(
            "font-bold text-primary uppercase tracking-wider",
            situationRoomMode ? "text-sm" : "text-xs"
          )}>Executive Signal</span>
          <p className={cn(
            "text-foreground mt-2 leading-relaxed font-medium",
            situationRoomMode ? "text-base" : "text-sm"
          )}>{cleanInsight}</p>
        </div>
      </div>
    </div>
  );
};

export const SynthesisPanel = ({ synthesis, isSearching, query, results, situationRoomMode = false }: SynthesisPanelProps) => {
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
    <Card className="flex flex-col shadow-intel bg-surface-dark border-border/30">
      <CardHeader className="shrink-0 pb-4 border-b border-border/30 bg-surface-command/60 relative overflow-hidden">
        {/* Subtle texture background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary rounded-lg shadow-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground tracking-tight">Strategic Intelligence Brief</CardTitle>
          </div>
          <CardDescription className="text-sm text-muted-foreground pl-[52px]">
            CXO-level synthesis of market signals, competition, and commercialization
          </CardDescription>
        </div>
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
              <ExecutiveSnapshot results={results} situationRoomMode={situationRoomMode} />
              <ExecutiveSignal synthesis={synthesis} situationRoomMode={situationRoomMode} />
              
              <div className="prose prose-sm max-w-none dark:prose-invert space-y-4">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <div className="mt-6 mb-4 bg-surface-command rounded-xl border border-border/30 overflow-hidden">
                        <div className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
                          <div className="w-1.5 h-5 bg-primary rounded-full" />
                          <h2 className="text-base font-bold text-primary m-0 tracking-wide">{children}</h2>
                        </div>
                      </div>
                    ),
                    h3: ({ children }) => (
                      <div className="bg-surface-elevated/50 rounded-lg px-4 py-2.5 mt-4 mb-2 border border-border/20">
                        <h3 className="text-sm font-semibold text-foreground m-0">{children}</h3>
                      </div>
                    ),
                    p: ({ children }) => <p className="text-sm text-foreground/90 leading-relaxed mb-3 px-1">{children}</p>,
                    ul: ({ children }) => <ul className="text-sm space-y-2 mb-4 list-disc pl-6 pr-1">{children}</ul>,
                    li: ({ children }) => <li className="text-sm text-foreground/90 leading-relaxed">{children}</li>,
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
