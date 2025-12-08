import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchResult } from "@/lib/searchService";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Brain, TrendingUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format, parseISO } from "date-fns";

interface DataVisualizationProps {
  results: SearchResult[];
  isLoading: boolean;
  query?: string;
  situationRoomMode?: boolean;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--foreground))"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

export const DataVisualization = ({ results, isLoading, query, situationRoomMode = false }: DataVisualizationProps) => {
  const [chartAnalysis, setChartAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Process publication dates over time - grouped by month
  const publicationTrend = useMemo(() => {
    const dateData = results
      .filter(r => r.date)
      .reduce((acc, result) => {
        try {
          const date = new Date(result.date!);
          if (!isNaN(date.getTime()) && date.getFullYear() > 1990) {
            // Group by month-year
            const monthYear = format(date, "MMM yy");
            const sortKey = format(date, "yyyy-MM");
            if (!acc[sortKey]) {
              acc[sortKey] = { monthYear, count: 0, sortKey };
            }
            acc[sortKey].count += 1;
          }
        } catch (e) {
          // Skip invalid dates
        }
        return acc;
      }, {} as Record<string, { monthYear: string; count: number; sortKey: string }>);

    return Object.values(dateData)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ monthYear, count }) => ({ monthYear, publications: count }));
  }, [results]);

  // Process source breakdown
  const sourceData = results.reduce((acc, result) => {
    acc[result.source] = (acc[result.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceBreakdown = Object.entries(sourceData).map(([source, count]) => ({
    name: source,
    value: count
  }));

  // Process project stage distribution
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

  // Fetch AI analysis when data changes
  useEffect(() => {
    const analyzeCharts = async () => {
      if (results.length === 0 || !query) return;
      
      setIsAnalyzing(true);
      try {
        const { data, error } = await supabase.functions.invoke('analyze-charts', {
          body: {
            query,
            chartData: {
              publicationTrend,
              sourceBreakdown,
              studyTypeDistribution
            },
            results: results.slice(0, 20)
          }
        });

        if (error) throw error;
        setChartAnalysis(data.analysis);
      } catch (error) {
        console.error('Chart analysis error:', error);
        setChartAnalysis(null);
      } finally {
        setIsAnalyzing(false);
      }
    };

    if (results.length > 0 && query) {
      analyzeCharts();
    }
  }, [results.length, query]);

  if (isLoading) {
    return (
      <Card className="bg-card border-border/30 shadow-elevated">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-xl font-bold text-foreground">Executive Market Overview</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Loading intelligence data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <Skeleton className="h-[300px] w-full rounded-xl bg-muted/20" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-[280px] w-full rounded-xl bg-muted/20" />
            <Skeleton className="h-[280px] w-full rounded-xl bg-muted/20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border/30 shadow-elevated">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="flex items-center gap-3 text-xl font-bold text-foreground">
          <div className="p-2 bg-primary/15 rounded-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          Executive Market Overview
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground pl-12">
          High-level intelligence across activity, sources, and execution stages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 pt-8">
        {/* AI Chart Analysis */}
        {(isAnalyzing || chartAnalysis) && (
          <div className="bg-surface-elevated rounded-xl p-6 border border-border/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/15 rounded-lg">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Strategic Intelligence Analysis</h3>
            </div>
            {isAnalyzing ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm">Analyzing market landscape and competitive signals...</span>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h2 className="text-sm font-bold mt-4 mb-2 text-primary uppercase tracking-wide">{children}</h2>,
                    h2: ({ children }) => <h2 className="text-sm font-bold mt-4 mb-2 text-primary uppercase tracking-wide">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1.5 text-foreground">{children}</h3>,
                    p: ({ children }) => <p className="text-sm text-foreground/90 leading-relaxed mb-2">{children}</p>,
                    ul: ({ children }) => <ul className="text-sm space-y-1 mb-2 list-disc pl-4">{children}</ul>,
                    ol: ({ children }) => <ol className="text-sm space-y-1 mb-2 list-decimal pl-4">{children}</ol>,
                    li: ({ children }) => <li className="text-foreground/90">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                  }}
                >
                  {chartAnalysis}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Market Activity Momentum */}
        {publicationTrend.length > 0 && (
          <div className="bg-surface-elevated rounded-xl p-6 border border-border/30">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground">Market Activity Momentum</h3>
              <p className="text-sm text-muted-foreground mt-1">Volume of competitive and innovation signals over time</p>
              <p className="text-xs text-secondary-foreground mt-2 italic">"Market signals remained flat for a decade before sharp acceleration post-2022."</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={publicationTrend} margin={{ top: 20, right: 30, left: 50, bottom: 60 }} style={{ background: 'transparent' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 25%)" strokeOpacity={0.5} vertical={false} />
                <XAxis 
                  dataKey="monthYear" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  axisLine={{ stroke: 'hsl(220 12% 25%)' }}
                  tickLine={{ stroke: 'hsl(220 12% 25%)' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  width={50}
                  axisLine={{ stroke: 'hsl(220 12% 25%)' }}
                  tickLine={{ stroke: 'hsl(220 12% 25%)' }}
                  label={{ 
                    value: 'Publications', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 },
                    dx: -10
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                    boxShadow: '0 8px 24px -4px hsl(220 15% 10% / 0.12)'
                  }}
                  formatter={(value: number) => [value, 'Publications']}
                />
                <Legend 
                  wrapperStyle={{ 
                    color: 'hsl(var(--foreground))',
                    paddingTop: '20px'
                  }} 
                />
                <Bar 
                  dataKey="publications" 
                  fill="hsl(210 100% 50%)" 
                  radius={[2, 2, 0, 0]}
                  name="Publications"
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Intelligence Source Mix */}
          <div className="bg-surface-elevated rounded-xl p-6 border border-border/30">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground">Intelligence Source Mix</h3>
              <p className="text-sm text-muted-foreground mt-1">Where intelligence is being captured from</p>
              <p className="text-xs text-secondary-foreground mt-2 italic">"Balanced coverage across research, patents, and market news."</p>
            </div>
            <div className="flex items-start gap-6">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart style={{ background: 'transparent' }}>
                  <Pie
                    data={sourceBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
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
                      color: 'hsl(var(--foreground))',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px -4px hsl(220 15% 10% / 0.12)'
                    }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend Table */}
              <div className="flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-2 text-muted-foreground font-medium">Source</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Count</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceBreakdown.map((entry, index) => {
                      const total = sourceBreakdown.reduce((acc, e) => acc + e.value, 0);
                      const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                      return (
                        <tr key={entry.name} className="border-b border-border/20">
                          <td className="py-2 flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-sm" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-foreground">{entry.name}</span>
                          </td>
                          <td className="text-right py-2 text-foreground font-medium">{entry.value}</td>
                          <td className="text-right py-2 text-muted-foreground">{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Execution & Commercialization Stages */}
          {studyTypeDistribution.length > 0 && (
            <div className="bg-surface-elevated rounded-xl p-6 border border-border/30">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">Execution & Commercialization Stages</h3>
                <p className="text-sm text-muted-foreground mt-1">Maturity distribution of tracked initiatives</p>
                <p className="text-xs text-secondary-foreground mt-2 italic">"Most initiatives are in early development phases."</p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={studyTypeDistribution} margin={{ top: 10, right: 30, left: 20, bottom: 80 }} style={{ background: 'transparent' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 25%)" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    width={40}
                    label={{ 
                      value: 'Count', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px -4px hsl(220 15% 10% / 0.12)'
                    }}
                    formatter={(value: number) => [value, 'Initiatives']}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[6, 6, 0, 0]}
                    name="Number of Initiatives"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
