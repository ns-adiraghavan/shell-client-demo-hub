import { Card, CardContent } from "@/components/ui/card";
import { FileText, Briefcase, FileSearch, Scale, Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  counts: {
    pubmed: number;
    clinical: number;
    arxiv: number;
    patents: number;
    news: number;
  };
  isSearching: boolean;
}

export const StatsCards = ({ counts, isSearching }: StatsCardsProps) => {
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isActive = index === activeIndex && stat.value > 0;
        return (
          <Card 
            key={stat.label} 
            className={`transition-all overflow-hidden border-border/30 ${
              isActive 
                ? 'bg-surface-elevated shadow-beacon shadow-elevated' 
                : 'bg-card shadow-beacon-muted hover:bg-surface-elevated'
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate mb-2">
                    {stat.label}
                  </p>
                  {isSearching ? (
                    <Skeleton className="h-12 w-20 bg-muted/30" />
                  ) : (
                    <p className={`text-4xl font-bold tracking-tight ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {stat.value}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg shrink-0 ${isActive ? 'bg-primary/15' : 'bg-secondary'}`}>
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
