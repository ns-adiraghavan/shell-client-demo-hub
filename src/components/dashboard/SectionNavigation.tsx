import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Section {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SectionNavigationProps {
  sections: Section[];
  activeSection?: string;
}

export const SectionNavigation = ({ sections, activeSection }: SectionNavigationProps) => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-sm font-medium text-muted-foreground mr-2 shrink-0">Jump to:</span>
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "outline"}
              size="sm"
              onClick={() => scrollToSection(section.id)}
              className="shrink-0"
            >
              {section.icon}
              <span className="ml-1">{section.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface SectionHeaderProps {
  id: string;
  title: string;
  sections: Section[];
  currentIndex: number;
}

export const SectionHeader = ({ id, title, sections, currentIndex }: SectionHeaderProps) => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : null;
  const nextSection = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

  return (
    <div id={id} className="flex items-center justify-between pt-6 pb-2 scroll-mt-20">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollToTop}
          title="Back to top"
          className="h-8 w-8"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        {prevSection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollToSection(prevSection.id)}
            title={`Previous: ${prevSection.label}`}
            className="text-xs"
          >
            <ChevronUp className="h-3 w-3 mr-1" />
            Prev
          </Button>
        )}
        {nextSection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollToSection(nextSection.id)}
            title={`Next: ${nextSection.label}`}
            className="text-xs"
          >
            Next
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};
