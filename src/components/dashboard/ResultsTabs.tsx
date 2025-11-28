import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, FileText, BookOpen } from "lucide-react";
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

export const ResultsTabs = ({ results, isSearching, query }: ResultsTabsProps) => {
  const pubmedResults = results.filter(r => r.source === 'PubMed');
  const clinicalResults = results.filter(r => r.source === 'ClinicalTrials');
  const arxivResults = results.filter(r => r.source === 'arXiv');

  const handleExportCSV = () => {
    exportToCSV(results, query);
    toast.success("CSV exported successfully");
  };

  const renderResults = (sourceResults: SearchResult[]) => {
    if (isSearching) {
      return (
        <>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </>
      );
    }

    if (sourceResults.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>No results found</p>
        </div>
      );
    }

    return sourceResults.map((result) => (
      <Card key={result.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2 leading-tight">{result.title}</CardTitle>
              <CardDescription className="text-sm">
                {result.authors && `${result.authors} • `}
                {result.date}
              </CardDescription>
              {result.phase && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">{result.phase}</Badge>
                  {result.status && <Badge className="bg-success text-white">{result.status}</Badge>}
                </div>
              )}
            </div>
            <Badge variant="outline" className="shrink-0">{result.source}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {result.abstract && <p className="text-sm text-muted-foreground mb-3">{result.abstract}</p>}
          {result.enrollment && <p className="text-sm text-muted-foreground mb-3">{result.enrollment}</p>}
          <a 
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            View Source <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Results</h2>
        {results.length > 0 && !isSearching && (
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Export Citations
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
            
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({results.length})</TabsTrigger>
          <TabsTrigger value="pubmed">PubMed ({pubmedResults.length})</TabsTrigger>
          <TabsTrigger value="clinical">Clinical ({clinicalResults.length})</TabsTrigger>
          <TabsTrigger value="arxiv">arXiv ({arxivResults.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4 space-y-4">
          {renderResults(results)}
        </TabsContent>
        
        <TabsContent value="pubmed" className="mt-4 space-y-4">
          {renderResults(pubmedResults)}
        </TabsContent>
        
        <TabsContent value="clinical" className="mt-4 space-y-4">
          {renderResults(clinicalResults)}
        </TabsContent>
        
        <TabsContent value="arxiv" className="mt-4 space-y-4">
          {renderResults(arxivResults)}
        </TabsContent>
      </Tabs>
    </div>
  );
};