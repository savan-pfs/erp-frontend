import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  ArrowLeft,
  Calendar,
  Home,
  Leaf,
  Layers,
  TrendingUp,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { useBatch, useUpdateBatch, useDeleteBatch, useGenetics, useRooms } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const BatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  
  // Fetch batch data from API
  const { data: batch, isLoading, isError } = useBatch(id || "");
  const { data: apiGenetics } = useGenetics();
  const { data: apiRooms } = useRooms();
  
  // Mutations
  const updateBatch = useUpdateBatch();
  const deleteBatch = useDeleteBatch();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !batch) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/batches")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Batch Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">The batch you're looking for doesn't exist or has been deleted.</p>
            <Button className="mt-4" onClick={() => navigate("/batches")}>
              Back to Batches
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    const stages = ["seed", "germination", "seedling", "clone", "vegetative", "pre_flower", "flowering", "harvest"];
    const index = stages.indexOf(stage);
    return ((index + 1) / stages.length) * 100;
  };

  // Handle edit
  const handleOpenEdit = () => {
    if (!batch) return;
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
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
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

  const handleSubmitEdit = async () => {
    if (!batch || !formData.batchName) {
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
      };

      await updateBatch.mutateAsync({ id: batch.id, updates: batchData });
      toast({
        title: "Success",
        description: "Batch updated successfully",
      });
      handleCloseEditDialog();
      // Refresh the page data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update batch",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!batch) return;

    const hasPlants = (batch.totalPlants ?? batch.total_plants ?? batch.currentCount ?? 0) > 0;
    
    if (hasPlants) {
      if (!confirm(`This batch has ${batch.totalPlants ?? batch.total_plants ?? batch.currentCount ?? 0} plants. Are you sure you want to delete it? This action cannot be undone.`)) {
        return;
      }
    } else {
      if (!confirm("Are you sure you want to delete this batch? This action cannot be undone.")) {
        return;
      }
    }

    try {
      await deleteBatch.mutateAsync(batch.id);
      toast({
        title: "Success",
        description: "Batch deleted successfully",
      });
      navigate("/batches");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete batch. This batch may have active plants or harvest batches.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/batches")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{batch.batchName}</h1>
            <p className="text-muted-foreground">
              {batch.genetic?.strainName || "Unknown Strain"} • {batch.batchType}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{batch.currentCount || 0}</p>
                <p className="text-sm text-muted-foreground">Current Plants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{batch.initialCount || 0}</p>
                <p className="text-sm text-muted-foreground">Initial Count</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Home className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{batch.room?.name || "Unassigned"}</p>
                <p className="text-sm text-muted-foreground">Room Location</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <Badge className={getStageColor(batch.currentStage || "unknown")}>
                  {batch.currentStage}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">Growth Stage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plants">Plants</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Batch Information */}
          <Card>
            <CardHeader>
              <CardTitle>Batch Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Batch Number</p>
                  <p className="font-mono font-medium">{batch.batchNumber || `B-${batch.id}`}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Batch Type</p>
                  <p className="font-medium capitalize">{batch.batchType || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Genetic Strain</p>
                  <p className="font-medium">{batch.genetic?.strainName || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mother Plant</p>
                  <p className="font-medium">{batch.mother?.motherName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {batch.startDate ? format(new Date(batch.startDate), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Harvest</p>
                  <p className="font-medium">
                    {batch.expectedHarvestDate ? format(new Date(batch.expectedHarvestDate), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="font-medium">{batch.successRate || 0}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={batch.isActive ? "default" : "secondary"}>
                    {batch.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {/* Growth Progress */}
              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Growth Progress</span>
                  <span className="font-medium">
                    {Math.round(getStageProgress(batch.currentStage || "seed"))}%
                  </span>
                </div>
                <Progress value={getStageProgress(batch.currentStage || "seed")} />
              </div>

              {/* Notes */}
              {batch.notes && (
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{batch.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plants">
          <Card>
            <CardHeader>
              <CardTitle>Plants in this Batch</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This batch contains {batch.currentCount || 0} plants.
              </p>
              <Button className="mt-4" onClick={() => navigate(`/plants?batchId=${batch.id}`)}>
                View All Plants
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Batch Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Timeline view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Batch Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{batch.notes || "No notes available for this batch."}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>
              Update batch information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batch-name">Batch Name *</Label>
              <Input
                id="batch-name"
                placeholder="B-2024-005"
                value={formData.batchName}
                onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
              />
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
              onClick={handleSubmitEdit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Batch"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchDetail;
