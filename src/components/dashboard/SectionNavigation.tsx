import { useState, useEffect } from "react";
import { BarChart2, Sparkles, Building2, Search, FileText, ChartLine, ChevronUp, ChevronDown, Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SectionNavigationProps {
  hasResults: boolean;
  hasSynthesis: boolean;
}

const sections = [
  { id: "search-section", label: "Search", icon: Radar },
  { id: "stats", label: "No. of Results", icon: BarChart2 },
  { id: "synthesis", label: "Strategic Analysis", icon: Sparkles },
  { id: "landscape", label: "Competitive Landscape", icon: Building2 },
  { id: "visualization", label: "Data Viz", icon: ChartLine },
  { id: "results", label: "Live Feed", icon: Search },
  { id: "documents", label: "Document AI", icon: FileText },
];

export const SectionNavigation = ({ hasResults, hasSynthesis }: SectionNavigationProps) => {
  const [activeSection, setActiveSection] = useState<string>("stats");

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id)
      })).filter(s => s.element);

      for (const section of sectionElements) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom > 200) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
    }
  };

  const getVisibleSections = () => {
    return sections.filter(section => {
      if ((section.id === "synthesis" || section.id === "landscape") && !hasSynthesis) {
        return false;
      }
      return true;
    });
  };

  const navigatePrevNext = (direction: 'prev' | 'next') => {
    const visibleSections = getVisibleSections();
    const currentIndex = visibleSections.findIndex(s => s.id === activeSection);
    
    if (direction === 'prev' && currentIndex > 0) {
      scrollToSection(visibleSections[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < visibleSections.length - 1) {
      scrollToSection(visibleSections[currentIndex + 1].id);
    }
  };

  if (!hasResults) return null;

  const visibleSections = getVisibleSections();
  const currentIndex = visibleSections.findIndex(s => s.id === activeSection);

  return (
    <div className="sticky top-[81px] z-30 bg-[hsl(220,18%,11%)] backdrop-blur-md py-3 border-b border-border/30 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-muted-foreground font-medium mr-2 shrink-0">Jump to:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {visibleSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-elevated"
                      : "bg-card border border-border/40 text-foreground hover:bg-secondary hover:border-border/60 shadow-sm hover:shadow-md"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Prev/Next Navigation */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigatePrevNext('prev')}
            disabled={currentIndex <= 0}
            className="h-9 px-3 bg-card border-border/40"
          >
            <ChevronUp className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigatePrevNext('next')}
            disabled={currentIndex >= visibleSections.length - 1}
            className="h-9 px-3 bg-card border-border/40"
          >
            Next
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
