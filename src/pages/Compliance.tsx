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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  RefreshCw,
  Calendar,
  AlertCircle,
  Eye,
  Download,
} from "lucide-react";
import { PageHeader, StatCard, DataTable, StatusBadge } from "@/components/common";
import type { Column, RowAction } from "@/components/common";

interface ComplianceItem {
  id: string;
  category: string;
  requirement: string;
  status: string;
  dueDate: string | null;
  lastChecked: string;
  notes: string;
  priority: string;
}

interface MetrcSync {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  status: string;
  syncedAt: string;
  error: string | null;
}

const Compliance = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock compliance items
  const complianceItems: ComplianceItem[] = [
    {
      id: "CMP-001",
      category: "Licensing",
      requirement: "State License Renewal",
      status: "compliant",
      dueDate: "2025-06-15",
      lastChecked: "2024-12-15",
      notes: "License valid until June 2025",
      priority: "high",
    },
    {
      id: "CMP-002",
      category: "Tracking",
      requirement: "Metrc Daily Sync",
      status: "compliant",
      dueDate: null,
      lastChecked: "2024-12-17",
      notes: "All packages synced successfully",
      priority: "high",
    },
    {
      id: "CMP-003",
      category: "Security",
      requirement: "Video Surveillance Check",
      status: "attention",
      dueDate: "2024-12-20",
      lastChecked: "2024-12-10",
      notes: "Camera 3 needs maintenance",
      priority: "medium",
    },
    {
      id: "CMP-004",
      category: "Testing",
      requirement: "Lab Testing Compliance",
      status: "compliant",
      dueDate: null,
      lastChecked: "2024-12-16",
      notes: "All batches tested before sale",
      priority: "high",
    },
    {
      id: "CMP-005",
      category: "Waste",
      requirement: "Waste Disposal Documentation",
      status: "compliant",
      dueDate: null,
      lastChecked: "2024-12-17",
      notes: "Dual-witness verification complete",
      priority: "high",
    },
    {
      id: "CMP-006",
      category: "Training",
      requirement: "Employee Compliance Training",
      status: "non_compliant",
      dueDate: "2024-12-15",
      lastChecked: "2024-12-01",
      notes: "2 employees need certification renewal",
      priority: "high",
    },
  ];

  // Mock Metrc sync history
  const metrcSyncHistory: MetrcSync[] = [
    {
      id: "SYNC-001",
      entityType: "Plant",
      entityId: "PLT-001-001",
      action: "Create",
      status: "success",
      syncedAt: "2024-12-17 14:30:00",
      error: null,
    },
    {
      id: "SYNC-002",
      entityType: "Package",
      entityId: "PKG-2024-001",
      action: "Update",
      status: "success",
      syncedAt: "2024-12-17 14:25:00",
      error: null,
    },
    {
      id: "SYNC-003",
      entityType: "Harvest",
      entityId: "HB-2024-001",
      action: "Create",
      status: "success",
      syncedAt: "2024-12-17 14:20:00",
      error: null,
    },
    {
      id: "SYNC-004",
      entityType: "Transfer",
      entityId: "TRF-2024-001",
      action: "Create",
      status: "failed",
      syncedAt: "2024-12-17 14:15:00",
      error: "Invalid destination license",
    },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "compliant":
        return { status: "success" as const, label: "Compliant", icon: <CheckCircle2 className="w-3 h-3" /> };
      case "attention":
        return { status: "warning" as const, label: "Needs Attention", icon: <AlertTriangle className="w-3 h-3" /> };
      case "non_compliant":
        return { status: "danger" as const, label: "Non-Compliant", icon: <XCircle className="w-3 h-3" /> };
      default:
        return { status: "pending" as const, label: status, icon: null };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive";
      case "medium":
        return "bg-warning/10 text-warning";
      case "low":
        return "bg-blue-500/10 text-blue-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const compliantCount = complianceItems.filter((i) => i.status === "compliant").length;
  const attentionCount = complianceItems.filter((i) => i.status === "attention").length;
  const nonCompliantCount = complianceItems.filter((i) => i.status === "non_compliant").length;
  const complianceScore = Math.round((compliantCount / complianceItems.length) * 100);

  // DataTable columns for compliance items
  const complianceColumns: Column<ComplianceItem>[] = [
    {
      key: "id",
      header: "ID",
      cell: (item) => <span className="font-mono text-sm">{item.id}</span>,
    },
    {
      key: "category",
      header: "Category",
      cell: (item) => <Badge variant="outline">{item.category}</Badge>,
      sortable: true,
    },
    {
      key: "requirement",
      header: "Requirement",
      cell: (item) => <span className="font-medium">{item.requirement}</span>,
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => {
        const config = getStatusConfig(item.status);
        return <StatusBadge status={config.status} label={config.label} />;
      },
      sortable: true,
    },
    {
      key: "priority",
      header: "Priority",
      cell: (item) => (
        <Badge className={`${getPriorityConfig(item.priority)} border-0 capitalize`}>
          {item.priority}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (item) =>
        item.dueDate ? (
          <span className="text-sm">{new Date(item.dueDate).toLocaleDateString()}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      sortable: true,
    },
    {
      key: "lastChecked",
      header: "Last Checked",
      cell: (item) => (
        <span className="text-sm text-muted-foreground">
          {new Date(item.lastChecked).toLocaleDateString()}
        </span>
      ),
      sortable: true,
    },
  ];

  const complianceRowActions: RowAction<ComplianceItem>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (item) => console.log("View", item.id),
    },
    {
      label: "Mark Checked",
      icon: <CheckCircle2 className="w-4 h-4" />,
      onClick: (item) => console.log("Check", item.id),
    },
  ];

  // DataTable columns for Metrc sync
  const syncColumns: Column<MetrcSync>[] = [
    {
      key: "syncedAt",
      header: "Time",
      cell: (sync) => <span className="text-sm">{sync.syncedAt}</span>,
      sortable: true,
    },
    {
      key: "entityType",
      header: "Type",
      cell: (sync) => <Badge variant="outline">{sync.entityType}</Badge>,
    },
    {
      key: "entityId",
      header: "Entity ID",
      cell: (sync) => <span className="font-mono text-sm">{sync.entityId}</span>,
    },
    {
      key: "action",
      header: "Action",
      cell: (sync) => <span className="text-sm">{sync.action}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (sync) =>
        sync.status === "success" ? (
          <Badge className="bg-success/10 text-success border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Success
          </Badge>
        ) : (
          <Badge className="bg-destructive/10 text-destructive border-0">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        ),
    },
    {
      key: "error",
      header: "Error",
      cell: (sync) =>
        sync.error ? (
          <span className="text-sm text-destructive">{sync.error}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Compliance"
        description="Regulatory compliance tracking and Metrc integration"
        breadcrumbs={[{ label: "Compliance" }]}
        badge={
          nonCompliantCount > 0 ? (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
              <AlertCircle className="w-3 h-3 mr-1" />
              {nonCompliantCount} issue{nonCompliantCount > 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              All compliant
            </Badge>
          )
        }
        actions={
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Metrc
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Compliance Score"
          value={`${complianceScore}%`}
          icon={<Shield className="w-5 h-5" />}
          iconColor="bg-primary/10 text-primary"
          trend={complianceScore >= 90 ? "up" : "down"}
          change={complianceScore >= 90 ? "Excellent" : "Needs attention"}
        />
        <StatCard
          title="Compliant"
          value={compliantCount}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Needs Attention"
          value={attentionCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="bg-warning/10 text-warning"
        />
        <StatCard
          title="Non-Compliant"
          value={nonCompliantCount}
          icon={<XCircle className="w-5 h-5" />}
          iconColor="bg-destructive/10 text-destructive"
        />
      </div>

      {/* Compliance Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance Overview</CardTitle>
          <CardDescription>Current compliance status by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {["Licensing", "Tracking", "Security", "Testing", "Waste", "Training"].map((category) => {
              const items = complianceItems.filter((i) => i.category === category);
              const compliant = items.filter((i) => i.status === "compliant").length;
              const percentage = items.length > 0 ? Math.round((compliant / items.length) * 100) : 0;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{category}</span>
                    <span className={percentage === 100 ? "text-success" : percentage >= 50 ? "text-warning" : "text-destructive"}>
                      {percentage}%
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="checklist">Compliance Checklist</TabsTrigger>
          <TabsTrigger value="metrc">Metrc Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-6 mt-6">
          <DataTable
            data={complianceItems}
            columns={complianceColumns}
            rowActions={complianceRowActions}
            searchable
            searchPlaceholder="Search requirements..."
            searchKeys={["requirement", "category"]}
            pagination
            pageSize={10}
            getRowId={(row) => row.id}
          />
        </TabsContent>

        <TabsContent value="metrc" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Metrc Sync Status</CardTitle>
                  <CardDescription>Real-time sync with state tracking system</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-success/10 text-success border-0">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse mr-2" />
                    Connected
                  </Badge>
                  <Button size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Force Sync
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-success/10 text-center">
                  <p className="text-2xl font-bold text-success">
                    {metrcSyncHistory.filter((s) => s.status === "success").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div className="p-4 rounded-xl bg-destructive/10 text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {metrcSyncHistory.filter((s) => s.status === "failed").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 text-center">
                  <p className="text-2xl font-bold text-blue-600">{metrcSyncHistory.length}</p>
                  <p className="text-sm text-muted-foreground">Total Today</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/10 text-center">
                  <p className="text-2xl font-bold text-primary">2 min</p>
                  <p className="text-sm text-muted-foreground">Last Sync</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DataTable
            data={metrcSyncHistory}
            columns={syncColumns}
            searchable
            searchPlaceholder="Search sync history..."
            searchKeys={["entityId", "entityType"]}
            pagination
            pageSize={10}
            getRowId={(row) => row.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Compliance;
