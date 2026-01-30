import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Plus,
  Calendar,
  Leaf,
  ArrowRight,
  Home,
  Eye,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Loader2,
  Power,
  PowerOff,
} from "lucide-react";
import { useBatches, useCreateBatch, useUpdateBatch, useDeleteBatch, useGenetics, useRooms } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

// Import common components
import { PageHeader, StatCard, DataTable, EmptyState, StatusBadge } from "@/components/common";
import type { Column, RowAction } from "@/components/common";
import { cn } from "@/lib/utils";

interface Batch extends Record<string, unknown> {
  id: string | number;
  batchNumber: string;
  strain: string;
  type: string;
  stage: string;
  room: string;
  initialCount: number;
  currentCount: number;
  startDate: string;
  expectedHarvest: string;
  daysInStage: number;
  daysUntilHarvest: number | null;
  status: string;
  isActive: boolean;
  expectedHarvestDate?: string;
  currentStage?: string;
}

const Batches = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    batchName: "",
    geneticId: "",
    batchType: "clone",
    totalSeeds: "",
    totalClones: "",
    roomId: "",
    sourceSupplier: "",
    notes: "",
  });

  // Fetch data from API
  const { data: apiBatches, isLoading, isError } = useBatches();
  const { data: apiGenetics } = useGenetics();
  const { data: apiRooms } = useRooms();

  // Mutations
  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();
  const deleteBatch = useDeleteBatch();

  // Transform API data to display format
  const batches: Batch[] = (apiBatches || []).map((b: any) => {
    const currentStage = b.currentStage || b.current_stage || (b.batchType === "seed" ? "seed" : "clone");
    const expectedHarvestDate = b.expectedHarvestDate || b.expected_harvest_date;
    const stageChangedAt = b.stageChangedAt || b.stage_changed_at || b.sourceDate || b.createdAt;
    
    // Calculate days in current stage
    const daysInStage = stageChangedAt
      ? Math.floor((new Date().getTime() - new Date(stageChangedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    // Calculate days until harvest
    let daysUntilHarvest: number | null = null;
    if (expectedHarvestDate) {
      const days = Math.floor((new Date(expectedHarvestDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      daysUntilHarvest = days;
    }

    return {
      id: b.id,
      batchNumber: b.batchName || `B-${b.id}`,
      strain: b.genetic?.strainName || "Unknown",
      type: b.batchType || "clone",
      stage: currentStage,
      room: b.room?.name || "Unassigned",
      initialCount: (b.totalSeeds || 0) + (b.totalClones || 0),
      currentCount: (b.totalSeeds || 0) + (b.totalClones || 0),
      startDate: b.sourceDate || b.createdAt,
      expectedHarvest: expectedHarvestDate || (b.sourceDate 
        ? new Date(new Date(b.sourceDate).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()),
      daysInStage: daysInStage,
      daysUntilHarvest: daysUntilHarvest,
      status: b.isActive !== false ? "active" : "inactive",
      isActive: b.isActive !== false,
      expectedHarvestDate: expectedHarvestDate,
      currentStage: currentStage,
    };
  });

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      seed: "bg-amber-100 text-amber-700 border-amber-200",
      germination: "bg-lime-100 text-lime-700 border-lime-200",
      seedling: "bg-emerald-100 text-emerald-700 border-emerald-200",
      clone: "bg-blue-100 text-blue-700 border-blue-200",
      vegetative: "bg-green-100 text-green-700 border-green-200",
      pre_flower: "bg-indigo-100 text-indigo-700 border-indigo-200",
      flowering: "bg-purple-100 text-purple-700 border-purple-200",
      harvest: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[stage] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStageProgress = (stage: string) => {
    const stages = [
      "seed",
      "germination",
      "seedling",
      "clone",
      "vegetative",
      "pre_flower",
      "flowering",
      "harvest",
    ];
    const index = stages.indexOf(stage);
    return ((index + 1) / stages.length) * 100;
  };

  // Stats
  const stats = {
    activeBatches: batches.filter(b => b.status === "active").length,
    totalPlants: batches.reduce((sum, b) => sum + (b.currentCount || 0), 0),
    inFlower: batches.filter((b) => b.stage === "flowering").length,
    harvestSoon: batches.filter((b) => {
      if (!b.expectedHarvest) return false;
      const daysToHarvest = Math.ceil(
        (new Date(b.expectedHarvest).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return daysToHarvest <= 14 && daysToHarvest > 0;
    }).length,
  };

  // Handle form submission
  // Generate batch name automatically
  const generateBatchName = () => {
    const year = new Date().getFullYear();
    const existingBatches = apiBatches || [];
    const yearBatches = existingBatches.filter((b: any) => {
      const batchName = b.batchName || b.batch_name || "";
      return batchName.startsWith(`B-${year}-`);
    });
    const nextNumber = (yearBatches.length + 1).toString().padStart(3, "0");
    return `B-${year}-${nextNumber}`;
  };

  const handleOpenEdit = (batch: any) => {
    setEditingBatch(batch);
    // Map all fields from API response - handle both camelCase and snake_case
    setFormData({
      batchName: batch.batchName || batch.batch_name || "",
      geneticId: (batch.geneticId ?? batch.genetic?.id ?? batch.genetic_id)?.toString() || "",
      batchType: batch.batchType || batch.batch_type || "clone",
      totalSeeds: (batch.totalSeeds ?? batch.total_seeds)?.toString() || "",
      totalClones: (batch.totalClones ?? batch.total_clones)?.toString() || "",
      roomId: (batch.roomId ?? batch.room?.id ?? batch.room_id)?.toString() || "",
      sourceSupplier: batch.sourceSupplier || batch.source_supplier || "",
      notes: batch.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingBatch(null);
    const autoGeneratedName = generateBatchName();
    setFormData({
      batchName: autoGeneratedName,
      geneticId: "",
      batchType: "clone",
      totalSeeds: "",
      totalClones: "",
      roomId: "",
      sourceSupplier: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBatch(null);
    setFormData({
      batchName: "",
      geneticId: "",
      batchType: "clone",
      totalSeeds: "",
      totalClones: "",
      roomId: "",
      sourceSupplier: "",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.batchName) {
      toast({
        title: "Error",
        description: "Batch name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const batchData = {
        batchName: formData.batchName,
        batchType: formData.batchType,
        geneticId: formData.geneticId ? parseInt(formData.geneticId) : undefined,
        roomId: formData.roomId ? parseInt(formData.roomId) : undefined,
        totalSeeds: formData.batchType === "seed" ? parseInt(formData.totalSeeds) || 0 : 0,
        totalClones: formData.batchType === "clone" ? parseInt(formData.totalClones) || 0 : 0,
        sourceSupplier: formData.sourceSupplier || undefined,
        notes: formData.notes || undefined,
        sourceDate: new Date().toISOString().split("T")[0],
      };

      if (editingBatch) {
        await updateBatch.mutateAsync({ id: editingBatch.id, updates: batchData });
        toast({
          title: "Success",
          description: "Batch updated successfully",
        });
      } else {
        await createBatch.mutateAsync(batchData);
        toast({
          title: "Success",
          description: "Batch created successfully",
        });
      }

      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingBatch ? 'update' : 'create'} batch`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle active/inactive
  const handleToggleActive = async (batch: any, newStatus?: boolean) => {
    const apiBatch = apiBatches?.find((b: any) => b.id === batch.id);
    if (!apiBatch) return;

    // Use provided newStatus, or toggle from current state
    const newActiveStatus = newStatus !== undefined ? newStatus : !batch.isActive;
    const action = newActiveStatus ? "activate" : "deactivate";

    // Check if batch has active plants before deactivating
    if (!newActiveStatus) {
      const hasPlants = (apiBatch.totalPlants ?? apiBatch.total_plants ?? 0) > 0;
      if (hasPlants) {
        toast({
          title: "Cannot Deactivate",
          description: "This batch has active plants. Please remove or deactivate the plants first.",
          variant: "destructive",
        });
        // Force re-render to revert switch
        return Promise.reject(new Error("Cannot deactivate batch with active plants"));
      }
      
      if (!confirm(`Are you sure you want to ${action} this batch?`)) {
        // Force re-render to revert switch
        return Promise.reject(new Error("User cancelled"));
      }
    }

    try {
      await updateBatch.mutateAsync({ 
        id: batch.id, 
        updates: { isActive: newActiveStatus } 
      });
      toast({
        title: "Success",
        description: `Batch ${action}d successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} batch`,
        variant: "destructive",
      });
      throw error; // Re-throw to prevent switch from updating
    }
  };

  // Handle delete
  const handleDelete = async (id: string | number) => {
    const batch = apiBatches?.find((b: any) => b.id === id);
    if (batch) {
      // Check if batch has active plants or harvest batches
      const hasPlants = (batch.totalPlants ?? batch.total_plants ?? 0) > 0;
      
      if (hasPlants) {
        if (!confirm(`This batch has ${batch.totalPlants ?? batch.total_plants ?? 0} plants. Are you sure you want to delete it? This action cannot be undone.`)) {
          return;
        }
      } else {
        if (!confirm("Are you sure you want to delete this batch? This action cannot be undone.")) {
          return;
        }
      }
    }

    try {
      await deleteBatch.mutateAsync(id);
      toast({
        title: "Success",
        description: "Batch deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete batch. This batch may have active plants or harvest batches.",
        variant: "destructive",
      });
    }
  };

  // Table columns
  const columns: Column<Batch>[] = [
    {
      key: "batchNumber",
      header: "Batch",
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-medium text-foreground">
          {row.batchNumber}
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
      key: "stage",
      header: "Stage",
      sortable: true,
      cell: (row) => (
        <Badge variant="outline" className={cn("capitalize", getStageColor(row.stage))}>
          {row.stage}
        </Badge>
      ),
    },
    {
      key: "room",
      header: "Room",
      sortable: true,
      cell: (row) => <span className="text-muted-foreground">{row.room}</span>,
    },
    {
      key: "currentCount",
      header: "Plants",
      sortable: true,
      cell: (row) => (
        <span>
          {row.currentCount} / {row.initialCount}
        </span>
      ),
    },
    {
      key: "daysInStage",
      header: "Days in Stage",
      sortable: true,
      cell: (row) => <span className="text-muted-foreground">{row.daysInStage} days</span>,
    },
    {
      key: "expectedHarvest",
      header: "Expected Harvest",
      sortable: true,
      cell: (row) => {
        if (!row.expectedHarvestDate && !row.expectedHarvest) {
          return <span className="text-muted-foreground">—</span>;
        }
        const harvestDate = row.expectedHarvestDate || row.expectedHarvest;
        const daysUntil = row.daysUntilHarvest;
        return (
          <div className="flex flex-col">
            <span className="text-muted-foreground">
              {new Date(harvestDate).toLocaleDateString()}
            </span>
            {daysUntil !== null && (
              <span className={cn(
                "text-xs",
                daysUntil < 0 ? "text-warning" : daysUntil <= 7 ? "text-success" : "text-muted-foreground"
              )}>
                {daysUntil >= 0 ? `${daysUntil} days` : `${Math.abs(daysUntil)} days ago`}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <StatusBadge 
            status={row.isActive ? "success" : "pending"}
            label={row.isActive ? "Active" : "Inactive"}
          />
          <Switch
            checked={row.isActive as boolean}
            onCheckedChange={async (checked) => {
              const apiBatch = apiBatches?.find((b: any) => b.id === row.id);
              if (apiBatch) {
                try {
                  await handleToggleActive(row, checked);
                } catch (error) {
                  // Error handled in handleToggleActive, switch will revert automatically
                  // because checked state is controlled by row.isActive
                }
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
    },
  ];

  // Row actions
  const rowActions: RowAction<Batch>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => navigate(`/batches/${row.id}`),
    },
    {
      label: "Edit",
      icon: <Edit className="w-4 h-4" />,
      onClick: (row) => {
        const apiBatch = apiBatches?.find((b: any) => b.id === row.id);
        if (apiBatch) handleOpenEdit(apiBatch);
      },
    },
    {
      label: "Toggle Status",
      icon: <Power className="w-4 h-4" />,
      onClick: (row) => handleToggleActive(row),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (row) => handleDelete(row.id),
      variant: "destructive",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Batches"
        description="Track plant batches through the cultivation lifecycle"
        breadcrumbs={[{ label: "Cultivation", href: "/plants" }, { label: "Batches" }]}
        actions={
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-3"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-3"
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
              <Button onClick={handleOpenCreate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Batch
                </Button>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingBatch ? "Edit Batch" : "Create New Batch"}</DialogTitle>
                  <DialogDescription>
                    {editingBatch ? "Update batch information" : "Start a new cultivation batch"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch-name">Batch Name *</Label>
                    {editingBatch ? (
                      <Input
                        id="batch-name"
                        placeholder="B-2024-005"
                        value={formData.batchName}
                        onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                      />
                    ) : (
                      <Input
                        id="batch-name"
                        value={formData.batchName}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                      />
                    )}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Batch Type</Label>
                      <Select
                        value={formData.batchType}
                        onValueChange={(value) => setFormData({ ...formData, batchType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="seed">Seed</SelectItem>
                          <SelectItem value="clone">Clone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="count">
                        {formData.batchType === "seed" ? "Seed Count" : "Clone Count"}
                      </Label>
                      <Input
                        id="count"
                        type="number"
                        placeholder="100"
                        value={formData.batchType === "seed" ? formData.totalSeeds : formData.totalClones}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [formData.batchType === "seed" ? "totalSeeds" : "totalClones"]: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Starting Room</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Source/Supplier</Label>
                    <Input
                      id="supplier"
                      placeholder="Supplier name"
                      value={formData.sourceSupplier}
                      onChange={(e) => setFormData({ ...formData, sourceSupplier: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingBatch ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingBatch ? "Update Batch" : "Create Batch"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Batches"
          value={stats.activeBatches}
          icon={<Layers className="w-6 h-6" />}
          iconColor="bg-primary-light text-primary"
        />
        <StatCard
          title="Total Plants"
          value={stats.totalPlants}
          icon={<Leaf className="w-6 h-6" />}
          iconColor="bg-success-light text-success"
        />
        <StatCard
          title="In Flower"
          value={stats.inFlower}
          icon={<Calendar className="w-6 h-6" />}
          iconColor="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Harvest Soon"
          value={stats.harvestSoon}
          icon={<ArrowRight className="w-6 h-6" />}
          iconColor="bg-warning-light text-warning"
          subtitle="Within 14 days"
        />
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <DataTable
          data={batches as Record<string, unknown>[]}
          columns={columns as Column<Record<string, unknown>>[]}
          rowActions={rowActions as RowAction<Record<string, unknown>>[]}
          searchable
          searchPlaceholder="Search batches..."
          searchKeys={["batchNumber", "strain", "room"]}
          pagination
          pageSize={10}
          loading={isLoading}
          getRowId={(row) => String(row.id)}
          emptyState={
            <EmptyState
              icon={Layers}
              title="No batches found"
              description="Create your first batch to start tracking cultivation."
              action={{
                label: "Create Batch",
                onClick: () => setIsDialogOpen(true),
                icon: Plus,
              }}
            />
          }
        />
      ) : (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : batches.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No batches found"
              description="Create your first batch to start tracking cultivation."
              action={{
                label: "Create Batch",
                onClick: () => setIsDialogOpen(true),
                icon: Plus,
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {batches.map((batch) => (
                <Card
                  key={batch.id}
                  className="hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer group"
                  onClick={() => navigate(`/batches/${batch.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {batch.batchNumber}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{batch.strain}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("capitalize", getStageColor(batch.stage))}>
                          {batch.stage || batch.currentStage || 'unknown'}
                        </Badge>
                        <StatusBadge 
                          status={(batch.isActive as boolean) ? "success" : "pending"}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Lifecycle Progress</span>
                          <span className="font-medium">
                            {Math.round(getStageProgress(batch.stage || batch.currentStage || 'seed'))}%
                          </span>
                        </div>
                        <Progress
                          value={getStageProgress(batch.stage || batch.currentStage || 'seed')}
                          className="h-2 [&>div]:bg-primary"
                        />
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-muted/50 border">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Leaf className="w-4 h-4" />
                            <span className="text-xs">Plants</span>
                          </div>
                          <p className="text-lg font-semibold">
                            {batch.currentCount}{" "}
                            <span className="text-sm text-muted-foreground font-normal">
                              / {batch.initialCount}
                            </span>
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/50 border">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Home className="w-4 h-4" />
                            <span className="text-xs">Room</span>
                          </div>
                          <p className="text-lg font-semibold truncate">{batch.room}</p>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <div>
                          <span className="text-muted-foreground">Started: </span>
                          <span className="font-medium">
                            {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Harvest: </span>
                          <span className="font-medium">
                            {batch.expectedHarvestDate || batch.expectedHarvest 
                              ? new Date(batch.expectedHarvestDate || batch.expectedHarvest).toLocaleDateString()
                              : "N/A"}
                            {batch.daysUntilHarvest !== null && (
                              <span className={cn(
                                "ml-2 text-xs",
                                batch.daysUntilHarvest < 0 ? "text-warning" : batch.daysUntilHarvest <= 7 ? "text-success" : "text-muted-foreground"
                              )}>
                                ({batch.daysUntilHarvest >= 0 ? `${batch.daysUntilHarvest} days` : `${Math.abs(batch.daysUntilHarvest)} days ago`})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Day {batch.daysInStage} in {batch.stage || batch.currentStage || 'unknown'} stage
                        {batch.daysUntilHarvest !== null && batch.daysUntilHarvest > 0 && (
                          <span className="text-success ml-2">
                            • {batch.daysUntilHarvest} days until harvest
                          </span>
                        )}
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-3">
                          <StatusBadge 
                            status={batch.isActive ? "success" : "pending"}
                            label={batch.isActive ? "Active" : "Inactive"}
                          />
                          <Switch
                            checked={batch.isActive as boolean}
                            onCheckedChange={async (checked) => {
                              const apiBatch = apiBatches?.find((b: any) => b.id === batch.id);
                              if (apiBatch) {
                                try {
                                  await handleToggleActive(batch, checked);
                                } catch (error) {
                                  // Error handled in handleToggleActive, switch will revert automatically
                                  // because checked state is controlled by batch.isActive
                                }
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const apiBatch = apiBatches?.find((b: any) => b.id === batch.id);
                              if (apiBatch) handleOpenEdit(apiBatch);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Batches;
