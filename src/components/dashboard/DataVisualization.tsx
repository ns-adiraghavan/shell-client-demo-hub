import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchResult } from "@/lib/searchService";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

interface DataVisualizationProps {
  results: SearchResult[];
  isLoading: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const DataVisualization = ({ results, isLoading }: DataVisualizationProps) => {
  // Process publication dates over time
  const dateData = results
    .filter(r => r.date)
    .reduce((acc, result) => {
      const year = new Date(result.date!).getFullYear();
      if (!isNaN(year)) {
        acc[year] = (acc[year] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

  const publicationTrend = Object.entries(dateData)
    .map(([year, count]) => ({ year: year.toString(), publications: count }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));

  // Process source breakdown
  const sourceData = results.reduce((acc, result) => {
    acc[result.source] = (acc[result.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceBreakdown = Object.entries(sourceData).map(([source, count]) => ({
    name: source,
    value: count
  }));

  // Process study type distribution (for clinical trials)
  const studyTypeData = results
    .filter(r => r.phase)
    .reduce((acc, result) => {
      const phase = result.phase || 'Unknown';
      acc[phase] = (acc[phase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const studyTypeDistribution = Object.entries(studyTypeData).map(([type, count]) => ({
    name: type,
    value: count
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Research Analytics</CardTitle>
          <CardDescription>Loading visualizations...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-[300px] w-full" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[250px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Analytics</CardTitle>
        <CardDescription>Visual insights from {results.length} search results</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Publication Trend Over Time */}
        {publicationTrend.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Publication Timeline</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={publicationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="year" 
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                <Line 
                  type="monotone" 
                  dataKey="publications" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Source Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Source Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {sourceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Study Type Distribution */}
          {studyTypeDistribution.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Clinical Trial Phases</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={studyTypeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};