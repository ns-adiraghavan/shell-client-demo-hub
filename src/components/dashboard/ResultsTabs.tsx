import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Download, FileText, BookOpen, Search, Radio, Clock, Tag, Filter, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchResult, InsightCategory } from "@/lib/searchService";
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

const INSIGHT_CATEGORIES: InsightCategory[] = [
  "Business Updates",
  "Product / Project Announcements",
  "Partnerships & Collaborations",
  "Investments & Funding",
  "Academic Research & Tie-ups",
  "Patent & IP Activity",
  "Startup & Innovation News",
  "Suppliers, Logistics & Raw Materials",
];

// Decode HTML entities properly - handles all common entities
const decodeHtmlEntities = (text: string): string => {
  if (!text) return '';
  // First pass: use textarea for basic entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  let decoded = textarea.value;
  
  // Second pass: handle any remaining numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  // Third pass: handle named entities that might be missed
  const entityMap: Record<string, string> = {
    '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>',
    '&quot;': '"', '&apos;': "'", '&ndash;': '\u2013', '&mdash;': '\u2014',
    '&lsquo;': '\u2018', '&rsquo;': '\u2019', '&ldquo;': '\u201C', '&rdquo;': '\u201D',
    '&bull;': '\u2022', '&hellip;': '\u2026', '&trade;': '\u2122', '&copy;': '\u00A9',
    '&reg;': '\u00AE', '&deg;': '\u00B0', '&plusmn;': '\u00B1', '&times;': '\u00D7',
    '&divide;': '\u00F7', '&micro;': '\u03BC', '&alpha;': '\u03B1', '&beta;': '\u03B2',
    '&gamma;': '\u03B3', '&delta;': '\u03B4', '&epsilon;': '\u03B5', '&sigma;': '\u03C3',
  };
  
  Object.entries(entityMap).forEach(([entity, char]) => {
    decoded = decoded.replace(new RegExp(entity, 'gi'), char);
  });
  
  return decoded;
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    "Business Updates": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "Product / Project Announcements": "bg-green-500/15 text-green-400 border-green-500/30",
    "Partnerships & Collaborations": "bg-purple-500/15 text-purple-400 border-purple-500/30",
    "Investments & Funding": "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "Academic Research & Tie-ups": "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    "Patent & IP Activity": "bg-rose-500/15 text-rose-400 border-rose-500/30",
    "Startup & Innovation News": "bg-orange-500/15 text-orange-400 border-orange-500/30",
    "Suppliers, Logistics & Raw Materials": "bg-teal-500/15 text-teal-400 border-teal-500/30",
  };
  return colors[category] || "bg-muted text-muted-foreground";
};

// Check if abstract is a placeholder that shouldn't be displayed
const isPlaceholderAbstract = (abstract: string): boolean => {
  const placeholders = [
    'abstract not available',
    'view patent for full details',
    'view patent for details',
    'view source for details',
    'no abstract available',
    'n/a',
  ];
  const normalized = abstract.toLowerCase().trim();
  return placeholders.some(p => normalized === p || normalized.startsWith(p));
};

// Detect if text contains non-Latin characters (likely non-English)
const isNonEnglish = (text: string): boolean => {
  // Check for CJK, Cyrillic, Arabic, Hebrew, Thai, etc.
  const nonLatinRegex = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\u0400-\u04ff\u0600-\u06ff\u0590-\u05ff\u0e00-\u0e7f]/;
  return nonLatinRegex.test(text);
};

// Clean abstract text by removing redundant source attributions and HTML
const cleanAbstract = (abstract: string): string => {
  let cleaned = abstract
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
  
  // Remove redundant source attributions at the start
  cleaned = cleaned.replace(/^(Source:|From:|Via:|Published by:|By:)\s*/i, '');
  
  // Remove source attributions at the end (e.g., "... - Source: IEEE", "Source: arXiv", etc.)
  cleaned = cleaned.replace(/\s*[-–—]\s*(Source|From|Via):\s*[^\s]+.*$/gi, '');
  cleaned = cleaned.replace(/\s*(Source|From|Via):\s*[^\s]+.*$/gi, '');
  
  // Remove trailing ellipsis duplication
  cleaned = cleaned.replace(/\.{3,}$/g, '...');
  
  return cleaned;
};

export const ResultsTabs = ({ results, isSearching, query }: ResultsTabsProps) => {
  const [selectedCategories, setSelectedCategories] = useState<InsightCategory[]>([]);
  const [keywordFilter, setKeywordFilter] = useState("");

  // Filter results based on selected categories and keyword
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      // Category filter
      if (selectedCategories.length > 0) {
        const resultCategories = result.insightCategories || [];
        const hasMatchingCategory = selectedCategories.some(cat => 
          resultCategories.includes(cat)
        );
        if (!hasMatchingCategory) return false;
      }
      
      // Keyword filter
      if (keywordFilter.trim()) {
        const searchTerm = keywordFilter.toLowerCase();
        const titleMatch = result.title?.toLowerCase().includes(searchTerm);
        const abstractMatch = result.abstract?.toLowerCase().includes(searchTerm);
        const authorsMatch = result.authors?.toLowerCase().includes(searchTerm);
        if (!titleMatch && !abstractMatch && !authorsMatch) return false;
      }
      
      return true;
    });
  }, [results, selectedCategories, keywordFilter]);

  const toggleCategory = (category: InsightCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setKeywordFilter("");
  };

  const ieeeResults = filteredResults.filter(r => r.source === 'IEEE');
  const industryNewsResults = filteredResults.filter(r => r.source === 'IndustryNews');
  const scholarResults = filteredResults.filter(r => r.source === 'Google Scholar');
  const patentResults = filteredResults.filter(r => r.source === 'Patents');
  const businessNewsResults = filteredResults.filter(r => r.source === 'BusinessNews');

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
          <div className="p-4 bg-secondary rounded-full w-fit mx-auto mb-4">
            <Search className="h-6 w-6 opacity-50" />
          </div>
          <p className="text-base font-medium">No results found in this category</p>
        </div>
      );
    }

    return sourceResults.map((result, index) => (
      <div 
        key={result.id} 
        className="bg-surface-elevated hover:bg-secondary transition-all rounded-xl border border-border/30 hover:border-border/50 shadow-card hover:shadow-card-hover overflow-hidden"
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Index Number */}
            <div className="shrink-0 w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-primary">#{index + 1}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Title - Editorial Style with translation tooltip for non-English */}
              {isNonEnglish(result.title) ? (
                <h3 
                  className="text-base font-bold text-foreground leading-snug mb-2 hover:text-primary transition-colors cursor-help"
                  title="Non-English text detected - hover for translation coming soon"
                >
                  {decodeHtmlEntities(result.title)}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">(Non-English)</span>
                </h3>
              ) : (
                <h3 className="text-base font-bold text-foreground leading-snug mb-2 hover:text-primary transition-colors">
                  {decodeHtmlEntities(result.title)}
                </h3>
              )}
              
              {/* Metadata Row */}
              <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                <Badge variant="outline" className="text-xs border-border/40 bg-secondary font-medium">
                  {result.source}
                </Badge>
                {result.insightCategories && result.insightCategories.length > 0 && (
                  result.insightCategories.map((category, catIndex) => (
                    <Badge 
                      key={catIndex}
                      variant="outline" 
                      className={`text-xs font-medium ${getCategoryColor(category)}`}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {category}
                    </Badge>
                  ))
                )}
                {result.date && result.date !== 'Unknown' && result.date !== '' && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {result.date}
                  </span>
                )}
                {result.authors && result.authors !== 'Unknown' && result.authors !== '' && (
                  <span className="truncate max-w-[200px]">{result.authors}</span>
                )}
              </div>
              
              {/* Phase/Status Badges */}
              {result.phase && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className="bg-primary/15 text-primary border-0 text-xs font-semibold">{result.phase}</Badge>
                  {result.status && <Badge className="bg-success text-white text-xs">{result.status}</Badge>}
                </div>
              )}
              
              {/* Abstract - De-emphasized */}
              {result.abstract && !isPlaceholderAbstract(result.abstract) && (
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-3">
                  {decodeHtmlEntities(cleanAbstract(result.abstract))}
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
    <Card className="border-border/30 shadow-elevated bg-card">
      <CardHeader className="pb-4 border-b border-border/30">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/15 rounded-lg">
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
                  <Button variant="outline" size="sm" className="bg-secondary hover:bg-muted border-border/40">
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
        
        {/* Filter Controls */}
        {results.length > 0 && !isSearching && (
          <div className="mt-4 space-y-3">
            {/* Keyword Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
                placeholder="Filter results by keyword..."
                className="pl-10 bg-surface-elevated border-border/40"
              />
              {keywordFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setKeywordFilter("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Category Filter Badges */}
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mr-1">Filter by:</span>
              {INSIGHT_CATEGORIES.map((category) => (
                <Badge
                  key={category}
                  variant="outline"
                  onClick={() => toggleCategory(category)}
                  className={`cursor-pointer transition-all text-xs ${
                    selectedCategories.includes(category)
                      ? getCategoryColor(category)
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary border-border/40"
                  }`}
                >
                  {category}
                </Badge>
              ))}
              {(selectedCategories.length > 0 || keywordFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground h-6 px-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            
            {/* Active filter count */}
            {(selectedCategories.length > 0 || keywordFilter) && (
              <p className="text-xs text-muted-foreground">
                Showing {filteredResults.length} of {results.length} results
              </p>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="all" className="w-full">
          <div className="px-6 pt-5 pb-4 border-b border-border/20">
            <TabsList className="grid w-full grid-cols-6 bg-secondary p-1.5 rounded-lg h-auto">
              <TabsTrigger value="all" className="text-xs font-semibold py-2.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-primary">All ({filteredResults.length})</TabsTrigger>
              <TabsTrigger value="ieee" className="text-xs font-semibold py-2.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-primary">Technical ({ieeeResults.length})</TabsTrigger>
              <TabsTrigger value="industryNews" className="text-xs font-semibold py-2.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-primary">Industry ({industryNewsResults.length})</TabsTrigger>
              <TabsTrigger value="scholar" className="text-xs font-semibold py-2.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-primary">Scholarly ({scholarResults.length})</TabsTrigger>
              <TabsTrigger value="patents" className="text-xs font-semibold py-2.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-primary">Patents ({patentResults.length})</TabsTrigger>
              <TabsTrigger value="businessNews" className="text-xs font-semibold py-2.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-primary">Business ({businessNewsResults.length})</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-6 space-y-4">
            <TabsContent value="all" className="mt-0 space-y-4">
              {renderResults(filteredResults)}
            </TabsContent>
            
            <TabsContent value="ieee" className="mt-0 space-y-4">
              {renderResults(ieeeResults)}
            </TabsContent>
            
            <TabsContent value="industryNews" className="mt-0 space-y-4">
              {renderResults(industryNewsResults)}
            </TabsContent>
            
            <TabsContent value="scholar" className="mt-0 space-y-4">
              {renderResults(scholarResults)}
            </TabsContent>
            
            <TabsContent value="patents" className="mt-0 space-y-4">
              {renderResults(patentResults)}
            </TabsContent>
            
            <TabsContent value="businessNews" className="mt-0 space-y-4">
              {renderResults(businessNewsResults)}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};