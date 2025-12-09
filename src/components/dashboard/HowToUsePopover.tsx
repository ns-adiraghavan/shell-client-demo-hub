import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { HelpCircle } from "lucide-react";

export const HowToUsePopover = () => {
  return (
    <HoverCard openDelay={100} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <HelpCircle className="h-4 w-4" />
          How to Use
        </Button>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-96 bg-card border-border/50 shadow-elevated" 
        align="end"
        sideOffset={8}
      >
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground text-sm">Quick Start Guide</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Search across business news, startups, patents, scientific research, suppliers, and partnerships. Get AI-powered synthesis of market intelligence and your internal knowledge base.
          </p>
          <ol className="space-y-2 text-xs text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary font-semibold shrink-0">1.</span>
              <span>Enter market, technology, or competitive keyword</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-semibold shrink-0">2.</span>
              <span>Select intelligence sources (Literature, Patents, News)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-semibold shrink-0">3.</span>
              <span>Optionally connect Document Intelligence sources</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-semibold shrink-0">4.</span>
              <span>Click Search to aggregate external insights</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-semibold shrink-0">5.</span>
              <span>Review Executive Brief, Competitive Landscape & Live Feed</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-semibold shrink-0">6.</span>
              <span>Export reports as PDF or CSV/BibTeX/RIS</span>
            </li>
          </ol>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
