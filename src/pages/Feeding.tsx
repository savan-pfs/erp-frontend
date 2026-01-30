import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Droplets,
  Plus,
  Leaf,
  TrendingUp,
  Loader2,
  Beaker,
  FlaskConical,
  Activity,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState } from "@/components/common";
import type { Column, RowAction } from "@/components/common";
import { useFeedingLogs, useCreateFeedingLog, useRooms, useBatches } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

interface FeedingLog {
  id: string;
  feedDate: string;
  room: string;
  batch: string;
  nutrientSolution: string;
  phLevel: number;
  ecPpm: number;
  runoffPh: number;
  runoffEc: number;
  waterVolume: number;
  performedBy: string;
  notes: string;
}

interface NutrientSchedule {
  stage: string;
  phRange: string;
  ecRange: string;
  nutrients: string;
  frequency: string;
  icon: string;
}

const Feeding = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    feedDate: "",
    roomId: "",
    batchId: "",
    nutrientSolution: "",
    phLevel: "",
    ecPpm: "",
    runoffPh: "",
    runoffEc: "",
    waterVolume: "",
    notes: "",
  });

  // Fetch data from API
  const { data: apiFeedingLogs, isLoading, isError } = useFeedingLogs();
  const { data: apiRooms } = useRooms();
  const { data: apiBatches } = useBatches();

  // Mutations
  const createFeedingLog = useCreateFeedingLog();

  // Transform API data
  const feedingLogs: FeedingLog[] = (apiFeedingLogs || []).map((log: any) => ({
    id: log.id,
    feedDate: log.fedAt || log.fed_at || log.feedDate || log.feed_date || new Date().toISOString(),
    room: log.room_name || log.room?.name || "Unknown",
    batch: log.batch_name || log.batch?.batchName || "N/A",
    nutrientSolution: log.nutrientName || log.nutrient_name || log.nutrientSolution || "Standard",
    phLevel: parseFloat(log.phLevel || log.ph_level) || 6.0,
    ecPpm: parseInt(log.ecLevel || log.ec_level || log.ecPpm || log.ec_ppm) || 1000,
    runoffPh: parseFloat(log.runoffPh || log.runoff_ph) || 0,
    runoffEc: parseInt(log.runoffEc || log.runoff_ec) || 0,
    waterVolume: parseFloat(log.volume || log.waterVolume || log.water_volume) || 0,
    performedBy: log.performedBy || log.performed_by || "Unknown",
    notes: log.notes || "",
  }));

  const nutrientSchedules: NutrientSchedule[] = [
    {
      stage: "Clone",
      phRange: "5.5-6.0",
      ecRange: "300-500",
      nutrients: "Clone Rooting Solution",
      frequency: "Every 2-3 days",
      icon: "🌱",
    },
    {
      stage: "Vegetative",
      phRange: "5.8-6.2",
      ecRange: "800-1200",
      nutrients: "Veg Grow A+B, Cal-Mag",
      frequency: "Every 2-3 days",
      icon: "🌿",
    },
    {
      stage: "Flowering",
      phRange: "6.0-6.5",
      ecRange: "1000-1400",
      nutrients: "Flower Bloom A+B, PK Boost",
      frequency: "Every 2-3 days",
      icon: "🌸",
    },
  ];

  const phTrendData = [
    { date: "11/10", ph: 6.0, runoffPh: 5.8 },
    { date: "11/11", ph: 6.1, runoffPh: 5.9 },
    { date: "11/12", ph: 6.2, runoffPh: 6.0 },
    { date: "11/13", ph: 6.1, runoffPh: 5.9 },
    { date: "11/14", ph: 6.2, runoffPh: 6.0 },
    { date: "11/15", ph: 6.2, runoffPh: 6.0 },
  ];

  const ecTrendData = [
    { date: "11/10", ec: 1000, runoffEc: 950 },
    { date: "11/11", ec: 1050, runoffEc: 1000 },
    { date: "11/12", ec: 1100, runoffEc: 1050 },
    { date: "11/13", ec: 1150, runoffEc: 1100 },
    { date: "11/14", ec: 1200, runoffEc: 1150 },
    { date: "11/15", ec: 1200, runoffEc: 1100 },
  ];

  const getPhStatus = (ph: number) => {
    if (ph >= 5.8 && ph <= 6.5) return { status: "optimal", color: "text-success" };
    if (ph < 5.8) return { status: "low", color: "text-warning" };
    return { status: "high", color: "text-warning" };
  };

  const handleCreateLog = async () => {
    if (!formData.roomId || !formData.nutrientSolution) {
      toast({
        title: "Error",
        description: "Room and nutrient solution are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createFeedingLog.mutateAsync({
        roomId: parseInt(formData.roomId),
        batchId: formData.batchId ? parseInt(formData.batchId) : undefined,
        feedingType: "nutrients",
        nutrientName: formData.nutrientSolution,
        phLevel: formData.phLevel ? parseFloat(formData.phLevel) : undefined,
        ecLevel: formData.ecPpm ? parseInt(formData.ecPpm) : undefined,
        volume: formData.waterVolume ? parseFloat(formData.waterVolume) : undefined,
        volumeUnit: "L",
        notes: formData.notes || undefined,
        fedAt: formData.feedDate || new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Feeding log recorded successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        feedDate: "",
        roomId: "",
        batchId: "",
        nutrientSolution: "",
        phLevel: "",
        ecPpm: "",
        runoffPh: "",
        runoffEc: "",
        waterVolume: "",
        notes: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record feeding log",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats
  const avgPh = (feedingLogs.reduce((sum, log) => sum + log.phLevel, 0) / feedingLogs.length).toFixed(1);
  const avgEc = Math.round(feedingLogs.reduce((sum, log) => sum + log.ecPpm, 0) / feedingLogs.length);
  const totalVolume = feedingLogs.reduce((sum, log) => sum + log.waterVolume, 0);

  // DataTable columns
  const columns: Column<FeedingLog>[] = [
    {
      key: "feedDate",
      header: "Date",
      cell: (log) => (
        <span className="font-medium">
          {new Date(log.feedDate).toLocaleDateString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "room",
      header: "Room",
      cell: (log) => <span>{log.room}</span>,
      sortable: true,
    },
    {
      key: "batch",
      header: "Batch",
      cell: (log) => (
        <Badge variant="outline" className="font-mono">
          {log.batch}
        </Badge>
      ),
    },
    {
      key: "nutrientSolution",
      header: "Solution",
      cell: (log) => <span className="text-sm">{log.nutrientSolution}</span>,
    },
    {
      key: "phLevel",
      header: "pH",
      cell: (log) => {
        const phStatus = getPhStatus(log.phLevel);
        return (
          <div className="flex items-center gap-1.5">
            {phStatus.status === "optimal" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-warning" />
            )}
            <span className={phStatus.color}>{log.phLevel}</span>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "ecPpm",
      header: "EC (ppm)",
      cell: (log) => <span className="font-medium">{log.ecPpm}</span>,
      sortable: true,
    },
    {
      key: "runoffPh",
      header: "Runoff pH",
      cell: (log) => <span className="text-muted-foreground">{log.runoffPh}</span>,
    },
    {
      key: "runoffEc",
      header: "Runoff EC",
      cell: (log) => <span className="text-muted-foreground">{log.runoffEc}</span>,
    },
    {
      key: "waterVolume",
      header: "Volume",
      cell: (log) => <span>{log.waterVolume} gal</span>,
    },
    {
      key: "performedBy",
      header: "By",
      cell: (log) => <span className="text-sm text-muted-foreground">{log.performedBy}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Feeding & Nutrients"
        description="Track nutrient schedules, pH levels, and feeding logs"
        breadcrumbs={[{ label: "Cultivation", href: "/plants" }, { label: "Feeding" }]}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Log Feeding
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Log Feeding</DialogTitle>
                <DialogDescription>Record nutrient feeding application</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Feed Date *</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Room *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flower-a">Flower Room A</SelectItem>
                        <SelectItem value="flower-b">Flower Room B</SelectItem>
                        <SelectItem value="veg-1">Veg Room 1</SelectItem>
                        <SelectItem value="clone">Clone Room</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nutrient Solution *</Label>
                  <Input placeholder="e.g., Flower Bloom A+B" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>pH Level</Label>
                    <Input type="number" step="0.1" placeholder="6.2" />
                  </div>
                  <div className="space-y-2">
                    <Label>EC (ppm)</Label>
                    <Input type="number" placeholder="1200" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Runoff pH</Label>
                    <Input type="number" step="0.1" placeholder="6.0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Runoff EC (ppm)</Label>
                    <Input type="number" placeholder="1100" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Water Volume (gallons)</Label>
                  <Input type="number" placeholder="50" />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Observations, plant response..." />
                </div>

                <Button className="w-full" onClick={handleCreateLog} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    "Log Feeding"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Feedings"
          value={feedingLogs.length}
          icon={<Droplets className="w-5 h-5" />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Avg pH"
          value={avgPh}
          icon={<Beaker className="w-5 h-5" />}
          iconColor="bg-blue-500/10 text-blue-600"
          trend="up"
          change="Optimal range"
        />
        <StatCard
          title="Avg EC (ppm)"
          value={avgEc.toLocaleString()}
          icon={<Activity className="w-5 h-5" />}
          iconColor="bg-green-500/10 text-green-600"
        />
        <StatCard
          title="Total Volume"
          value={`${totalVolume} gal`}
          icon={<FlaskConical className="w-5 h-5" />}
          iconColor="bg-purple-500/10 text-purple-600"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="logs">Feeding Logs</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6 mt-6">
          <DataTable
            data={feedingLogs}
            columns={columns}
            searchable
            searchPlaceholder="Search by room, batch, or solution..."
            searchKeys={["room", "batch", "nutrientSolution"]}
            pagination
            pageSize={10}
            loading={isLoading}
            getRowId={(row) => row.id}
            emptyState={
              <EmptyState
                icon={Droplets}
                title="No feeding logs"
                description="Start logging your feeding schedules to track nutrient applications"
                action={{
                  label: "Log Feeding",
                  onClick: () => setIsDialogOpen(true),
                  icon: Plus,
                }}
              />
            }
          />
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nutrientSchedules.map((schedule) => (
              <Card key={schedule.stage} className="hover:shadow-lg transition-all duration-300 hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">{schedule.icon}</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{schedule.stage}</CardTitle>
                      <CardDescription>{schedule.frequency}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1">pH Range</p>
                        <p className="font-semibold text-lg">{schedule.phRange}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1">EC Range</p>
                        <p className="font-semibold text-lg">{schedule.ecRange}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Nutrients</p>
                      <p className="text-sm font-medium">{schedule.nutrients}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">pH Trend</CardTitle>
                <CardDescription>Feed pH vs Runoff pH over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={phTrendData}>
                    <defs>
                      <linearGradient id="phGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="runoffPhGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={[5.5, 6.5]} className="text-xs" />
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
                      dataKey="ph"
                      stroke="#3b82f6"
                      fill="url(#phGradient)"
                      strokeWidth={2}
                      name="Feed pH"
                    />
                    <Area
                      type="monotone"
                      dataKey="runoffPh"
                      stroke="#10b981"
                      fill="url(#runoffPhGradient)"
                      strokeWidth={2}
                      name="Runoff pH"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">EC Trend</CardTitle>
                <CardDescription>Feed EC vs Runoff EC over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ecTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ec"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6", strokeWidth: 2 }}
                      name="Feed EC"
                    />
                    <Line
                      type="monotone"
                      dataKey="runoffEc"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", strokeWidth: 2 }}
                      name="Runoff EC"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Feeding;
