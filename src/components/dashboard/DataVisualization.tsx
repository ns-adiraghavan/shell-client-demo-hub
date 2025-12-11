import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchResult } from "@/lib/searchService";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Brain, TrendingUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format, parseISO, eachMonthOfInterval, startOfMonth, endOfMonth, isValid } from "date-fns";

interface DataVisualizationProps {
  results: SearchResult[];
  isLoading: boolean;
  query?: string;
  situationRoomMode?: boolean;
}

// Distinct, vibrant color palette for maximum visual separation
const COLORS = [
  'hsl(25 95% 53%)',    // Vivid orange
  'hsl(200 95% 45%)',   // Bright blue
  'hsl(145 70% 42%)',   // Emerald green
  'hsl(280 75% 55%)',   // Rich purple
  'hsl(340 80% 55%)',   // Magenta/pink
];

// Chart font configuration for consistency
const CHART_FONT = {
  family: 'inherit',
  size: {
    tick: 10,
    axisLabel: 11,
    legend: 11,
  },
};

// Custom label with leader lines for pie chart
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
  fill,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const ex = cx + (outerRadius + 40) * Math.cos(-midAngle * RADIAN);
  const ey = cy + (outerRadius + 40) * Math.sin(-midAngle * RADIAN);
  const textAnchor = ex > cx ? 'start' : 'end';

  if (percent < 0.05) return null; // Hide labels for very small slices

  return (
    <g>
      <path
        d={`M${cx + outerRadius * Math.cos(-midAngle * RADIAN)},${cy + outerRadius * Math.sin(-midAngle * RADIAN)}L${x},${y}L${ex},${ey}`}
        stroke={fill}
        fill="none"
        strokeWidth={1}
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} />
      <text
        x={ex + (textAnchor === 'start' ? 4 : -4)}
        y={ey}
        textAnchor={textAnchor}
        fill="hsl(var(--foreground))"
        style={{ fontSize: CHART_FONT.size.legend, fontFamily: CHART_FONT.family }}
        dominantBaseline="central"
      >
        {`${name}`}
      </text>
      <text
        x={ex + (textAnchor === 'start' ? 4 : -4)}
        y={ey + 12}
        textAnchor={textAnchor}
        fill="hsl(var(--muted-foreground))"
        style={{ fontSize: CHART_FONT.size.tick, fontFamily: CHART_FONT.family }}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

// Custom legend renderer for consistent styling
const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span style={{ fontSize: CHART_FONT.size.legend, color: 'hsl(var(--foreground))' }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const DataVisualization = ({ results, isLoading, query, situationRoomMode = false }: DataVisualizationProps) => {
  const [chartAnalysis, setChartAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Source label mapping to match filter checkboxes
  const sourceDisplayLabels: Record<string, string> = {
    'IEEE': 'Technical Literature',
    'IndustryNews': 'Industry News',
    'Google Scholar': 'Scholarly Literature',
    'Patents': 'Patents',
    'News': 'Business News',
    'PubMed': 'Scholarly Literature',
    'arXiv': 'Technical Literature',
    'ClinicalTrials': 'Industry News',
  };

  // Get unique sources for the chart (using display labels)
  const uniqueSources = useMemo(() => {
    const labels = [...new Set(results.map(r => sourceDisplayLabels[r.source] || r.source))];
    return labels;
  }, [results]);

  // Source color mapping using display labels - distinct vibrant colors
  const sourceColors: Record<string, string> = {
    'Business News': 'hsl(25 95% 53%)',       // Vivid orange
    'Patents': 'hsl(200 95% 45%)',            // Bright blue
    'Scholarly Literature': 'hsl(145 70% 42%)', // Emerald green
    'Technical Literature': 'hsl(280 75% 55%)', // Rich purple
    'Industry News': 'hsl(340 80% 55%)',      // Magenta/pink
  };

  // Format year as '23, '24, '25
  const formatMonthYear = (date: Date): string => {
    const month = format(date, "MMM");
    const year = format(date, "yy");
    return `${month} '${year}`;
  };

  // Process publication dates over time - grouped by month and source (with smart spacing)
  const publicationTrend = useMemo(() => {
    // First, collect all valid dates
    const validDates = results
      .filter(r => r.date && r.date !== 'Unknown' && r.date !== '')
      .map(r => {
        try {
          const date = new Date(r.date!);
          if (!isNaN(date.getTime()) && date.getFullYear() > 1990) {
            return date;
          }
        } catch (e) {
          // Skip invalid dates
        }
        return null;
      })
      .filter((d): d is Date => d !== null);

    if (validDates.length === 0) return [];

    // Find min and max dates
    const minDate = startOfMonth(new Date(Math.min(...validDates.map(d => d.getTime()))));
    const maxDate = endOfMonth(new Date(Math.max(...validDates.map(d => d.getTime()))));

    // Generate all months in the range
    const allMonths = eachMonthOfInterval({ start: minDate, end: maxDate });

    // Initialize data structure with all months
    const monthlyData: Record<string, Record<string, string | number>> = {};
    allMonths.forEach(month => {
      const sortKey = format(month, "yyyy-MM");
      const monthYear = formatMonthYear(month);
      monthlyData[sortKey] = { monthYear, sortKey };
      // Initialize all sources to 0
      uniqueSources.forEach(source => {
        monthlyData[sortKey][source] = 0;
      });
    });

    // Fill in actual counts
    results.forEach(result => {
      if (!result.date || result.date === 'Unknown' || result.date === '') return;
      try {
        const date = new Date(result.date);
        if (isNaN(date.getTime()) || date.getFullYear() <= 1990) return;
        const sortKey = format(date, "yyyy-MM");
        if (monthlyData[sortKey]) {
          const sourceKey = sourceDisplayLabels[result.source] || result.source;
          monthlyData[sortKey][sourceKey] = ((monthlyData[sortKey][sourceKey] as number) || 0) + 1;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Convert to array and sort
    const dataArray = Object.values(monthlyData)
      .sort((a, b) => (a.sortKey as string).localeCompare(b.sortKey as string));
    
    // Filter to only keep months that have at least one publication
    const monthsWithData = dataArray.filter((month) => {
      const totalCount = uniqueSources.reduce((sum, source) => sum + ((month[source] as number) || 0), 0);
      return totalCount > 0;
    });

    return monthsWithData;
  }, [results, uniqueSources]);

  // Process source breakdown using display labels
  const sourceData = results.reduce((acc, result) => {
    const displayLabel = sourceDisplayLabels[result.source] || result.source;
    acc[displayLabel] = (acc[displayLabel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceBreakdown = Object.entries(sourceData).map(([source, count]) => ({
    name: source,
    value: count
  }));

  // Insight category colors - distinct palette
  const insightCategoryColors: Record<string, string> = {
    "Business Updates": 'hsl(200 95% 45%)',              // Bright blue
    "Product / Project Announcements": 'hsl(145 70% 42%)', // Emerald green
    "Partnerships & Collaborations": 'hsl(280 75% 55%)',   // Rich purple
    "Investments & Funding": 'hsl(25 95% 53%)',            // Vivid orange
    "Academic Research & Tie-ups": 'hsl(180 70% 45%)',     // Teal
    "Patent & IP Activity": 'hsl(340 80% 55%)',            // Magenta/pink
    "Startup & Innovation News": 'hsl(45 90% 50%)',        // Gold
    "Suppliers, Logistics & Raw Materials": 'hsl(220 70% 55%)', // Blue-violet
  };

  // Process insight category breakdown
  const insightCategoryData = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    results.forEach(result => {
      const categories = result.insightCategories || [];
      categories.forEach((cat: string) => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });
    return Object.entries(categoryCount)
      .map(([name, count]) => ({
        name,
        count,
        fill: insightCategoryColors[name] || COLORS[0]
      }))
      .sort((a, b) => b.count - a.count);
  }, [results]);

  // Source breakdown as bar chart data (keeping for pie chart)
  const sourceBarData = sourceBreakdown.map(item => ({
    name: item.name,
    count: item.value,
    fill: sourceColors[item.name] || COLORS[0]
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

  const total = sourceBreakdown.reduce((acc, e) => acc + e.value, 0);

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
              <h3 className="text-lg font-bold text-foreground">Strategic Market Analysis</h3>
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
              <p className="text-sm text-muted-foreground mt-1">Volume of competitive and innovation signals over time by source</p>
              <p className="text-xs text-secondary-foreground mt-2 italic">"Market signals remained flat for a decade before sharp acceleration post-2022."</p>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={publicationTrend} margin={{ top: 20, right: 30, left: 50, bottom: 80 }} style={{ background: 'transparent' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 25%)" strokeOpacity={0.5} vertical={false} />
                <XAxis 
                  dataKey="monthYear" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: CHART_FONT.size.tick, fontFamily: CHART_FONT.family }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  axisLine={{ stroke: 'hsl(220 12% 25%)' }}
                  tickLine={{ stroke: 'hsl(220 12% 25%)' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: CHART_FONT.size.tick, fontFamily: CHART_FONT.family }}
                  width={50}
                  axisLine={{ stroke: 'hsl(220 12% 25%)' }}
                  tickLine={{ stroke: 'hsl(220 12% 25%)' }}
                  label={{ 
                    value: 'Publications', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--muted-foreground))', fontSize: CHART_FONT.size.axisLabel, fontFamily: CHART_FONT.family, fontWeight: 500 },
                    dx: -10
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                    fontSize: CHART_FONT.size.legend,
                    fontFamily: CHART_FONT.family,
                    boxShadow: '0 8px 24px -4px hsl(220 15% 10% / 0.12)'
                  }}
                />
                <Legend content={renderLegend} />
                {uniqueSources.map((source, index) => (
                  <Bar 
                    key={source}
                    dataKey={source} 
                    fill={sourceColors[source] || COLORS[index % COLORS.length]} 
                    radius={index === uniqueSources.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                    stackId="sources"
                    name={source}
                    maxBarSize={30}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Intelligence Source Mix - Full Width with Pie + Bar */}
        <div className="bg-surface-elevated rounded-xl p-6 border border-border/30">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground">Intelligence Source Mix</h3>
            <p className="text-sm text-muted-foreground mt-1">Where intelligence is being captured from</p>
            <p className="text-xs text-secondary-foreground mt-2 italic">"Balanced coverage across research, patents, and market news."</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Pie Chart with Leader Lines */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4 text-center">Distribution</h4>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart style={{ background: 'transparent' }}>
                  <Pie
                    data={sourceBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props) => renderCustomizedLabel({ ...props, fill: sourceColors[props.name] || COLORS[0] })}
                    outerRadius={70}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {sourceBreakdown.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={sourceColors[entry.name] || COLORS[0]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                      fontSize: CHART_FONT.size.legend,
                      fontFamily: CHART_FONT.family,
                      boxShadow: '0 8px 24px -4px hsl(220 15% 10% / 0.12)'
                    }}
                    formatter={(value: number, name: string) => [`${value} (${((value / total) * 100).toFixed(0)}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Bar Chart - Count by Insight Category */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4 text-center">Count by Insight Category</h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart 
                  data={insightCategoryData} 
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 140, bottom: 10 }} 
                  style={{ background: 'transparent' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 25%)" strokeOpacity={0.5} horizontal={true} vertical={false} />
                  <XAxis 
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: CHART_FONT.size.tick, fontFamily: CHART_FONT.family }}
                    axisLine={{ stroke: 'hsl(220 12% 25%)' }}
                    tickLine={{ stroke: 'hsl(220 12% 25%)' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 9, fontFamily: CHART_FONT.family }}
                    width={130}
                    axisLine={{ stroke: 'hsl(220 12% 25%)' }}
                    tickLine={{ stroke: 'hsl(220 12% 25%)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                      fontSize: CHART_FONT.size.legend,
                      fontFamily: CHART_FONT.family,
                      boxShadow: '0 8px 24px -4px hsl(220 15% 10% / 0.12)'
                    }}
                    formatter={(value: number) => [`${value} results`, 'Count']}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[0, 4, 4, 0]}
                    maxBarSize={24}
                  >
                    {insightCategoryData.map((entry, index) => (
                      <Cell key={`cell-bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-1 gap-6">

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
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: CHART_FONT.size.tick, fontFamily: CHART_FONT.family }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: CHART_FONT.size.tick, fontFamily: CHART_FONT.family }}
                    width={40}
                    label={{ 
                      value: 'Count', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--muted-foreground))', fontSize: CHART_FONT.size.axisLabel, fontFamily: CHART_FONT.family, fontWeight: 500 }
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                      fontSize: CHART_FONT.size.legend,
                      fontFamily: CHART_FONT.family,
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
