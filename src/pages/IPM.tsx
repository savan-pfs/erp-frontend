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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  Bug,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Home,
  Loader2,
  Shield,
  Zap,
  Clock,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState } from "@/components/common";
import type { Column, RowAction } from "@/components/common";
import { useIPMLogs, useCreateIPMLog, useUpdateIpmLog, useDeleteIpmLog, useRooms, useBatches } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

interface IPMLog {
  id: string;
  treatmentDate: string;
  room: string;
  batch: string;
  treatmentType: string;
  productUsed: string;
  concentration: string;
  applicationMethod: string;
  pestDisease: string | null;
  reiHours: number;
  phiDays: number;
  performedBy: string;
  notes: string;
  status: string;
}

interface UpcomingTreatment {
  id: string;
  scheduledDate: string;
  room: string;
  treatmentType: string;
  productUsed: string;
  frequency: string;
}

interface PestHistory {
  pest: string;
  occurrences: number;
  lastSeen: string | null;
  severity: string | null;
}

const IPM = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [viewingLog, setViewingLog] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    treatmentDate: "",
    roomId: "",
    batchId: "",
    treatmentType: "",
    productUsed: "",
    concentration: "",
    applicationMethod: "",
    pestDisease: "",
    reiHours: "",
    phiDays: "",
    notes: "",
  });

  // Fetch data from API
  const { data: apiIPMLogs, isLoading, isError } = useIPMLogs();
  const { data: apiRooms } = useRooms();
  const { data: apiBatches } = useBatches();

  // Mutations
  const createIPMLog = useCreateIPMLog();
  const updateIPMLog = useUpdateIpmLog();
  const deleteIPMLog = useDeleteIpmLog();

  // Transform API data
  const ipmLogs: IPMLog[] = (apiIPMLogs || []).map((log: any) => ({
    id: log.id,
    treatmentDate: log.treatedAt || log.treated_at || log.treatmentDate || log.treatment_date || new Date().toISOString(),
    room: log.room_name || log.room?.name || "Unknown",
    batch: log.batch_name || log.batch?.batchName || "N/A",
    treatmentType: log.treatmentMethod || log.treatment_method || log.treatmentType || "Preventive",
    productUsed: log.productUsed || log.product_used || "Unknown",
    concentration: log.productConcentration || log.product_concentration || log.concentration || "",
    applicationMethod: log.applicationMethod || log.application_method || "Foliar Spray",
    pestDisease: log.pestName || log.pest_name || log.pestDisease || log.pest_disease || null,
    reiHours: parseInt(log.reiHours || log.rei_hours) || 0,
    phiDays: parseInt(log.phiDays || log.phi_days) || 0,
    performedBy: log.performedBy || log.performed_by || "Unknown",
    notes: log.notes || "",
    status: log.status || "completed",
  }));

  // Calculate upcoming treatments from recent logs (treatments that need follow-up)
  const upcomingTreatments: UpcomingTreatment[] = useMemo(() => {
    if (!apiIPMLogs || apiIPMLogs.length === 0) return [];
    
    // Group by room and treatment type, find most recent and calculate next due date
    const treatmentMap = new Map<string, any>();
    
    apiIPMLogs.forEach((log: any) => {
      const roomName = log.room_name || log.room?.name || "Unknown";
      const treatmentType = log.treatmentMethod || log.treatment_method || log.treatmentType || "Preventive";
      const key = `${roomName}-${treatmentType}`;
      
      const treatedDate = new Date(log.treatedAt || log.treated_at || log.treatmentDate || log.treatment_date);
      const existing = treatmentMap.get(key);
      
      if (!existing || treatedDate > new Date(existing.lastDate)) {
        treatmentMap.set(key, {
          id: log.id,
          room: roomName,
          treatmentType: treatmentType,
          productUsed: log.productUsed || log.product_used || "Unknown",
          lastDate: treatedDate.toISOString(),
          frequency: log.frequency || "Weekly", // Default frequency
        });
      }
    });
    
    // Calculate next scheduled date (7 days from last treatment for weekly, 14 for bi-weekly)
    return Array.from(treatmentMap.values()).map((treatment) => {
      const lastDate = new Date(treatment.lastDate);
      const daysToAdd = treatment.frequency === "Bi-weekly" ? 14 : 7;
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      
      return {
        id: treatment.id,
        scheduledDate: nextDate.toISOString().split("T")[0],
        room: treatment.room,
        treatmentType: treatment.treatmentType,
        productUsed: treatment.productUsed,
        frequency: treatment.frequency,
      };
    }).filter((t) => new Date(t.scheduledDate) >= new Date()).slice(0, 10); // Only upcoming, limit to 10
  }, [apiIPMLogs]);

  // Calculate pest/disease history from logs
  const pestDiseaseHistory: PestHistory[] = useMemo(() => {
    if (!apiIPMLogs || apiIPMLogs.length === 0) return [];
    
    const pestMap = new Map<string, { occurrences: number; lastSeen: string | null; severity: string | null }>();
    
    apiIPMLogs.forEach((log: any) => {
      const pestName = log.pestName || log.pest_name || log.pestDisease || log.pest_disease;
      if (!pestName) return;
      
      const existing = pestMap.get(pestName) || { occurrences: 0, lastSeen: null, severity: null };
      existing.occurrences += 1;
      
      const treatedDate = log.treatedAt || log.treated_at || log.treatmentDate || log.treatment_date;
      if (!existing.lastSeen || new Date(treatedDate) > new Date(existing.lastSeen)) {
        existing.lastSeen = treatedDate;
      }
      
      existing.severity = log.severity || log.severity_level || "low";
      pestMap.set(pestName, existing);
    });
    
    return Array.from(pestMap.entries()).map(([pest, data]) => ({
      pest,
      occurrences: data.occurrences,
      lastSeen: data.lastSeen,
      severity: data.severity,
    })).sort((a, b) => b.occurrences - a.occurrences);
  }, [apiIPMLogs]);

  const getTreatmentTypeConfig = (type: string) => {
    return type === "Preventive"
      ? { color: "bg-blue-500/10 text-blue-600", icon: <Shield className="w-3 h-3" /> }
      : { color: "bg-orange-500/10 text-orange-600", icon: <Zap className="w-3 h-3" /> };
  };

  const getSeverityConfig = (severity: string | null) => {
    if (!severity) return { color: "bg-gray-500/10 text-gray-600", label: "None" };
    switch (severity) {
      case "low":
        return { color: "bg-success/10 text-success", label: "Low" };
      case "medium":
        return { color: "bg-warning/10 text-warning", label: "Medium" };
      case "high":
        return { color: "bg-destructive/10 text-destructive", label: "High" };
      default:
        return { color: "bg-gray-500/10 text-gray-600", label: severity };
    }
  };

  const handleCreateLog = async () => {
    if (!formData.roomId || !formData.treatmentType || !formData.productUsed) {
      toast({
        title: "Error",
        description: "Room, treatment type, and product are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createIPMLog.mutateAsync({
        roomId: parseInt(formData.roomId),
        batchId: formData.batchId ? parseInt(formData.batchId) : undefined,
        issueType: formData.treatmentType === "Preventive" ? "preventive" : "treatment",
        treatmentMethod: formData.treatmentType,
        productUsed: formData.productUsed,
        productConcentration: formData.concentration || undefined,
        applicationMethod: formData.applicationMethod || undefined,
        pestName: formData.pestDisease || undefined,
        notes: formData.notes || undefined,
        treatedAt: formData.treatmentDate || new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "IPM treatment logged successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        treatmentDate: "",
        roomId: "",
        batchId: "",
        treatmentType: "",
        productUsed: "",
        concentration: "",
        applicationMethod: "",
        pestDisease: "",
        reiHours: "",
        phiDays: "",
        notes: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log IPM treatment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats
  const preventiveCount = ipmLogs.filter((l) => l.treatmentType === "Preventive").length;
  const curativeCount = ipmLogs.filter((l) => l.treatmentType === "Curative").length;
  const activePests = pestDiseaseHistory.filter((p) => p.occurrences > 0).length;

  // DataTable columns
  const columns: Column<IPMLog>[] = [
    {
      key: "treatmentDate",
      header: "Date",
      cell: (log) => (
        <span className="font-medium">
          {new Date(log.treatmentDate).toLocaleDateString()}
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
      key: "treatmentType",
      header: "Type",
      cell: (log) => {
        const config = getTreatmentTypeConfig(log.treatmentType);
        return (
          <Badge className={`${config.color} border-0`}>
            {config.icon}
            <span className="ml-1">{log.treatmentType}</span>
          </Badge>
        );
      },
      sortable: true,
    },
    {
      key: "productUsed",
      header: "Product",
      cell: (log) => (
        <div>
          <p className="font-medium">{log.productUsed}</p>
          <p className="text-xs text-muted-foreground">{log.concentration}</p>
        </div>
      ),
    },
    {
      key: "pestDisease",
      header: "Pest/Disease",
      cell: (log) =>
        log.pestDisease ? (
          <Badge variant="destructive" className="text-xs">
            {log.pestDisease}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "applicationMethod",
      header: "Method",
      cell: (log) => <span className="text-sm">{log.applicationMethod}</span>,
    },
    {
      key: "reiHours",
      header: "REI/PHI",
      cell: (log) => (
        <span className="text-xs text-muted-foreground">
          {log.reiHours}h / {log.phiDays}d
        </span>
      ),
    },
    {
      key: "performedBy",
      header: "By",
      cell: (log) => <span className="text-sm text-muted-foreground">{log.performedBy}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (log) => <StatusBadge status="success" label="Completed" />,
    },
  ];

  // Handle view details
  const handleViewDetails = (log: IPMLog) => {
    const apiLog = apiIPMLogs?.find((l: any) => l.id === log.id);
    if (apiLog) {
      setViewingLog(apiLog);
      setIsViewDialogOpen(true);
    }
  };

  // Handle open edit
  const handleOpenEdit = (log: IPMLog) => {
    const apiLog = apiIPMLogs?.find((l: any) => l.id === log.id);
    if (apiLog) {
      setEditingLog(apiLog);
      setFormData({
        treatmentDate: apiLog.treatedAt || apiLog.treated_at || new Date().toISOString().split('T')[0],
        roomId: String(apiLog.roomId || apiLog.room_id || ''),
        batchId: String(apiLog.batchId || apiLog.batch_id || ''),
        treatmentType: apiLog.treatmentMethod || apiLog.treatment_method || apiLog.issueType || apiLog.issue_type || '',
        productUsed: apiLog.productUsed || apiLog.product_used || '',
        concentration: apiLog.productConcentration || apiLog.product_concentration || '',
        applicationMethod: apiLog.applicationMethod || apiLog.application_method || '',
        pestDisease: apiLog.pestName || apiLog.pest_name || '',
        reiHours: '',
        phiDays: '',
        notes: apiLog.notes || '',
      });
      setIsEditDialogOpen(true);
    }
  };

  // Handle edit submit
  const handleEditLog = async () => {
    if (!editingLog || !formData.roomId || !formData.treatmentType || !formData.productUsed) {
      toast({
        title: "Error",
        description: "Room, treatment type, and product are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateIPMLog.mutateAsync({
        id: editingLog.id,
        updates: {
          roomId: parseInt(formData.roomId),
          batchId: formData.batchId ? parseInt(formData.batchId) : undefined,
          issueType: formData.treatmentType === "Preventive" ? "preventive" : "treatment",
          treatmentMethod: formData.treatmentType,
          productUsed: formData.productUsed,
          productConcentration: formData.concentration || undefined,
          applicationMethod: formData.applicationMethod || undefined,
          pestName: formData.pestDisease || undefined,
          notes: formData.notes || undefined,
          treatedAt: formData.treatmentDate || new Date().toISOString(),
        },
      });

      toast({
        title: "Success",
        description: "IPM log updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingLog(null);
      setFormData({
        treatmentDate: "",
        roomId: "",
        batchId: "",
        treatmentType: "",
        productUsed: "",
        concentration: "",
        applicationMethod: "",
        pestDisease: "",
        reiHours: "",
        phiDays: "",
        notes: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update IPM log",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (log: IPMLog) => {
    if (!window.confirm(`Are you sure you want to delete this IPM log? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteIPMLog.mutateAsync(log.id);
      toast({
        title: "Success",
        description: "IPM log deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete IPM log",
        variant: "destructive",
      });
    }
  };

  const rowActions: RowAction<IPMLog>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (log) => handleViewDetails(log),
    },
    {
      label: "Edit",
      icon: <Edit className="w-4 h-4" />,
      onClick: (log) => handleOpenEdit(log),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (log) => handleDelete(log),
      variant: "destructive",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="IPM Management"
        description="Integrated Pest Management tracking and treatments"
        breadcrumbs={[{ label: "Cultivation", href: "/plants" }, { label: "IPM" }]}
        badge={
          activePests > 0 ? (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
              <Bug className="w-3 h-3 mr-1" />
              {activePests} active pest{activePests > 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              All clear
            </Badge>
          )
        }
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Log Treatment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Log IPM Treatment</DialogTitle>
                <DialogDescription>Record pest management treatment</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Treatment Date *</Label>
                    <Input 
                      type="date" 
                      value={formData.treatmentDate}
                      onChange={(e) => setFormData({ ...formData, treatmentDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Room *</Label>
                    <Select 
                      value={formData.roomId} 
                      onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {(apiRooms || []).map((room: any) => (
                          <SelectItem key={room.id} value={String(room.id)}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Treatment Type *</Label>
                    <Select 
                      value={formData.treatmentType} 
                      onValueChange={(value) => setFormData({ ...formData, treatmentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Preventive">Preventive</SelectItem>
                        <SelectItem value="Curative">Curative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Batch (Optional)</Label>
                    <Select 
                      value={formData.batchId || undefined} 
                      onValueChange={(value) => setFormData({ ...formData, batchId: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {apiBatches?.filter((b: any) => b.isActive !== false).map((batch: any) => (
                          <SelectItem key={batch.id} value={String(batch.id)}>
                            {batch.batchName || batch.batch_name || `Batch ${batch.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Used *</Label>
                    <Input 
                      placeholder="e.g., Neem Oil" 
                      value={formData.productUsed}
                      onChange={(e) => setFormData({ ...formData, productUsed: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Concentration</Label>
                    <Input 
                      placeholder="e.g., 2%" 
                      value={formData.concentration}
                      onChange={(e) => setFormData({ ...formData, concentration: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Application Method</Label>
                  <Select 
                    value={formData.applicationMethod} 
                    onValueChange={(value) => setFormData({ ...formData, applicationMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Foliar Spray">Foliar Spray</SelectItem>
                      <SelectItem value="Root Drench">Root Drench</SelectItem>
                      <SelectItem value="Soil Application">Soil Application</SelectItem>
                      <SelectItem value="Systemic">Systemic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pest/Disease Identified (if curative)</Label>
                  <Input 
                    placeholder="e.g., Spider Mites" 
                    value={formData.pestDisease}
                    onChange={(e) => setFormData({ ...formData, pestDisease: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>REI (Re-entry Interval) Hours</Label>
                    <Input 
                      type="number" 
                      placeholder="4" 
                      value={formData.reiHours}
                      onChange={(e) => setFormData({ ...formData, reiHours: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PHI (Pre-harvest Interval) Days</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={formData.phiDays}
                      onChange={(e) => setFormData({ ...formData, phiDays: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Additional observations..." 
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <Button className="w-full" onClick={handleCreateLog} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    "Log Treatment"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit IPM Treatment</DialogTitle>
            <DialogDescription>Update pest management treatment details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Treatment Date *</Label>
                <Input
                  type="date"
                  value={formData.treatmentDate}
                  onChange={(e) => setFormData({ ...formData, treatmentDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Room *</Label>
                <Select
                  value={formData.roomId}
                  onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiRooms?.filter((r: any) => r.isActive !== false).map((room: any) => (
                      <SelectItem key={room.id} value={String(room.id)}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Batch (Optional)</Label>
                <Select
                  value={formData.batchId || undefined}
                  onValueChange={(value) => setFormData({ ...formData, batchId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {apiBatches?.filter((b: any) => b.isActive !== false).map((batch: any) => (
                      <SelectItem key={batch.id} value={String(batch.id)}>
                        {batch.batchName || batch.batch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Treatment Type *</Label>
                <Select
                  value={formData.treatmentType}
                  onValueChange={(value) => setFormData({ ...formData, treatmentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Preventive">Preventive</SelectItem>
                    <SelectItem value="Curative">Curative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Used *</Label>
                <Input
                  placeholder="e.g., Neem Oil"
                  value={formData.productUsed}
                  onChange={(e) => setFormData({ ...formData, productUsed: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Concentration</Label>
                <Input
                  placeholder="e.g., 2%"
                  value={formData.concentration}
                  onChange={(e) => setFormData({ ...formData, concentration: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Application Method</Label>
                <Select
                  value={formData.applicationMethod}
                  onValueChange={(value) => setFormData({ ...formData, applicationMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Foliar Spray">Foliar Spray</SelectItem>
                    <SelectItem value="Root Drench">Root Drench</SelectItem>
                    <SelectItem value="Soil Drench">Soil Drench</SelectItem>
                    <SelectItem value="Dusting">Dusting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pest/Disease</Label>
                <Input
                  placeholder="e.g., Spider Mites"
                  value={formData.pestDisease}
                  onChange={(e) => setFormData({ ...formData, pestDisease: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                placeholder="Additional observations..." 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleEditLog} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Treatment"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingLog(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Treatments"
          value={ipmLogs.length}
          icon={<Bug className="w-5 h-5" />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Preventive"
          value={preventiveCount}
          icon={<Shield className="w-5 h-5" />}
          iconColor="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title="Curative"
          value={curativeCount}
          icon={<Zap className="w-5 h-5" />}
          iconColor="bg-orange-500/10 text-orange-600"
        />
        <StatCard
          title="Scheduled"
          value={upcomingTreatments.length}
          icon={<Calendar className="w-5 h-5" />}
          iconColor="bg-success/10 text-success"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="logs">Treatment Logs</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="pests">Pest History</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6 mt-6">
          <DataTable
            data={ipmLogs}
            columns={columns}
            rowActions={rowActions}
            searchable
            searchPlaceholder="Search by room, product, or pest..."
            searchKeys={["room", "productUsed", "pestDisease"]}
            pagination
            pageSize={10}
            loading={isLoading}
            getRowId={(row) => row.id}
            emptyState={
              <EmptyState
                icon={Bug}
                title="No IPM treatments logged"
                description="Start logging your pest management treatments"
                action={{
                  label: "Log Treatment",
                  onClick: () => setIsDialogOpen(true),
                  icon: Plus,
                }}
              />
            }
          />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Treatments</CardTitle>
              <CardDescription>Scheduled preventive treatments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingTreatments.map((treatment) => (
                  <div
                    key={treatment.id}
                    className="p-4 rounded-xl border bg-card hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {new Date(treatment.scheduledDate).toLocaleDateString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {treatment.frequency}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Home className="w-4 h-4" />
                            <span>{treatment.room}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getTreatmentTypeConfig(treatment.treatmentType).color}>
                          {treatment.treatmentType}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {treatment.productUsed}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingTreatments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming treatments scheduled
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pests" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pest & Disease History</CardTitle>
              <CardDescription>Track occurrences and severity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pestDiseaseHistory.map((pest, index) => {
                  const severityConfig = getSeverityConfig(pest.severity);
                  return (
                    <div
                      key={index}
                      className="p-4 rounded-xl border bg-card hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            pest.occurrences > 0 ? "bg-warning/10" : "bg-success/10"
                          }`}>
                            {pest.occurrences > 0 ? (
                              <Bug className="w-6 h-6 text-warning" />
                            ) : (
                              <CheckCircle2 className="w-6 h-6 text-success" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{pest.pest}</p>
                            <p className="text-sm text-muted-foreground">
                              {pest.occurrences} occurrence{pest.occurrences !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {pest.severity && (
                            <Badge className={`${severityConfig.color} border-0`}>
                              {severityConfig.label}
                            </Badge>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {pest.lastSeen
                              ? `Last seen: ${new Date(pest.lastSeen).toLocaleDateString()}`
                              : "Never detected"}
                          </p>
                        </div>
                      </div>
                      {pest.occurrences > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Occurrence frequency</span>
                            <span className="font-medium">{pest.occurrences} this year</span>
                          </div>
                          <Progress
                            value={(pest.occurrences / 5) * 100}
                            className="h-2 mt-2"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-primary" />
              IPM Treatment Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this IPM treatment
            </DialogDescription>
          </DialogHeader>
          {viewingLog && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Treatment Date</Label>
                  <p className="font-medium">
                    {viewingLog.treatedAt || viewingLog.treated_at 
                      ? new Date(viewingLog.treatedAt || viewingLog.treated_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Issue Type</Label>
                  <p className="font-medium capitalize">
                    {viewingLog.issueType || viewingLog.issue_type || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Room</Label>
                  <p className="font-medium">
                    {viewingLog.room_name || viewingLog.room?.name || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Batch</Label>
                  <p className="font-medium">
                    {viewingLog.batch_name || viewingLog.batch?.batch_name || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Treatment Method</Label>
                  <p className="font-medium">
                    {viewingLog.treatmentMethod || viewingLog.treatment_method || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Severity</Label>
                  <p className="font-medium capitalize">
                    {viewingLog.severity || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product Used</Label>
                  <p className="font-medium">
                    {viewingLog.productUsed || viewingLog.product_used || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Concentration</Label>
                  <p className="font-medium">
                    {viewingLog.productConcentration || viewingLog.product_concentration || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Application Method</Label>
                  <p className="font-medium">
                    {viewingLog.applicationMethod || viewingLog.application_method || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Pest/Disease</Label>
                  <p className="font-medium">
                    {viewingLog.pestName || viewingLog.pest_name || "—"}
                  </p>
                </div>
                {viewingLog.detectedAt || viewingLog.detected_at ? (
                  <div>
                    <Label className="text-muted-foreground">Detected At</Label>
                    <p className="font-medium">
                      {new Date(viewingLog.detectedAt || viewingLog.detected_at).toLocaleString()}
                    </p>
                  </div>
                ) : null}
                {viewingLog.treatmentResult || viewingLog.treatment_result ? (
                  <div>
                    <Label className="text-muted-foreground">Treatment Result</Label>
                    <p className="font-medium">
                      {viewingLog.treatmentResult || viewingLog.treatment_result}
                    </p>
                  </div>
                ) : null}
                {viewingLog.followUpRequired || viewingLog.follow_up_required ? (
                  <div>
                    <Label className="text-muted-foreground">Follow-up Required</Label>
                    <p className="font-medium">
                      {viewingLog.followUpRequired || viewingLog.follow_up_required ? "Yes" : "No"}
                    </p>
                  </div>
                ) : null}
                {viewingLog.followUpDate || viewingLog.follow_up_date ? (
                  <div>
                    <Label className="text-muted-foreground">Follow-up Date</Label>
                    <p className="font-medium">
                      {new Date(viewingLog.followUpDate || viewingLog.follow_up_date).toLocaleDateString()}
                    </p>
                  </div>
                ) : null}
              </div>

              {viewingLog.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {viewingLog.notes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Status:</span>
                  <StatusBadge status="success" label="Completed" />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleOpenEdit({ id: viewingLog.id } as IPMLog);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IPM;
