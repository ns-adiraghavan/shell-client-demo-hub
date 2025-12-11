import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchResult } from "@/lib/searchService";
import { Building2, Globe, FlaskConical, Lightbulb, Factory, Handshake, ShoppingCart, FileText, Rocket, Zap, Info } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

// Color palette for geographic regions
const GEOGRAPHY_COLORS: Record<string, string> = {
  "USA": "hsl(25 95% 53%)",           // burnt orange
  "Netherlands": "hsl(200 95% 45%)",  // bright blue
  "UK": "hsl(145 70% 42%)",           // teal/green
  "Germany": "hsl(280 75% 55%)",      // purple
  "France": "hsl(340 80% 55%)",       // pink/magenta
  "India": "hsl(45 90% 50%)",         // golden yellow
  "China": "hsl(180 60% 45%)",        // cyan
  "Norway": "hsl(120 50% 45%)",       // green
  "Italy": "hsl(15 85% 50%)",         // red-orange
  "Spain": "hsl(0 75% 50%)",          // red
  "Malaysia": "hsl(220 70% 55%)",     // blue
  "Saudi Arabia": "hsl(35 95% 45%)",  // amber
  "Brazil": "hsl(100 60% 45%)",       // lime green
  "Australia": "hsl(170 50% 45%)",    // teal
  "Japan": "hsl(350 70% 55%)",        // rose
  "South Korea": "hsl(260 60% 55%)",  // violet
  "Switzerland": "hsl(0 0% 50%)",     // gray
};

// Get color for a geography, with fallback
function getGeographyColor(geography: string): string {
  const region = geography.split('/')[0];
  return GEOGRAPHY_COLORS[region] || "hsl(var(--muted-foreground))";
}

const STAGES = [
  { name: "Research", icon: FlaskConical, description: "Fundamental research and early-stage investigation" },
  { name: "Development", icon: Lightbulb, description: "Technology development and engineering design" },
  { name: "Pilot", icon: Rocket, description: "Pilot projects and prototype testing" },
  { name: "Production", icon: Factory, description: "Active production and manufacturing" },
  { name: "Scaling", icon: Zap, description: "Capacity expansion and growth initiatives" },
  { name: "Regulatory", icon: FileText, description: "Regulatory approval and compliance processes" },
  { name: "Partnership", icon: Handshake, description: "Strategic alliances and joint ventures" },
  { name: "Commercial", icon: ShoppingCart, description: "Full commercial deployment and market presence" },
];

// Known energy and infrastructure companies with their typical focus areas and logo domains
const KNOWN_COMPANIES: Record<string, { geography: string; type: string; logoDomain: string }> = {
  "shell": { geography: "Netherlands/EU", type: "Energy", logoDomain: "shell.com" },
  "bp": { geography: "UK/EU", type: "Energy", logoDomain: "bp.com" },
  "exxonmobil": { geography: "USA", type: "Energy", logoDomain: "exxonmobil.com" },
  "exxon": { geography: "USA", type: "Energy", logoDomain: "exxonmobil.com" },
  "chevron": { geography: "USA", type: "Energy", logoDomain: "chevron.com" },
  "totalenergies": { geography: "France/EU", type: "Energy", logoDomain: "totalenergies.com" },
  "total": { geography: "France/EU", type: "Energy", logoDomain: "totalenergies.com" },
  "ongc": { geography: "India/Asia", type: "Energy", logoDomain: "ongcindia.com" },
  "reliance": { geography: "India/Asia", type: "Energy", logoDomain: "ril.com" },
  "reliance industries": { geography: "India/Asia", type: "Energy", logoDomain: "ril.com" },
  "petronas": { geography: "Malaysia/Asia", type: "Energy", logoDomain: "petronas.com" },
  "saudi aramco": { geography: "Saudi Arabia/ME", type: "Energy", logoDomain: "aramco.com" },
  "aramco": { geography: "Saudi Arabia/ME", type: "Energy", logoDomain: "aramco.com" },
  "equinor": { geography: "Norway/EU", type: "Energy", logoDomain: "equinor.com" },
  "eni": { geography: "Italy/EU", type: "Energy", logoDomain: "eni.com" },
  "conocophillips": { geography: "USA", type: "Energy", logoDomain: "conocophillips.com" },
  "marathon petroleum": { geography: "USA", type: "Energy", logoDomain: "marathonpetroleum.com" },
  "valero": { geography: "USA", type: "Energy", logoDomain: "valero.com" },
  "phillips 66": { geography: "USA", type: "Energy", logoDomain: "phillips66.com" },
  "halliburton": { geography: "USA", type: "Oilfield Services", logoDomain: "halliburton.com" },
  "schlumberger": { geography: "USA", type: "Oilfield Services", logoDomain: "slb.com" },
  "slb": { geography: "USA", type: "Oilfield Services", logoDomain: "slb.com" },
  "baker hughes": { geography: "USA", type: "Oilfield Services", logoDomain: "bakerhughes.com" },
  "siemens": { geography: "Germany/EU", type: "Industrial", logoDomain: "siemens.com" },
  "siemens energy": { geography: "Germany/EU", type: "Industrial", logoDomain: "siemens-energy.com" },
  "ge": { geography: "USA", type: "Industrial", logoDomain: "ge.com" },
  "general electric": { geography: "USA", type: "Industrial", logoDomain: "ge.com" },
  "ge vernova": { geography: "USA", type: "Industrial", logoDomain: "gevernova.com" },
  "schneider electric": { geography: "France/EU", type: "Industrial", logoDomain: "se.com" },
  "abb": { geography: "Switzerland/EU", type: "Industrial", logoDomain: "abb.com" },
  "honeywell": { geography: "USA", type: "Industrial", logoDomain: "honeywell.com" },
  "emerson": { geography: "USA", type: "Industrial", logoDomain: "emerson.com" },
  "rockwell": { geography: "USA", type: "Industrial", logoDomain: "rockwellautomation.com" },
  "tesla": { geography: "USA", type: "EV/Clean Energy", logoDomain: "tesla.com" },
  "vestas": { geography: "Denmark/EU", type: "Renewable", logoDomain: "vestas.com" },
  "orsted": { geography: "Denmark/EU", type: "Renewable", logoDomain: "orsted.com" },
  "iberdrola": { geography: "Spain/EU", type: "Utility", logoDomain: "iberdrola.com" },
  "enel": { geography: "Italy/EU", type: "Utility", logoDomain: "enel.com" },
  "engie": { geography: "France/EU", type: "Utility", logoDomain: "engie.com" },
  "nexterra": { geography: "USA", type: "Renewable", logoDomain: "nexteraenergy.com" },
  "nextera": { geography: "USA", type: "Renewable", logoDomain: "nexteraenergy.com" },
  "bloom energy": { geography: "USA", type: "Clean Energy", logoDomain: "bloomenergy.com" },
  "plug power": { geography: "USA", type: "Hydrogen", logoDomain: "plugpower.com" },
  "nel asa": { geography: "Norway/EU", type: "Hydrogen", logoDomain: "nelhydrogen.com" },
  "air liquide": { geography: "France/EU", type: "Industrial Gas", logoDomain: "airliquide.com" },
  "linde": { geography: "Germany/EU", type: "Industrial Gas", logoDomain: "linde.com" },
  "catl": { geography: "China/Asia", type: "Battery", logoDomain: "catl.com" },
  "lg energy": { geography: "South Korea/Asia", type: "Battery", logoDomain: "lgensol.com" },
  "panasonic": { geography: "Japan/Asia", type: "Battery", logoDomain: "panasonic.com" },
  "byd": { geography: "China/Asia", type: "EV/Battery", logoDomain: "byd.com" },
  "iocl": { geography: "India/Asia", type: "Energy", logoDomain: "iocl.com" },
  "indian oil": { geography: "India/Asia", type: "Energy", logoDomain: "iocl.com" },
  "bpcl": { geography: "India/Asia", type: "Energy", logoDomain: "bharatpetroleum.in" },
  "bharat petroleum": { geography: "India/Asia", type: "Energy", logoDomain: "bharatpetroleum.in" },
  "gail": { geography: "India/Asia", type: "Energy", logoDomain: "gailonline.com" },
  "adani": { geography: "India/Asia", type: "Energy", logoDomain: "adani.com" },
  "adani green": { geography: "India/Asia", type: "Renewable", logoDomain: "adanigreenenergy.com" },
  "tata power": { geography: "India/Asia", type: "Utility", logoDomain: "tatapower.com" },
  "ntpc": { geography: "India/Asia", type: "Utility", logoDomain: "ntpc.co.in" },
  "sinopec": { geography: "China/Asia", type: "Energy", logoDomain: "sinopec.com" },
  "cnpc": { geography: "China/Asia", type: "Energy", logoDomain: "cnpc.com.cn" },
  "cnooc": { geography: "China/Asia", type: "Energy", logoDomain: "cnooc.com.cn" },
  "petrobras": { geography: "Brazil/LATAM", type: "Energy", logoDomain: "petrobras.com.br" },
  "repsol": { geography: "Spain/EU", type: "Energy", logoDomain: "repsol.com" },
  "woodside": { geography: "Australia/APAC", type: "Energy", logoDomain: "woodside.com" },
  "santos": { geography: "Australia/APAC", type: "Energy", logoDomain: "santos.com" },
};

// Canonical display names for companies (proper capitalization and branding)
const COMPANY_DISPLAY_NAMES: Record<string, string> = {
  "shell": "Shell",
  "bp": "BP",
  "exxonmobil": "ExxonMobil",
  "exxon": "ExxonMobil",
  "chevron": "Chevron",
  "totalenergies": "TotalEnergies",
  "total": "TotalEnergies",
  "ongc": "ONGC",
  "reliance": "Reliance Industries",
  "reliance industries": "Reliance Industries",
  "petronas": "PETRONAS",
  "saudi aramco": "Saudi Aramco",
  "aramco": "Saudi Aramco",
  "equinor": "Equinor",
  "eni": "Eni",
  "conocophillips": "ConocoPhillips",
  "marathon petroleum": "Marathon Petroleum",
  "valero": "Valero",
  "phillips 66": "Phillips 66",
  "halliburton": "Halliburton",
  "schlumberger": "SLB",
  "slb": "SLB",
  "baker hughes": "Baker Hughes",
  "siemens": "Siemens",
  "siemens energy": "Siemens Energy",
  "ge": "GE",
  "general electric": "GE",
  "ge vernova": "GE Vernova",
  "schneider electric": "Schneider Electric",
  "abb": "ABB",
  "honeywell": "Honeywell",
  "emerson": "Emerson",
  "rockwell": "Rockwell Automation",
  "tesla": "Tesla",
  "vestas": "Vestas",
  "orsted": "Ørsted",
  "iberdrola": "Iberdrola",
  "enel": "Enel",
  "engie": "ENGIE",
  "nexterra": "NextEra Energy",
  "nextera": "NextEra Energy",
  "bloom energy": "Bloom Energy",
  "plug power": "Plug Power",
  "nel asa": "Nel ASA",
  "air liquide": "Air Liquide",
  "linde": "Linde",
  "catl": "CATL",
  "lg energy": "LG Energy Solution",
  "panasonic": "Panasonic",
  "byd": "BYD",
  "iocl": "IOCL",
  "indian oil": "Indian Oil",
  "bpcl": "BPCL",
  "bharat petroleum": "Bharat Petroleum",
  "gail": "GAIL",
  "adani": "Adani",
  "adani green": "Adani Green Energy",
  "tata power": "Tata Power",
  "ntpc": "NTPC",
  "sinopec": "Sinopec",
  "cnpc": "CNPC",
  "cnooc": "CNOOC",
  "petrobras": "Petrobras",
  "repsol": "Repsol",
  "woodside": "Woodside",
  "santos": "Santos",
};

// Map of aliases to canonical company keys for deduplication
const COMPANY_ALIASES: Record<string, string> = {
  "exxon": "exxonmobil",
  "total": "totalenergies",
  "reliance": "reliance industries",
  "aramco": "saudi aramco",
  "slb": "schlumberger",
  "ge": "general electric",
  "nextera": "nexterra",
  "siemens energy": "siemens energy", // Keep separate from siemens
  "siemens": "siemens",
  "indian oil": "iocl",
  "bharat petroleum": "bpcl",
};

function getCompanyLogo(companyName: string): string {
  const lowerName = companyName.toLowerCase();
  // Check canonical name first, then lookup
  const canonicalKey = COMPANY_ALIASES[lowerName] || lowerName;
  const companyInfo = KNOWN_COMPANIES[canonicalKey] || KNOWN_COMPANIES[lowerName];
  if (companyInfo?.logoDomain) {
    return `https://logo.clearbit.com/${companyInfo.logoDomain}`;
  }
  // Fallback to generic domain guess
  const cleanName = lowerName.replace(/[^a-z0-9]/g, '');
  return `https://logo.clearbit.com/${cleanName}.com`;
}

function extractCompanies(results: SearchResult[], synthesis: string): CompanyStage[] {
  const companies = new Map<string, CompanyStage>();
  const text = `${synthesis} ${results.map(r => `${r.title} ${r.abstract || ''}`).join(' ')}`.toLowerCase();
  
  // Extract known companies, using canonical keys to avoid duplicates
  for (const [company, info] of Object.entries(KNOWN_COMPANIES)) {
    if (text.includes(company)) {
      // Get canonical key for deduplication
      const canonicalKey = COMPANY_ALIASES[company] || company;
      
      // Skip if we already have this company under its canonical name
      if (companies.has(canonicalKey)) continue;
      
      const stage = determineStage(text, company);
      const displayName = COMPANY_DISPLAY_NAMES[company] || 
        company.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      companies.set(canonicalKey, {
        name: displayName,
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

  // Get unique geographies for legend
  const uniqueGeographies = useMemo(() => {
    const geos = new Set<string>();
    companies.forEach(c => geos.add(c.geography.split('/')[0]));
    return Array.from(geos);
  }, [companies]);

  return (
    <TooltipProvider>
      <Card className={cn("mt-6", situationRoomMode && "bg-surface-dark border-border/40 shadow-intel")}>
        <CardHeader className={cn(situationRoomMode && "pb-6")}>
          <div className="flex items-center gap-2">
            <Building2 className={cn("text-primary", situationRoomMode ? "h-6 w-6" : "h-5 w-5")} />
            <CardTitle className={cn(situationRoomMode ? "text-xl" : "text-lg")}>Competitive Landscape</CardTitle>
          </div>
          <CardDescription className={cn(situationRoomMode && "text-base")}>Innovation stages across market players by region</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 overflow-x-auto">
          {/* Geography Color Legend */}
          <div className={cn("flex flex-wrap gap-2 pb-4 border-b border-border/30", situationRoomMode && "gap-3")}>
            <span className={cn("text-muted-foreground font-medium mr-2", situationRoomMode ? "text-sm" : "text-xs")}>By Region:</span>
            {uniqueGeographies.map((geo) => (
              <div key={geo} className={cn("flex items-center gap-1", situationRoomMode ? "text-sm" : "text-xs")}>
                <div 
                  className={cn("rounded-full", situationRoomMode ? "w-4 h-4" : "w-3 h-3")} 
                  style={{ backgroundColor: getGeographyColor(geo) }}
                />
                <span className="text-muted-foreground">{geo}</span>
              </div>
            ))}
          </div>

          {/* Stage Legend with Info */}
          <div className={cn("flex flex-wrap items-center gap-2 pb-4 border-b border-border/30", situationRoomMode && "gap-3")}>
            <span className={cn("text-muted-foreground font-medium mr-2", situationRoomMode ? "text-sm" : "text-xs")}>Stages:</span>
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <Tooltip key={stage.name}>
                  <TooltipTrigger asChild>
                    <div className={cn("flex items-center gap-1 cursor-help", situationRoomMode ? "text-sm" : "text-xs")}>
                      <Icon className={cn("text-muted-foreground", situationRoomMode ? "h-4 w-4" : "h-3 w-3")} />
                      <span className="text-muted-foreground">{stage.name}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-sm">{stage.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className={cn("text-muted-foreground cursor-help ml-1", situationRoomMode ? "h-4 w-4" : "h-3 w-3")} />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px]">
                <p className="text-sm">Innovation stages represent the maturity of a company's activity in this domain, from early research through commercial deployment.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Company Timeline */}
          <div className={cn("space-y-4 min-w-[600px]", situationRoomMode && "space-y-6")}>
            {companies.map((company) => {
              const geoColor = getGeographyColor(company.geography);
              return (
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
                            className="h-full transition-all duration-500"
                            style={{ 
                              width: `${((company.stage + 1) / STAGES.length) * 100}%`,
                              backgroundColor: geoColor
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="absolute inset-0 flex justify-between items-center px-1">
                        {STAGES.map((stage, idx) => (
                          <div 
                            key={stage.name}
                            className={cn(
                              "rounded-full border-2 border-background z-10",
                              situationRoomMode ? "w-6 h-6" : "w-4 h-4"
                            )}
                            style={{ 
                              backgroundColor: idx <= company.stage ? geoColor : 'hsl(var(--muted))'
                            }}
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
              );
            })}
          </div>

          {/* Geographic Distribution */}
          <div className="pt-4 border-t border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <Globe className={cn("text-muted-foreground", situationRoomMode ? "h-5 w-5" : "h-4 w-4")} />
              <span className={cn("font-medium", situationRoomMode ? "text-base" : "text-sm")}>Geographic Distribution</span>
            </div>
            <div className={cn("flex flex-wrap gap-2", situationRoomMode && "gap-3")}>
              {Array.from(geographies.entries()).map(([geo, geoCompanies]) => (
                <Badge 
                  key={geo} 
                  variant="secondary" 
                  className={cn("flex items-center gap-1", situationRoomMode && "text-sm py-1")}
                  style={{ borderLeftColor: getGeographyColor(geo), borderLeftWidth: '3px' }}
                >
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
    </TooltipProvider>
  );
};