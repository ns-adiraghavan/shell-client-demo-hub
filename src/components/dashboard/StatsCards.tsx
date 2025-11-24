import { Card, CardContent } from "@/components/ui/card";
import { FileText, Beaker, FileSearch, Scale } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  isSearching: boolean;
}

export const StatsCards = ({ isSearching }: StatsCardsProps) => {
  const stats = [
    { label: "PubMed Articles", value: "47", icon: FileText, color: "text-blue-600" },
    { label: "Clinical Trials", value: "23", icon: Beaker, color: "text-green-600" },
    { label: "Preprints", value: "12", icon: FileSearch, color: "text-amber-600" },
    { label: "Patents", value: "8", icon: Scale, color: "text-purple-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
