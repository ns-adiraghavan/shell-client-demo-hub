import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, FileText, BookOpen, Search } from "lucide-react";
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
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </div>
      );
    }

    if (sourceResults.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          <div className="p-3 bg-muted/40 rounded-full w-fit mx-auto mb-3">
            <Search className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-body">No results found in this category</p>
        </div>
      );
    }

    return sourceResults.map((result, index) => (
      <Card key={result.id} className="hover:shadow-card-hover transition-shadow border-border/50 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                <Badge className="shrink-0 mt-0.5 bg-primary/10 text-primary border-0 font-semibold">#{index + 1}</Badge>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-body font-semibold mb-1.5 leading-snug text-foreground">{decodeHtmlEntities(result.title)}</CardTitle>
                  <CardDescription className="text-caption text-muted-foreground">
                    {result.authors && `${result.authors} • `}
                    {result.date}
                  </CardDescription>
                  {result.phase && (
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      <Badge variant="secondary" className="text-xs">{result.phase}</Badge>
                      {result.status && <Badge className="bg-success text-white text-xs">{result.status}</Badge>}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs border-border/60">{result.source}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {result.abstract && (
            <p className="text-caption text-muted-foreground mb-3 line-clamp-3 leading-relaxed">
              {decodeHtmlEntities(result.abstract.replace(/<[^>]*>/g, ''))}
            </p>
          )}
          {result.enrollment && <p className="text-caption text-muted-foreground mb-3">{result.enrollment}</p>}
          <a 
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-caption text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            View Source <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    ));
  };

  return (
    <Card className="border-border/60 shadow-card bg-card">
      <CardHeader className="pb-4 border-b border-border/40">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-title">Intelligence Results</CardTitle>
          </div>
          {results.length > 0 && !isSearching && (
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-card hover:bg-muted border-border/60">
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
              
              <Button onClick={handleExportCSV} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="all" className="w-full">
          <div className="px-6 pt-4 pb-3 border-b border-border/30">
            <TabsList className="grid w-full grid-cols-6 bg-muted/50 p-1 rounded-lg h-auto">
              <TabsTrigger value="all" className="text-xs py-2 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card">All ({results.length})</TabsTrigger>
              <TabsTrigger value="pubmed" className="text-xs py-2 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card">Research ({pubmedResults.length})</TabsTrigger>
              <TabsTrigger value="clinical" className="text-xs py-2 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card">Projects ({clinicalResults.length})</TabsTrigger>
              <TabsTrigger value="arxiv" className="text-xs py-2 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card">Reports ({arxivResults.length})</TabsTrigger>
              <TabsTrigger value="patents" className="text-xs py-2 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card">Patents ({patentResults.length})</TabsTrigger>
              <TabsTrigger value="news" className="text-xs py-2 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card">News ({newsResults.length})</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-6">
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
