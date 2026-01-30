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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Leaf,
  Calendar,
  Target,
  Loader2,
  Activity,
} from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/common";
import { analyticsApi } from "@/lib/api/realApi";
import { useHarvestBatches, useBatches, useRooms, useGenetics, usePlants, useInventory } from "@/hooks/useApi";

const Analytics = () => {
  const [dateRange, setDateRange] = useState("30d");

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    switch (dateRange) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
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
  const { data: apiRooms } = useRooms();
  const { data: apiGenetics } = useGenetics();
  const { data: apiPlants } = usePlants();
  const { data: apiInventory } = useInventory();

  // Calculate yield data from harvest batches
  const yieldData = useMemo(() => {
    if (!apiHarvestBatches || apiHarvestBatches.length === 0) return [];
    
    // Group by month
    const monthlyData = new Map<string, { yield: number; target: number; count: number }>();
    
    apiHarvestBatches.forEach((hb: any) => {
      const harvestDate = new Date(hb.harvestDate || hb.harvest_date);
      const monthKey = harvestDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const dryWeight = parseFloat(hb.dryWeight || hb.dry_weight || 0);
      const existing = monthlyData.get(monthKey) || { yield: 0, target: 0, count: 0 };
      existing.yield += dryWeight / 28.35; // Convert grams to oz
      existing.count += 1;
      existing.target = 50; // Default target
      monthlyData.set(monthKey, existing);
    });
    
    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, yield: Math.round(data.yield), target: data.target }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6); // Last 6 months
  }, [apiHarvestBatches]);

  // Calculate strain performance
  const strainPerformance = useMemo(() => {
    if (!apiHarvestBatches || !apiGenetics) return [];
    
    const strainMap = new Map<string, { batches: number; totalYield: number; successCount: number }>();
    
    apiHarvestBatches.forEach((hb: any) => {
      const batch = apiBatches?.find((b: any) => b.id === hb.batchId || hb.batch_id);
      const geneticId = batch?.geneticId || batch?.genetic_id;
      const genetic = apiGenetics.find((g: any) => g.id === geneticId);
      
      if (genetic) {
        const strainName = genetic.strainName || genetic.name || "Unknown";
        const existing = strainMap.get(strainName) || { batches: 0, totalYield: 0, successCount: 0 };
        existing.batches += 1;
        existing.totalYield += parseFloat(hb.dryWeight || hb.dry_weight || 0) / 28.35; // Convert to oz
        if (hb.status === 'completed') existing.successCount += 1;
        strainMap.set(strainName, existing);
      }
    });
    
    return Array.from(strainMap.entries())
      .map(([strain, data]) => ({
        strain,
        batches: data.batches,
        avgYield: data.batches > 0 ? Math.round((data.totalYield / data.batches) * 10) / 10 : 0,
        successRate: data.batches > 0 ? Math.round((data.successCount / data.batches) * 100) : 0,
      }))
      .sort((a, b) => b.avgYield - a.avgYield)
      .slice(0, 10);
  }, [apiHarvestBatches, apiGenetics, apiBatches]);

  // Calculate room efficiency
  const roomEfficiency = useMemo(() => {
    if (!apiRooms || !apiHarvestBatches) return [];
    
    return apiRooms
      .filter((r: any) => r.isActive !== false)
      .map((room: any) => {
        const roomHarvests = apiHarvestBatches.filter((hb: any) => 
          (hb.roomId || hb.room_id) === room.id
        );
        
        const totalYield = roomHarvests.reduce((sum: number, hb: any) => 
          sum + (parseFloat(hb.dryWeight || hb.dry_weight || 0) / 28.35), 0
        );
        const avgYield = roomHarvests.length > 0 ? Math.round(totalYield / roomHarvests.length) : 0;
        
        const capacity = room.capacity || 0;
        const currentPlants = room.currentPlants || room.current_plants || 0;
        const utilization = capacity > 0 ? Math.round((currentPlants / capacity) * 100) : 0;
        
        return {
          room: room.name,
          utilization,
          avgYield,
          efficiency: utilization > 0 ? Math.round((avgYield / utilization) * 100) : 0,
        };
      })
      .filter((r: any) => r.utilization > 0 || r.avgYield > 0);
  }, [apiRooms, apiHarvestBatches]);

  // Calculate stage distribution
  const stageDistribution = useMemo(() => {
    if (!apiBatches || !apiPlants) return [];
    
    const stages = {
      "Flowering": 0,
      "Vegetative": 0,
      "Clone": 0,
      "Harvest": 0,
    };
    
    // Count batches by room type
    apiBatches.filter((b: any) => b.isActive !== false).forEach((batch: any) => {
      const room = apiRooms?.find((r: any) => r.id === (batch.roomId || batch.room_id));
      const roomType = room?.roomType || room?.room_type;
      if (roomType === "FLOWERING") stages["Flowering"] += 1;
      else if (roomType === "VEGETATIVE") stages["Vegetative"] += 1;
      else if (roomType === "PROPAGATION") stages["Clone"] += 1;
    });
    
    // Count harvest batches
    stages["Harvest"] = apiHarvestBatches?.filter((hb: any) => 
      ['drying', 'curing', 'completed'].includes(hb.status)
    ).length || 0;
    
    return [
      { name: "Flowering", value: stages["Flowering"], color: "#8b5cf6" },
      { name: "Vegetative", value: stages["Vegetative"], color: "#10b981" },
      { name: "Clone", value: stages["Clone"], color: "#3b82f6" },
      { name: "Harvest", value: stages["Harvest"], color: "#f59e0b" },
    ].filter((s) => s.value > 0);
  }, [apiBatches, apiRooms, apiHarvestBatches]);

  // Calculate KPIs
  const kpiData = useMemo(() => {
    if (!apiHarvestBatches || apiHarvestBatches.length === 0) {
      return {
        avgYieldPerPlant: 0,
        yieldTrend: "0%",
        avgCycleTime: 0,
        cycleTrend: "0 days",
        costPerGram: 0,
        costTrend: "0%",
        complianceScore: 100,
        complianceTrend: "0%",
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
    
    // Calculate average cycle time (simplified - from batch start to harvest)
    const cycleTimes: number[] = [];
    apiHarvestBatches.forEach((hb: any) => {
      const batch = apiBatches?.find((b: any) => b.id === (hb.batchId || hb.batch_id));
      if (batch && batch.sourceDate) {
        const startDate = new Date(batch.sourceDate);
        const harvestDate = new Date(hb.harvestDate || hb.harvest_date);
        const days = Math.floor((harvestDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (days > 0) cycleTimes.push(days);
      }
    });
    const avgCycleTime = cycleTimes.length > 0 
      ? Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length)
      : 0;
    
    return {
      avgYieldPerPlant: Math.round(avgYieldPerPlant * 10) / 10,
      yieldTrend: "+0%", // Could calculate trend from historical data
      avgCycleTime,
      cycleTrend: "0 days",
      costPerGram: 0, // Would need cost data
      costTrend: "0%",
      complianceScore: 100, // Would need compliance data
      complianceTrend: "0%",
    };
  }, [apiHarvestBatches, apiBatches]);

  // Cost analysis (would need cost tracking data - placeholder for now)
  const costAnalysis = useMemo(() => {
    // This would come from a cost tracking API
    // For now, return placeholder data with some default values to show the chart
    const costs = [
      { category: "Nutrients", cost: 0 },
      { category: "Labor", cost: 0 },
      { category: "Utilities", cost: 0 },
      { category: "Supplies", cost: 0 },
    ];
    
    const total = costs.reduce((sum, item) => sum + item.cost, 0);
    return costs.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.cost / total) * 100) : 0,
    }));
  }, []);

  const COLORS = ["#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics & Insights"
        description="Comprehensive cultivation performance metrics and data visualization"
        breadcrumbs={[{ label: "Analytics" }]}
        actions={
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg Yield/Plant"
          value={`${kpiData.avgYieldPerPlant} oz`}
          icon={<Package className="w-5 h-5" />}
          iconColor="bg-purple-500/10 text-purple-600"
          trend="up"
          change={kpiData.yieldTrend}
        />
        <StatCard
          title="Avg Cycle Time"
          value={`${kpiData.avgCycleTime} days`}
          icon={<Calendar className="w-5 h-5" />}
          iconColor="bg-blue-500/10 text-blue-600"
          trend="down"
          change={kpiData.cycleTrend}
        />
        <StatCard
          title="Cost per Gram"
          value={`$${kpiData.costPerGram}`}
          icon={<DollarSign className="w-5 h-5" />}
          iconColor="bg-success/10 text-success"
          trend="down"
          change={kpiData.costTrend}
        />
        <StatCard
          title="Compliance Score"
          value={`${kpiData.complianceScore}%`}
          icon={<Target className="w-5 h-5" />}
          iconColor="bg-orange-500/10 text-orange-600"
          trend="up"
          change={kpiData.complianceTrend}
        />
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="yield" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="yield">Yield</TabsTrigger>
          <TabsTrigger value="strains">Strains</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="yield" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Yield Trend</CardTitle>
                <CardDescription>Monthly yield vs target</CardDescription>
              </CardHeader>
              <CardContent>
                {yieldData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <EmptyState
                      icon={Package}
                      title="No Yield Data"
                      description="No harvest data available. Start harvesting to see yield trends."
                    />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={yieldData}>
                    <defs>
                      <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                      stroke="#8b5cf6"
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
                <CardTitle className="text-lg">Stage Distribution</CardTitle>
                <CardDescription>Current plant distribution by stage</CardDescription>
              </CardHeader>
              <CardContent>
                {stageDistribution.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <EmptyState
                      icon={Activity}
                      title="No Stage Data"
                      description="No active batches or plants available. Create batches to see stage distribution."
                    />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stageDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stageDistribution.map((entry, index) => (
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
        </TabsContent>

        <TabsContent value="strains" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strain Performance Comparison</CardTitle>
              <CardDescription>Average yield and success rate by strain</CardDescription>
            </CardHeader>
            <CardContent>
              {strainPerformance.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <EmptyState
                    icon={Leaf}
                    title="No Strain Data"
                    description="No strain performance data available. Harvest batches with genetics to see comparisons."
                  />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={strainPerformance}>
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
                  <Bar yAxisId="left" dataKey="avgYield" fill="#8b5cf6" name="Avg Yield (oz)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="successRate" fill="#10b981" name="Success Rate (%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {strainPerformance.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {strainPerformance.map((strain) => (
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
                      <span className="text-sm text-muted-foreground">Avg Yield</span>
                      <span className="font-medium">{strain.avgYield} oz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <Badge className={strain.successRate >= 90 ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>
                        {strain.successRate}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rooms" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Room Efficiency Metrics</CardTitle>
              <CardDescription>Utilization and performance by room</CardDescription>
            </CardHeader>
            <CardContent>
              {roomEfficiency.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <EmptyState
                    icon={Activity}
                    title="No Room Data"
                    description="No room efficiency data available. Assign batches to rooms to see efficiency metrics."
                  />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={roomEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="room" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="utilization" fill="#3b82f6" name="Utilization (%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="efficiency" fill="#10b981" name="Efficiency Score" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                <CardDescription>Total costs by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costAnalysis}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="percentage"
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                    >
                      {costAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Details</CardTitle>
                <CardDescription>Monthly cost breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costAnalysis.map((item, index) => (
                    <div key={item.category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                          <span className="text-muted-foreground">{item.category}</span>
                        </div>
                        <span className="font-medium">${item.cost.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${item.percentage}%`, backgroundColor: COLORS[index] }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${costAnalysis.reduce((sum, item) => sum + item.cost, 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
