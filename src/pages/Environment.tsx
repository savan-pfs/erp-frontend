import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { environmentalLogsApi } from "@/lib/api/realApi";
import { useRooms } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Plus,
  TrendingUp,
  TrendingDown,
  Loader2,
  Activity,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState } from "@/components/common";
import type { Column, RowAction } from "@/components/common";

interface EnvironmentalLog {
  id: string;
  room_id: string;
  temperature_f: number | null;
  humidity_percent: number | null;
  co2_ppm: number | null;
  vpd: number | null;
  light_intensity_ppfd: number | null;
  notes: string | null;
  recorded_at: string;
  rooms?: { name: string } | null;
}

const Environment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLog, setNewLog] = useState({
    room_id: "",
    temperature_f: "",
    humidity_percent: "",
    co2_ppm: "",
    vpd: "",
    light_intensity_ppfd: "",
    notes: "",
  });

  // Fetch environmental logs
  const { data: envLogs, isLoading } = useQuery({
    queryKey: ["environmental-logs", selectedRoom],
    queryFn: async () => {
      const data = await environmentalLogsApi.getAll(
        selectedRoom !== "all" ? selectedRoom : undefined
      );
      return (Array.isArray(data) ? data : []).slice(0, 100).map((log: any) => ({
        ...log,
        room_id: log.roomId || log.room_id,
        temperature_f: log.temperature || log.temperature_f,
        humidity_percent: log.humidity || log.humidity_percent,
        co2_ppm: log.co2Level || log.co2_ppm,
        vpd: log.vpd,
        light_intensity_ppfd: log.lightIntensity || log.light_intensity_ppfd,
        recorded_at: log.recordedAt || log.recorded_at,
        rooms: log.room_name ? { name: log.room_name } : (log.room ? { name: log.room.name } : null),
      }));
    },
  });

  // Fetch rooms
  const { data: roomsData } = useRooms();
  const rooms = roomsData
    ? roomsData
        .filter((r: any) => r.isActive !== false)
        .map((r: any) => ({
          id: String(r.id),
          name: r.name || "Unnamed Room",
          target_temp_f: r.temperature?.max ?? r.temperature_max ?? null,
          target_humidity: r.humidity?.max ?? r.humidity_max ?? null,
          target_vpd: null, // VPD is calculated, not stored as target
        }))
    : [];

  // Create environmental log
  const createLog = useMutation({
    mutationFn: async (logData: typeof newLog) => {
      const log = await environmentalLogsApi.create({
        roomId: parseInt(logData.room_id),
        temperature: logData.temperature_f ? parseFloat(logData.temperature_f) : undefined,
        humidity: logData.humidity_percent ? parseFloat(logData.humidity_percent) : undefined,
        co2Level: logData.co2_ppm ? parseInt(logData.co2_ppm) : undefined,
        vpd: logData.vpd ? parseFloat(logData.vpd) : undefined,
        lightIntensity: logData.light_intensity_ppfd ? parseInt(logData.light_intensity_ppfd) : undefined,
        notes: logData.notes || undefined,
      });
      return [log];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["environmental-logs"] });
      setIsDialogOpen(false);
      setNewLog({
        room_id: "",
        temperature_f: "",
        humidity_percent: "",
        co2_ppm: "",
        vpd: "",
        light_intensity_ppfd: "",
        notes: "",
      });
      toast({
        title: "Environmental log recorded",
        description: "New reading has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete environmental log
  const deleteLog = useMutation({
    mutationFn: async (id: string | number) => {
      return await environmentalLogsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["environmental-logs"] });
      toast({
        title: "Environmental log deleted",
        description: "The log has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete environmental log",
        variant: "destructive",
      });
    },
  });

  // Handle delete
  const handleDelete = (log: EnvironmentalLog) => {
    if (window.confirm(`Are you sure you want to delete this environmental log from ${new Date(log.recorded_at).toLocaleString()}? This action cannot be undone.`)) {
      deleteLog.mutate(log.id);
    }
  };

  // Calculate averages
  const getAverages = () => {
    if (!envLogs || envLogs.length === 0) return { temp: 0, humidity: 0, co2: 0, vpd: 0 };

    const validTemps = envLogs.filter((l) => l.temperature_f != null);
    const validHumidity = envLogs.filter((l) => l.humidity_percent != null);
    const validCo2 = envLogs.filter((l) => l.co2_ppm != null);
    const validVpd = envLogs.filter((l) => l.vpd != null);

    return {
      temp:
        validTemps.length > 0
          ? validTemps.reduce((sum, l) => sum + Number(l.temperature_f), 0) / validTemps.length
          : 0,
      humidity:
        validHumidity.length > 0
          ? validHumidity.reduce((sum, l) => sum + Number(l.humidity_percent), 0) / validHumidity.length
          : 0,
      co2:
        validCo2.length > 0
          ? validCo2.reduce((sum, l) => sum + l.co2_ppm!, 0) / validCo2.length
          : 0,
      vpd:
        validVpd.length > 0
          ? validVpd.reduce((sum, l) => sum + Number(l.vpd), 0) / validVpd.length
          : 0,
    };
  };

  const averages = getAverages();

  // Mock trend data for charts
  const trendData = envLogs?.slice(0, 24).reverse().map((log, index) => ({
    time: new Date(log.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    temp: log.temperature_f || 0,
    humidity: log.humidity_percent || 0,
    vpd: log.vpd || 0,
    co2: log.co2_ppm || 0,
  })) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.room_id) {
      toast({
        title: "Validation Error",
        description: "Please select a room.",
        variant: "destructive",
      });
      return;
    }
    createLog.mutate(newLog);
  };

  // DataTable columns
  const columns: Column<EnvironmentalLog>[] = [
    {
      key: "recorded_at",
      header: "Time",
      cell: (log) => (
        <span className="font-mono text-sm">
          {new Date(log.recorded_at).toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "room",
      header: "Room",
      cell: (log) => (
        <span className="font-medium">{log.rooms?.name || "Unknown"}</span>
      ),
    },
    {
      key: "temperature_f",
      header: "Temp (°F)",
      cell: (log) => (
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-red-500" />
          <span>{log.temperature_f ?? "—"}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "humidity_percent",
      header: "RH (%)",
      cell: (log) => (
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-blue-500" />
          <span>{log.humidity_percent ?? "—"}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "co2_ppm",
      header: "CO2 (ppm)",
      cell: (log) => (
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-green-500" />
          <span>{log.co2_ppm ?? "—"}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "vpd",
      header: "VPD (kPa)",
      cell: (log) => {
        const vpd = log.vpd;
        const isOptimal = vpd && vpd >= 0.8 && vpd <= 1.3;
        return (
          <div className="flex items-center gap-1.5">
            {isOptimal ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            ) : vpd ? (
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            ) : null}
            <span className={isOptimal ? "text-success" : vpd ? "text-warning" : ""}>
              {vpd ?? "—"}
            </span>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "light_intensity_ppfd",
      header: "Light (PPFD)",
      cell: (log) => (
        <div className="flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-yellow-500" />
          <span>{log.light_intensity_ppfd ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      cell: (log) => (
        <span className="max-w-xs truncate text-muted-foreground text-sm">
          {log.notes || "—"}
        </span>
      ),
    },
  ];

  // Row actions
  const rowActions: RowAction<EnvironmentalLog>[] = [
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (row) => handleDelete(row),
      variant: "destructive",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Environment"
        description="Monitor and log environmental conditions across cultivation rooms"
        breadcrumbs={[{ label: "Cultivation", href: "/plants" }, { label: "Environment" }]}
        actions={
          <div className="flex items-center gap-3">
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Log Reading
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Log Environmental Reading</DialogTitle>
                  <DialogDescription>
                    Record current environmental conditions for a room
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="room_id">Room *</Label>
                    <Select
                      value={newLog.room_id}
                      onValueChange={(value) => setNewLog({ ...newLog, room_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms?.map((room) => (
                          <SelectItem key={room.id} value={String(room.id)}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="temperature_f">Temperature (°F)</Label>
                      <Input
                        id="temperature_f"
                        type="number"
                        step="0.1"
                        placeholder="75.0"
                        value={newLog.temperature_f}
                        onChange={(e) => setNewLog({ ...newLog, temperature_f: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="humidity_percent">Humidity (%)</Label>
                      <Input
                        id="humidity_percent"
                        type="number"
                        step="0.1"
                        placeholder="55.0"
                        value={newLog.humidity_percent}
                        onChange={(e) => setNewLog({ ...newLog, humidity_percent: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="co2_ppm">CO2 (ppm)</Label>
                      <Input
                        id="co2_ppm"
                        type="number"
                        placeholder="1200"
                        value={newLog.co2_ppm}
                        onChange={(e) => setNewLog({ ...newLog, co2_ppm: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vpd">VPD (kPa)</Label>
                      <Input
                        id="vpd"
                        type="number"
                        step="0.01"
                        placeholder="1.2"
                        value={newLog.vpd}
                        onChange={(e) => setNewLog({ ...newLog, vpd: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="light_intensity_ppfd">Light (PPFD)</Label>
                    <Input
                      id="light_intensity_ppfd"
                      type="number"
                      placeholder="800"
                      value={newLog.light_intensity_ppfd}
                      onChange={(e) => setNewLog({ ...newLog, light_intensity_ppfd: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional observations..."
                      value={newLog.notes}
                      onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={createLog.isPending}>
                      {createLog.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Reading"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg Temperature"
          value={`${averages.temp.toFixed(1)}°F`}
          icon={<Thermometer className="w-5 h-5" />}
          iconColor="bg-red-500/10 text-red-500"
          trend={averages.temp > 75 ? "up" : "down"}
          change={averages.temp > 75 ? "Above target" : "Within range"}
        />
        <StatCard
          title="Avg Humidity"
          value={`${averages.humidity.toFixed(1)}%`}
          icon={<Droplets className="w-5 h-5" />}
          iconColor="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Avg CO2"
          value={`${averages.co2.toFixed(0)} ppm`}
          icon={<Wind className="w-5 h-5" />}
          iconColor="bg-green-500/10 text-green-500"
        />
        <StatCard
          title="Avg VPD"
          value={`${averages.vpd.toFixed(2)} kPa`}
          icon={<Gauge className="w-5 h-5" />}
          iconColor="bg-purple-500/10 text-purple-500"
          trend={averages.vpd >= 0.8 && averages.vpd <= 1.3 ? "up" : "down"}
          change={averages.vpd >= 0.8 && averages.vpd <= 1.3 ? "Optimal" : "Adjust needed"}
        />
      </div>

      {/* Charts */}
      {trendData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Temperature & Humidity Trend</CardTitle>
              <CardDescription>Last 24 readings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    stroke="#ef4444"
                    fill="url(#tempGradient)"
                    strokeWidth={2}
                    name="Temp (°F)"
                  />
                  <Area
                    type="monotone"
                    dataKey="humidity"
                    stroke="#3b82f6"
                    fill="url(#humidityGradient)"
                    strokeWidth={2}
                    name="RH (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">VPD & CO2 Trend</CardTitle>
              <CardDescription>Last 24 readings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="vpd"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    name="VPD (kPa)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="co2"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="CO2 (ppm)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={envLogs || []}
        columns={columns}
        rowActions={rowActions}
        searchable
        searchPlaceholder="Search logs..."
        searchKeys={["notes"]}
        pagination
        pageSize={15}
        loading={isLoading}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Thermometer}
            title="No environmental logs"
            description="Start logging environmental conditions to track your grow."
            action={{
              label: "Log Reading",
              onClick: () => setIsDialogOpen(true),
              icon: Plus,
            }}
          />
        }
      />
    </div>
  );
};

export default Environment;
