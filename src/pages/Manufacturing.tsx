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
import {
  Factory,
  FlaskConical,
  Package,
  Plus,
  Droplets,
  Cookie,
  Pill,
  Timer,
  CheckCircle2,
  Beaker,
  FileText,
  Scale,
  Loader2,
  Eye,
  Edit,
  TrendingUp,
} from "lucide-react";
import { PageHeader, StatCard, DataTable, StatusBadge } from "@/components/common";
import type { Column, RowAction } from "@/components/common";

interface ManufacturingBatch {
  id: string;
  productType: string;
  productName: string;
  inputMaterial: string;
  inputWeight: number;
  outputWeight: number | null;
  yieldPercent: number | null;
  extractionMethod: string;
  status: string;
  startDate: string;
  completedDate: string | null;
  thcPercent: number | null;
  terpenePercent: number | null;
  operator: string;
}

interface Recipe {
  id: string;
  name: string;
  type: string;
  method: string;
  targetYield: string;
  steps: number;
}

const Manufacturing = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock manufacturing batches
  const manufacturingBatches: ManufacturingBatch[] = [
    {
      id: "MFG-2024-001",
      productType: "Concentrate",
      productName: "Blue Dream Live Resin",
      inputMaterial: "INV-2024-002",
      inputWeight: 5.0,
      outputWeight: 0.85,
      yieldPercent: 17,
      extractionMethod: "Hydrocarbon (BHO)",
      status: "completed",
      startDate: "2024-12-10",
      completedDate: "2024-12-12",
      thcPercent: 78.5,
      terpenePercent: 8.2,
      operator: "John Smith",
    },
    {
      id: "MFG-2024-002",
      productType: "Edible",
      productName: "OG Kush Gummies 10mg",
      inputMaterial: "MFG-2024-001",
      inputWeight: 0.5,
      outputWeight: null,
      yieldPercent: null,
      extractionMethod: "Infusion",
      status: "in_progress",
      startDate: "2024-12-15",
      completedDate: null,
      thcPercent: null,
      terpenePercent: null,
      operator: "Jane Doe",
    },
    {
      id: "MFG-2024-003",
      productType: "Concentrate",
      productName: "Sour Diesel Shatter",
      inputMaterial: "INV-2024-001",
      inputWeight: 8.0,
      outputWeight: 1.2,
      yieldPercent: 15,
      extractionMethod: "Hydrocarbon (BHO)",
      status: "qa_testing",
      startDate: "2024-12-13",
      completedDate: "2024-12-14",
      thcPercent: 82.3,
      terpenePercent: 5.8,
      operator: "John Smith",
    },
    {
      id: "MFG-2024-004",
      productType: "Tincture",
      productName: "Full Spectrum CBD Tincture",
      inputMaterial: "INV-2024-003",
      inputWeight: 2.0,
      outputWeight: 0.4,
      yieldPercent: 20,
      extractionMethod: "CO2 Extraction",
      status: "completed",
      startDate: "2024-12-08",
      completedDate: "2024-12-10",
      thcPercent: 2.5,
      terpenePercent: 12.0,
      operator: "Mike Johnson",
    },
  ];

  // Mock recipes
  const recipes: Recipe[] = [
    {
      id: "RCP-001",
      name: "Live Resin Standard",
      type: "Concentrate",
      method: "Hydrocarbon (BHO)",
      targetYield: "15-20%",
      steps: 8,
    },
    {
      id: "RCP-002",
      name: "Gummy 10mg THC",
      type: "Edible",
      method: "Infusion",
      targetYield: "95%",
      steps: 12,
    },
    {
      id: "RCP-003",
      name: "Distillate Cart",
      type: "Vape",
      method: "Distillation",
      targetYield: "85%",
      steps: 6,
    },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { status: "success" as const, label: "Completed", icon: <CheckCircle2 className="w-3 h-3" /> };
      case "in_progress":
        return { status: "info" as const, label: "In Progress", icon: <Timer className="w-3 h-3" /> };
      case "qa_testing":
        return { status: "warning" as const, label: "QA Testing", icon: <Beaker className="w-3 h-3" /> };
      default:
        return { status: "pending" as const, label: status, icon: null };
    }
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case "Concentrate":
        return <Droplets className="w-4 h-4" />;
      case "Edible":
        return <Cookie className="w-4 h-4" />;
      case "Tincture":
        return <FlaskConical className="w-4 h-4" />;
      case "Vape":
        return <Pill className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getProductColor = (type: string) => {
    switch (type) {
      case "Concentrate":
        return "bg-amber-500/10 text-amber-600";
      case "Edible":
        return "bg-pink-500/10 text-pink-600";
      case "Tincture":
        return "bg-green-500/10 text-green-600";
      case "Vape":
        return "bg-blue-500/10 text-blue-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const handleCreateBatch = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }, 1000);
  };

  // Stats
  const totalOutput = manufacturingBatches
    .filter((b) => b.outputWeight)
    .reduce((sum, b) => sum + (b.outputWeight || 0), 0);
  const avgYield =
    manufacturingBatches.filter((b) => b.yieldPercent).reduce((sum, b) => sum + (b.yieldPercent || 0), 0) /
    manufacturingBatches.filter((b) => b.yieldPercent).length;
  const pendingQA = manufacturingBatches.filter((b) => b.status === "qa_testing").length;

  // DataTable columns
  const columns: Column<ManufacturingBatch>[] = [
    {
      key: "id",
      header: "Batch ID",
      cell: (batch) => (
        <span className="font-mono font-semibold">{batch.id}</span>
      ),
      sortable: true,
    },
    {
      key: "productName",
      header: "Product",
      cell: (batch) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${getProductColor(batch.productType)} flex items-center justify-center`}>
            {getProductIcon(batch.productType)}
          </div>
          <div>
            <p className="font-medium">{batch.productName}</p>
            <p className="text-xs text-muted-foreground">{batch.extractionMethod}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "productType",
      header: "Type",
      cell: (batch) => (
        <Badge className={`${getProductColor(batch.productType)} border-0`}>
          {batch.productType}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "inputMaterial",
      header: "Input",
      cell: (batch) => (
        <div className="text-sm">
          <span className="font-mono">{batch.inputMaterial}</span>
          <p className="text-muted-foreground">{batch.inputWeight} lbs</p>
        </div>
      ),
    },
    {
      key: "outputWeight",
      header: "Output",
      cell: (batch) =>
        batch.outputWeight ? (
          <span className="font-semibold">{batch.outputWeight} lbs</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      sortable: true,
    },
    {
      key: "yieldPercent",
      header: "Yield",
      cell: (batch) =>
        batch.yieldPercent ? (
          <div className="flex items-center gap-2">
            <Progress value={batch.yieldPercent} className="w-16 h-2" />
            <span className="text-sm font-medium">{batch.yieldPercent}%</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      sortable: true,
    },
    {
      key: "thcPercent",
      header: "THC %",
      cell: (batch) =>
        batch.thcPercent ? (
          <span className="font-semibold">{batch.thcPercent}%</span>
        ) : (
          <span className="text-muted-foreground">Pending</span>
        ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      cell: (batch) => {
        const config = getStatusConfig(batch.status);
        return <StatusBadge status={config.status} label={config.label} />;
      },
      sortable: true,
    },
    {
      key: "operator",
      header: "Operator",
      cell: (batch) => (
        <span className="text-sm text-muted-foreground">{batch.operator}</span>
      ),
    },
  ];

  const rowActions: RowAction<ManufacturingBatch>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (batch) => console.log("View", batch.id),
    },
    {
      label: "Edit",
      icon: <Edit className="w-4 h-4" />,
      onClick: (batch) => console.log("Edit", batch.id),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Manufacturing"
        description="Extraction, processing, and product manufacturing management"
        breadcrumbs={[{ label: "Production", href: "/harvest" }, { label: "Manufacturing" }]}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Production Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Production Batch</DialogTitle>
                <DialogDescription>Start a new manufacturing or extraction batch</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concentrate">Concentrate</SelectItem>
                        <SelectItem value="edible">Edible</SelectItem>
                        <SelectItem value="tincture">Tincture</SelectItem>
                        <SelectItem value="vape">Vape Cartridge</SelectItem>
                        <SelectItem value="topical">Topical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Recipe</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipe" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipes.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input placeholder="e.g., Blue Dream Live Resin" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Input Material (Lot #)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inventory lot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INV-2024-001">INV-2024-001 - GDP Flower (38.2 lbs)</SelectItem>
                        <SelectItem value="INV-2024-002">INV-2024-002 - Blue Dream (12.5 lbs)</SelectItem>
                        <SelectItem value="INV-2024-003">INV-2024-003 - OG Kush Trim (15.0 lbs)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Input Weight (lbs)</Label>
                    <Input type="number" step="0.01" placeholder="0.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Extraction Method</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bho">Hydrocarbon (BHO)</SelectItem>
                        <SelectItem value="co2">CO2 Extraction</SelectItem>
                        <SelectItem value="ethanol">Ethanol Extraction</SelectItem>
                        <SelectItem value="rosin">Rosin Press</SelectItem>
                        <SelectItem value="distillation">Distillation</SelectItem>
                        <SelectItem value="infusion">Infusion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="john">John Smith</SelectItem>
                        <SelectItem value="jane">Jane Doe</SelectItem>
                        <SelectItem value="mike">Mike Johnson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Production notes..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBatch} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Batch"
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
          title="Active Batches"
          value={manufacturingBatches.length}
          icon={<Factory className="w-5 h-5" />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total Output (MTD)"
          value={`${totalOutput.toFixed(2)} lbs`}
          icon={<Droplets className="w-5 h-5" />}
          iconColor="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title="Avg Yield"
          value={`${avgYield.toFixed(1)}%`}
          icon={<Scale className="w-5 h-5" />}
          iconColor="bg-success/10 text-success"
          trend="up"
          change="Above target"
        />
        <StatCard
          title="Pending QA"
          value={pendingQA}
          icon={<Beaker className="w-5 h-5" />}
          iconColor="bg-warning/10 text-warning"
        />
      </div>

      {/* Production Batches Table */}
      <DataTable
        data={manufacturingBatches}
        columns={columns}
        rowActions={rowActions}
        searchable
        searchPlaceholder="Search batches..."
        searchKeys={["id", "productName"]}
        pagination
        pageSize={10}
        getRowId={(row) => row.id}
      />

      {/* Recipes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Production Recipes</CardTitle>
              <CardDescription>Standard operating procedures for manufacturing</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Recipe
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="p-4 border rounded-xl hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FlaskConical className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{recipe.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {recipe.type}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method:</span>
                    <span className="font-medium">{recipe.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Yield:</span>
                    <span className="font-semibold text-success">{recipe.targetYield}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Steps:</span>
                    <span>{recipe.steps} steps</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Manufacturing;
