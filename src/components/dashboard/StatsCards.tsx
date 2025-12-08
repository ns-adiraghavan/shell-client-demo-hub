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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isActive = index === activeIndex && stat.value > 0;
        return (
          <Card 
            key={stat.label} 
            className={`bg-card transition-all ${
              isActive 
                ? 'border-primary border-2 shadow-md' 
                : 'border-border/50 hover:border-border'
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
                    {stat.label}
                  </p>
                  {isSearching ? (
                    <Skeleton className="h-9 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-primary mt-2">{stat.value}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};