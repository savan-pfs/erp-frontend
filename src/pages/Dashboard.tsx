import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Plus, ArrowRight, AlertCircle, Loader2, Upload, Shield, Package, Beaker, BarChart3, ClipboardList } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { organizationsApi } from "@/lib/api/realApi";
import { useEffect, useState } from "react";
import { LicenseUpload } from "@/components/LicenseUpload";
import {
  useDashboardStats,
  useDashboardAlerts,
  useBatches,
  useRooms,
  useTasks,
  useMothers,
  useGenetics,
  useHarvestBatches,
} from "@/hooks/useApi";

// Import dashboard widgets
import {
  QuickStats,
  AlertsWidget,
  ComplianceWidget,
  EnvironmentWidget,
  BatchesWidget,
  CultivationProgress,
} from "@/components/dashboard";

// Role-based dashboard view types
type DashboardView = 'default' | 'cultivation' | 'inventory' | 'manufacturing' | 'compliance' | 'analytics' | 'minimal';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSuperAdmin, isOrgAdmin, hasRole } = usePermissions();
  const [organizationStatus, setOrganizationStatus] = useState<string | null>(null);
  const [showLicenseUpload, setShowLicenseUpload] = useState(false);
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);

  // Determine dashboard view based on user role
  const getDashboardView = (): DashboardView => {
    if (isSuperAdmin || isOrgAdmin) return 'default';
    if (hasRole('Cultivation Manager') || hasRole('cultivation_manager')) return 'cultivation';
    if (hasRole('Technician / Grower') || hasRole('technician_grower')) return 'cultivation';
    if (hasRole('Inventory Clerk') || hasRole('inventory_clerk')) return 'inventory';
    if (hasRole('Processor / Mfg Operator') || hasRole('processor_mfg_operator')) return 'manufacturing';
    if (hasRole('QA / Lab Manager') || hasRole('qa_lab_manager')) return 'compliance';
    if (hasRole('Auditor / Compliance') || hasRole('auditor_compliance')) return 'compliance';
    if (hasRole('Read-only Viewer') || hasRole('read_only_viewer')) return 'minimal';
    return 'default';
  };

  const dashboardView = getDashboardView();

  // Check organization approval status
  useEffect(() => {
    const checkOrganizationStatus = async () => {
      if (!user?.organizationId) {
        setIsLoadingOrg(false);
        return;
      }

      try {
        const org = await organizationsApi.getById(user.organizationId);
        setOrganizationStatus(org.approval_status);
        setIsLoadingOrg(false);
      } catch (error) {
        console.error('Failed to fetch organization status:', error);
        setIsLoadingOrg(false);
      }
    };

    checkOrganizationStatus();
  }, [user?.organizationId]);

  const isPendingApproval = organizationStatus === 'PENDING_APPROVAL';
  const isRejected = organizationStatus === 'REJECTED';

  // Fetch data from API with real-time updates
  const { data: dashboardStats, isLoading: statsLoading, isError: statsError } = useDashboardStats();
  const { data: apiAlerts, isLoading: alertsLoading } = useDashboardAlerts();
  const { data: apiBatches, isLoading: batchesLoading, isError: batchesError } = useBatches();
  const { data: apiRooms, isLoading: roomsLoading, isError: roomsError } = useRooms();
  const { data: apiTasks, isLoading: tasksLoading, isError: tasksError } = useTasks();
  const { data: apiMothers, isLoading: mothersLoading } = useMothers();
  const { data: apiGenetics, isLoading: geneticsLoading } = useGenetics();
  const { data: apiHarvestBatches, isLoading: harvestBatchesLoading } = useHarvestBatches();

  // Use API data with proper defaults
  const stats = dashboardStats || {
    totalPlants: 0,
    activeBatches: 0,
    activeRooms: 0,
    inventoryLots: 0,
    pendingTasks: 0,
    completedToday: 0,
    capacityPercent: 0,
    complianceScore: 0,
  };

  // Transform API batches to display format
  const batches = (apiBatches || []).slice(0, 5).map((b: any) => ({
    id: b.id,
    strain: b.genetic?.strainName || b.batchName || "Unknown",
    batchNumber: b.batchName || `B-${b.id}`,
    stage: b.batchType || "seed",
    plants: (b.totalSeeds || 0) + (b.totalClones || 0),
    daysInStage: b.sourceDate 
      ? Math.floor((new Date().getTime() - new Date(b.sourceDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
  }));

  // Transform API rooms to display format
  const rooms = (apiRooms || []).slice(0, 6).map((r: any) => {
    // Calculate average temperature (use max if available, otherwise min, fallback to 75)
    const tempMin = r.temperature?.min ?? r.temperature_min ?? null;
    const tempMax = r.temperature?.max ?? r.temperature_max ?? null;
    const avgTemp = tempMin !== null && tempMax !== null 
      ? Math.round((tempMin + tempMax) / 2)
      : tempMax ?? tempMin ?? 75;

    // Calculate average humidity (use max if available, otherwise min, fallback to 60)
    const humidityMin = r.humidity?.min ?? r.humidity_min ?? null;
    const humidityMax = r.humidity?.max ?? r.humidity_max ?? null;
    const avgHumidity = humidityMin !== null && humidityMax !== null
      ? Math.round((humidityMin + humidityMax) / 2)
      : humidityMax ?? humidityMin ?? 60;

    // Get current plants count
    const currentPlants = r.currentPlants ?? r.current_plants ?? 0;
    
    // Get capacity
    const capacity = r.capacity ?? 300;

    // Check for alerts (temperature or humidity out of range, capacity issues)
    const hasAlert = 
      (tempMax !== null && tempMax > 85) ||
      (tempMin !== null && tempMin < 65) ||
      (humidityMax !== null && humidityMax > 80) ||
      (humidityMin !== null && humidityMin < 40) ||
      (capacity > 0 && currentPlants >= capacity * 0.9);

    return {
      id: r.id,
      name: r.name || "Unnamed Room",
      temp: avgTemp,
      humidity: avgHumidity,
      plants: currentPlants,
      capacity: capacity,
      hasAlert: hasAlert,
    };
  });

  // Transform API alerts or use defaults
  const alerts = (apiAlerts || []).map((alert: any, index: number) => ({
    id: alert.id || `alert-${index}`,
    type: alert.type === "warning" ? "warning" as const : 
          alert.type === "info" ? "info" as const : 
          "success" as const,
    title: alert.title,
    message: alert.message,
    time: "Just now",
    dismissible: true,
  }));

  // Add default alerts if none from API
  if (alerts.length === 0) {
    const pendingTaskCount = (apiTasks || []).filter((t: any) => t.status === "pending").length;
    if (pendingTaskCount > 0) {
      alerts.push({
        id: "tasks-pending",
        type: "info" as const,
        title: "Tasks Due",
        message: `${pendingTaskCount} tasks pending`,
        time: "Just now",
        dismissible: false,
      });
    }
  }

  // Compliance items based on real data
  const complianceItems = [
    { id: "1", label: "Plant tags verified", status: "passed" as const },
    { id: "2", label: "Audit logs up to date", status: "passed" as const },
    { id: "3", label: "Inventory reconciled", status: stats.inventoryLots > 0 ? "passed" as const : "warning" as const },
    { id: "4", label: "Environment logs", status: rooms.length > 0 ? "passed" as const : "warning" as const },
  ];

  // Task stats from real data
  const urgentTasks = (apiTasks || []).filter((t: any) => t.priority === "urgent" && t.status === "pending").length;
  const taskStats = {
    completed: stats.completedToday,
    pending: stats.pendingTasks,
    urgent: urgentTasks,
  };

  const firstName = user?.full_name?.split(" ")[0] || user?.firstName || "there";
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  // Check if any data is loading
  const isAnyLoading = statsLoading || batchesLoading || roomsLoading || tasksLoading;
  const hasAnyError = statsError || batchesError || roomsError || tasksError;

  // Show blurred dashboard if pending approval
  if (isPendingApproval || isRejected) {
    return (
      <div className="space-y-6 p-6 relative">
        {/* Blur Overlay */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="max-w-2xl w-full mx-4 space-y-6">
            <Alert variant={isRejected ? "destructive" : "default"}>
              <Shield className="w-4 h-4" />
              <AlertTitle>
                {isRejected ? "Organization Rejected" : "Organization Pending Approval"}
              </AlertTitle>
              <AlertDescription>
                {isRejected ? (
                  "Your organization has been rejected. Please contact support for assistance."
                ) : (
                  "Your organization is pending Super Admin approval. Please upload your cultivation license to complete the approval process."
                )}
              </AlertDescription>
            </Alert>

            {isPendingApproval && (
              <div className="bg-card border rounded-lg p-6">
                {showLicenseUpload ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Upload Cultivation License</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowLicenseUpload(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                    <LicenseUpload
                      organizationId={user?.organizationId || undefined}
                      onUploadComplete={() => {
                        setShowLicenseUpload(false);
                        // Refresh organization status
                        organizationsApi.getById(user?.organizationId || 0).then(org => {
                          setOrganizationStatus(org.approval_status);
                        });
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-4 text-center">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Upload Your Cultivation License</h3>
                      <p className="text-muted-foreground mb-4">
                        To complete your organization approval, please upload your cultivation license PDF with all required details.
                      </p>
                      <Button onClick={() => setShowLicenseUpload(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload License
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Blurred Content */}
        <div className="blur-sm pointer-events-none">
          {renderDashboardContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {renderDashboardContent()}
    </div>
  );

  function renderDashboardContent() {
    // Role indicator badge
    const getRoleIndicator = () => {
      switch (dashboardView) {
        case 'cultivation':
          return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Cultivation View</Badge>;
        case 'inventory':
          return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">Inventory View</Badge>;
        case 'manufacturing':
          return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200">Manufacturing View</Badge>;
        case 'compliance':
          return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">Compliance View</Badge>;
        case 'minimal':
          return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-200">Read-Only View</Badge>;
        default:
          return null;
      }
    };

    // Quick action buttons based on role
    const getQuickActions = () => {
      switch (dashboardView) {
        case 'cultivation':
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/plants")}>
                <span className="text-sm font-medium">View Plants</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/batches")}>
                <span className="text-sm font-medium">Batches</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/rooms")}>
                <span className="text-sm font-medium">Rooms</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/harvest")}>
                <span className="text-sm font-medium">Harvest</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          );
        case 'inventory':
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/inventory")}>
                <Package className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Inventory</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/waste")}>
                <span className="text-sm font-medium">Waste Logs</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/reports")}>
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Reports</span>
              </Button>
            </div>
          );
        case 'compliance':
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/compliance")}>
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Compliance</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/audit-logs")}>
                <ClipboardList className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Audit Logs</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/quality-control")}>
                <Beaker className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Quality Control</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/reports")}>
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Reports</span>
              </Button>
            </div>
          );
        case 'minimal':
          return (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/analytics")}>
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Analytics</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/reports")}>
                <span className="text-sm font-medium">Reports</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          );
        default:
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/plants")}>
                <span className="text-sm font-medium">View Plants</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/inventory")}>
                <span className="text-sm font-medium">Inventory</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate("/reports")}>
                <span className="text-sm font-medium">Reports</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          );
      }
    };

    return (
      <>
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">
              {greeting}, {firstName}!
            </h1>
            {getRoleIndicator()}
          </div>
          <p className="text-muted-foreground mt-0.5">
            {dashboardView === 'minimal' 
              ? "Overview of cultivation operations (read-only access)."
              : "Here's what's happening with your cultivation today."
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAnyLoading ? (
            <Badge variant="outline" className="bg-muted text-muted-foreground px-3 py-1">
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Syncing...
            </Badge>
          ) : hasAnyError ? (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 px-3 py-1">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
              Connection Issue
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-success-light text-success border-success/20 px-3 py-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              All Systems Operational
            </Badge>
          )}
          {dashboardView !== 'minimal' && (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => navigate("/batches")}
            >
              <Plus className="w-4 h-4" />
              New Batch
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats
        stats={{
          totalPlants: stats.totalPlants,
          activeBatches: stats.activeBatches,
          inventoryLots: stats.inventoryLots,
          pendingTasks: stats.pendingTasks,
        }}
        isLoading={statsLoading}
      />

      {/* Cultivation Progress - Show for cultivation and default views */}
      {(dashboardView === 'default' || dashboardView === 'cultivation') && (
        <CultivationProgress
          batches={apiBatches || []}
          genetics={apiGenetics || []}
          mothers={apiMothers || []}
          rooms={apiRooms || []}
          harvestBatches={apiHarvestBatches || []}
          isLoading={batchesLoading || geneticsLoading || mothersLoading || roomsLoading || harvestBatchesLoading}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Batches (2 cols) */}
        <div className="lg:col-span-2">
          <BatchesWidget
            batches={batches}
            onViewAll={() => navigate("/batches")}
            onBatchClick={(id) => navigate(`/batches/${id}`)}
            isLoading={batchesLoading}
          />
        </div>

        {/* Right Column - Alerts */}
        <div>
          <AlertsWidget
            alerts={alerts}
            onDismiss={(id) => console.log("Dismiss alert:", id)}
            onViewAll={() => navigate("/tasks")}
            isLoading={alertsLoading}
          />
        </div>
      </div>

      {/* Environment & Compliance Row - Show based on role */}
      {(dashboardView === 'default' || dashboardView === 'cultivation' || dashboardView === 'compliance') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnvironmentWidget
            rooms={rooms}
            onViewAll={() => navigate("/rooms")}
            isLoading={roomsLoading}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ComplianceWidget
              score={stats.complianceScore}
              items={complianceItems}
              onViewDetails={() => navigate("/compliance")}
              isLoading={statsLoading}
            />
          </div>
        </div>
      )}

      {/* Quick Actions Footer - Role based */}
      {getQuickActions()}
      </>
    );
  }
};

export default Dashboard;
