import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { harvestBatchesApi } from "@/lib/api/realApi";
import { useBatches, useRooms, usePlants } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Scissors,
  Plus,
  Scale,
  Clock,
  CheckCircle,
  Package,
  Loader2,
  Eye,
  Edit,
  TrendingUp,
  Timer,
  Leaf,
  AlertCircle,
  Flower,
  Trash2,
} from "lucide-react";
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState } from "@/components/common";
import type { Column, RowAction } from "@/components/common";

interface HarvestBatch extends Record<string, unknown> {
  id: string;
  harvest_batch_number: string;
  plant_count: number;
  wet_weight_lbs: number | null;
  dry_weight_lbs: number | null;
  final_weight_lbs: number | null;
  status: string;
  harvest_date: string;
  plant_batches?: {
    batch_number: string;
    genetics?: { name: string } | null;
  } | null;
}

const Harvest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState<HarvestBatch | null>(null);
  // Generate harvest batch number automatically
  const generateHarvestBatchNumber = () => {
    const year = new Date().getFullYear();
    const existingHarvests = harvests || [];
    const yearHarvests = existingHarvests.filter((h: any) => {
      const harvestNumber = h.harvest_batch_number || h.harvestName || "";
      return harvestNumber.startsWith(`H-${year}-`);
    });
    const nextNumber = (yearHarvests.length + 1).toString().padStart(3, "0");
    return `H-${year}-${nextNumber}`;
  };

  const [newHarvest, setNewHarvest] = useState({
    plant_batch_id: "",
    harvest_batch_number: "",
    plant_count: "",
    wet_weight_lbs: "",
    notes: "",
  });
  const [updateFormData, setUpdateFormData] = useState({
    status: "",
    dryWeight: "",
    trimWeight: "",
    wasteWeight: "",
    qualityGrade: "",
    notes: "",
  });

  // Fetch harvest batches
  const { data: harvests, isLoading } = useQuery({
    queryKey: ["harvest-batches"],
    queryFn: async () => {
      const data = await harvestBatchesApi.getAll();
      return data.map((harvest) => ({
        ...harvest,
        plant_batches: harvest.plant_batch
          ? {
              batch_number: harvest.plant_batch.batch_number,
              genetics: harvest.plant_batch.genetic
                ? { name: harvest.plant_batch.genetic.name }
                : null,
            }
          : null,
      }));
    },
  });

  // Fetch plant batches, rooms, and plants for validation
  const { data: batchesData } = useBatches();
  const { data: roomsData } = useRooms();
  const { data: plantsData } = usePlants();
  
  // Create a map of room ID to room type for quick lookup
  const roomTypeMap = new Map(
    (roomsData || []).map((r: any) => [r.id, r.roomType || r.room_type])
  );

  // Calculate harvest readiness for each batch
  const calculateHarvestReadiness = (batch: any) => {
    const floweringStart = batch.floweringStartDate || batch.flowering_start_date || batch.stageChangedAt || batch.stage_changed_at;
    const expectedHarvest = batch.expectedHarvestDate || batch.expected_harvest_date;
    const floweringTime = batch.genetic?.floweringTime || batch.genetic?.flowering_time || 56; // Default 8 weeks
    
    let daysInFlowering = 0;
    if (floweringStart) {
      const startDate = new Date(floweringStart);
      const today = new Date();
      daysInFlowering = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const minimumFloweringDays = Math.floor(floweringTime * 0.8); // 80% of recommended time
    const daysUntilExpected = expectedHarvest 
      ? Math.floor((new Date(expectedHarvest).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Calculate plant readiness
    const batchPlants = (plantsData || []).filter((p: any) => 
      (p.batchId || p.batch_id) === batch.id && (p.isActive !== false)
    );
    const totalPlants = batchPlants.length;
    const readyPlants = batchPlants.filter((p: any) => 
      ['flowering', 'ripening'].includes(p.growthStage || p.growth_stage)
    ).length;
    const readinessPercentage = totalPlants > 0 ? (readyPlants / totalPlants) * 100 : 0;

    const currentStage = batch.currentStage || batch.current_stage;
    const isReady = 
      currentStage === 'flowering' &&
      daysInFlowering >= minimumFloweringDays &&
      readinessPercentage >= 80 &&
      (daysUntilExpected === null || daysUntilExpected >= -7);

    const warnings: string[] = [];
    if (currentStage !== 'flowering') {
      warnings.push(`Batch is in ${currentStage || 'unknown'} stage, not flowering`);
    }
    if (daysInFlowering < minimumFloweringDays) {
      warnings.push(`Only ${daysInFlowering} days in flowering (minimum: ${minimumFloweringDays} days)`);
    }
    if (readinessPercentage < 80) {
      warnings.push(`Only ${readinessPercentage.toFixed(1)}% of plants ready (${readyPlants}/${totalPlants})`);
    }
    if (daysUntilExpected !== null && daysUntilExpected < -7) {
      warnings.push(`Expected harvest date was ${Math.abs(daysUntilExpected)} days ago`);
    }

    return {
      daysInFlowering,
      minimumFloweringDays,
      daysUntilExpected,
      readinessPercentage,
      readyPlants,
      totalPlants,
      isReady,
      warnings,
      expectedHarvest,
      floweringStart,
    };
  };

  // Filter batches to only show those in FLOWERING rooms
  const plantBatches = batchesData
    ? batchesData
        .filter((b: any) => {
          // Only show active batches
          if (b.isActive === false) return false;
          
          // Check if batch is in a FLOWERING room
          const roomId = b.room?.id || b.roomId;
          if (!roomId) return false;
          
          const roomType = roomTypeMap.get(roomId);
          return roomType === "FLOWERING";
        })
        .map((b: any) => {
          const readiness = calculateHarvestReadiness(b);
          return {
            id: b.id,
            batch_number: b.batchName || `Batch ${b.id}`,
            current_count: b.totalPlants || 0,
            genetics: b.genetic?.strainName || b.geneticName ? { name: b.genetic?.strainName || b.geneticName } : null,
            roomId: b.room?.id || b.roomId,
            roomType: b.room?.id ? roomTypeMap.get(b.room.id) : null,
            currentStage: b.currentStage || b.current_stage,
            expectedHarvestDate: b.expectedHarvestDate || b.expected_harvest_date,
            floweringStartDate: b.floweringStartDate || b.flowering_start_date,
            stageChangedAt: b.stageChangedAt || b.stage_changed_at,
            genetic: b.genetic,
            ...readiness,
          };
        })
    : [];

  // Create harvest batch
  const createHarvest = useMutation({
    mutationFn: async (harvestData: typeof newHarvest) => {
      const harvest = await harvestBatchesApi.create({
        batchId: harvestData.plant_batch_id ? parseInt(harvestData.plant_batch_id) : undefined,
        harvestName: harvestData.harvest_batch_number,
        harvestDate: new Date().toISOString().split("T")[0],
        plantCount: harvestData.plant_count ? parseInt(harvestData.plant_count) : undefined,
        wetWeight: harvestData.wet_weight_lbs ? parseFloat(harvestData.wet_weight_lbs) : undefined,
        notes: harvestData.notes || undefined,
      });
      return [harvest];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvest-batches"] });
      setIsDialogOpen(false);
      setNewHarvest({
        plant_batch_id: "",
        harvest_batch_number: "",
        plant_count: "",
        wet_weight_lbs: "",
        notes: "",
      });
      toast({
        title: "Harvest batch created",
        description: "New harvest batch has been recorded.",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-generate harvest batch number if not provided
    const finalHarvestNumber = newHarvest.harvest_batch_number || generateHarvestBatchNumber();
    
    if (!newHarvest.plant_batch_id || !finalHarvestNumber || !newHarvest.plant_count) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate that the selected batch is ready for harvest
    const selectedBatch = plantBatches.find((b: any) => String(b.id) === newHarvest.plant_batch_id);
    if (!selectedBatch) {
      toast({
        title: "Validation Error",
        description: "Selected batch not found or not available for harvest.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBatch.isReady) {
      const warnings = selectedBatch.warnings?.join('. ') || 'Batch is not ready for harvest';
      toast({
        title: "Harvest Not Allowed",
        description: warnings,
        variant: "destructive",
      });
      return;
    }

    createHarvest.mutate({
      ...newHarvest,
      harvest_batch_number: finalHarvestNumber,
    });
  };

  // Calculate stats
  const stats = {
    total: harvests?.length || 0,
    harvesting: harvests?.filter((h) => h.status === "harvesting").length || 0,
    drying: harvests?.filter((h) => h.status === "drying").length || 0,
    curing: harvests?.filter((h) => h.status === "curing").length || 0,
    completed: harvests?.filter((h) => h.status === "completed").length || 0,
    totalWeight: harvests?.reduce((sum, h) => sum + (Number(h.final_weight_lbs) || 0), 0) || 0,
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      harvesting: {
        color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        icon: <Scissors className="w-3 h-3" />,
        label: "Harvesting",
      },
      drying: {
        color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
        icon: <Timer className="w-3 h-3" />,
        label: "Drying",
      },
      curing: {
        color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        icon: <Package className="w-3 h-3" />,
        label: "Curing",
      },
      completed: {
        color: "bg-success/10 text-success border-success/20",
        icon: <CheckCircle className="w-3 h-3" />,
        label: "Completed",
      },
    };
    return configs[status] || { color: "bg-muted text-muted-foreground", icon: null, label: status };
  };

  // DataTable columns
  const columns: Column<HarvestBatch>[] = [
    {
      key: "harvest_batch_number",
      header: "Harvest Batch",
      cell: (harvest) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-primary" />
          </div>
          <span className="font-mono font-medium">{harvest.harvest_batch_number}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "source_batch",
      header: "Source Batch",
      cell: (harvest) => (
        <Badge variant="outline" className="font-mono">
          {harvest.plant_batches?.batch_number || "—"}
        </Badge>
      ),
    },
    {
      key: "strain",
      header: "Strain",
      cell: (harvest) => (
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-success" />
          <span>{harvest.plant_batches?.genetics?.name || "—"}</span>
        </div>
      ),
    },
    {
      key: "plant_count",
      header: "Plants",
      cell: (harvest) => <span className="font-medium">{harvest.plant_count}</span>,
      sortable: true,
    },
    {
      key: "wet_weight_lbs",
      header: "Wet Weight",
      cell: (harvest) => (
        <span>{harvest.wet_weight_lbs ? `${harvest.wet_weight_lbs} lbs` : "—"}</span>
      ),
      sortable: true,
    },
    {
      key: "dry_weight_lbs",
      header: "Dry Weight",
      cell: (harvest) => (
        <span>{harvest.dry_weight_lbs ? `${harvest.dry_weight_lbs} lbs` : "—"}</span>
      ),
      sortable: true,
    },
    {
      key: "final_weight_lbs",
      header: "Final Weight",
      cell: (harvest) => (
        <span className="font-semibold text-success">
          {harvest.final_weight_lbs ? `${harvest.final_weight_lbs} lbs` : "—"}
        </span>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      cell: (harvest) => {
        const config = getStatusConfig(harvest.status);
        return (
          <Badge className={`${config.color} border`}>
            {config.icon}
            <span className="ml-1">{config.label}</span>
          </Badge>
        );
      },
      sortable: true,
    },
    {
      key: "harvest_date",
      header: "Date",
      cell: (harvest) => (
        <span className="text-sm text-muted-foreground">
          {new Date(harvest.harvest_date).toLocaleDateString()}
        </span>
      ),
      sortable: true,
    },
  ];

  // Handle view details
  const handleViewDetails = (harvest: HarvestBatch) => {
    setSelectedHarvest(harvest);
    setIsViewDialogOpen(true);
  };

  // Handle update status
  const handleUpdateStatus = (harvest: HarvestBatch) => {
    setSelectedHarvest(harvest);
    setUpdateFormData({
      status: harvest.status || "",
      dryWeight: harvest.dry_weight_lbs?.toString() || "",
      trimWeight: "",
      wasteWeight: "",
      qualityGrade: "",
      notes: "",
    });
    setIsUpdateDialogOpen(true);
  };

  // Update harvest mutation
  const updateHarvest = useMutation({
    mutationFn: async (data: { id: string | number; updates: any }) => {
      return await harvestBatchesApi.update(data.id, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvest-batches"] });
      setIsUpdateDialogOpen(false);
      setSelectedHarvest(null);
      toast({
        title: "Harvest updated",
        description: "Harvest batch has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update harvest batch",
        variant: "destructive",
      });
    },
  });

  // Delete harvest mutation
  const deleteHarvest = useMutation({
    mutationFn: async (id: string | number) => {
      return await harvestBatchesApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvest-batches"] });
      toast({
        title: "Harvest deleted",
        description: "Harvest batch has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete harvest batch",
        variant: "destructive",
      });
    },
  });

  // Handle delete with confirmation
  const handleDelete = (harvest: HarvestBatch) => {
    if (window.confirm(`Are you sure you want to delete harvest batch "${harvest.harvest_batch_number}"? This action cannot be undone.`)) {
      deleteHarvest.mutate(harvest.id);
    }
  };

  // Handle update form submit
  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHarvest) return;

    const updates: any = {};
    if (updateFormData.status) updates.status = updateFormData.status;
    if (updateFormData.dryWeight) updates.dryWeight = parseFloat(updateFormData.dryWeight);
    if (updateFormData.trimWeight) updates.trimWeight = parseFloat(updateFormData.trimWeight);
    if (updateFormData.wasteWeight) updates.wasteWeight = parseFloat(updateFormData.wasteWeight);
    if (updateFormData.qualityGrade) updates.qualityGrade = updateFormData.qualityGrade;
    if (updateFormData.notes) updates.notes = updateFormData.notes;

    updateHarvest.mutate({ id: selectedHarvest.id, updates });
  };

  const rowActions: RowAction<HarvestBatch>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (harvest) => handleViewDetails(harvest),
    },
    {
      label: "Update Status",
      icon: <Edit className="w-4 h-4" />,
      onClick: (harvest) => handleUpdateStatus(harvest),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (harvest) => handleDelete(harvest),
      variant: "destructive",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Harvest"
        description="Track harvest batches through drying and curing stages"
        breadcrumbs={[{ label: "Production", href: "/batches" }, { label: "Harvest" }]}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (open) {
            // Auto-generate harvest batch number when dialog opens
            const autoGeneratedNumber = generateHarvestBatchNumber();
            setNewHarvest({
              ...newHarvest,
              harvest_batch_number: autoGeneratedNumber,
            });
          } else {
            // Reset form when dialog closes
            setNewHarvest({
              plant_batch_id: "",
              harvest_batch_number: "",
              plant_count: "",
              wet_weight_lbs: "",
              notes: "",
            });
          }
        }}>
            <DialogTrigger asChild>
              <Button disabled={plantBatches.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Start Harvest
                {plantBatches.length === 0 && (
                  <AlertCircle className="w-4 h-4 ml-2" />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Start New Harvest</DialogTitle>
                <DialogDescription>
                  Create a new harvest batch from flowering plants. Only batches in FLOWERING rooms can be harvested.
                </DialogDescription>
              </DialogHeader>
              {plantBatches.length === 0 && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warning mb-1">No Batches Ready for Harvest</p>
                    <p className="text-xs text-muted-foreground">
                      You need batches in FLOWERING rooms to start a harvest. Move your batches to a Flowering room first.
                    </p>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plant_batch_id">Source Batch *</Label>
                  <Select
                    value={newHarvest.plant_batch_id}
                    onValueChange={(value) => {
                      // Auto-generate harvest batch number when batch is selected
                      const autoGeneratedNumber = generateHarvestBatchNumber();
                      setNewHarvest({ 
                        ...newHarvest, 
                        plant_batch_id: value,
                        harvest_batch_number: autoGeneratedNumber
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch in Flowering stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {plantBatches && plantBatches.length > 0 ? (
                        plantBatches.map((batch: any) => (
                          <SelectItem key={batch.id} value={String(batch.id)}>
                            <div className="flex items-center gap-2">
                              <Flower className="w-4 h-4 text-rose-500" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {batch.batch_number} - {batch.genetics?.name}
                                  </span>
                                  {batch.isReady ? (
                                    <Badge className="bg-success/10 text-success border-success/20 text-xs">
                                      Ready
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">
                                      Not Ready
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {batch.current_count} plants • {batch.daysInFlowering} days in flowering
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No batches available in Flowering stage
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Display readiness information for selected batch */}
                  {newHarvest.plant_batch_id && (() => {
                    const selectedBatch = plantBatches.find((b: any) => String(b.id) === newHarvest.plant_batch_id);
                    if (!selectedBatch) return null;
                    
                    return (
                      <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Harvest Readiness</span>
                          {selectedBatch.isReady ? (
                            <Badge className="bg-success/10 text-success border-success/20">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ready to Harvest
                            </Badge>
                          ) : (
                            <Badge className="bg-warning/10 text-warning border-warning/20">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Not Ready
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Days in Flowering:</span>
                            <span className="ml-2 font-medium">{selectedBatch.daysInFlowering} / {selectedBatch.minimumFloweringDays} min</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Plant Readiness:</span>
                            <span className="ml-2 font-medium">{selectedBatch.readinessPercentage.toFixed(1)}% ({selectedBatch.readyPlants}/{selectedBatch.totalPlants})</span>
                          </div>
                          {selectedBatch.expectedHarvest && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Expected Harvest:</span>
                              <span className="ml-2 font-medium">
                                {new Date(selectedBatch.expectedHarvest).toLocaleDateString()}
                                {selectedBatch.daysUntilExpected !== null && (
                                  <span className={selectedBatch.daysUntilExpected >= 0 ? "text-muted-foreground" : "text-warning"}>
                                    {" "}({selectedBatch.daysUntilExpected >= 0 ? '+' : ''}{selectedBatch.daysUntilExpected} days)
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {selectedBatch.warnings && selectedBatch.warnings.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-warning">Warnings:</span>
                            {selectedBatch.warnings.map((warning: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-warning">
                                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  {plantBatches && plantBatches.length === 0 && (
                    <div className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        Only batches in Flowering rooms can be harvested. Move batches to a Flowering room first.
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harvest_batch_number">Harvest Batch Number *</Label>
                  <Input
                    id="harvest_batch_number"
                    value={newHarvest.harvest_batch_number || generateHarvestBatchNumber()}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                    placeholder="H-2024-001"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plant_count">Plant Count *</Label>
                    <Input
                      id="plant_count"
                      type="number"
                      placeholder="50"
                      value={newHarvest.plant_count}
                      onChange={(e) => setNewHarvest({ ...newHarvest, plant_count: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wet_weight_lbs">Wet Weight (lbs)</Label>
                    <Input
                      id="wet_weight_lbs"
                      type="number"
                      step="0.01"
                      placeholder="100.00"
                      value={newHarvest.wet_weight_lbs}
                      onChange={(e) => setNewHarvest({ ...newHarvest, wet_weight_lbs: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Harvest notes..."
                    value={newHarvest.notes}
                    onChange={(e) => setNewHarvest({ ...newHarvest, notes: e.target.value })}
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
                  <Button type="submit" className="flex-1" disabled={createHarvest.isPending}>
                    {createHarvest.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Start Harvest"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Batches"
          value={stats.total}
          icon={<Scissors className="w-5 h-5" />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Harvesting"
          value={stats.harvesting}
          icon={<Scissors className="w-5 h-5" />}
          iconColor="bg-yellow-500/10 text-yellow-600"
        />
        <StatCard
          title="Drying"
          value={stats.drying}
          icon={<Timer className="w-5 h-5" />}
          iconColor="bg-orange-500/10 text-orange-600"
        />
        <StatCard
          title="Curing"
          value={stats.curing}
          icon={<Package className="w-5 h-5" />}
          iconColor="bg-purple-500/10 text-purple-600"
        />
        <StatCard
          title="Total Yield"
          value={`${stats.totalWeight.toFixed(1)} lbs`}
          icon={<Scale className="w-5 h-5" />}
          iconColor="bg-success/10 text-success"
          trend="up"
          change="Final weight"
        />
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Harvest Pipeline</CardTitle>
          <CardDescription>Current status of all harvest batches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Harvesting", count: stats.harvesting, color: "bg-yellow-500" },
              { label: "Drying", count: stats.drying, color: "bg-orange-500" },
              { label: "Curing", count: stats.curing, color: "bg-purple-500" },
              { label: "Completed", count: stats.completed, color: "bg-success" },
            ].map((stage, index) => (
              <div key={stage.label} className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <span className="text-sm font-medium">{stage.label}</span>
                </div>
                <div className="text-2xl font-bold">{stage.count}</div>
                <Progress
                  value={stats.total > 0 ? (stage.count / stats.total) * 100 : 0}
                  className="h-2 mt-2"
                />
                {index < 3 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable<HarvestBatch>
        data={harvests || []}
        columns={columns}
        rowActions={rowActions}
        searchable
        searchPlaceholder="Search harvest batches..."
        searchKeys={["harvest_batch_number"]}
        pagination
        pageSize={10}
        loading={isLoading}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Scissors}
            title="No harvest batches"
            description="Start your first harvest to begin tracking."
            action={{
              label: "Start Harvest",
              onClick: () => setIsDialogOpen(true),
              icon: Plus,
            }}
          />
        }
      />

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Harvest Batch Details</DialogTitle>
            <DialogDescription>
              View complete information about this harvest batch
            </DialogDescription>
          </DialogHeader>
          {selectedHarvest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Harvest Batch Number</Label>
                  <p className="font-medium">{selectedHarvest.harvest_batch_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {(() => {
                      const config = getStatusConfig(selectedHarvest.status);
                      return (
                        <Badge className={`${config.color} border`}>
                          {config.icon}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Source Batch</Label>
                  <p className="font-medium">{selectedHarvest.plant_batches?.batch_number || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Strain</Label>
                  <p className="font-medium">{selectedHarvest.plant_batches?.genetics?.name || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Plant Count</Label>
                  <p className="font-medium">{selectedHarvest.plant_count}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Harvest Date</Label>
                  <p className="font-medium">
                    {new Date(selectedHarvest.harvest_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Wet Weight</Label>
                  <p className="font-medium">
                    {selectedHarvest.wet_weight_lbs ? `${selectedHarvest.wet_weight_lbs} lbs` : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dry Weight</Label>
                  <p className="font-medium">
                    {selectedHarvest.dry_weight_lbs ? `${selectedHarvest.dry_weight_lbs} lbs` : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Final Weight</Label>
                  <p className="font-medium text-success">
                    {selectedHarvest.final_weight_lbs ? `${selectedHarvest.final_weight_lbs} lbs` : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Harvest Status</DialogTitle>
            <DialogDescription>
              Update the status and details of this harvest batch
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={updateFormData.status}
                onValueChange={(value) => setUpdateFormData({ ...updateFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drying">Drying</SelectItem>
                  <SelectItem value="curing">Curing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dryWeight">Dry Weight (lbs)</Label>
                <Input
                  id="dryWeight"
                  type="number"
                  step="0.01"
                  value={updateFormData.dryWeight}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, dryWeight: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trimWeight">Trim Weight (lbs)</Label>
                <Input
                  id="trimWeight"
                  type="number"
                  step="0.01"
                  value={updateFormData.trimWeight}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, trimWeight: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wasteWeight">Waste Weight (lbs)</Label>
              <Input
                id="wasteWeight"
                type="number"
                step="0.01"
                value={updateFormData.wasteWeight}
                onChange={(e) => setUpdateFormData({ ...updateFormData, wasteWeight: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualityGrade">Quality Grade</Label>
              <Input
                id="qualityGrade"
                value={updateFormData.qualityGrade}
                onChange={(e) => setUpdateFormData({ ...updateFormData, qualityGrade: e.target.value })}
                placeholder="e.g., A, B, C"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={updateFormData.notes}
                onChange={(e) => setUpdateFormData({ ...updateFormData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUpdateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateHarvest.isPending}>
                {updateHarvest.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Harvest;
