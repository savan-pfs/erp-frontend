import { useState, useMemo } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState } from "@/components/common";
import type { Column, RowAction } from "@/components/common";
import {
  Flower2,
  Plus,
  Scissors,
  Calendar,
  Heart,
  Dna,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Leaf,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Activity,
  Target,
  Loader2,
  LayoutGrid,
  List,
  Home,
  Info,
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
import { cn } from "@/lib/utils";
import { useMothers, useCreateMother, useUpdateMother, useDeleteMother, useCloneMother, useGenetics, useRooms } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

interface MotherPlant extends Record<string, unknown> {
  id: string;
  tag: string;
  strain: string;
  genetic_id: string;
  age_weeks: number;
  health_score: number;
  total_clones_taken: number;
  clones_this_month: number;
  last_clone_date: string;
  next_clone_date: string | null;
  status: "healthy" | "stressed" | "retiring";
  location: string;
  notes: string;
}

const MotherPlants = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMother, setEditingMother] = useState<any>(null);
  const [viewingMother, setViewingMother] = useState<any>(null);

  // Form state
  const [addFormData, setAddFormData] = useState({
    motherName: "",
    geneticId: "",
    roomId: "",
    source: "",
    notes: "",
  });

  const [cloneFormData, setCloneFormData] = useState({
    motherId: "",
    cloneCount: "",
    medium: "",
    notes: "",
  });

  // Fetch data from API
  const { data: apiMothers, isLoading, isError } = useMothers();
  const { data: apiGenetics } = useGenetics();
  const { data: apiRooms } = useRooms();

  // Mutations
  const createMother = useCreateMother();
  const updateMother = useUpdateMother();
  const deleteMother = useDeleteMother();
  const cloneMother = useCloneMother();

  // Transform API data
  const motherPlants: MotherPlant[] = (apiMothers || []).map((m: any) => ({
    id: m.id,
    tag: m.motherName || `MTH-${m.id}`,
    strain: m.genetic?.strainName || "Unknown",
    genetic_id: m.geneticId,
    age_weeks: m.plantingDate ? Math.floor((new Date().getTime() - new Date(m.plantingDate).getTime()) / (1000 * 60 * 60 * 24 * 7)) : 0,
    health_score: m.healthScore || 80,
    total_clones_taken: m.totalClonesTaken || 0,
    clones_this_month: m.clonesThisMonth || 0,
    last_clone_date: m.lastCloneDate || new Date().toISOString(),
    next_clone_date: m.nextCloneDate || null,
    status: m.healthStatus === "healthy" ? "healthy" : m.healthStatus === "stressed" ? "stressed" : "retiring",
    location: m.room?.name || "Mother Room",
    notes: m.notes || "",
  }));

  // Generate dynamic clone production trend data from actual mother plants
  const cloneProductionData = useMemo(() => {
    // Get last 6 months of data
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Calculate clones for this month from mother plants
      // This is a simplified calculation - in a real system, you'd track clone dates
      const clonesThisMonth = motherPlants.reduce((sum, m) => {
        // Estimate based on clones_this_month if available, otherwise distribute total clones
        if (i === 5) { // Current month
          return sum + (m.clones_this_month || 0);
        }
        // For past months, estimate based on total clones divided by age
        const estimatedMonthly = m.total_clones_taken > 0 && m.age_weeks > 0
          ? Math.round(m.total_clones_taken / Math.max(m.age_weeks / 4, 1))
          : 0;
        return sum + estimatedMonthly;
      }, 0);
      
      // Set target (average of all months + 10% growth)
      const target = Math.round(clonesThisMonth * 1.1);
      
      months.push({
        month: monthName,
        clones: clonesThisMonth,
        target: target || 200, // Default target if no data
      });
    }
    return months;
  }, [motherPlants]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalClones = motherPlants.reduce((sum, m) => sum + m.clones_this_month, 0);
    const avgHealth = motherPlants.length > 0
      ? Math.round(
      motherPlants.reduce((sum, m) => sum + m.health_score, 0) / motherPlants.length
        )
      : 0;
    const healthyCount = motherPlants.filter((m) => m.status === "healthy").length;
    const totalLifetimeClones = motherPlants.reduce((s, m) => s + m.total_clones_taken, 0);

    return { totalClones, avgHealth, healthyCount, totalLifetimeClones };
  }, [motherPlants]);

  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-destructive";
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 90) return "bg-success";
    if (score >= 70) return "bg-warning";
    return "bg-destructive";
  };

  const handleOpenView = (mother: any) => {
    const apiMother = apiMothers?.find((m: any) => m.id === mother.id);
    setViewingMother(apiMother || mother);
    setIsViewDialogOpen(true);
  };

  const handleOpenEdit = (mother: any) => {
    setEditingMother(mother);
    // Map all fields from API response - handle both camelCase and snake_case
    setAddFormData({
      motherName: mother.motherName || mother.mother_name || "",
      geneticId: (mother.geneticId ?? mother.genetic?.id ?? mother.genetic_id)?.toString() || "",
      roomId: (mother.roomId ?? mother.room?.id ?? mother.room_id)?.toString() || "",
      source: mother.source || "",
      notes: mother.notes || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
    setEditingMother(null);
    setAddFormData({
      motherName: "",
      geneticId: "",
      roomId: "",
      source: "",
      notes: "",
    });
  };

  // Generate plant tag automatically based on genetic
  const generatePlantTag = (geneticId: string): string => {
    if (!geneticId || !apiGenetics) return "";
    
    const genetic = apiGenetics.find((g: any) => String(g.id) === geneticId);
    if (!genetic) return "";

    const strainName = genetic.strainName || genetic.name || "";
    
    // Get first 2-3 letters of strain name, uppercase
    const strainCode = strainName
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, "X");

    // Count existing mothers with same genetic
    const existingMothers = (apiMothers || []).filter(
      (m: any) => String(m.geneticId || m.genetic?.id) === geneticId
    );
    const nextNumber = (existingMothers.length + 1).toString().padStart(3, "0");

    return `MTH-${strainCode}-${nextNumber}`;
  };

  // Table columns
  const columns: Column<MotherPlant>[] = [
    {
      key: "tag",
      header: "Tag",
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-primary">{row.tag}</span>
      ),
    },
    {
      key: "strain",
      header: "Strain",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-success" />
          </div>
          <span className="font-medium">{row.strain}</span>
        </div>
      ),
    },
    {
      key: "age_weeks",
      header: "Age",
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground">{row.age_weeks} weeks</span>
      ),
    },
    {
      key: "health_score",
      header: "Health",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2 min-w-[100px]">
          <Progress
            value={row.health_score}
            className={cn("w-16 h-2", `[&>div]:${getHealthBgColor(row.health_score)}`)}
          />
          <span className={cn("font-semibold text-sm", getHealthColor(row.health_score))}>
            {row.health_score}%
          </span>
        </div>
      ),
    },
    {
      key: "total_clones_taken",
      header: "Total Clones",
      sortable: true,
      cell: (row) => (
        <span className="font-semibold">{row.total_clones_taken.toLocaleString()}</span>
      ),
    },
    {
      key: "clones_this_month",
      header: "This Month",
      sortable: true,
      cell: (row) => (
        <Badge variant="outline" className="font-mono">
          {row.clones_this_month}
        </Badge>
      ),
    },
    {
      key: "last_clone_date",
      header: "Last Clone",
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.last_clone_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "location",
      header: "Room",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{row.location}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const statusMap = {
          healthy: "success" as const,
          stressed: "warning" as const,
          retiring: "pending" as const,
        };
        return <StatusBadge status={statusMap[row.status]} label={row.status} />;
      },
    },
  ];

  // Row actions
  const rowActions: RowAction<MotherPlant>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => handleOpenView(row),
    },
    {
      label: "Take Clones",
      icon: <Scissors className="w-4 h-4" />,
      onClick: (row) => {
        setCloneFormData({ ...cloneFormData, motherId: String(row.id) });
        setIsCloneDialogOpen(true);
      },
      disabled: (row) => row.status === "retiring",
    },
    {
      label: "Edit",
      icon: <Edit className="w-4 h-4" />,
      onClick: (row) => {
        const apiMother = apiMothers?.find((m: any) => m.id === row.id);
        if (apiMother) handleOpenEdit(apiMother);
      },
    },
    {
      label: "Retire",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (row) => handleDelete(row.id),
      variant: "destructive",
      disabled: (row) => row.status === "retiring",
    },
  ];

  const handleSubmitMother = async () => {
    if (!addFormData.motherName || !addFormData.geneticId) {
      toast({
        title: "Error",
        description: "Mother name and genetic are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const motherData: any = {
        motherName: addFormData.motherName,
        geneticId: parseInt(addFormData.geneticId),
        roomId: addFormData.roomId ? parseInt(addFormData.roomId) : undefined,
        notes: addFormData.notes ? `${addFormData.notes}${addFormData.source ? ` | Source: ${addFormData.source}` : ''}` : (addFormData.source ? `Source: ${addFormData.source}` : undefined),
      };

      if (editingMother) {
        await updateMother.mutateAsync({ id: editingMother.id, updates: motherData });
        toast({
          title: "Success",
          description: "Mother plant updated successfully",
        });
      } else {
        await createMother.mutateAsync(motherData);
        toast({
          title: "Success",
          description: "Mother plant added successfully",
        });
      }

      handleCloseAddDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingMother ? 'update' : 'add'} mother plant`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogClones = async () => {
    if (!cloneFormData.motherId || !cloneFormData.cloneCount) {
      toast({
        title: "Error",
        description: "Mother plant and clone count are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await cloneMother.mutateAsync({
        id: cloneFormData.motherId,
        cloneCount: parseInt(cloneFormData.cloneCount),
      });

      toast({
        title: "Success",
        description: `${cloneFormData.cloneCount} clones logged successfully`,
      });

      setIsCloneDialogOpen(false);
      setCloneFormData({
        motherId: "",
        cloneCount: "",
        medium: "",
        notes: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log clones",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await deleteMother.mutateAsync(id);
      toast({
        title: "Success",
        description: "Mother plant retired successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to retire mother plant",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mother Plants"
        description="Genetic preservation and clone production management"
        breadcrumbs={[
          { label: "Cultivation", href: "/batches" },
          { label: "Mother Plants" },
        ]}
        badge={
          stats.healthyCount < motherPlants.length && (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {motherPlants.length - stats.healthyCount} need attention
            </Badge>
          )
        }
        actions={
          <div className="flex gap-2">
            <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Scissors className="w-4 h-4" />
                  Log Cloning
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-primary" />
                    Log Clone Production
                  </DialogTitle>
                  <DialogDescription>
                    Record clones taken from a mother plant
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Mother Plant *</Label>
                    <Select 
                      value={cloneFormData.motherId} 
                      onValueChange={(value) => setCloneFormData({ ...cloneFormData, motherId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select mother plant" />
                      </SelectTrigger>
                      <SelectContent>
                        {motherPlants
                          .filter((m) => m.status !== "retiring")
                          .map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{m.tag}</span>
                                <span className="text-muted-foreground">-</span>
                                <span>{m.strain}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Number of Clones *</Label>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        min={1} 
                        value={cloneFormData.cloneCount}
                        onChange={(e) => setCloneFormData({ ...cloneFormData, cloneCount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rooting Medium</Label>
                      <Select 
                        value={cloneFormData.medium} 
                        onValueChange={(value) => setCloneFormData({ ...cloneFormData, medium: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select medium" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rockwool">Rockwool Cubes</SelectItem>
                          <SelectItem value="rapid_rooter">Rapid Rooters</SelectItem>
                          <SelectItem value="aeroponic">Aeroponic Cloner</SelectItem>
                          <SelectItem value="soil">Soil Plugs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea 
                      placeholder="Clone quality, cutting location, rooting hormone used..." 
                      value={cloneFormData.notes}
                      onChange={(e) => setCloneFormData({ ...cloneFormData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCloneDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleLogClones} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Log Clones
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* View Mother Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Flower2 className="w-5 h-5 text-pink-500" />
                    Mother Plant Details
                  </DialogTitle>
                  <DialogDescription>
                    Complete information for {viewingMother?.motherName || 'mother plant'}
                  </DialogDescription>
                </DialogHeader>
                {viewingMother && (
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
                          <p className="text-sm font-medium">{viewingMother.motherName || `MTH-${viewingMother.id}`}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Genetic/Strain</p>
                          <p className="text-sm font-medium">{viewingMother.genetic?.strainName || 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Room</p>
                          <p className="text-sm font-medium flex items-center gap-1.5">
                            <Home className="w-3.5 h-3.5 text-muted-foreground" />
                            {viewingMother.room?.name || 'Not assigned'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Health Status</p>
                          <Badge className={viewingMother.healthStatus === 'healthy' ? 'bg-success' : viewingMother.healthStatus === 'stressed' ? 'bg-warning' : 'bg-destructive'}>
                            {viewingMother.healthStatus || 'healthy'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Clone Production */}
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Scissors className="w-4 h-4" />
                        Clone Production
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <p className="text-xs text-muted-foreground mb-1">Total Clones</p>
                          <p className="text-2xl font-bold text-primary">{viewingMother.cloneCount || 0}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10">
                          <p className="text-xs text-muted-foreground mb-1">Age (days)</p>
                          <p className="text-2xl font-bold text-blue-600">{viewingMother.ageDays || 0}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-500/10">
                          <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                          <p className="text-2xl font-bold text-purple-600">95%</p>
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Cloning Schedule
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Last Clone Date</p>
                          <p className="text-sm font-medium">
                            {viewingMother.lastCloneDate ? new Date(viewingMother.lastCloneDate).toLocaleDateString() : 'Not recorded'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Next Clone Date</p>
                          <p className="text-sm font-medium">
                            {viewingMother.nextCloneDate ? new Date(viewingMother.nextCloneDate).toLocaleDateString() : 'Not scheduled'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {viewingMother.notes && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Notes</h3>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          {viewingMother.notes}
                        </p>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Status:</span>
                        <Badge variant={viewingMother.isActive ? 'default' : 'secondary'}>
                          {viewingMother.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          handleOpenEdit(viewingMother);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Mother
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              if (!open) {
                handleCloseAddDialog();
              } else {
                setIsAddDialogOpen(true);
              }
            }}>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Mother
                </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Flower2 className="w-5 h-5 text-pink-500" />
                    {editingMother ? "Edit Mother Plant" : "Add Mother Plant"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingMother ? "Update mother plant information" : "Register a new mother plant for clone production"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Strain / Genetic *</Label>
                    <Select 
                      value={addFormData.geneticId} 
                      onValueChange={(value) => {
                        const generatedTag = generatePlantTag(value);
                        setAddFormData({ 
                          ...addFormData, 
                          geneticId: value,
                          motherName: editingMother ? addFormData.motherName : generatedTag
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select strain" />
                      </SelectTrigger>
                      <SelectContent>
                        {(apiGenetics || []).map((g: any) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.strainName || g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Plant Tag *</Label>
                    <Input 
                      placeholder="MTH-XXX-001" 
                      value={addFormData.motherName}
                      onChange={(e) => setAddFormData({ ...addFormData, motherName: e.target.value })}
                    />
                    {!editingMother && addFormData.geneticId && (
                      <p className="text-xs text-muted-foreground">
                        Auto-generated from selected strain (editable)
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Select 
                      value={addFormData.roomId} 
                      onValueChange={(value) => setAddFormData({ ...addFormData, roomId: value })}
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
                    <Label>Source</Label>
                    <Select 
                      value={addFormData.source} 
                      onValueChange={(value) => setAddFormData({ ...addFormData, source: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clone">Clone from existing mother</SelectItem>
                        <SelectItem value="seed">Seed phenotype selection</SelectItem>
                        <SelectItem value="purchased">Purchased clone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea 
                      placeholder="Phenotype characteristics, selection criteria..." 
                      value={addFormData.notes}
                      onChange={(e) => setAddFormData({ ...addFormData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseAddDialog}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitMother} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingMother ? "Update Mother" : "Add Mother"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Mother Plants"
          value={motherPlants.length}
          icon={<Flower2 className="w-6 h-6" />}
          iconColor="bg-pink-100 text-pink-600"
          subtitle={`${stats.healthyCount} healthy`}
        />
        <StatCard
          title="Average Health"
          value={`${stats.avgHealth}%`}
          icon={<Heart className="w-6 h-6" />}
          iconColor="bg-success-light text-success"
          change={stats.avgHealth >= 85 ? "Good condition" : "Needs attention"}
          trend={stats.avgHealth >= 85 ? "up" : "down"}
        />
        <StatCard
          title="Clones (MTD)"
          value={stats.totalClones}
          icon={<Scissors className="w-6 h-6" />}
          iconColor="bg-primary-light text-primary"
          change="+12% vs last month"
          trend="up"
        />
        <StatCard
          title="Lifetime Clones"
          value={stats.totalLifetimeClones.toLocaleString()}
          icon={<Dna className="w-6 h-6" />}
          iconColor="bg-info-light text-info"
          subtitle="All time production"
        />
      </div>

      {/* Charts and Schedule Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clone Production Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Clone Production Trend
                </CardTitle>
                <CardDescription>Monthly clone output vs target</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Actual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                  <span className="text-muted-foreground">Target</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {cloneProductionData.length === 0 ? (
              <div className="flex items-center justify-center h-72">
                <EmptyState
                  icon={Scissors}
                  title="No Clone Data"
                  description="No clone production data available. Take clones from mother plants to see production trends."
                />
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cloneProductionData}>
                    <defs>
                      <linearGradient id="cloneGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clones"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#cloneGradient)"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Mother Plants Table/Cards */}
      <Tabs defaultValue="table" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="table" className="gap-2">
              <List className="w-4 h-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              Card View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="table" className="m-0">
          <DataTable
            data={motherPlants as Record<string, unknown>[]}
            columns={columns as Column<Record<string, unknown>>[]}
            rowActions={rowActions as RowAction<Record<string, unknown>>[]}
            searchable
            searchPlaceholder="Search by tag or strain..."
            searchKeys={["tag", "strain"]}
            pagination
            pageSize={10}
            loading={isLoading}
            getRowId={(row) => String(row.id)}
            emptyState={
              <EmptyState
                icon={Flower2}
                title="No mother plants found"
                description="Add your first mother plant to start clone production"
                action={{
                  label: "Add Mother",
                  onClick: () => setIsAddDialogOpen(true),
                  icon: Plus,
                }}
              />
            }
          />
        </TabsContent>

        <TabsContent value="cards" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {motherPlants.map((mother) => (
              <Card
                key={mother.id}
                className={cn(
                  "overflow-hidden transition-all hover:shadow-lg cursor-pointer group",
                  mother.status === "stressed" && "border-warning/50",
                  mother.status === "retiring" && "border-muted opacity-75"
                )}
              >
                {/* Card Header with Status */}
                <div
                  className={cn(
                    "h-2",
                    mother.status === "healthy" && "bg-success",
                    mother.status === "stressed" && "bg-warning",
                    mother.status === "retiring" && "bg-muted-foreground"
                  )}
                />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-primary">{mother.tag}</p>
                      <p className="text-lg font-semibold">{mother.strain}</p>
                    </div>
                    <StatusBadge
                      status={
                        mother.status === "healthy"
                          ? "success"
                          : mother.status === "stressed"
                          ? "warning"
                          : "pending"
                      }
                      label={mother.status}
                      size="sm"
                    />
                  </div>

                  {/* Health Score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Health Score</span>
                      <span className={cn("font-bold", getHealthColor(mother.health_score))}>
                        {mother.health_score}%
                      </span>
                    </div>
                    <Progress
                      value={mother.health_score}
                      className={cn("h-2", `[&>div]:${getHealthBgColor(mother.health_score)}`)}
                    />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground text-xs">Age</p>
                      <p className="font-semibold">{mother.age_weeks} weeks</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground text-xs">This Month</p>
                      <p className="font-semibold">{mother.clones_this_month} clones</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground text-xs">Total Clones</p>
                      <p className="font-semibold">{mother.total_clones_taken.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground text-xs">Last Clone</p>
                      <p className="font-semibold">
                        {new Date(mother.last_clone_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {mother.notes && (
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                      {mother.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={mother.status === "retiring"}
                    >
                      <Scissors className="w-4 h-4 mr-1" />
                      Clone
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MotherPlants;
