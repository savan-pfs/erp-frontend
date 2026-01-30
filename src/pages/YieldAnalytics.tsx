import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  Package,
  DollarSign,
  Leaf,
  Target,
  Award,
  Loader2,
} from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/common";
import { analyticsApi } from "@/lib/api/realApi";
import { useHarvestBatches, useBatches, useGenetics } from "@/hooks/useApi";

const YieldAnalytics = () => {
  const [dateRange, setDateRange] = useState("6m");

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    switch (dateRange) {
      case "3m":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "6m":
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 6);
    }
    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  const dateRangeParams = getDateRange();

  // Fetch analytics data
  const { data: yieldAnalytics, isLoading: yieldLoading } = useQuery({
    queryKey: ["analytics-yield", dateRange],
    queryFn: () => analyticsApi.getYield({
      startDate: dateRangeParams.startDate,
      endDate: dateRangeParams.endDate,
    }),
  });

  // Fetch all data for calculations
  const { data: apiHarvestBatches } = useHarvestBatches();
  const { data: apiBatches } = useBatches();
  const { data: apiGenetics } = useGenetics();

  // Calculate yield data from harvest batches
  const yieldData = useMemo(() => {
    if (!apiHarvestBatches || apiHarvestBatches.length === 0) return [];
    
    // Group by month
    const monthlyData = new Map<string, { yield: number; target: number; count: number }>();
    
    apiHarvestBatches.forEach((hb: any) => {
      const harvestDate = new Date(hb.harvestDate || hb.harvest_date);
      const monthKey = harvestDate.toLocaleDateString('en-US', { month: 'short' });
      
      const dryWeight = parseFloat(hb.dryWeight || hb.dry_weight || 0);
      const yieldOz = dryWeight / 28.35; // Convert grams to oz
      const existing = monthlyData.get(monthKey) || { yield: 0, target: 0, count: 0 };
      existing.yield += yieldOz;
      existing.count += 1;
      existing.target = 1200; // Default target per month
      monthlyData.set(monthKey, existing);
    });
    
    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({ 
        month, 
        yield: Math.round(data.yield), 
        target: data.target,
        revenue: Math.round(data.yield * 100) // Estimate $100 per oz
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6); // Last 6 months
  }, [apiHarvestBatches]);

  // Calculate strain performance
  const strainYield = useMemo(() => {
    if (!apiHarvestBatches || !apiGenetics) return [];
    
    const strainMap = new Map<string, { batches: number; totalYield: number; totalPlants: number; revenue: number }>();
    
    apiHarvestBatches.forEach((hb: any) => {
      const batch = apiBatches?.find((b: any) => b.id === (hb.batchId || hb.batch_id));
      const geneticId = batch?.geneticId || batch?.genetic_id;
      const genetic = apiGenetics.find((g: any) => g.id === geneticId);
      
      if (genetic) {
        const strainName = genetic.strainName || genetic.name || "Unknown";
        const existing = strainMap.get(strainName) || { batches: 0, totalYield: 0, totalPlants: 0, revenue: 0 };
        existing.batches += 1;
        const dryWeight = parseFloat(hb.dryWeight || hb.dry_weight || 0);
        existing.totalYield += dryWeight / 28.35; // Convert to oz
        existing.totalPlants += parseInt(hb.plantCount || hb.plant_count || 0);
        existing.revenue += (dryWeight / 28.35) * 100; // Estimate $100 per oz
        strainMap.set(strainName, existing);
      }
    });
    
    return Array.from(strainMap.entries())
      .map(([strain, data]) => ({
        strain,
        batches: data.batches,
        totalYield: Math.round(data.totalYield),
        avgYieldPerPlant: data.totalPlants > 0 ? Math.round((data.totalYield / data.totalPlants) * 10) / 10 : 0,
        revenue: Math.round(data.revenue),
      }))
      .sort((a, b) => b.totalYield - a.totalYield)
      .slice(0, 10);
  }, [apiHarvestBatches, apiGenetics, apiBatches]);

  // Calculate harvest efficiency
  const harvestEfficiency = useMemo(() => {
    if (!apiHarvestBatches || !apiBatches || !apiGenetics) return [];
    
    return apiHarvestBatches
      .filter((hb: any) => hb.status === 'completed')
      .slice(0, 10) // Recent 10 harvests
      .map((hb: any) => {
        const batch = apiBatches.find((b: any) => b.id === (hb.batchId || hb.batch_id));
        const genetic = batch ? apiGenetics.find((g: any) => g.id === (batch.geneticId || batch.genetic_id)) : null;
        const strainName = genetic?.strainName || genetic?.name || "Unknown";
        
        const dryWeight = parseFloat(hb.dryWeight || hb.dry_weight || 0);
        const yieldOz = dryWeight / 28.35;
        const plantCount = parseInt(hb.plantCount || hb.plant_count || 0);
        const avgYieldPerPlant = plantCount > 0 ? yieldOz / plantCount : 0;
        const targetYield = plantCount * 2; // Target 2 oz per plant
        const efficiency = targetYield > 0 ? Math.round((yieldOz / targetYield) * 100) : 0;
        
        return {
          batch: batch?.batchName || batch?.batch_name || `B-${hb.id}`,
          strain: strainName,
          plants: plantCount,
          yield: Math.round(yieldOz),
          targetYield: Math.round(targetYield),
          efficiency,
        };
      })
      .sort((a, b) => b.efficiency - a.efficiency);
  }, [apiHarvestBatches, apiBatches, apiGenetics]);

  // Calculate yield distribution
  const yieldDistribution = useMemo(() => {
    if (!apiHarvestBatches) return [];
    
    const ranges = {
      "2.0-2.2": 0,
      "2.2-2.4": 0,
      "2.4-2.6": 0,
      "2.6+": 0,
    };
    
    apiHarvestBatches
      .filter((hb: any) => hb.status === 'completed')
      .forEach((hb: any) => {
        const plantCount = parseInt(hb.plantCount || hb.plant_count || 0);
        const dryWeight = parseFloat(hb.dryWeight || hb.dry_weight || 0);
        if (plantCount > 0) {
          const avgYield = (dryWeight / 28.35) / plantCount;
          if (avgYield >= 2.0 && avgYield < 2.2) ranges["2.0-2.2"] += 1;
          else if (avgYield >= 2.2 && avgYield < 2.4) ranges["2.2-2.4"] += 1;
          else if (avgYield >= 2.4 && avgYield < 2.6) ranges["2.4-2.6"] += 1;
          else if (avgYield >= 2.6) ranges["2.6+"] += 1;
        }
      });
    
    return [
      { range: "2.0-2.2 oz", count: ranges["2.0-2.2"], color: "#ef4444" },
      { range: "2.2-2.4 oz", count: ranges["2.2-2.4"], color: "#f59e0b" },
      { range: "2.4-2.6 oz", count: ranges["2.4-2.6"], color: "#10b981" },
      { range: "2.6+ oz", count: ranges["2.6+"], color: "#3b82f6" },
    ].filter((r) => r.count > 0);
  }, [apiHarvestBatches]);

  // Calculate KPIs
  const kpiData = useMemo(() => {
    if (!apiHarvestBatches || apiHarvestBatches.length === 0) {
      return {
        totalYield: 0,
        avgYieldPerPlant: 0,
        yieldTrend: "0%",
        totalRevenue: 0,
        revenueTrend: "0%",
        targetAchievement: 0,
        efficiency: 0,
      };
    }
    
    const completedHarvests = apiHarvestBatches.filter((hb: any) => hb.status === 'completed');
    const totalPlants = completedHarvests.reduce((sum: number, hb: any) => 
      sum + (parseInt(hb.plantCount || hb.plant_count || 0)), 0
    );
    const totalYield = completedHarvests.reduce((sum: number, hb: any) => 
      sum + (parseFloat(hb.dryWeight || hb.dry_weight || 0) / 28.35), 0
    );
    const avgYieldPerPlant = totalPlants > 0 ? totalYield / totalPlants : 0;
    const totalRevenue = totalYield * 100; // Estimate $100 per oz
    const targetYield = totalPlants * 2; // Target 2 oz per plant
    const targetAchievement = targetYield > 0 ? Math.round((totalYield / targetYield) * 100) : 0;
    
    return {
      totalYield: Math.round(totalYield),
      avgYieldPerPlant: Math.round(avgYieldPerPlant * 10) / 10,
      yieldTrend: "+0%", // Could calculate trend from historical data
      totalRevenue: Math.round(totalRevenue),
      revenueTrend: "+0%",
      targetAchievement,
      efficiency: targetAchievement,
    };
  }, [apiHarvestBatches]);

  if (yieldLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Yield Analytics"
        description="Harvest yield performance and detailed analysis"
        breadcrumbs={[{ label: "Analytics", href: "/analytics" }, { label: "Yield" }]}
        actions={
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Yield"
          value={`${kpiData.totalYield.toLocaleString()} oz`}
          icon={<Package className="w-5 h-5" />}
          iconColor="bg-success/10 text-success"
          trend="up"
          change={kpiData.yieldTrend}
        />
        <StatCard
          title="Avg Yield/Plant"
          value={`${kpiData.avgYieldPerPlant} oz`}
          icon={<Leaf className="w-5 h-5" />}
          iconColor="bg-blue-500/10 text-blue-600"
          trend="up"
          change="Above target"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(kpiData.totalRevenue / 1000).toFixed(0)}k`}
          icon={<DollarSign className="w-5 h-5" />}
          iconColor="bg-purple-500/10 text-purple-600"
          trend="up"
          change={kpiData.revenueTrend}
        />
        <StatCard
          title="Efficiency"
          value={`${kpiData.efficiency}%`}
          icon={<Target className="w-5 h-5" />}
          iconColor="bg-orange-500/10 text-orange-600"
          trend="up"
          change={`${kpiData.targetAchievement}% of target`}
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Yield Trend</CardTitle>
            <CardDescription>Yield vs target over time</CardDescription>
          </CardHeader>
          <CardContent>
            {yieldData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <EmptyState
                  icon={Package}
                  title="No Yield Data"
                  description="No harvest data available for the selected period. Start harvesting to see yield trends."
                />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={yieldData}>
                <defs>
                  <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="yield"
                  stroke="#10b981"
                  fill="url(#yieldGradient)"
                  strokeWidth={2}
                  name="Actual Yield (oz)"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name="Target (oz)"
                  dot={false}
                />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Yield Distribution</CardTitle>
            <CardDescription>Distribution of yields per plant</CardDescription>
          </CardHeader>
          <CardContent>
            {yieldDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <EmptyState
                  icon={Target}
                  title="No Distribution Data"
                  description="No yield distribution data available. Complete harvests to see distribution analysis."
                />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={yieldDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  label={({ range, count }) => `${range}: ${count}`}
                >
                  {yieldDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Strain Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strain Performance</CardTitle>
          <CardDescription>Yield comparison by strain</CardDescription>
        </CardHeader>
        <CardContent>
          {strainYield.length === 0 ? (
            <div className="flex items-center justify-center h-[400px]">
              <EmptyState
                icon={Leaf}
                title="No Strain Data"
                description="No strain performance data available. Harvest batches with genetics to see strain comparisons."
              />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={strainYield}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="strain" className="text-xs" />
              <YAxis yAxisId="left" className="text-xs" />
              <YAxis yAxisId="right" orientation="right" className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="totalYield" fill="#8b5cf6" name="Total Yield (oz)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="avgYieldPerPlant" fill="#10b981" name="Avg/Plant (oz)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Harvest Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Harvest Efficiency</CardTitle>
          <CardDescription>Recent batch performance vs targets</CardDescription>
        </CardHeader>
        <CardContent>
          {harvestEfficiency.length === 0 ? (
            <div className="flex items-center justify-center h-[300px]">
              <EmptyState
                icon={Award}
                title="No Efficiency Data"
                description="No completed harvests available. Complete harvest batches to see efficiency metrics."
              />
            </div>
          ) : (
            <div className="space-y-4">
              {harvestEfficiency.map((harvest) => (
              <div key={harvest.batch} className="p-4 rounded-xl border bg-card hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{harvest.batch}</span>
                      <Badge variant="outline">{harvest.strain}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {harvest.plants} plants harvested
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{harvest.yield} oz</p>
                    <Badge
                      className={
                        harvest.efficiency >= 115
                          ? "bg-success/10 text-success border-0"
                          : harvest.efficiency >= 100
                          ? "bg-blue-500/10 text-blue-600 border-0"
                          : "bg-warning/10 text-warning border-0"
                      }
                    >
                      <Award className="w-3 h-3 mr-1" />
                      {harvest.efficiency}% efficiency
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress
                    value={Math.min(harvest.efficiency, 150)}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Target: {harvest.targetYield} oz</span>
                    <span>
                      {harvest.efficiency >= 100 ? "Exceeded target" : "Below target"}
                    </span>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strain Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {strainYield.map((strain) => (
          <Card key={strain.strain} className="hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Leaf className="w-5 h-5 text-success" />
                {strain.strain}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Batches</span>
                  <span className="font-medium">{strain.batches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Yield</span>
                  <span className="font-medium">{strain.totalYield} oz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg/Plant</span>
                  <span className="font-medium">{strain.avgYieldPerPlant} oz</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="font-bold text-success">${(strain.revenue / 1000).toFixed(0)}k</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default YieldAnalytics;
