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
            className={`bg-card shadow-card transition-all ${
              isActive 
                ? 'border-primary border-2 shadow-elevated' 
                : 'border-border/50 hover:shadow-card-hover'
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-caption font-medium text-muted-foreground uppercase tracking-wider truncate">
                    {stat.label}
                  </p>
                  {isSearching ? (
                    <Skeleton className="h-10 w-16 mt-2" />
                  ) : (
                    <p className="text-display text-primary mt-1">{stat.value}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg shrink-0 ${isActive ? 'bg-primary/10' : 'bg-muted/60'}`}>
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
