import { Card, CardContent } from "@/components/ui/card";
import { FileText, Briefcase, FileSearch, Scale, Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  counts: {
    pubmed: number;
    clinical: number;
    arxiv: number;
    patents: number;
    news: number;
  };
  isSearching: boolean;
  situationRoomMode?: boolean;
}

export const StatsCards = ({ counts, isSearching, situationRoomMode = false }: StatsCardsProps) => {
  const stats = [
    { label: "Research Papers", value: counts.pubmed, icon: FileText },
    { label: "Active Projects", value: counts.clinical, icon: Briefcase },
    { label: "Technical Reports", value: counts.arxiv, icon: FileSearch },
    { label: "Patents", value: counts.patents, icon: Scale },
    { label: "Business News", value: counts.news, icon: Newspaper },
  ];

  const maxValue = Math.max(...stats.map(s => s.value));
  const activeIndex = stats.findIndex(s => s.value === maxValue && s.value > 0);

  return (
    <div className={cn(
      "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4",
      situationRoomMode && "gap-3"
    )}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isActive = index === activeIndex && stat.value > 0;
        return (
          <Card 
            key={stat.label} 
            className={cn(
              "transition-all overflow-hidden border-border/30",
              situationRoomMode 
                ? cn(
                    "bg-surface-dark border-border/40",
                    isActive && "shadow-beacon animate-beacon-glow border-primary/50"
                  )
                : cn(
                    isActive 
                      ? 'bg-surface-elevated shadow-beacon shadow-elevated' 
                      : 'bg-card shadow-beacon-muted hover:bg-surface-elevated'
                  )
            )}
          >
            <CardContent className={cn("p-5", situationRoomMode && "p-6")}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "font-semibold text-muted-foreground uppercase tracking-wider truncate mb-2",
                    situationRoomMode ? "text-xs" : "text-xs"
                  )}>
                    {stat.label}
                  </p>
                  {isSearching ? (
                    <Skeleton className={cn(
                      "bg-muted/30",
                      situationRoomMode ? "h-14 w-24" : "h-12 w-20"
                    )} />
                  ) : (
                    <p className={cn(
                      "font-bold tracking-tight",
                      situationRoomMode ? "text-5xl" : "text-4xl",
                      isActive ? 'text-primary' : 'text-foreground'
                    )}>
                      {stat.value}
                    </p>
                  )}
                </div>
                <div className={cn(
                  "rounded-lg shrink-0",
                  situationRoomMode ? "p-4" : "p-3",
                  isActive ? 'bg-primary/15' : 'bg-secondary'
                )}>
                  <Icon className={cn(
                    isActive ? 'text-primary' : 'text-muted-foreground',
                    situationRoomMode ? "h-6 w-6" : "h-5 w-5"
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
