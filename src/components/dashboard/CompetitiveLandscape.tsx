import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchResult } from "@/lib/searchService";
import { Building2, Globe, FlaskConical, Lightbulb, Factory, Handshake, ShoppingCart, FileText, Rocket, Zap } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface CompetitiveLandscapeProps {
  results: SearchResult[];
  synthesis: string;
  situationRoomMode?: boolean;
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
  { name: "Development", icon: Lightbulb, color: "bg-chart-2" },
  { name: "Pilot", icon: Rocket, color: "bg-chart-3" },
  { name: "Production", icon: Factory, color: "bg-chart-4" },
  { name: "Scaling", icon: Zap, color: "bg-chart-5" },
  { name: "Regulatory", icon: FileText, color: "bg-primary" },
  { name: "Partnership", icon: Handshake, color: "bg-accent" },
  { name: "Commercial", icon: ShoppingCart, color: "bg-success" },
];

// Known energy and infrastructure companies with their typical focus areas
const KNOWN_COMPANIES: Record<string, { geography: string; type: string }> = {
  "shell": { geography: "Netherlands/EU", type: "Energy" },
  "bp": { geography: "UK/EU", type: "Energy" },
  "exxonmobil": { geography: "USA", type: "Energy" },
  "chevron": { geography: "USA", type: "Energy" },
  "totalenergies": { geography: "France/EU", type: "Energy" },
  "ongc": { geography: "India/Asia", type: "Energy" },
  "reliance": { geography: "India/Asia", type: "Energy" },
  "petronas": { geography: "Malaysia/Asia", type: "Energy" },
  "saudi aramco": { geography: "Saudi Arabia/ME", type: "Energy" },
  "equinor": { geography: "Norway/EU", type: "Energy" },
  "eni": { geography: "Italy/EU", type: "Energy" },
  "siemens": { geography: "Germany/EU", type: "Industrial" },
  "ge": { geography: "USA", type: "Industrial" },
  "schneider electric": { geography: "France/EU", type: "Industrial" },
  "abb": { geography: "Switzerland/EU", type: "Industrial" },
  "honeywell": { geography: "USA", type: "Industrial" },
  "tesla": { geography: "USA", type: "EV/Clean Energy" },
  "vestas": { geography: "Denmark/EU", type: "Renewable" },
  "orsted": { geography: "Denmark/EU", type: "Renewable" },
  "iberdrola": { geography: "Spain/EU", type: "Utility" },
  "enel": { geography: "Italy/EU", type: "Utility" },
  "nexterra": { geography: "USA", type: "Renewable" },
  "bloom energy": { geography: "USA", type: "Clean Energy" },
  "plug power": { geography: "USA", type: "Hydrogen" },
  "nel asa": { geography: "Norway/EU", type: "Hydrogen" },
  "air liquide": { geography: "France/EU", type: "Industrial Gas" },
  "linde": { geography: "Germany/EU", type: "Industrial Gas" },
  "catl": { geography: "China/Asia", type: "Battery" },
  "lg energy": { geography: "South Korea/Asia", type: "Battery" },
  "panasonic": { geography: "Japan/Asia", type: "Battery" },
  "byd": { geography: "China/Asia", type: "EV/Battery" },
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
  if (companyContext.includes('partnership') || companyContext.includes('license') || companyContext.includes('collaboration') || companyContext.includes('deal') || companyContext.includes('joint venture')) {
    return { index: 6, name: "Partnership" };
  }
  if (companyContext.includes('approv') || companyContext.includes('regulatory') || companyContext.includes('permit') || companyContext.includes('compliance')) {
    return { index: 5, name: "Regulatory" };
  }
  if (companyContext.includes('scaling') || companyContext.includes('expansion') || companyContext.includes('growth') || companyContext.includes('capacity')) {
    return { index: 4, name: "Scaling" };
  }
  if (companyContext.includes('production') || companyContext.includes('manufacturing') || companyContext.includes('plant') || companyContext.includes('facility')) {
    return { index: 3, name: "Production" };
  }
  if (companyContext.includes('pilot') || companyContext.includes('demonstration') || companyContext.includes('prototype') || companyContext.includes('testing')) {
    return { index: 2, name: "Pilot" };
  }
  if (companyContext.includes('develop') || companyContext.includes('engineering') || companyContext.includes('design')) {
    return { index: 1, name: "Development" };
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

export const CompetitiveLandscape = ({ results, synthesis, situationRoomMode = false }: CompetitiveLandscapeProps) => {
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
    <Card className={cn("mt-6", situationRoomMode && "bg-surface-dark border-border/40 shadow-intel")}>
      <CardHeader className={cn(situationRoomMode && "pb-6")}>
        <div className="flex items-center gap-2">
          <Building2 className={cn("text-primary", situationRoomMode ? "h-6 w-6" : "h-5 w-5")} />
          <CardTitle className={cn(situationRoomMode ? "text-xl" : "text-lg")}>Competitive Landscape</CardTitle>
        </div>
        <CardDescription className={cn(situationRoomMode && "text-base")}>Innovation stages across market players</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 overflow-x-auto">
        {/* Stage Legend */}
        <div className={cn("flex flex-wrap gap-2 pb-4 border-b border-border/30", situationRoomMode && "gap-3")}>
          {STAGES.map((stage, idx) => (
            <div key={stage.name} className={cn("flex items-center gap-1", situationRoomMode ? "text-sm" : "text-xs")}>
              <div className={cn("rounded-full", stage.color, situationRoomMode ? "w-4 h-4" : "w-3 h-3")} />
              <span className="text-muted-foreground">{stage.name}</span>
            </div>
          ))}
        </div>

        {/* Company Timeline */}
        <div className={cn("space-y-4 min-w-[600px]", situationRoomMode && "space-y-6")}>
          {companies.map((company) => (
            <div key={company.name} className={cn("flex items-center gap-4", situationRoomMode && "gap-6")}>
              <div className={cn("flex items-center gap-2 flex-shrink-0", situationRoomMode ? "w-56 gap-3" : "w-44")}>
                <img 
                  src={getCompanyLogo(company.name)} 
                  alt={company.name}
                  className={cn(
                    "rounded object-contain bg-white p-0.5 border",
                    situationRoomMode ? "w-12 h-12" : "w-8 h-8"
                  )}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=random&size=32`;
                  }}
                />
                <div className="min-w-0">
                  <p className={cn("font-medium truncate", situationRoomMode ? "text-base" : "text-sm")}>{company.name}</p>
                  <p className={cn("text-muted-foreground", situationRoomMode ? "text-sm" : "text-xs")}>{company.geography}</p>
                </div>
              </div>
              
              <div className="flex-1 relative min-w-[300px]">
                <div className={cn("flex items-center", situationRoomMode ? "h-14" : "h-10")}>
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                    <div className={cn("w-full bg-muted rounded-full overflow-hidden", situationRoomMode ? "h-5" : "h-3")}>
                      <div 
                        className={cn("h-full transition-all duration-500", STAGES[company.stage].color)}
                        style={{ width: `${((company.stage + 1) / STAGES.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 flex justify-between items-center px-1">
                    {STAGES.map((stage, idx) => (
                      <div 
                        key={stage.name}
                        className={cn(
                          "rounded-full border-2 border-background z-10",
                          idx <= company.stage ? stage.color : 'bg-muted',
                          situationRoomMode ? "w-6 h-6" : "w-4 h-4"
                        )}
                        title={stage.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <Badge variant="outline" className={cn(
                "ml-3 flex-shrink-0 justify-center",
                situationRoomMode ? "min-w-[110px] text-sm py-1.5" : "min-w-[90px]"
              )}>
                {company.stageName}
              </Badge>
            </div>
          ))}
        </div>

        {/* Geographic Distribution */}
        <div className="pt-4 border-t border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <Globe className={cn("text-muted-foreground", situationRoomMode ? "h-5 w-5" : "h-4 w-4")} />
            <span className={cn("font-medium", situationRoomMode ? "text-base" : "text-sm")}>Geographic Distribution</span>
          </div>
          <div className={cn("flex flex-wrap gap-2", situationRoomMode && "gap-3")}>
            {Array.from(geographies.entries()).map(([geo, geoCompanies]) => (
              <Badge key={geo} variant="secondary" className={cn("flex items-center gap-1", situationRoomMode && "text-sm py-1")}>
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