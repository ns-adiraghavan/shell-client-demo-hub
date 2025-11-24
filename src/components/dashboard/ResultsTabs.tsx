import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ResultsTabsProps {
  isSearching: boolean;
}

export const ResultsTabs = ({ isSearching }: ResultsTabsProps) => {
  const mockResults = {
    pubmed: [
      {
        id: "38234567",
        title: "Neuroprotective Effects of GLP-1 Receptor Agonists in Parkinson's Disease: A Systematic Review",
        abstract: "Recent evidence suggests that glucagon-like peptide-1 (GLP-1) receptor agonists may have neuroprotective properties relevant to Parkinson's disease...",
        date: "2024",
        authors: "Smith J, Johnson A, Williams B"
      },
      {
        id: "38123456",
        title: "Semaglutide and Neurodegeneration: Mechanisms and Clinical Implications",
        abstract: "This review examines the potential mechanisms by which semaglutide may influence neurodegenerative processes in Parkinson's disease...",
        date: "2023",
        authors: "Chen L, Martinez R, Thompson K"
      }
    ],
    clinical: [
      {
        id: "NCT05234567",
        title: "Phase II Study of Semaglutide in Early Parkinson's Disease",
        status: "Recruiting",
        phase: "Phase 2",
        enrollment: "240 participants"
      },
      {
        id: "NCT05123456",
        title: "GLP-1 Agonists for Neuroprotection in PD",
        status: "Active, not recruiting",
        phase: "Phase 2",
        enrollment: "180 participants"
      }
    ]
  };

  const renderPubMedResults = () => (
    <div className="space-y-4">
      {isSearching ? (
        <>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </>
      ) : (
        mockResults.pubmed.map((result) => (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2 leading-tight">{result.title}</CardTitle>
                  <CardDescription className="text-sm">{result.authors} • {result.date}</CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0">PubMed</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{result.abstract}</p>
              <a 
                href={`https://pubmed.ncbi.nlm.nih.gov/${result.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View on PubMed <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderClinicalResults = () => (
    <div className="space-y-4">
      {isSearching ? (
        <>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </>
      ) : (
        mockResults.clinical.map((result) => (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2 leading-tight">{result.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">{result.phase}</Badge>
                    <Badge className="bg-success text-white">{result.status}</Badge>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">ClinicalTrials</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{result.enrollment}</p>
              <a 
                href={`https://clinicaltrials.gov/study/${result.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View on ClinicalTrials.gov <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all">All Results</TabsTrigger>
        <TabsTrigger value="pubmed">PubMed</TabsTrigger>
        <TabsTrigger value="clinical">Clinical Trials</TabsTrigger>
        <TabsTrigger value="preprints">Preprints</TabsTrigger>
      </TabsList>
      
      <TabsContent value="all" className="mt-4">
        {renderPubMedResults()}
      </TabsContent>
      
      <TabsContent value="pubmed" className="mt-4">
        {renderPubMedResults()}
      </TabsContent>
      
      <TabsContent value="clinical" className="mt-4">
        {renderClinicalResults()}
      </TabsContent>
      
      <TabsContent value="preprints" className="mt-4">
        <div className="text-center py-12 text-muted-foreground">
          <p>Preprint results will appear here</p>
        </div>
      </TabsContent>
    </Tabs>
  );
};
