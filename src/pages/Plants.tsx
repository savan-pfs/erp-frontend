import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Leaf,
  QrCode,
  Printer,
  Eye,
  Edit,
  Trash2,
  Activity,
  Plus,
  Loader2,
  Home,
  Info,
  Droplet,
  Calendar,
} from "lucide-react";
import { PlantLabelDialog } from "@/components/PlantLabelDialog";
import {
  usePlants,
  useCreatePlant,
  useUpdatePlant,
  useDeletePlant,
  useBatches,
  useGenetics,
  useRooms,
} from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

// Import common components
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState } from "@/components/common";
import type { Column, RowAction } from "@/components/common";

interface Plant extends Record<string, unknown> {
  id: string | number;
  tag: string;
  batch: string;
  batchId?: number;
  strain: string;
  room: string;
  roomId?: number;
  stage: string;
  status: string;
  health: number;
  height: number;
  daysInStage: number;
}

const Plants = () => {
  const { toast } = useToast();
  const [selectedPlants, setSelectedPlants] = useState<Plant[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPlant, setEditingPlant] = useState<any>(null);
  const [viewingPlant, setViewingPlant] = useState<any>(null);
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
  const [plantsForLabels, setPlantsForLabels] = useState<Plant[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    plantNumber: "",
    batchId: "",
    geneticId: "",
    roomId: "",
    growthStage: "seedling",
    healthStatus: "healthy",
    height: "",
    potSize: "",
    medium: "",
    notes: "",
  });

  // Fetch data from API
  const { data: apiPlants, isLoading, isError } = usePlants();
  const { data: apiBatches } = useBatches();
  const { data: apiGenetics } = useGenetics();
  const { data: apiRooms } = useRooms();

  // Mutations
  const createPlant = useCreatePlant();
  const updatePlant = useUpdatePlant();
  const deletePlant = useDeletePlant();

  // Transform API data to match component format
  const plants: Plant[] = (apiPlants || []).map((p: any) => ({
    id: p.id,
    tag: p.plantName || `PLT-${String(p.id).padStart(3, "0")}-${String(p.plantNumber).padStart(3, "0")}`,
    batch: p.batch?.batchName || "N/A",
    batchId: p.batch?.id,
    strain: p.genetic?.strainName || "Unknown",
    room: p.room?.name || "Unassigned",
    roomId: p.room?.id,
    stage: p.growthStage || "seedling",
    status: p.isActive ? "active" : "inactive",
    health: p.healthStatus === "healthy" ? 95 : p.healthStatus === "stressed" ? 70 : 50,
    height: p.height || 0,
    daysInStage: p.plantingDate
      ? Math.floor((new Date().getTime() - new Date(p.plantingDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
  }));

  const getStageStatus = (stage: string): "success" | "info" | "warning" | "default" => {
    const statusMap: Record<string, "success" | "info" | "warning" | "default"> = {
      seedling: "info",
      clone: "info",
      vegetative: "success",
      flowering: "warning",
      ripening: "warning",
      harvested: "default",
    };
    return statusMap[stage] || "default";
  };

  const getPlantStatus = (status: string): "success" | "warning" | "danger" | "default" => {
    const statusMap: Record<string, "success" | "warning" | "danger" | "default"> = {
      active: "success",
      quarantine: "warning",
      inactive: "danger",
      destroyed: "danger",
    };
    return statusMap[status] || "default";
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return "text-success font-semibold";
    if (health >= 70) return "text-warning font-semibold";
    return "text-destructive font-semibold";
  };

  // Stats calculations
  const stats = {
    total: plants.length,
    active: plants.filter((p) => p.status === "active").length,
    quarantine: plants.filter((p) => p.status === "quarantine").length,
    avgHealth: Math.round(plants.reduce((sum, p) => sum + p.health, 0) / plants.length || 0),
  };

  // Handle form submission
  const handleOpenView = (plant: any) => {
    const apiPlant = apiPlants?.find((p: any) => p.id === plant.id);
    setViewingPlant(apiPlant || plant);
    setIsViewDialogOpen(true);
  };

  const handleOpenEdit = (plant: any) => {
    const apiPlant = apiPlants?.find((p: any) => p.id === plant.id) || plant;
    setEditingPlant(apiPlant);
    // Map all fields from API response - handle both camelCase and snake_case
    setFormData({
      plantNumber: (apiPlant.plantNumber ?? apiPlant.plant_number)?.toString() || "",
      batchId: (apiPlant.batchId ?? apiPlant.batch?.id ?? apiPlant.batch_id)?.toString() || "",
      geneticId: (apiPlant.geneticId ?? apiPlant.genetic?.id ?? apiPlant.genetic_id)?.toString() || "",
      roomId: (apiPlant.roomId ?? apiPlant.room?.id ?? apiPlant.room_id)?.toString() || "",
      growthStage: apiPlant.growthStage || apiPlant.growth_stage || "seedling",
      healthStatus: apiPlant.healthStatus || apiPlant.health_status || "healthy",
      height: (apiPlant.height)?.toString() || "",
      potSize: (apiPlant.potSize ?? apiPlant.pot_size)?.toString() || "",
      medium: apiPlant.medium || "",
      notes: apiPlant.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlant(null);
    setFormData({
      plantNumber: "",
      batchId: "",
      geneticId: "",
      roomId: "",
      growthStage: "seedling",
      healthStatus: "healthy",
      height: "",
      potSize: "",
      medium: "",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.plantNumber) {
      toast({
        title: "Error",
        description: "Plant number is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const plantData = {
        plantNumber: parseInt(formData.plantNumber),
        batchId: formData.batchId ? parseInt(formData.batchId) : undefined,
        geneticId: formData.geneticId ? parseInt(formData.geneticId) : undefined,
        roomId: formData.roomId ? parseInt(formData.roomId) : undefined,
        growthStage: formData.growthStage,
        healthStatus: formData.healthStatus,
        height: formData.height ? parseFloat(formData.height) : undefined,
        potSize: formData.potSize ? parseFloat(formData.potSize) : undefined,
        medium: formData.medium || undefined,
        notes: formData.notes || undefined,
        plantingDate: editingPlant?.plantingDate || new Date().toISOString().split("T")[0],
      };

      if (editingPlant) {
        await updatePlant.mutateAsync({ id: editingPlant.id, updates: plantData });
        toast({
          title: "Success",
          description: "Plant updated successfully",
        });
      } else {
        await createPlant.mutateAsync(plantData);
        toast({
          title: "Success",
          description: "Plant created successfully",
        });
      }

      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save plant",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (plant: Plant) => {
    const apiPlant = apiPlants?.find((p: any) => p.id === plant.id);
    if (apiPlant) {
      // Check if plant is in active batch
      const batchId = apiPlant.batchId ?? apiPlant.batch?.id ?? apiPlant.batch_id;
      if (batchId) {
        const batch = apiBatches?.find((b: any) => b.id === batchId);
        if (batch && batch.isActive !== false) {
          if (!confirm(`This plant is part of an active batch. Are you sure you want to delete it?`)) {
            return;
          }
        }
      }
      
      if (!confirm(`Are you sure you want to delete plant ${plant.tag}? This action cannot be undone.`)) {
        return;
      }
    }

    try {
      await deletePlant.mutateAsync(plant.id);
      toast({
        title: "Success",
        description: "Plant deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete plant. This plant may be part of an active batch.",
        variant: "destructive",
      });
    }
  };

  // Define table columns
  const columns: Column<Plant>[] = [
    {
      key: "tag",
      header: "Plant Tag",
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-medium text-foreground">{row.tag}</span>
      ),
    },
    {
      key: "batch",
      header: "Batch",
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground font-mono text-sm">
          {row.batch}
        </span>
      ),
    },
    {
      key: "strain",
      header: "Strain",
      sortable: true,
      cell: (row) => <span className="font-medium">{row.strain}</span>,
    },
    {
      key: "room",
      header: "Room",
      sortable: true,
      cell: (row) => <span className="text-muted-foreground">{row.room}</span>,
    },
    {
      key: "stage",
      header: "Stage",
      sortable: true,
      cell: (row) => (
        <Badge
          variant="outline"
          className={`capitalize ${
            row.stage === "flowering"
              ? "bg-purple-100 text-purple-700 border-purple-200"
              : row.stage === "vegetative"
              ? "bg-green-100 text-green-700 border-green-200"
              : row.stage === "ripening"
              ? "bg-orange-100 text-orange-700 border-orange-200"
              : "bg-blue-100 text-blue-700 border-blue-200"
          }`}
        >
          {row.stage}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <StatusBadge
          status={getPlantStatus(row.status)}
          label={row.status}
          size="sm"
        />
      ),
    },
    {
      key: "health",
      header: "Health",
      sortable: true,
      cell: (row) => (
        <span className={getHealthColor(row.health)}>{row.health}%</span>
      ),
    },
    {
      key: "height",
      header: "Height",
      sortable: true,
      cell: (row) => <span>{row.height > 0 ? `${row.height} cm` : "-"}</span>,
    },
    {
      key: "daysInStage",
      header: "Days",
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground">{row.daysInStage}</span>
      ),
    },
  ];

  // Define row actions
  const rowActions: RowAction<Plant>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => handleOpenView(row),
    },
    {
      label: "Print Label",
      icon: <QrCode className="w-4 h-4" />,
      onClick: (row) => {
        // Set selected plants to just this plant for label printing
        const plantForLabel: Plant = {
          id: String(row.id),
          tag: row.tag,
          batch: row.batch,
          strain: row.strain,
          room: row.room,
          stage: row.stage,
          plantedDate: row.plantedDate,
        };
        setSelectedPlants([plantForLabel]);
        // The PlantLabelDialog will use selectedPlants
      },
    },
    {
      label: "Edit",
      icon: <Edit className="w-4 h-4" />,
      onClick: (row) => handleOpenEdit(row),
    },
    {
      label: "Remove",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (row) => handleDelete(row),
      variant: "destructive",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Plants"
        description="Individual plant tracking with compliance tags and QR codes"
        breadcrumbs={[{ label: "Cultivation", href: "/batches" }, { label: "Plants" }]}
        actions={
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (!open) {
                handleCloseDialog();
              } else {
                setIsDialogOpen(true);
              }
            }}>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setIsDialogOpen(true)}
              >
                  <Plus className="w-4 h-4" />
                  Add Plant
                </Button>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-primary" />
                    {editingPlant ? "Edit Plant" : "Add New Plant"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPlant ? "Update plant information" : "Add a new plant to track"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plant-number">Plant Number *</Label>
                      <Input
                        id="plant-number"
                        type="number"
                        placeholder="1"
                        value={formData.plantNumber}
                        onChange={(e) => setFormData({ ...formData, plantNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Growth Stage</Label>
                      <Select
                        value={formData.growthStage}
                        onValueChange={(value) => setFormData({ ...formData, growthStage: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="seedling">Seedling</SelectItem>
                          <SelectItem value="vegetative">Vegetative</SelectItem>
                          <SelectItem value="flowering">Flowering</SelectItem>
                          <SelectItem value="ripening">Ripening</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Batch</Label>
                    <Select
                      value={formData.batchId}
                      onValueChange={(value) => setFormData({ ...formData, batchId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {(apiBatches || []).map((b: any) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.batchName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Genetic</Label>
                    <Select
                      value={formData.geneticId}
                      onValueChange={(value) => setFormData({ ...formData, geneticId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select strain" />
                      </SelectTrigger>
                      <SelectContent>
                        {(apiGenetics || []).map((g: any) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.strainName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Select
                      value={formData.roomId}
                      onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {(apiRooms || []).map((r: any) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder="0"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pot-size">Pot Size (L)</Label>
                      <Input
                        id="pot-size"
                        type="number"
                        placeholder="0"
                        value={formData.potSize}
                        onChange={(e) => setFormData({ ...formData, potSize: e.target.value })}
                      />
            </div>
          </div>
                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingPlant ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingPlant ? "Update Plant" : "Add Plant"
                    )}
                  </Button>
        </div>
              </DialogContent>
            </Dialog>

            {/* View Plant Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-primary" />
                    Plant Details
                  </DialogTitle>
                  <DialogDescription>
                    Complete information for {viewingPlant?.plantName || viewingPlant?.tag || 'plant'}
                  </DialogDescription>
                </DialogHeader>
                {viewingPlant && (
                  <div className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Plant Tag</p>
                          <p className="text-sm font-medium font-mono">{viewingPlant.plantName || `PLT-${viewingPlant.id}`}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Strain</p>
                          <p className="text-sm font-medium">{viewingPlant.genetic?.strainName || 'Unknown'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Batch</p>
                          <p className="text-sm font-medium">{viewingPlant.batch?.batchName || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Room</p>
                          <p className="text-sm font-medium flex items-center gap-1.5">
                            <Home className="w-3.5 h-3.5 text-muted-foreground" />
                            {viewingPlant.room?.name || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Growth Status */}
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Growth Status
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <p className="text-xs text-muted-foreground mb-1">Growth Stage</p>
                          <Badge className="capitalize mt-1">{viewingPlant.growthStage || 'seedling'}</Badge>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/10">
                          <p className="text-xs text-muted-foreground mb-1">Health</p>
                          <p className="text-2xl font-bold text-green-600">
                            {viewingPlant.healthStatus === 'healthy' ? '95' : viewingPlant.healthStatus === 'stressed' ? '70' : '50'}%
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10">
                          <p className="text-xs text-muted-foreground mb-1">Height</p>
                          <p className="text-2xl font-bold text-blue-600">{viewingPlant.height || 0} cm</p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Timeline
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Planting Date</p>
                          <p className="text-sm font-medium">
                            {viewingPlant.plantingDate ? new Date(viewingPlant.plantingDate).toLocaleDateString() : 'Not recorded'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Days in Stage</p>
                          <p className="text-sm font-medium">
                            {viewingPlant.plantingDate 
                              ? Math.floor((new Date().getTime() - new Date(viewingPlant.plantingDate).getTime()) / (1000 * 60 * 60 * 24))
                              : 0} days
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cultivation Details */}
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Droplet className="w-4 h-4" />
                        Cultivation Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Pot Size</p>
                          <p className="text-sm font-medium">{viewingPlant.potSize ? `${viewingPlant.potSize}L` : 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Medium</p>
                          <p className="text-sm font-medium capitalize">{viewingPlant.medium || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {viewingPlant.notes && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Notes</h3>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          {viewingPlant.notes}
                        </p>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Status:</span>
                        <Badge variant={viewingPlant.isActive ? 'default' : 'secondary'}>
                          {viewingPlant.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          handleOpenEdit(viewingPlant);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Plant
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

          <PlantLabelDialog
              plants={
                selectedPlants.length > 0
                  ? selectedPlants.map((p) => ({
                      id: String(p.id),
                      tag: p.tag,
                      batch: p.batch,
                      strain: p.strain,
                      room: p.room,
                      stage: p.stage,
                    }))
                  : plants.map((p) => ({
                      id: String(p.id),
              tag: p.tag,
              batch: p.batch,
              strain: p.strain,
              room: p.room,
              stage: p.stage,
                    }))
              }
            trigger={
                <Button className="gap-2">
                  <Printer className="w-4 h-4" />
                Generate Labels
                  {selectedPlants.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedPlants.length}
                    </Badge>
                  )}
              </Button>
            }
          />
            <Button variant="outline" className="gap-2">
              <QrCode className="w-4 h-4" />
            Scan Tag
          </Button>
        </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Plants"
          value={stats.total}
          icon={<Leaf className="w-6 h-6" />}
          iconColor="bg-primary-light text-primary"
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={<Leaf className="w-6 h-6" />}
          iconColor="bg-success-light text-success"
          change="Healthy & growing"
          trend="up"
        />
        <StatCard
          title="Quarantine"
          value={stats.quarantine}
          icon={<Leaf className="w-6 h-6" />}
          iconColor="bg-warning-light text-warning"
        />
        <StatCard
          title="Avg Health"
          value={`${stats.avgHealth}%`}
          icon={<Activity className="w-6 h-6" />}
          iconColor="bg-info-light text-info"
          sparkline={[85, 88, 90, 87, 92, 91, stats.avgHealth]}
        />
      </div>

      {/* Data Table */}
      <DataTable
        data={plants}
        columns={columns}
        rowActions={rowActions}
        searchable
        searchPlaceholder="Search by tag, strain, or batch..."
        searchKeys={["tag", "strain", "batch", "room"]}
        selectable
        onSelectionChange={(selected) => setSelectedPlants(selected)}
        pagination
        pageSize={10}
        loading={isLoading}
        onExport={() => {
          // Export plants to CSV
          const headers = ["Tag", "Batch", "Strain", "Room", "Stage", "Status", "Health", "Height (cm)", "Days in Stage"];
          const rows = plants.map((p) => [
            p.tag,
            p.batch,
            p.strain,
            p.room,
            p.stage,
            p.status,
            `${p.health}%`,
            p.height > 0 ? p.height.toString() : "",
            p.daysInStage.toString(),
          ]);
          
          const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
          ].join("\n");
          
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", `plants_export_${new Date().toISOString().split("T")[0]}.csv`);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Export Successful",
            description: `Exported ${plants.length} plants to CSV`,
          });
        }}
        getRowId={(row) => String(row.id)}
        emptyState={
          <EmptyState
            icon={Leaf}
            title="No plants found"
            description="Add plants to start tracking your cultivation."
            action={{
              label: "Add Plant",
              onClick: () => setIsDialogOpen(true),
              icon: Plus,
            }}
          />
        }
      />
    </div>
  );
};

export default Plants;
