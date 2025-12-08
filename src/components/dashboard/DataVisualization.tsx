import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchResult } from "@/lib/searchService";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Brain, TrendingUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DataVisualizationProps {
  results: SearchResult[];
  isLoading: boolean;
  query?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

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

export const DataVisualization = ({ results, isLoading, query }: DataVisualizationProps) => {
  const [chartAnalysis, setChartAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Process publication dates over time
  const dateData = results
    .filter(r => r.date)
    .reduce((acc, result) => {
      const year = new Date(result.date!).getFullYear();
      if (!isNaN(year) && year > 1990) {
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
      <Card className="bg-card border-border/60 shadow-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-title text-foreground">Executive Market Overview</CardTitle>
          <CardDescription className="text-caption text-muted-foreground">Loading intelligence data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <Skeleton className="h-[300px] w-full rounded-lg" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-[250px] w-full rounded-lg" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border/60 shadow-card">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="flex items-center gap-2.5 text-title text-foreground">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          Executive Market Overview
        </CardTitle>
        <CardDescription className="text-caption text-muted-foreground">
          High-level intelligence across activity, sources, and execution stages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        {/* AI Chart Analysis */}
        {(isAnalyzing || chartAnalysis) && (
          <div className="bg-muted/40 rounded-xl p-6 border border-border/40">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-subtitle text-foreground">Strategic Intelligence Analysis</h3>
            </div>
            {isAnalyzing ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-body">Analyzing market landscape and competitive signals...</span>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h2 className="text-body font-semibold mt-4 mb-2 text-primary">{children}</h2>,
                    h2: ({ children }) => <h2 className="text-body font-semibold mt-4 mb-2 text-primary">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-caption font-semibold mt-3 mb-1.5 text-foreground">{children}</h3>,
                    p: ({ children }) => <p className="text-body text-foreground leading-relaxed mb-2">{children}</p>,
                    ul: ({ children }) => <ul className="text-body space-y-1 mb-2 list-disc pl-4">{children}</ul>,
                    ol: ({ children }) => <ol className="text-body space-y-1 mb-2 list-decimal pl-4">{children}</ol>,
                    li: ({ children }) => <li className="text-foreground">{children}</li>,
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
          <div className="bg-muted/30 rounded-xl p-6 border border-border/40">
            <div className="mb-5">
              <h3 className="text-subtitle font-semibold text-foreground">Market Activity Momentum</h3>
              <p className="text-caption text-muted-foreground mt-1">Volume of competitive and innovation signals over time</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={publicationTrend} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="year" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  width={40}
                  label={{ 
                    value: 'Signals', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px -2px hsl(220 15% 10% / 0.08)'
                  }}
                  formatter={(value: number) => [value, 'Signals']}
                />
                <Legend 
                  wrapperStyle={{ 
                    color: 'hsl(var(--foreground))',
                    paddingTop: '20px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="publications" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  name="Market Signals per Year"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Intelligence Source Mix */}
          <div className="bg-muted/30 rounded-xl p-6 border border-border/40">
            <div className="mb-5">
              <h3 className="text-subtitle font-semibold text-foreground">Intelligence Source Mix</h3>
              <p className="text-caption text-muted-foreground mt-1">Where intelligence is being captured from</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart margin={{ top: 10, right: 80, left: 80, bottom: 10 }}>
                <Pie
                  data={sourceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={CustomLabel}
                  outerRadius={70}
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
                    boxShadow: '0 4px 12px -2px hsl(220 15% 10% / 0.08)'
                  }}
                  formatter={(value: number, name: string) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Execution & Commercialization Stages */}
          {studyTypeDistribution.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-6 border border-border/40">
              <div className="mb-5">
                <h3 className="text-subtitle font-semibold text-foreground">Execution & Commercialization Stages</h3>
                <p className="text-caption text-muted-foreground mt-1">Maturity distribution of tracked initiatives</p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={studyTypeDistribution} margin={{ top: 10, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                      style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px -2px hsl(220 15% 10% / 0.08)'
                    }}
                    formatter={(value: number) => [value, 'Initiatives']}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
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
