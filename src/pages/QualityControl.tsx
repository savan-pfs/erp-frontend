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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Beaker,
  FileCheck,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  FlaskConical,
  Shield,
  FileText,
  Printer,
  Loader2,
} from "lucide-react";
import { PageHeader, StatCard, DataTable, StatusBadge } from "@/components/common";
import type { Column, RowAction } from "@/components/common";

interface LabTest {
  id: string;
  sampleId: string;
  productName: string;
  testType: string;
  labName: string;
  submittedDate: string;
  completedDate: string | null;
  status: string;
  thc: number | null;
  cbd: number | null;
  totalCannabinoids: number | null;
  terpenes: number | null;
  moisture: number | null;
  pesticides: string | null;
  heavyMetals: string | null;
  microbials: string | null;
  residualSolvents: string | null;
  coaUrl: string | null;
  failReason?: string;
}

interface QAChecklist {
  id: string;
  name: string;
  category: string;
  items: number;
  lastUsed: string;
}

const QualityControl = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock lab tests
  const labTests: LabTest[] = [
    {
      id: "LAB-2024-001",
      sampleId: "INV-2024-001",
      productName: "Granddaddy Purple Flower",
      testType: "Full Panel",
      labName: "Green Labs Colorado",
      submittedDate: "2024-12-10",
      completedDate: "2024-12-13",
      status: "passed",
      thc: 23.5,
      cbd: 0.12,
      totalCannabinoids: 26.8,
      terpenes: 2.4,
      moisture: 12.5,
      pesticides: "ND",
      heavyMetals: "Pass",
      microbials: "Pass",
      residualSolvents: "N/A",
      coaUrl: "#",
    },
    {
      id: "LAB-2024-002",
      sampleId: "MFG-2024-001",
      productName: "Blue Dream Live Resin",
      testType: "Concentrate Panel",
      labName: "Green Labs Colorado",
      submittedDate: "2024-12-12",
      completedDate: "2024-12-14",
      status: "passed",
      thc: 78.5,
      cbd: 0.8,
      totalCannabinoids: 82.3,
      terpenes: 8.2,
      moisture: null,
      pesticides: "ND",
      heavyMetals: "Pass",
      microbials: "Pass",
      residualSolvents: "Pass",
      coaUrl: "#",
    },
    {
      id: "LAB-2024-003",
      sampleId: "MFG-2024-003",
      productName: "Sour Diesel Shatter",
      testType: "Concentrate Panel",
      labName: "Rocky Mountain Testing",
      submittedDate: "2024-12-14",
      completedDate: null,
      status: "pending",
      thc: null,
      cbd: null,
      totalCannabinoids: null,
      terpenes: null,
      moisture: null,
      pesticides: null,
      heavyMetals: null,
      microbials: null,
      residualSolvents: null,
      coaUrl: null,
    },
    {
      id: "LAB-2024-004",
      sampleId: "INV-2024-004",
      productName: "OG Kush Pre-Rolls",
      testType: "Full Panel",
      labName: "Green Labs Colorado",
      submittedDate: "2024-12-08",
      completedDate: "2024-12-11",
      status: "failed",
      thc: 22.1,
      cbd: 0.3,
      totalCannabinoids: 24.5,
      terpenes: 1.8,
      moisture: 14.2,
      pesticides: "Detected",
      heavyMetals: "Pass",
      microbials: "Pass",
      residualSolvents: "N/A",
      coaUrl: "#",
      failReason: "Pesticide residue detected (Myclobutanil)",
    },
  ];

  // Mock QA checklists
  const qaChecklists: QAChecklist[] = [
    { id: "QA-CHK-001", name: "Pre-Harvest Inspection", category: "Cultivation", items: 12, lastUsed: "2024-12-15" },
    { id: "QA-CHK-002", name: "Post-Harvest Quality Check", category: "Harvest", items: 18, lastUsed: "2024-12-14" },
    { id: "QA-CHK-003", name: "Extraction Equipment Validation", category: "Manufacturing", items: 24, lastUsed: "2024-12-12" },
    { id: "QA-CHK-004", name: "Packaging Inspection", category: "Packaging", items: 15, lastUsed: "2024-12-15" },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "passed":
        return { status: "success" as const, label: "Passed", icon: <CheckCircle2 className="w-3 h-3" /> };
      case "failed":
        return { status: "danger" as const, label: "Failed", icon: <XCircle className="w-3 h-3" /> };
      case "pending":
        return { status: "warning" as const, label: "Pending", icon: <Clock className="w-3 h-3" /> };
      default:
        return { status: "pending" as const, label: status, icon: null };
    }
  };

  const handleSubmitSample = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }, 1000);
  };

  const passedTests = labTests.filter((t) => t.status === "passed").length;
  const failedTests = labTests.filter((t) => t.status === "failed").length;
  const pendingTests = labTests.filter((t) => t.status === "pending").length;
  const passRate = passedTests + failedTests > 0 ? Math.round((passedTests / (passedTests + failedTests)) * 100) : 0;

  // DataTable columns
  const columns: Column<LabTest>[] = [
    {
      key: "id",
      header: "Test ID",
      cell: (test) => (
        <span className="font-mono font-semibold text-sm">{test.id}</span>
      ),
      sortable: true,
    },
    {
      key: "productName",
      header: "Product",
      cell: (test) => (
        <div>
          <p className="font-medium">{test.productName}</p>
          <p className="text-xs text-muted-foreground font-mono">{test.sampleId}</p>
        </div>
      ),
      sortable: true,
    },
    {
      key: "testType",
      header: "Test Type",
      cell: (test) => (
        <Badge variant="outline">{test.testType}</Badge>
      ),
    },
    {
      key: "thc",
      header: "THC %",
      cell: (test) =>
        test.thc ? (
          <div className="flex items-center gap-2">
            <div className="w-12 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min((test.thc / 30) * 100, 100)}%` }}
              />
            </div>
            <span className="font-bold text-sm">{test.thc}%</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      sortable: true,
    },
    {
      key: "cbd",
      header: "CBD %",
      cell: (test) =>
        test.cbd ? <span>{test.cbd}%</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "terpenes",
      header: "Terpenes",
      cell: (test) =>
        test.terpenes ? <span>{test.terpenes}%</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "safety",
      header: "Safety",
      cell: (test) => {
        if (test.status === "pending") return <span className="text-muted-foreground">—</span>;
        const isClean = test.pesticides === "ND" && test.heavyMetals === "Pass" && test.microbials === "Pass";
        return isClean ? (
          <Badge className="bg-success/10 text-success border-0">
            <Shield className="w-3 h-3 mr-1" />
            Clean
          </Badge>
        ) : (
          <Badge className="bg-destructive/10 text-destructive border-0">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Issues
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (test) => {
        const config = getStatusConfig(test.status);
        return <StatusBadge status={config.status} label={config.label} />;
      },
      sortable: true,
    },
    {
      key: "labName",
      header: "Lab",
      cell: (test) => (
        <span className="text-sm text-muted-foreground">{test.labName}</span>
      ),
    },
  ];

  const rowActions: RowAction<LabTest>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (test) => console.log("View", test.id),
    },
    {
      label: "Download COA",
      icon: <Download className="w-4 h-4" />,
      onClick: (test) => console.log("Download", test.id),
      disabled: (test) => !test.coaUrl,
    },
    {
      label: "Print COA",
      icon: <Printer className="w-4 h-4" />,
      onClick: (test) => console.log("Print", test.id),
      disabled: (test) => !test.coaUrl,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Quality Control"
        description="Lab testing, COA management, and quality assurance"
        breadcrumbs={[{ label: "Compliance", href: "/compliance" }, { label: "Quality Control" }]}
        badge={
          failedTests > 0 ? (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
              <XCircle className="w-3 h-3 mr-1" />
              {failedTests} failed test{failedTests > 1 ? "s" : ""}
            </Badge>
          ) : undefined
        }
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Submit Sample
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Lab Sample</DialogTitle>
                <DialogDescription>Submit a sample for third-party lab testing</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Sample Source</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select inventory/batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INV-2024-001">INV-2024-001 - GDP Flower</SelectItem>
                      <SelectItem value="INV-2024-002">INV-2024-002 - Blue Dream</SelectItem>
                      <SelectItem value="MFG-2024-003">MFG-2024-003 - Sour Diesel Shatter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Test Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Panel</SelectItem>
                      <SelectItem value="potency">Potency Only</SelectItem>
                      <SelectItem value="concentrate">Concentrate Panel</SelectItem>
                      <SelectItem value="edible">Edible Panel</SelectItem>
                      <SelectItem value="terpene">Terpene Profile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Testing Lab</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lab" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="green">Green Labs Colorado</SelectItem>
                      <SelectItem value="rocky">Rocky Mountain Testing</SelectItem>
                      <SelectItem value="mile">Mile High Labs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sample Weight (g)</Label>
                  <Input type="number" placeholder="10" />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Additional notes for lab..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitSample} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Sample"
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
          title="Total Tests"
          value={labTests.length}
          icon={<FlaskConical className="w-5 h-5" />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Pass Rate"
          value={`${passRate}%`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconColor="bg-success/10 text-success"
          trend={passRate >= 90 ? "up" : "down"}
          change={passRate >= 90 ? "Excellent" : "Needs attention"}
        />
        <StatCard
          title="Pending Results"
          value={pendingTests}
          icon={<Clock className="w-5 h-5" />}
          iconColor="bg-warning/10 text-warning"
        />
        <StatCard
          title="Failed Tests"
          value={failedTests}
          icon={<XCircle className="w-5 h-5" />}
          iconColor="bg-destructive/10 text-destructive"
        />
      </div>

      <Tabs defaultValue="tests" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="tests">Lab Tests</TabsTrigger>
          <TabsTrigger value="checklists">QA Checklists</TabsTrigger>
          <TabsTrigger value="coa">COA Library</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <DataTable
            data={labTests}
            columns={columns}
            rowActions={rowActions}
            searchable
            searchPlaceholder="Search tests..."
            searchKeys={["id", "productName", "sampleId"]}
            pagination
            pageSize={10}
            getRowId={(row) => row.id}
          />
        </TabsContent>

        <TabsContent value="checklists" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">QA Checklists</CardTitle>
                  <CardDescription>Quality assurance inspection checklists</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Checklist
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {qaChecklists.map((checklist) => (
                  <div
                    key={checklist.id}
                    className="p-4 border rounded-xl hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{checklist.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {checklist.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-3">
                      <span>{checklist.items} items</span>
                      <span>Last used: {checklist.lastUsed}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Start Inspection
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Certificate of Analysis Library</CardTitle>
              <CardDescription>All COAs from third-party lab testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {labTests
                  .filter((t) => t.status !== "pending")
                  .map((test) => {
                    const statusConfig = getStatusConfig(test.status);
                    return (
                      <div
                        key={test.id}
                        className="p-4 border rounded-xl hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <StatusBadge status={statusConfig.status} label={statusConfig.label} />
                        </div>
                        <h4 className="font-semibold mb-1">{test.productName}</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          {test.labName} • {test.completedDate}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                          <div>
                            <span className="text-muted-foreground">THC:</span>{" "}
                            <span className="font-semibold">{test.thc}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">CBD:</span>{" "}
                            <span className="font-semibold">{test.cbd}%</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QualityControl;
