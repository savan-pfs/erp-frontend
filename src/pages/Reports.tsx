import { useState, useMemo } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Download, Calendar, Clock, Plus, FileSpreadsheet, FileBarChart,
  FilePieChart, FileCheck, Loader2, Eye, Trash2, RefreshCw, Send, Star, StarOff,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/common";
import { useHarvestBatches, useInventory, useWasteManagement, useBatches, usePlants } from "@/hooks/useApi";
import { reportsApi } from "@/lib/api/realApi";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  name: string;
  type: string;
  category: string;
  lastGenerated: string;
  schedule: string | null;
  format: string;
  isFavorite: boolean;
  description: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  frequency: string;
  nextRun: string;
  recipients: string[];
  format: string;
  status: string;
}

const Reports = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");

  // Fetch data for reports (counts etc)
  const { data: apiHarvestBatches } = useHarvestBatches();
  const { data: apiInventory } = useInventory();
  const { data: apiWasteLogs } = useWasteManagement();
  const { data: apiBatches } = useBatches();

  // Calculate last generated dates from actual data
  const getLastGeneratedDate = (type: string): string => {
    const today = new Date().toISOString().split("T")[0];
    switch (type) {
      case "yield":
        if (apiHarvestBatches && apiHarvestBatches.length > 0) {
          const latest = apiHarvestBatches
            .map((hb: any) => hb.harvestDate || hb.harvest_date)
            .filter(Boolean).sort().reverse()[0];
          return latest ? new Date(latest).toISOString().split("T")[0] : today;
        }
        return today;
      case "inventory":
        if (apiInventory && apiInventory.length > 0) {
          const latest = apiInventory
            .map((inv: any) => inv.createdAt || inv.created_at || inv.packageDate || inv.package_date)
            .filter(Boolean).sort().reverse()[0];
          return latest ? new Date(latest).toISOString().split("T")[0] : today;
        }
        return today;
      case "waste":
        if (apiWasteLogs && apiWasteLogs.length > 0) {
          const latest = apiWasteLogs
            .map((w: any) => w.disposedAt || w.disposed_at || w.createdAt || w.created_at)
            .filter(Boolean).sort().reverse()[0];
          return latest ? new Date(latest).toISOString().split("T")[0] : today;
        }
        return today;
      case "tracking":
        if (apiBatches && apiBatches.length > 0) {
          const latest = apiBatches
            .map((b: any) => b.updatedAt || b.updated_at || b.createdAt || b.created_at)
            .filter(Boolean).sort().reverse()[0];
          return latest ? new Date(latest).toISOString().split("T")[0] : today;
        }
        return today;
      default:
        return today;
    }
  };

  // Calculate data counts for each report type
  const getDataCount = (type: string): number => {
    switch (type) {
      case "yield": return apiHarvestBatches?.length || 0;
      case "inventory": return apiInventory?.length || 0;
      case "waste": return apiWasteLogs?.length || 0;
      case "tracking": return apiBatches?.length || 0;
      case "compliance": return (apiWasteLogs?.length || 0) + (apiBatches?.length || 0);
      default: return 0;
    }
  };

  // Dynamic reports based on available data
  const reports: Report[] = useMemo(() => {
    const yieldCount = getDataCount("yield");
    const inventoryCount = getDataCount("inventory");
    const wasteCount = getDataCount("waste");
    const trackingCount = getDataCount("tracking");
    const complianceCount = getDataCount("compliance");

    return [
      {
        id: "RPT-001",
        name: "Monthly Yield Summary",
        type: "yield",
        category: "Production",
        lastGenerated: getLastGeneratedDate("yield"),
        schedule: "Monthly",
        format: "PDF",
        isFavorite: true,
        description: `Comprehensive monthly yield metrics${yieldCount > 0 ? ` (${yieldCount} harvests)` : ''}`,
      },
      {
        id: "RPT-002",
        name: "Inventory Valuation",
        type: "inventory",
        category: "Inventory",
        lastGenerated: getLastGeneratedDate("inventory"),
        schedule: "Weekly",
        format: "Excel",
        isFavorite: true,
        description: `Current inventory levels and valuation${inventoryCount > 0 ? ` (${inventoryCount} items)` : ''}`,
      },
      {
        id: "RPT-003",
        name: "Compliance Audit Report",
        type: "compliance",
        category: "Compliance",
        lastGenerated: getLastGeneratedDate("waste"),
        schedule: null,
        format: "PDF",
        isFavorite: false,
        description: `Compliance status and audit findings${complianceCount > 0 ? ` (${complianceCount} records)` : ''}`,
      },
      {
        id: "RPT-004",
        name: "Waste Disposal Log",
        type: "waste",
        category: "Compliance",
        lastGenerated: getLastGeneratedDate("waste"),
        schedule: "Daily",
        format: "PDF",
        isFavorite: false,
        description: `Daily waste disposal records${wasteCount > 0 ? ` (${wasteCount} items)` : ''}`,
      },
      {
        id: "RPT-005",
        name: "Lab Test Results",
        type: "quality",
        category: "Quality",
        lastGenerated: new Date().toISOString().split("T")[0],
        schedule: null,
        format: "PDF",
        isFavorite: false,
        description: "Summary of all lab test results and COAs",
      },
      {
        id: "RPT-006",
        name: "Plant Movement Report",
        type: "tracking",
        category: "Compliance",
        lastGenerated: getLastGeneratedDate("tracking"),
        schedule: "Daily",
        format: "Excel",
        isFavorite: false,
        description: `Track all plant movements for Metrc compliance${trackingCount > 0 ? ` (${trackingCount} batches)` : ''}`,
      },
    ];
  }, [apiHarvestBatches, apiInventory, apiWasteLogs, apiBatches]);

  const scheduledReports: ScheduledReport[] = [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "yield": return <FileBarChart className="w-5 h-5" />;
      case "inventory": return <FileSpreadsheet className="w-5 h-5" />;
      case "compliance": return <FileCheck className="w-5 h-5" />;
      case "quality": return <FilePieChart className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Production": return "bg-purple-500/10 text-purple-600";
      case "Inventory": return "bg-blue-500/10 text-blue-600";
      case "Compliance": return "bg-orange-500/10 text-orange-600";
      case "Quality": return "bg-success/10 text-success";
      default: return "bg-gray-500/10 text-gray-600";
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReportType) return;
    setIsGenerating(true);

    try {
      const payload = {
        type: selectedReportType,
        startDate,
        endDate,
        format: selectedFormat
      };

      const response: any = await reportsApi.generateReport(payload);

      // In real app, response.downloadUrl would be used
      // For now, let's just show success

      toast({
        title: "Report Generated",
        description: response.message || "Your report is ready for download."
      });

      // Mock download logic if we got data back in a real file scenario
      if (response.data) {
        const jsonString = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReportType}_report.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to generate report" });
    } finally {
      setIsGenerating(false);
    }
  };

  // ... (keeping rest of UI structure similar)

  const favoriteReports = reports.filter((r) => r.isFavorite);
  const reportsGeneratedToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return reports.filter(r => r.lastGenerated === today).length;
  }, [reports]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reports"
        description="Generate, schedule, and manage reports"
        breadcrumbs={[{ label: "Reports" }]}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Report</DialogTitle>
                <DialogDescription>Select report type and date range</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yield">Yield Summary</SelectItem>
                      <SelectItem value="inventory">Inventory Valuation</SelectItem>
                      <SelectItem value="compliance">Compliance Audit</SelectItem>
                      <SelectItem value="waste">Waste Disposal Log</SelectItem>
                      <SelectItem value="financial">Financial Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger><SelectValue placeholder="Format" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV (JSON)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleGenerateReport} disabled={isGenerating || !selectedReportType}>
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reports" value={reports.length} icon={<FileText className="w-5 h-5" />} iconColor="bg-primary/10 text-primary" />
        <StatCard title="Scheduled" value={scheduledReports.length} icon={<Clock className="w-5 h-5" />} iconColor="bg-blue-500/10 text-blue-600" />
        <StatCard title="Generated Today" value={reportsGeneratedToday} icon={<Calendar className="w-5 h-5" />} iconColor="bg-success/10 text-success" />
        <StatCard title="Favorites" value={favoriteReports.length} icon={<Star className="w-5 h-5" />} iconColor="bg-warning/10 text-warning" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-all group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl ${getCategoryColor(report.category)} flex items-center justify-center`}>
                  {getTypeIcon(report.type)}
                </div>
              </div>
              <CardTitle className="text-lg mt-3">{report.name}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <Badge className={`${getCategoryColor(report.category)} border-0`}>{report.category}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">{report.format}</span>
                </div>
                <div className="flex gap-2 pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedReportType(report.type); setIsDialogOpen(true); }}>
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reports;
