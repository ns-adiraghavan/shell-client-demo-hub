import { BarChart2, Sparkles, Building2, Search, FileText, ChartLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionNavigationProps {
  hasResults: boolean;
  hasSynthesis: boolean;
}

const sections = [
  { id: "stats", label: "No. of Results", icon: BarChart2 },
  { id: "visualization", label: "Data Viz", icon: ChartLine },
  { id: "synthesis", label: "Strategic Analysis", icon: Sparkles },
  { id: "landscape", label: "Competitive Landscape", icon: Building2 },
  { id: "results", label: "Live Feed", icon: Search },
  { id: "documents", label: "Document AI", icon: FileText },
];

export const SectionNavigation = ({ hasResults, hasSynthesis }: SectionNavigationProps) => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!hasResults) return null;

  return (
    <div className="sticky top-[130px] z-[5] bg-surface-sunken/95 backdrop-blur-sm py-3 border-b border-border/20">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium mr-2">Jump to:</span>
        <div className="flex items-center gap-2 flex-wrap">
          {sections.map((section) => {
            // Hide certain sections if no data
            if ((section.id === "synthesis" || section.id === "landscape") && !hasSynthesis) {
              return null;
            }
            
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-card border border-border/40 text-foreground",
                  "hover:bg-secondary hover:border-border/60 transition-all duration-200",
                  "shadow-sm hover:shadow-md"
                )}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
