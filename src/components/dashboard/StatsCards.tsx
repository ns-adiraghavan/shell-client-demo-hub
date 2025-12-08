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
    { label: "Research Papers", value: counts.pubmed, icon: FileText, color: "text-primary" },
    { label: "Active Projects", value: counts.clinical, icon: Briefcase, color: "text-chart-2" },
    { label: "Technical Reports", value: counts.arxiv, icon: FileSearch, color: "text-chart-3" },
    { label: "Patents", value: counts.patents, icon: Scale, color: "text-chart-4" },
    { label: "Business News", value: counts.news, icon: Newspaper, color: "text-chart-5" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  {isSearching ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};