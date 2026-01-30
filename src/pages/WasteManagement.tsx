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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Trash2,
  Plus,
  Scale,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Leaf,
  Package,
  Camera,
  Loader2,
  Eye,
  Download,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState } from "@/components/common";
import type { Column, RowAction } from "@/components/common";
import { useWasteLogs, useCreateWasteLog, useRooms, useBatches } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

interface WasteRecord {
  id: string;
  date: string;
  wasteType: string;
  category: string;
  source: string;
  sourceName: string;
  weight_lbs: number;
  method: string;
  witness1: string;
  witness2: string;
  status: string;
  metrcSynced: boolean;
  notes: string;
  photoUrl: string | null;
}

const WasteManagement = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    wasteType: "",
    category: "",
    sourceId: "",
    weight: "",
    method: "",
    witness1: "",
    witness2: "",
    date: "",
    notes: "",
  });

  // Fetch data from API
  const { data: apiWasteLogs, isLoading, isError } = useWasteLogs();
  const { data: apiRooms } = useRooms();
  const { data: apiBatches } = useBatches();

  // Mutations
  const createWasteLog = useCreateWasteLog();

  // Transform API data
  const wasteRecords: WasteRecord[] = (apiWasteLogs || []).map((log: any) => ({
    id: String(log.id || `WASTE-${log.id}`),
    date: log.disposedAt || log.disposed_at || log.wasteDate || log.waste_date || new Date().toISOString(),
    wasteType: log.wasteType || log.waste_type || "Plant Material",
    category: log.reason || log.category || "General",
    source: log.batch_name || log.batch?.batchName || log.source || "Unknown",
    sourceName: log.sourceName || log.source_name || "Unknown",
    weight_lbs: parseFloat(log.quantity || log.weight || log.weight_lbs) || 0,
    method: log.disposalMethod || log.disposal_method || "Composting",
    witness1: log.witnessName || log.witness_name || log.witness1 || "Unknown",
    witness2: log.witness2 || log.witness_2 || "Unknown",
    status: log.status || "completed",
    metrcSynced: log.metrcSynced || log.metrc_synced || false,
    notes: log.complianceNotes || log.compliance_notes || log.notes || "",
    photoUrl: log.images || log.photoUrl || log.photo_url || null,
  }));

  // Waste by category data
  const wasteByCategory = [
    { name: "Trim/Leaves", value: 45, color: "#22c55e" },
    { name: "Whole Plants", value: 15, color: "#f59e0b" },
    { name: "Root Balls", value: 20, color: "#8b5cf6" },
    { name: "Extraction Waste", value: 12, color: "#3b82f6" },
    { name: "Failed Product", value: 8, color: "#ef4444" },
  ];

  // Mock employees for witness selection
  const employees = [
    { id: "emp-1", name: "John Smith" },
    { id: "emp-2", name: "Jane Doe" },
    { id: "emp-3", name: "Mike Johnson" },
    { id: "emp-4", name: "Sarah Williams" },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { status: "success" as const, label: "Completed", icon: <CheckCircle2 className="w-3 h-3" /> };
      case "pending_witness":
        return { status: "warning" as const, label: "Needs Witness", icon: <Users className="w-3 h-3" /> };
      case "pending_disposal":
        return { status: "info" as const, label: "Pending Disposal", icon: <Clock className="w-3 h-3" /> };
      default:
        return { status: "pending" as const, label: status, icon: null };
    }
  };

  const handleCreateRecord = async () => {
    if (!formData.wasteType || !formData.weight || !formData.method) {
      toast({
        title: "Error",
        description: "Waste type, weight, and disposal method are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createWasteLog.mutateAsync({
        roomId: formData.sourceId ? parseInt(formData.sourceId) : undefined,
        batchId: formData.sourceId ? parseInt(formData.sourceId) : undefined,
        wasteType: formData.wasteType,
        reason: formData.category || undefined,
        quantity: parseFloat(formData.weight),
        unit: "lbs",
        disposalMethod: formData.method,
        witnessName: formData.witness1 || undefined,
        complianceNotes: formData.notes || undefined,
        disposedAt: formData.date || new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Waste record created successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        wasteType: "",
        category: "",
        sourceId: "",
        weight: "",
        method: "",
        witness1: "",
        witness2: "",
        date: "",
        notes: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create waste record",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalWaste = wasteRecords.reduce((sum, w) => sum + w.weight_lbs, 0);
  const completedRecords = wasteRecords.filter((w) => w.status === "completed").length;
  const pendingRecords = wasteRecords.filter((w) => w.status !== "completed").length;

  // DataTable columns
  const columns: Column<WasteRecord>[] = [
    {
      key: "id",
      header: "ID",
      cell: (record) => (
        <span className="font-mono font-semibold text-sm">{record.id}</span>
      ),
      sortable: true,
    },
    {
      key: "date",
      header: "Date",
      cell: (record) => (
        <span className="text-sm">{new Date(record.date).toLocaleDateString()}</span>
      ),
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      cell: (record) => (
        <Badge variant="outline">{record.category}</Badge>
      ),
      sortable: true,
    },
    {
      key: "source",
      header: "Source",
      cell: (record) => (
        <div>
          <span className="font-mono text-sm">{record.source}</span>
          <p className="text-xs text-muted-foreground">{record.sourceName}</p>
        </div>
      ),
    },
    {
      key: "weight_lbs",
      header: "Weight",
      cell: (record) => (
        <span className="font-semibold">{record.weight_lbs} lbs</span>
      ),
      sortable: true,
    },
    {
      key: "method",
      header: "Method",
      cell: (record) => <span className="text-sm">{record.method}</span>,
    },
    {
      key: "witnesses",
      header: "Witnesses",
      cell: (record) => (
        <div className="text-sm">
          <span>{record.witness1}</span>
          <br />
          <span className="text-muted-foreground">{record.witness2}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (record) => {
        const config = getStatusConfig(record.status);
        return <StatusBadge status={config.status} label={config.label} />;
      },
      sortable: true,
    },
    {
      key: "metrcSynced",
      header: "Metrc",
      cell: (record) =>
        record.metrcSynced ? (
          <Badge className="bg-success/10 text-success border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Synced
          </Badge>
        ) : (
          <Badge className="bg-warning/10 text-warning border-0">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        ),
    },
  ];

  const rowActions: RowAction<WasteRecord>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (record) => console.log("View", record.id),
    },
    {
      label: "Download",
      icon: <Download className="w-4 h-4" />,
      onClick: (record) => console.log("Download", record.id),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Waste Management"
        description="Track and document cannabis waste with required dual-witness verification"
        breadcrumbs={[{ label: "Compliance", href: "/compliance" }, { label: "Waste Management" }]}
        badge={
          pendingRecords > 0 ? (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {pendingRecords} pending
            </Badge>
          ) : undefined
        }
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Record Waste
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record Waste Disposal</DialogTitle>
                <DialogDescription>
                  Document waste with required dual-witness verification
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Waste Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plant">Plant Material</SelectItem>
                        <SelectItem value="extraction">Extraction Waste</SelectItem>
                        <SelectItem value="failed">Failed Product</SelectItem>
                        <SelectItem value="packaging">Packaging Waste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trim">Trim/Fan Leaves</SelectItem>
                        <SelectItem value="whole">Whole Plants</SelectItem>
                        <SelectItem value="roots">Root Balls</SelectItem>
                        <SelectItem value="stems">Stems/Stalks</SelectItem>
                        <SelectItem value="spent">Spent Biomass</SelectItem>
                        <SelectItem value="lab_fail">Lab Failure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source (Batch/Plant/Lot)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B-2024-001">B-2024-001 - Blue Dream</SelectItem>
                        <SelectItem value="B-2024-002">B-2024-002 - OG Kush</SelectItem>
                        <SelectItem value="MFG-2024-001">MFG-2024-001 - Live Resin</SelectItem>
                        <SelectItem value="INV-2024-001">INV-2024-001 - GDP Flower</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (lbs)</Label>
                    <Input type="number" step="0.01" placeholder="0.00" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Disposal Method</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="composting">Composting</SelectItem>
                        <SelectItem value="incineration">Incineration</SelectItem>
                        <SelectItem value="landfill">Landfill (Mixed)</SelectItem>
                        <SelectItem value="rendering">Rendering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                </div>

                <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-warning" />
                    <span className="font-semibold">Witness Verification Required</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Witness 1 (Employee)</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select witness" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Witness 2 (Employee)</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select witness" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Photo Documentation</Label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes/Reason</Label>
                  <Textarea placeholder="Describe the waste and reason for disposal..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRecord} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    "Record Waste"
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
          title="Total Waste (MTD)"
          value={`${totalWaste.toFixed(1)} lbs`}
          icon={<Scale className="w-5 h-5" />}
          iconColor="bg-orange-500/10 text-orange-500"
        />
        <StatCard
          title="Completed"
          value={completedRecords}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Pending"
          value={pendingRecords}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="bg-warning/10 text-warning"
        />
        <StatCard
          title="Total Records"
          value={wasteRecords.length}
          icon={<FileText className="w-5 h-5" />}
          iconColor="bg-primary/10 text-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waste by Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Waste by Category</CardTitle>
            <CardDescription>Distribution of waste types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={wasteByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {wasteByCategory.map((entry, index) => (
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Waste Activity</CardTitle>
            <CardDescription>Latest waste disposal records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {wasteRecords.slice(0, 4).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        record.wasteType === "Plant Material"
                          ? "bg-success/10"
                          : record.wasteType === "Failed Product"
                          ? "bg-destructive/10"
                          : "bg-primary/10"
                      }`}
                    >
                      {record.wasteType === "Plant Material" ? (
                        <Leaf className="w-6 h-6 text-success" />
                      ) : record.wasteType === "Failed Product" ? (
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                      ) : (
                        <Package className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{record.category}</p>
                      <p className="text-sm text-muted-foreground">{record.sourceName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{record.weight_lbs} lbs</p>
                    <p className="text-xs text-muted-foreground">{record.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waste Records Table */}
      <DataTable
        data={wasteRecords}
        columns={columns}
        rowActions={rowActions}
        searchable
        searchPlaceholder="Search records..."
        searchKeys={["id", "category", "sourceName"]}
        pagination
        pageSize={10}
        loading={isLoading}
        onExport={() => console.log("Export")}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Trash2}
            title="No waste records"
            description="Start documenting waste disposal for compliance"
            action={{
              label: "Record Waste",
              onClick: () => setIsDialogOpen(true),
              icon: Plus,
            }}
          />
        }
      />
    </div>
  );
};

export default WasteManagement;
