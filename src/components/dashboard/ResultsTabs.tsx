import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, FileText, BookOpen, Search, Radio, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchResult } from "@/lib/searchService";
import { exportToCSV, exportToBibTeX, exportToRIS, exportToEndNote } from "@/lib/exportService";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ResultsTabsProps {
  results: SearchResult[];
  isSearching: boolean;
  query: string;
}

// Decode HTML entities properly
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

export const ResultsTabs = ({ results, isSearching, query }: ResultsTabsProps) => {
  const pubmedResults = results.filter(r => r.source === 'PubMed');
  const clinicalResults = results.filter(r => r.source === 'ClinicalTrials');
  const arxivResults = results.filter(r => r.source === 'arXiv');
  const patentResults = results.filter(r => r.source === 'Patents');
  const newsResults = results.filter(r => r.source === 'News');

  const handleExportCSV = () => {
    exportToCSV(results, query);
    toast.success("CSV exported successfully");
  };

  const renderResults = (sourceResults: SearchResult[]) => {
    if (isSearching) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      );
    }

    if (sourceResults.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          <div className="p-4 bg-surface-sunken rounded-full w-fit mx-auto mb-4">
            <Search className="h-6 w-6 opacity-50" />
          </div>
          <p className="text-base font-medium">No results found in this category</p>
        </div>
      );
    }

    return sourceResults.map((result, index) => (
      <div 
        key={result.id} 
        className="bg-card hover:bg-card/80 transition-all rounded-xl border border-border/40 hover:border-border/60 shadow-card hover:shadow-card-hover overflow-hidden"
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Index Number */}
            <div className="shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-primary">#{index + 1}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Title - Editorial Style */}
              <h3 className="text-base font-bold text-foreground leading-snug mb-2 hover:text-primary transition-colors">
                {decodeHtmlEntities(result.title)}
              </h3>
              
              {/* Metadata Row */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <Badge variant="outline" className="text-xs border-border/60 bg-surface-sunken font-medium">
                  {result.source}
                </Badge>
                {result.date && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {result.date}
                  </span>
                )}
                {result.authors && (
                  <span className="truncate max-w-[200px]">{result.authors}</span>
                )}
              </div>
              
              {/* Phase/Status Badges */}
              {result.phase && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className="bg-primary/10 text-primary border-0 text-xs font-semibold">{result.phase}</Badge>
                  {result.status && <Badge className="bg-success text-white text-xs">{result.status}</Badge>}
                </div>
              )}
              
              {/* Abstract - De-emphasized */}
              {result.abstract && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                  {decodeHtmlEntities(result.abstract.replace(/<[^>]*>/g, ''))}
                </p>
              )}
              {result.enrollment && <p className="text-sm text-muted-foreground mb-3">{result.enrollment}</p>}
              
              {/* View Source Link */}
              <a 
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 font-semibold"
              >
                View Source <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <Card className="border-border/50 shadow-elevated bg-card">
      <CardHeader className="pb-4 border-b border-border/30">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-foreground">Live Intelligence Feed</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Real-time competitive radar</p>
            </div>
          </div>
          {results.length > 0 && !isSearching && (
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-card hover:bg-surface-sunken border-border/50">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Citations
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="shadow-elevated">
                  <DropdownMenuItem onClick={() => {
                    exportToBibTeX(results, query);
                    toast.success("BibTeX exported successfully");
                  }}>
                    <FileText className="h-4 w-4 mr-2" />
                    BibTeX (.bib)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    exportToRIS(results, query);
                    toast.success("RIS exported successfully");
                  }}>
                    <FileText className="h-4 w-4 mr-2" />
                    RIS (.ris)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    exportToEndNote(results, query);
                    toast.success("EndNote exported successfully");
                  }}>
                    <FileText className="h-4 w-4 mr-2" />
                    EndNote (.enw)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button onClick={handleExportCSV} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-elevated">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="all" className="w-full">
          <div className="px-6 pt-5 pb-4 border-b border-border/20">
            <TabsList className="grid w-full grid-cols-6 bg-surface-sunken p-1.5 rounded-lg h-auto">
              <TabsTrigger value="all" className="text-xs font-semibold py-2.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-primary">All ({results.length})</TabsTrigger>
              <TabsTrigger value="pubmed" className="text-xs font-semibold py-2.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-primary">Research ({pubmedResults.length})</TabsTrigger>
              <TabsTrigger value="clinical" className="text-xs font-semibold py-2.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-primary">Projects ({clinicalResults.length})</TabsTrigger>
              <TabsTrigger value="arxiv" className="text-xs font-semibold py-2.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-primary">Reports ({arxivResults.length})</TabsTrigger>
              <TabsTrigger value="patents" className="text-xs font-semibold py-2.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-primary">Patents ({patentResults.length})</TabsTrigger>
              <TabsTrigger value="news" className="text-xs font-semibold py-2.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-primary">News ({newsResults.length})</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-6 space-y-4">
            <TabsContent value="all" className="mt-0 space-y-4">
              {renderResults(results)}
            </TabsContent>
            
            <TabsContent value="pubmed" className="mt-0 space-y-4">
              {renderResults(pubmedResults)}
            </TabsContent>
            
            <TabsContent value="clinical" className="mt-0 space-y-4">
              {renderResults(clinicalResults)}
            </TabsContent>
            
            <TabsContent value="arxiv" className="mt-0 space-y-4">
              {renderResults(arxivResults)}
            </TabsContent>
            
            <TabsContent value="patents" className="mt-0 space-y-4">
              {renderResults(patentResults)}
            </TabsContent>
            
            <TabsContent value="news" className="mt-0 space-y-4">
              {renderResults(newsResults)}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};
