import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchResult } from "@/lib/searchService";
import { Building2, Globe, FlaskConical, Pill, Factory, Handshake, ShoppingCart, FileText } from "lucide-react";
import { useMemo } from "react";

interface CompetitiveLandscapeProps {
  results: SearchResult[];
  synthesis: string;
}

interface CompanyStage {
  name: string;
  stage: number;
  stageName: string;
  geography: string;
  type: string;
}

const STAGES = [
  { name: "Research", icon: FlaskConical, color: "bg-chart-1" },
  { name: "Preclinical", icon: FlaskConical, color: "bg-chart-2" },
  { name: "Phase I", icon: Pill, color: "bg-chart-3" },
  { name: "Phase II", icon: Pill, color: "bg-chart-4" },
  { name: "Phase III", icon: Pill, color: "bg-chart-5" },
  { name: "Regulatory", icon: FileText, color: "bg-primary" },
  { name: "Partnership", icon: Handshake, color: "bg-accent" },
  { name: "Commercial", icon: ShoppingCart, color: "bg-green-500" },
];

// Known pharma companies with their typical focus areas
const KNOWN_COMPANIES: Record<string, { geography: string; type: string }> = {
  "novo nordisk": { geography: "Denmark/EU", type: "Pharma" },
  "eli lilly": { geography: "USA", type: "Pharma" },
  "pfizer": { geography: "USA", type: "Pharma" },
  "roche": { geography: "Switzerland/EU", type: "Pharma" },
  "novartis": { geography: "Switzerland/EU", type: "Pharma" },
  "astrazeneca": { geography: "UK/EU", type: "Pharma" },
  "merck": { geography: "USA", type: "Pharma" },
  "johnson & johnson": { geography: "USA", type: "Pharma" },
  "sanofi": { geography: "France/EU", type: "Pharma" },
  "gsk": { geography: "UK/EU", type: "Pharma" },
  "glaxosmithkline": { geography: "UK/EU", type: "Pharma" },
  "abbvie": { geography: "USA", type: "Pharma" },
  "bayer": { geography: "Germany/EU", type: "Pharma" },
  "takeda": { geography: "Japan/Asia", type: "Pharma" },
  "amgen": { geography: "USA", type: "Biotech" },
  "gilead": { geography: "USA", type: "Biotech" },
  "biogen": { geography: "USA", type: "Biotech" },
  "regeneron": { geography: "USA", type: "Biotech" },
  "moderna": { geography: "USA", type: "Biotech" },
  "biontech": { geography: "Germany/EU", type: "Biotech" },
  "sun pharma": { geography: "India/Asia", type: "Pharma" },
  "cipla": { geography: "India/Asia", type: "Pharma" },
  "dr. reddy's": { geography: "India/Asia", type: "Pharma" },
  "natco": { geography: "India/Asia", type: "Pharma" },
  "biocon": { geography: "India/Asia", type: "Biotech" },
  "zydus": { geography: "India/Asia", type: "Pharma" },
  "torrent": { geography: "India/Asia", type: "Pharma" },
};

function getCompanyLogo(companyName: string): string {
  const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://logo.clearbit.com/${cleanName}.com`;
}

function extractCompanies(results: SearchResult[], synthesis: string): CompanyStage[] {
  const companies = new Map<string, CompanyStage>();
  const text = `${synthesis} ${results.map(r => `${r.title} ${r.abstract || ''}`).join(' ')}`.toLowerCase();
  
  // Extract known companies
  for (const [company, info] of Object.entries(KNOWN_COMPANIES)) {
    if (text.includes(company)) {
      const stage = determineStage(text, company);
      companies.set(company, {
        name: company.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        stage: stage.index,
        stageName: stage.name,
        geography: info.geography,
        type: info.type,
      });
    }
  }
  
  return Array.from(companies.values()).slice(0, 8);
}

function determineStage(text: string, company: string): { index: number; name: string } {
  const companyContext = extractCompanyContext(text, company);
  
  if (companyContext.includes('commercial') || companyContext.includes('market') || companyContext.includes('sales') || companyContext.includes('revenue')) {
    return { index: 7, name: "Commercial" };
  }
  if (companyContext.includes('partnership') || companyContext.includes('license') || companyContext.includes('collaboration') || companyContext.includes('deal')) {
    return { index: 6, name: "Partnership" };
  }
  if (companyContext.includes('approv') || companyContext.includes('fda') || companyContext.includes('ema') || companyContext.includes('regulatory')) {
    return { index: 5, name: "Regulatory" };
  }
  if (companyContext.includes('phase 3') || companyContext.includes('phase iii') || companyContext.includes('pivotal')) {
    return { index: 4, name: "Phase III" };
  }
  if (companyContext.includes('phase 2') || companyContext.includes('phase ii')) {
    return { index: 3, name: "Phase II" };
  }
  if (companyContext.includes('phase 1') || companyContext.includes('phase i') || companyContext.includes('first-in-human')) {
    return { index: 2, name: "Phase I" };
  }
  if (companyContext.includes('preclinical') || companyContext.includes('animal') || companyContext.includes('toxicology')) {
    return { index: 1, name: "Preclinical" };
  }
  return { index: 0, name: "Research" };
}

function extractCompanyContext(text: string, company: string): string {
  const index = text.indexOf(company);
  if (index === -1) return '';
  const start = Math.max(0, index - 200);
  const end = Math.min(text.length, index + company.length + 200);
  return text.slice(start, end);
}

export const CompetitiveLandscape = ({ results, synthesis }: CompetitiveLandscapeProps) => {
  const companies = useMemo(() => extractCompanies(results, synthesis), [results, synthesis]);
  
  if (companies.length === 0) {
    return null;
  }

  const geographies = useMemo(() => {
    const geoMap = new Map<string, CompanyStage[]>();
    companies.forEach(c => {
      const geo = c.geography.split('/')[0];
      if (!geoMap.has(geo)) geoMap.set(geo, []);
      geoMap.get(geo)!.push(c);
    });
    return geoMap;
  }, [companies]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Competitive Landscape</CardTitle>
        </div>
        <CardDescription>Development stages across market players</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stage Legend */}
        <div className="flex flex-wrap gap-2 pb-4 border-b">
          {STAGES.map((stage, idx) => (
            <div key={stage.name} className="flex items-center gap-1 text-xs">
              <div className={`w-3 h-3 rounded-full ${stage.color}`} />
              <span className="text-muted-foreground">{stage.name}</span>
            </div>
          ))}
        </div>

        {/* Company Timeline */}
        <div className="space-y-4">
          {companies.map((company) => (
            <div key={company.name} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-40 flex-shrink-0">
                <img 
                  src={getCompanyLogo(company.name)} 
                  alt={company.name}
                  className="w-6 h-6 rounded object-contain bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=random&size=24`;
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{company.name}</p>
                  <p className="text-xs text-muted-foreground">{company.geography}</p>
                </div>
              </div>
              
              <div className="flex-1 relative">
                <div className="flex items-center h-8">
                  {/* Progress bar background */}
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${STAGES[company.stage].color} transition-all duration-500`}
                        style={{ width: `${((company.stage + 1) / STAGES.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Stage markers */}
                  <div className="absolute inset-0 flex justify-between items-center px-1">
                    {STAGES.map((stage, idx) => (
                      <div 
                        key={stage.name}
                        className={`w-3 h-3 rounded-full border-2 border-background z-10 ${
                          idx <= company.stage ? stage.color : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <Badge variant="outline" className="ml-2 flex-shrink-0">
                {company.stageName}
              </Badge>
            </div>
          ))}
        </div>

        {/* Geographic Distribution */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Geographic Distribution</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(geographies.entries()).map(([geo, geoCompanies]) => (
              <Badge key={geo} variant="secondary" className="flex items-center gap-1">
                {geo}
                <span className="bg-primary/20 text-primary px-1.5 rounded-full text-xs">
                  {geoCompanies.length}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
