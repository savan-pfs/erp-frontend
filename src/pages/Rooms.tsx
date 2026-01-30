import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  Plus,
  Thermometer,
  Droplets,
  Wind,
  Lightbulb,
  Leaf,
  LayoutGrid,
  List,
  Settings,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState } from "@/components/common";
import type { Column, RowAction } from "@/components/common";
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom, useMothers, useBatches, usePlants, useHarvestBatches } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePermissions } from "@/hooks/usePermissions";

interface Room extends Record<string, unknown> {
  id: string | number;
  name: string;
  type: string;
  stage: string;
  plants: number;
  capacity: number;
  temp: number;
  humidity: number;
  vpd: number;
  lightSchedule: string;
  isActive: boolean;
}

const Rooms = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [viewingRoom, setViewingRoom] = useState<any>(null);

  const { hasPermission } = usePermissions();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    roomType: "PROPAGATION",
    capacity: "",
    description: "",
    temperatureMin: "",
    temperatureMax: "",
    humidityMin: "",
    humidityMax: "",
    lightingType: "",
    ventilationSystem: false,
    co2System: false,
  });

  // Fetch data from API
  const { data: apiRooms, isLoading, isError } = useRooms();
  const { data: apiMothers } = useMothers();
  const { data: apiBatches } = useBatches();
  const { data: apiPlants } = usePlants();
  const { data: apiHarvestBatches } = useHarvestBatches();

  // Mutations
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  // Transform API data with actual plant counts
  const rooms: Room[] = (apiRooms || []).map((r: any) => {
    // Calculate actual occupancy from mothers, batches, and plants
    const mothersInRoom = (apiMothers || []).filter((m: any) => {
      const mRoomId = m.roomId || m.room_id || m.room?.id;
      return mRoomId && String(mRoomId) === String(r.id);
    }).length;
    
    const batchesInRoom = (apiBatches || []).filter((b: any) => {
      const bRoomId = b.roomId || b.room_id || b.room?.id;
      return bRoomId && String(bRoomId) === String(r.id);
    });
    
    const batchPlantCount = batchesInRoom.reduce((sum: number, b: any) => 
      sum + (b.totalSeeds || 0) + (b.totalClones || 0), 0
    );
    
    const plantsInRoom = (apiPlants || []).filter((p: any) => {
      const pRoomId = p.roomId || p.room_id || p.room?.id;
      return pRoomId && String(pRoomId) === String(r.id);
    }).length;
    
    const totalOccupancy = mothersInRoom + batchPlantCount + plantsInRoom;

    return {
      id: r.id,
      name: r.name,
      type: r.roomType || r.room_type || "PROPAGATION",
      stage: r.roomType || r.room_type || "PROPAGATION",
      plants: totalOccupancy,
      capacity: r.capacity || 100,
      temp: r.temperature?.max || r.temperature?.min || 75,
      humidity: r.humidity?.max || r.humidity?.min || 60,
      vpd: calculateVPD(r.temperature?.max || 75, r.humidity?.max || 60),
      lightSchedule: r.lightingType === "LED" ? "18/6" : (r.roomType || r.room_type) === "FLOWERING" ? "12/12" : "18/6",
      isActive: r.isActive !== false && r.is_active !== false,
    };
  });

  // Calculate VPD from temp and humidity
  function calculateVPD(tempF: number, rh: number): number {
    const tempC = (tempF - 32) * 5 / 9;
    const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
    const vpd = svp * (1 - rh / 100);
    return Math.round(vpd * 100) / 100;
  }

  const getStageConfig = (stage: string) => {
    switch (stage) {
      case "flowering":
        return { color: "bg-purple-500", textColor: "text-purple-600", bgColor: "bg-purple-500/10", icon: "🌸" };
      case "vegetative":
        return { color: "bg-green-500", textColor: "text-green-600", bgColor: "bg-green-500/10", icon: "🌿" };
      case "cloning":
        return { color: "bg-blue-500", textColor: "text-blue-600", bgColor: "bg-blue-500/10", icon: "🌱" };
      case "drying":
        return { color: "bg-amber-500", textColor: "text-amber-600", bgColor: "bg-amber-500/10", icon: "☀️" };
      case "curing":
        return { color: "bg-orange-500", textColor: "text-orange-600", bgColor: "bg-orange-500/10", icon: "🫙" };
      default:
        return { color: "bg-gray-500", textColor: "text-gray-600", bgColor: "bg-gray-500/10", icon: "📦" };
    }
  };

  const getVPDStatus = (vpd: number, stage: string) => {
    if (stage === "cloning") {
      return vpd >= 0.4 && vpd <= 0.8 ? "optimal" : vpd < 0.4 ? "low" : "high";
    } else if (stage === "vegetative") {
      return vpd >= 0.8 && vpd <= 1.1 ? "optimal" : vpd < 0.8 ? "low" : "high";
    } else if (stage === "flowering") {
      return vpd >= 1.0 && vpd <= 1.4 ? "optimal" : vpd < 1.0 ? "low" : "high";
    }
    return "optimal";
  };

  const handleOpenView = (room: any) => {
    const apiRoom = apiRooms?.find((r: any) => r.id === room.id);
    setViewingRoom(apiRoom || room);
    setIsViewDialogOpen(true);
  };

  const handleOpenEdit = (room: any) => {
    setEditingRoom(room);
    setFormData({
      name: room.name || "",
      roomType: room.roomType || room.room_type || room.type || "PROPAGATION",
      capacity: room.capacity?.toString() || "",
      description: room.description || "",
      temperatureMin: room.temperature?.min?.toString() || "",
      temperatureMax: room.temperature?.max?.toString() || "",
      humidityMin: room.humidity?.min?.toString() || "",
      humidityMax: room.humidity?.max?.toString() || "",
      lightingType: room.lightingType || "",
      ventilationSystem: room.ventilationSystem || false,
      co2System: room.co2System || false,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRoom(null);
    setFormData({
      name: "",
      roomType: "PROPAGATION",
      capacity: "",
      description: "",
      temperatureMin: "",
      temperatureMax: "",
      humidityMin: "",
      humidityMax: "",
      lightingType: "",
      ventilationSystem: false,
      co2System: false,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Room name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const roomData = {
        name: formData.name,
        description: formData.description || undefined,
        roomType: formData.roomType,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        temperature: {
          min: formData.temperatureMin ? parseFloat(formData.temperatureMin) : undefined,
          max: formData.temperatureMax ? parseFloat(formData.temperatureMax) : undefined,
        },
        humidity: {
          min: formData.humidityMin ? parseFloat(formData.humidityMin) : undefined,
          max: formData.humidityMax ? parseFloat(formData.humidityMax) : undefined,
        },
        lightingType: formData.lightingType || undefined,
        ventilationSystem: formData.ventilationSystem,
        co2System: formData.co2System,
      };

      if (editingRoom) {
        await updateRoom.mutateAsync({ id: editingRoom.id, updates: roomData });
        toast({
          title: "Success",
          description: "Room updated successfully",
        });
      } else {
        await createRoom.mutateAsync(roomData);
        toast({
          title: "Success",
          description: "Room created successfully",
        });
      }

      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingRoom ? 'update' : 'create'} room`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (room: any) => {
    const newActiveStatus = !room.isActive;
    const action = newActiveStatus ? "activate" : "deactivate";
    
    // Check if room has assignments before deactivating
    if (!newActiveStatus) {
      const hasBatches = (apiBatches || []).some((b: any) => {
        const bRoomId = b.roomId ?? b.room_id ?? b.room?.id;
        return bRoomId && String(bRoomId) === String(room.id) && b.isActive !== false;
      });
      const hasPlants = (apiPlants || []).some((p: any) => {
        const pRoomId = p.roomId ?? p.room_id ?? p.room?.id;
        return pRoomId && String(pRoomId) === String(room.id) && p.isActive !== false;
      });
      
      if (hasBatches || hasPlants) {
        toast({
          title: "Cannot Deactivate",
          description: "This room has active batches or plants assigned. Please move them to another room first.",
          variant: "destructive",
        });
        return;
      }
      
      if (!confirm(`Are you sure you want to ${action} this room?`)) {
        return;
      }
    }

    try {
      await updateRoom.mutateAsync({ 
        id: room.id, 
        updates: { isActive: newActiveStatus } 
      });
      toast({
        title: "Success",
        description: `Room ${action}d successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} room`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string | number) => {
    const room = apiRooms?.find((r: any) => r.id === id);
    if (!room) {
      toast({
        title: "Error",
        description: "Room not found",
        variant: "destructive",
      });
      return;
    }

    // Frontend validation - check if room has assignments
    const hasBatches = (apiBatches || []).some((b: any) => {
      const bRoomId = b.roomId ?? b.room_id ?? b.room?.id;
      return bRoomId && String(bRoomId) === String(id) && b.isActive !== false;
    });
    const hasPlants = (apiPlants || []).some((p: any) => {
      const pRoomId = p.roomId ?? p.room_id ?? p.room?.id;
      return pRoomId && String(pRoomId) === String(id) && p.isActive !== false;
    });
    const hasMothers = (apiMothers || []).some((m: any) => {
      const mRoomId = m.roomId ?? m.room_id ?? m.room?.id;
      return mRoomId && String(mRoomId) === String(id) && m.isActive !== false;
    });
    const hasHarvestBatches = (apiHarvestBatches || []).some((h: any) => {
      const hRoomId = h.roomId ?? h.room_id ?? h.room?.id;
      return hRoomId && String(hRoomId) === String(id);
    });
    
    if (hasBatches || hasPlants || hasMothers || hasHarvestBatches) {
      const issues = [];
      if (hasBatches) issues.push("batches");
      if (hasPlants) issues.push("plants");
      if (hasMothers) issues.push("mother plants");
      if (hasHarvestBatches) issues.push("harvest batches");
      toast({
        title: "Cannot Delete",
        description: `This room has active ${issues.join(", ")} assigned. Please move or remove them first.`,
        variant: "destructive",
      });
      return;
    }
    
    if (!confirm(`Are you sure you want to delete room "${room.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteRoom.mutateAsync(id);
      toast({
        title: "Success",
        description: "Room deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete room. This room may have active assignments.",
        variant: "destructive",
      });
    }
  };

  // Stats calculations
  const totalPlants = rooms.reduce((sum, r) => sum + r.plants, 0);
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const avgCapacity = totalCapacity > 0 ? Math.round((totalPlants / totalCapacity) * 100) : 0;
  const flowerRooms = rooms.filter((r) => r.type === "flowering").length;
  const roomsWithIssues = rooms.filter((r) => {
    const vpdStatus = getVPDStatus(r.vpd, r.stage);
    return vpdStatus !== "optimal";
  }).length;

  // DataTable columns
  const columns: Column<Room>[] = [
    {
      key: "name",
      header: "Room Name",
      cell: (room) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${getStageConfig(room.stage).bgColor} flex items-center justify-center`}>
            <span className="text-sm">{getStageConfig(room.stage).icon}</span>
          </div>
          <div>
            <p className="font-medium">{room.name}</p>
            <p className="text-xs text-muted-foreground">{room.plants} / {room.capacity} plants</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "stage",
      header: "Stage",
      cell: (room) => (
        <Badge className={`${getStageConfig(room.stage).bgColor} ${getStageConfig(room.stage).textColor} border-0`}>
          {room.stage}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (room) => {
        const percent = room.capacity > 0 ? Math.round((room.plants / room.capacity) * 100) : 0;
        return (
          <div className="w-32">
            <div className="flex justify-between text-xs mb-1">
              <span>{percent}%</span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "temp",
      header: "Temp",
      cell: (room) => (
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{room.temp}°F</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "humidity",
      header: "RH",
      cell: (room) => (
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{room.humidity}%</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "vpd",
      header: "VPD",
      cell: (room) => {
        const vpdStatus = getVPDStatus(room.vpd, room.stage);
        return (
          <div className="flex items-center gap-1.5">
            {vpdStatus === "optimal" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            )}
            <span className={vpdStatus === "optimal" ? "text-success" : "text-warning"}>
              {room.vpd}
            </span>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "lightSchedule",
      header: "Light",
      cell: (room) => (
        <div className="flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{room.lightSchedule}</span>
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (room) => (
        <StatusBadge status={room.isActive ? "success" : "pending"} label={room.isActive ? "Active" : "Inactive"} />
      ),
    },
  ];

  const rowActions: RowAction<Room>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (room) => handleOpenView(room),
    },
    {
      label: "Edit",
      icon: <Settings className="w-4 h-4" />,
      onClick: (room) => {
        const apiRoom = apiRooms?.find((r: any) => r.id === room.id);
        if (apiRoom) handleOpenEdit(apiRoom);
      },
    },
    {
      label: (room) => room.isActive ? "Deactivate" : "Activate",
      icon: (room) => room.isActive ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />,
      onClick: (room) => {
        const apiRoom = apiRooms?.find((r: any) => r.id === room.id);
        if (apiRoom) handleToggleActive(apiRoom);
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (room) => handleDelete(room.id),
      variant: "destructive",
    },
  ];

  // Room Card Component
  const RoomCard = ({ room }: { room: Room }) => {
    const vpdStatus = getVPDStatus(room.vpd, room.stage);
    const capacityPercent = room.capacity > 0 ? (room.plants / room.capacity) * 100 : 0;
    const stageConfig = getStageConfig(room.stage);

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30 overflow-hidden">
        {/* Stage indicator bar */}
        <div className={`h-1 ${stageConfig.color}`} />
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stageConfig.bgColor} flex items-center justify-center`}>
                <span className="text-lg">{stageConfig.icon}</span>
              </div>
              <div>
                <CardTitle className="text-lg">{room.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {room.plants} / {room.capacity} plants
                </p>
              </div>
            </div>
            <Badge className={`${stageConfig.bgColor} ${stageConfig.textColor} border-0`}>
              {room.stage}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Capacity Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Capacity</span>
              <span className="font-medium">{Math.round(capacityPercent)}%</span>
            </div>
            <Progress value={capacityPercent} className="h-2" />
          </div>

          {/* Environmental Data Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-default">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Thermometer className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{room.temp}°F</p>
                    <p className="text-xs text-muted-foreground">Temp</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>Temperature</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-default">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{room.humidity}%</p>
                    <p className="text-xs text-muted-foreground">RH</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>Relative Humidity</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-default">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    vpdStatus === "optimal" ? "bg-success/10" : "bg-warning/10"
                  }`}>
                    <Wind className={`w-4 h-4 ${vpdStatus === "optimal" ? "text-success" : "text-warning"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${
                      vpdStatus === "optimal" ? "text-success" : "text-warning"
                    }`}>
                      {room.vpd}
                    </p>
                    <p className="text-xs text-muted-foreground">VPD</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Vapor Pressure Deficit - {vpdStatus === "optimal" ? "Optimal" : vpdStatus === "low" ? "Too Low" : "Too High"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-default">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{room.lightSchedule}</p>
                    <p className="text-xs text-muted-foreground">Light</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>Light Schedule (On/Off hours)</TooltipContent>
            </Tooltip>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between pt-2 border-t">
            <StatusBadge 
              status={room.isActive ? "success" : "pending"} 
              label={room.isActive ? "Active" : "Inactive"} 
            />
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const apiRoom = apiRooms?.find((r: any) => r.id === room.id);
                  if (apiRoom) handleToggleActive(apiRoom);
                }}
                className="h-7 px-2"
                title={room.isActive ? "Deactivate Room" : "Activate Room"}
              >
                {room.isActive ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                )}
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => handleOpenView(room)}
            >
              <Eye className="w-4 h-4 mr-1.5" />
              View
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                const apiRoom = apiRooms?.find((r: any) => r.id === room.id);
                if (apiRoom) handleOpenEdit(apiRoom);
              }}
            >
              <Settings className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => {
                const apiRoom = apiRooms?.find((r: any) => r.id === room.id);
                if (apiRoom) handleDelete(room.id);
              }}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Rooms"
        description="Manage cultivation spaces and monitor environmental conditions"
        breadcrumbs={[{ label: "Cultivation", href: "/plants" }, { label: "Rooms" }]}
        badge={
          roomsWithIssues > 0 ? (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {roomsWithIssues} room{roomsWithIssues > 1 ? "s" : ""} need attention
            </Badge>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode("table")}
              >
                <List className="w-4 h-4" />
              </Button>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          } else {
            setIsDialogOpen(true);
          }
        }}>
          <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
              <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
              <DialogDescription>
                {editingRoom ? "Update room settings and configuration" : "Create a new cultivation space"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                    <Label htmlFor="room-name">Room Name *</Label>
                    <Input
                      id="room-name"
                      placeholder="e.g., Flower Room C"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-type">Room Type</Label>
                    <Select
                      value={formData.roomType}
                      onValueChange={(value) => setFormData({ ...formData, roomType: value })}
                    >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROPAGATION">Propagation</SelectItem>
                    <SelectItem value="VEGETATIVE">Vegetative</SelectItem>
                    <SelectItem value="FLOWERING">Flowering</SelectItem>
                    <SelectItem value="DRYING">Drying</SelectItem>
                    <SelectItem value="CURING">Curing</SelectItem>
                    <SelectItem value="TRIMMING">Trimming</SelectItem>
                    <SelectItem value="PACKAGING">Packaging</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="STORAGE">Storage</SelectItem>
                    <SelectItem value="WASTE">Waste</SelectItem>
                    <SelectItem value="QA_HOLD">QA Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Max Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        placeholder="350"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      />
                </div>
                <div className="space-y-2">
                      <Label htmlFor="lighting-type">Lighting Type</Label>
                      <Select
                        value={formData.lightingType}
                        onValueChange={(value) => setFormData({ ...formData, lightingType: value })}
                      >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                          <SelectItem value="LED">LED</SelectItem>
                          <SelectItem value="HPS">HPS</SelectItem>
                          <SelectItem value="CMH">CMH</SelectItem>
                          <SelectItem value="Fluorescent">Fluorescent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
                  <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                      <Label htmlFor="temp-min">Min Temp (°F)</Label>
                      <Input
                        id="temp-min"
                        type="number"
                        placeholder="70"
                        value={formData.temperatureMin}
                        onChange={(e) => setFormData({ ...formData, temperatureMin: e.target.value })}
                      />
                </div>
                <div className="space-y-2">
                      <Label htmlFor="temp-max">Max Temp (°F)</Label>
                      <Input
                        id="temp-max"
                        type="number"
                        placeholder="80"
                        value={formData.temperatureMax}
                        onChange={(e) => setFormData({ ...formData, temperatureMax: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rh-min">Min RH (%)</Label>
                      <Input
                        id="rh-min"
                        type="number"
                        placeholder="50"
                        value={formData.humidityMin}
                        onChange={(e) => setFormData({ ...formData, humidityMin: e.target.value })}
                      />
                </div>
                <div className="space-y-2">
                      <Label htmlFor="rh-max">Max RH (%)</Label>
                      <Input
                        id="rh-max"
                        type="number"
                        placeholder="65"
                        value={formData.humidityMax}
                        onChange={(e) => setFormData({ ...formData, humidityMax: e.target.value })}
                      />
                </div>
              </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Room description..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingRoom ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingRoom ? "Update Room" : "Create Room"
                    )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Room Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                {viewingRoom?.name || "Room Details"}
              </DialogTitle>
              <DialogDescription>
                View complete room information and environmental settings
              </DialogDescription>
            </DialogHeader>
            {viewingRoom && (() => {
              // Calculate room occupancy details
              const mothersInRoom = (apiMothers || []).filter((m: any) => {
                const mRoomId = m.roomId || m.room_id || m.room?.id;
                return mRoomId && String(mRoomId) === String(viewingRoom.id);
              });
              
              const batchesInRoom = (apiBatches || []).filter((b: any) => {
                const bRoomId = b.roomId || b.room_id || b.room?.id;
                return bRoomId && String(bRoomId) === String(viewingRoom.id);
              });
              
              const plantsInRoom = (apiPlants || []).filter((p: any) => {
                const pRoomId = p.roomId || p.room_id || p.room?.id;
                return pRoomId && String(pRoomId) === String(viewingRoom.id);
              });
              
              const batchPlantCount = batchesInRoom.reduce((sum: number, b: any) => 
                sum + (b.totalSeeds || 0) + (b.totalClones || 0), 0
              );
              const totalOccupancy = mothersInRoom.length + batchPlantCount + plantsInRoom.length;
              const capacityPercent = viewingRoom.capacity > 0 ? (totalOccupancy / viewingRoom.capacity) * 100 : 0;

              return (
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Room Name</Label>
                    <p className="text-lg font-semibold">{viewingRoom.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Room Type</Label>
                    <p className="text-lg font-semibold capitalize">{viewingRoom.roomType || viewingRoom.type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Capacity</Label>
                    <p className="text-lg font-semibold">{viewingRoom.capacity} plants</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Lighting Type</Label>
                    <p className="text-lg font-semibold">{viewingRoom.lightingType || "N/A"}</p>
                  </div>
                </div>

                {/* Current Occupancy */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Leaf className="w-4 h-4" />
                    Current Occupancy
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Plants</span>
                      <span className="font-semibold">{totalOccupancy} / {viewingRoom.capacity}</span>
                    </div>
                    <Progress value={capacityPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(capacityPercent)}% capacity used
                    </p>
                    
                    {/* Breakdown */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                        <p className="text-xs text-muted-foreground">Mother Plants</p>
                        <p className="text-lg font-bold text-pink-600">{mothersInRoom.length}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-muted-foreground">Batches</p>
                        <p className="text-lg font-bold text-blue-600">{batchesInRoom.length}</p>
                        <p className="text-xs text-muted-foreground">{batchPlantCount} plants</p>
                      </div>
                      <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-xs text-muted-foreground">Individual Plants</p>
                        <p className="text-lg font-bold text-green-600">{plantsInRoom.length}</p>
                      </div>
                    </div>

                    {/* List items */}
                    {mothersInRoom.length > 0 && (
                      <div className="pt-2">
                        <Label className="text-xs text-muted-foreground">Mother Plants in this room:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {mothersInRoom.map((m: any) => (
                            <Badge key={m.id} variant="outline" className="text-xs">
                              {m.motherName || `MTH-${m.id}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {batchesInRoom.length > 0 && (
                      <div className="pt-2">
                        <Label className="text-xs text-muted-foreground">Batches in this room:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {batchesInRoom.map((b: any) => (
                            <Badge key={b.id} variant="outline" className="text-xs">
                              {b.batchName || `B-${b.id}`} ({(b.totalSeeds || 0) + (b.totalClones || 0)} plants)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Environmental Settings */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Thermometer className="w-4 h-4" />
                    Environmental Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <Label className="text-muted-foreground text-xs">Temperature Range</Label>
                      <p className="text-base font-semibold">
                        {viewingRoom.temperature?.min || "N/A"}°F - {viewingRoom.temperature?.max || "N/A"}°F
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <Label className="text-muted-foreground text-xs">Humidity Range</Label>
                      <p className="text-base font-semibold">
                        {viewingRoom.humidity?.min || "N/A"}% - {viewingRoom.humidity?.max || "N/A"}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Equipment
                  </h3>
                  <div className="flex gap-2">
                    <Badge variant={viewingRoom.ventilationSystem ? "default" : "outline"}>
                      {viewingRoom.ventilationSystem ? "✓" : "✗"} Ventilation System
                    </Badge>
                    <Badge variant={viewingRoom.co2System ? "default" : "outline"}>
                      {viewingRoom.co2System ? "✓" : "✗"} CO2 System
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                {viewingRoom.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1">{viewingRoom.description}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleOpenEdit(viewingRoom);
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Room
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Rooms"
          value={rooms.length}
          icon={<Home className="w-5 h-5" />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total Plants"
          value={totalPlants.toLocaleString()}
          icon={<Leaf className="w-5 h-5" />}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Flower Rooms"
          value={flowerRooms}
          icon={<Lightbulb className="w-5 h-5" />}
          iconColor="bg-purple-500/10 text-purple-600"
        />
        <StatCard
          title="Avg. Capacity"
          value={`${avgCapacity}%`}
          icon={<Wind className="w-5 h-5" />}
          iconColor="bg-blue-500/10 text-blue-600"
          trend={avgCapacity > 70 ? "up" : "down"}
          change={avgCapacity > 70 ? "Good utilization" : "Room for growth"}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : viewMode === "table" ? (
        <DataTable
          data={rooms as Record<string, unknown>[]}
          columns={columns as Column<Record<string, unknown>>[]}
          rowActions={rowActions as RowAction<Record<string, unknown>>[]}
          searchable
          searchPlaceholder="Search rooms..."
          searchKeys={["name", "stage", "type"]}
          pagination
          pageSize={10}
          getRowId={(row) => String(row.id)}
          emptyState={
            <EmptyState
              icon={Home}
              title="No rooms found"
              description="Add your first room to start managing cultivation spaces."
              action={{
                label: "Add Room",
                onClick: () => setIsDialogOpen(true),
                icon: Plus,
              }}
            />
          }
        />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No rooms found"
          description="Add your first room to start managing cultivation spaces."
          action={{
            label: "Add Room",
            onClick: () => setIsDialogOpen(true),
            icon: Plus,
          }}
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
                </div>
      )}
    </div>
  );
};

export default Rooms;
