import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dna,
  Plus,
  Leaf,
  Clock,
  Percent,
  Eye,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Loader2,
  Beaker,
  TrendingUp,
} from "lucide-react";
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState } from "@/components/common";
import type { Column, RowAction } from "@/components/common";
import { useGenetics, useCreateGenetic, useUpdateGenetic, useDeleteGenetic } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

interface Genetic extends Record<string, unknown> {
  id: string;
  name: string;
  strainType: string;
  thcPotential: number;
  cbdPotential: number;
  floweringDays: number;
  avgYield: number;
  source: string;
  lineage: string;
  isActive: boolean;
  terpeneProfile?: string[];
  difficulty?: string;
}

const Genetics = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingGenetic, setEditingGenetic] = useState<any>(null);
  const [viewingGenetic, setViewingGenetic] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    strainName: "",
    strainType: "",
    source: "",
    thcPotential: "",
    cbdPotential: "",
    floweringDays: "",
    avgYield: "",
    lineage: "",
    notes: "",
  });

  // Fetch genetics from API
  const { data: apiGenetics, isLoading, isError } = useGenetics();
  const createGenetic = useCreateGenetic();
  const updateGenetic = useUpdateGenetic();
  const deleteGenetic = useDeleteGenetic();

  // Transform API data
  const genetics: Genetic[] = (apiGenetics || []).map((g: any) => ({
    id: g.id,
    name: g.strainName || g.name || "Unknown",
    strainType: g.strainType || "hybrid",
    thcPotential: parseFloat(g.thcPotential) || 0,
    cbdPotential: parseFloat(g.cbdPotential) || 0,
    floweringDays: parseInt(g.floweringDays) || 60,
    avgYield: parseFloat(g.avgYield) || 0,
    source: g.source || "internal",
    lineage: g.lineage || "",
    isActive: g.isActive !== false,
    terpeneProfile: g.terpeneProfile ? g.terpeneProfile.split(",").map((t: string) => t.trim()) : [],
    difficulty: g.difficulty || "moderate",
  }));

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "indica":
        return { color: "bg-purple-500/10 text-purple-600", icon: "🌙" };
      case "sativa":
        return { color: "bg-green-500/10 text-green-600", icon: "☀️" };
      case "hybrid":
        return { color: "bg-blue-500/10 text-blue-600", icon: "🔄" };
      default:
        return { color: "bg-gray-500/10 text-gray-600", icon: "🌿" };
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "seed_company":
        return "Seed Co.";
      case "clone_vendor":
        return "Clone Vendor";
      case "internal":
        return "Internal";
      default:
        return source;
    }
  };

  const getDifficultyConfig = (difficulty?: string) => {
    switch (difficulty) {
      case "easy":
        return { color: "bg-success/10 text-success", label: "Easy" };
      case "moderate":
        return { color: "bg-warning/10 text-warning", label: "Moderate" };
      case "hard":
        return { color: "bg-destructive/10 text-destructive", label: "Hard" };
      default:
        return { color: "bg-muted text-muted-foreground", label: "Unknown" };
    }
  };

  const handleOpenEdit = (genetic: any) => {
    setEditingGenetic(genetic);
    // Map all fields from API response - handle both camelCase and snake_case
    // Determine strain type from percentages
    let strainType = "hybrid";
    if (genetic.percentages) {
      if (genetic.percentages.indica === 100) strainType = "indica";
      else if (genetic.percentages.sativa === 100) strainType = "sativa";
      else strainType = "hybrid";
    }
    
    // Map breeder to source
    let source = "internal";
    if (genetic.breeder) {
      if (genetic.breeder.toLowerCase().includes("seed")) source = "seed_company";
      else if (genetic.breeder.toLowerCase().includes("clone")) source = "clone_vendor";
      else source = "internal";
    }
    
    setFormData({
      strainName: genetic.strainName || genetic.strain_name || genetic.name || "",
      strainType: strainType,
      source: source,
      thcPotential: (genetic.thcPotential ?? genetic.cannabinoids?.thc ?? genetic.thc_content)?.toString() || "",
      cbdPotential: (genetic.cbdPotential ?? genetic.cannabinoids?.cbd ?? genetic.cbd_content)?.toString() || "",
      floweringDays: (genetic.floweringDays ?? genetic.timing?.flowering ?? genetic.flowering_time)?.toString() || "",
      avgYield: genetic.avgYield ? genetic.avgYield.toString() : (genetic.yield?.indoor ? (genetic.yield.indoor / 28.35).toFixed(1) : genetic.yield_indoor ? (genetic.yield_indoor / 28.35).toFixed(1) : "") || "",
      lineage: genetic.lineage || genetic.geneticLineage || genetic.genetic_lineage || "",
      notes: genetic.notes || genetic.growthNotes || genetic.growth_notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (genetic: any) => {
    setViewingGenetic(genetic);
    setIsViewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingGenetic(null);
    setFormData({
      strainName: "",
      strainType: "",
      source: "",
      thcPotential: "",
      cbdPotential: "",
      floweringDays: "",
      avgYield: "",
      lineage: "",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.strainName) {
      toast({
        title: "Error",
        description: "Strain name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Map frontend form data to backend structure
      const geneticData: any = {
        strainName: formData.strainName,
        breeder: formData.source === "seed_company" ? "Seed Company" : formData.source === "clone_vendor" ? "Clone Vendor" : formData.source || undefined,
        geneticLineage: formData.lineage || undefined,
        cannabinoids: {
          thc: formData.thcPotential ? parseFloat(formData.thcPotential) : undefined,
          cbd: formData.cbdPotential ? parseFloat(formData.cbdPotential) : undefined,
        },
        timing: {
          flowering: formData.floweringDays ? parseInt(formData.floweringDays) : undefined,
          harvest: formData.floweringDays ? parseInt(formData.floweringDays) + 7 : undefined, // Estimate harvest as flowering + 7 days
        },
        difficulty: undefined, // Keep existing if not provided
        yield: {
          indoor: formData.avgYield ? parseFloat(formData.avgYield) * 28.35 : undefined, // Convert oz to grams (1 oz = 28.35g)
          outdoor: undefined,
        },
        growthNotes: formData.notes || undefined,
      };

      // Map strainType to percentages if provided
      if (formData.strainType) {
        if (formData.strainType === "indica") {
          geneticData.percentages = { indica: 100, sativa: 0, ruderalis: 0 };
        } else if (formData.strainType === "sativa") {
          geneticData.percentages = { indica: 0, sativa: 100, ruderalis: 0 };
        } else if (formData.strainType === "hybrid") {
          geneticData.percentages = { indica: 50, sativa: 50, ruderalis: 0 };
        }
      }

      if (editingGenetic) {
        await updateGenetic.mutateAsync({ id: editingGenetic.id, updates: geneticData });
        toast({
          title: "Success",
          description: "Strain updated successfully",
        });
      } else {
        await createGenetic.mutateAsync(geneticData);
        toast({
          title: "Success",
          description: "Strain added successfully",
        });
      }

      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingGenetic ? 'update' : 'add'} strain`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    // Check if genetic is used in mother plants
    const genetic = apiGenetics?.find((g: any) => g.id === id);
    if (genetic) {
      // We'll let the backend handle validation, but show a confirmation dialog
      if (!confirm("Are you sure you want to delete this genetic? This action cannot be undone. If this genetic is used in mother plants, deletion will be prevented.")) {
        return;
      }
    }

    try {
      await deleteGenetic.mutateAsync(id);
      toast({
        title: "Success",
        description: "Strain deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete strain. This genetic may be in use by mother plants.",
        variant: "destructive",
      });
    }
  };

  // Stats
  const maxThc = genetics.length > 0 
    ? Math.max(...genetics.map((g) => g.thcPotential))
    : 0;
  const avgFlowerDays = genetics.length > 0
    ? Math.round(
    genetics.reduce((sum, g) => sum + g.floweringDays, 0) / genetics.length
      )
    : 0;
  const avgYield = genetics.length > 0
    ? (
    genetics.reduce((sum, g) => sum + g.avgYield, 0) / genetics.length
      ).toFixed(1)
    : "0.0";

  // DataTable columns
  const columns: Column<Genetic>[] = [
    {
      key: "name",
      header: "Strain Name",
      cell: (strain) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${getTypeConfig(strain.strainType).color} flex items-center justify-center`}>
            <span className="text-sm">{getTypeConfig(strain.strainType).icon}</span>
          </div>
          <div>
            <p className="font-medium">{strain.name}</p>
            <p className="text-xs text-muted-foreground">{strain.lineage}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "strainType",
      header: "Type",
      cell: (strain) => (
        <Badge className={`${getTypeConfig(strain.strainType).color} border-0 capitalize`}>
          {strain.strainType}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "thcPotential",
      header: "THC %",
      cell: (strain) => (
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(strain.thcPotential / 30) * 100}%` }}
            />
          </div>
          <span className="font-medium text-sm">{strain.thcPotential}%</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "cbdPotential",
      header: "CBD %",
      cell: (strain) => <span className="text-muted-foreground">{strain.cbdPotential}%</span>,
      sortable: true,
    },
    {
      key: "floweringDays",
      header: "Flower Days",
      cell: (strain) => (
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{strain.floweringDays} days</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "avgYield",
      header: "Avg. Yield",
      cell: (strain) => <span className="font-medium">{strain.avgYield} oz</span>,
      sortable: true,
    },
    {
      key: "source",
      header: "Source",
      cell: (strain) => (
        <Badge variant="outline">{getSourceLabel(strain.source)}</Badge>
      ),
    },
    {
      key: "difficulty",
      header: "Difficulty",
      cell: (strain) => {
        const config = getDifficultyConfig(strain.difficulty);
        return <Badge className={`${config.color} border-0`}>{config.label}</Badge>;
      },
    },
  ];

  const rowActions: RowAction<Genetic>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (strain) => {
        const apiGenetic = apiGenetics?.find((g: any) => g.id === strain.id);
        if (apiGenetic) handleViewDetails(apiGenetic);
      },
    },
    {
      label: "Edit",
      icon: <Edit className="w-4 h-4" />,
      onClick: (strain) => {
        const apiGenetic = apiGenetics?.find((g: any) => g.id === strain.id);
        if (apiGenetic) handleOpenEdit(apiGenetic);
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (strain) => handleDelete(strain.id),
      variant: "destructive",
    },
  ];

  // Strain Card Component
  const StrainCard = ({ strain }: { strain: Genetic }) => {
    const typeConfig = getTypeConfig(strain.strainType);
    const difficultyConfig = getDifficultyConfig(strain.difficulty);

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30 overflow-hidden">
        <div className={`h-1 ${strain.strainType === "indica" ? "bg-purple-500" : strain.strainType === "sativa" ? "bg-green-500" : "bg-blue-500"}`} />
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${typeConfig.color} flex items-center justify-center`}>
                <span className="text-xl">{typeConfig.icon}</span>
              </div>
              <div>
                <CardTitle className="text-lg">{strain.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{strain.lineage}</p>
              </div>
            </div>
            <Badge className={`${typeConfig.color} border-0 capitalize`}>
              {strain.strainType}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* THC/CBD Bars */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">THC</span>
              <span className="font-semibold">{strain.thcPotential}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                style={{ width: `${(strain.thcPotential / 30) * 100}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-secondary/50">
              <p className="text-lg font-bold">{strain.floweringDays}</p>
              <p className="text-xs text-muted-foreground">Flower Days</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary/50">
              <p className="text-lg font-bold">{strain.avgYield}</p>
              <p className="text-xs text-muted-foreground">Avg Yield (oz)</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary/50">
              <p className="text-lg font-bold">{strain.cbdPotential}%</p>
              <p className="text-xs text-muted-foreground">CBD</p>
            </div>
          </div>

          {/* Terpene Profile */}
          {strain.terpeneProfile && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Terpene Profile</p>
              <div className="flex flex-wrap gap-1">
                {strain.terpeneProfile.map((terpene) => (
                  <Badge key={terpene} variant="outline" className="text-xs">
                    {terpene}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getSourceLabel(strain.source)}
              </Badge>
              <Badge className={`${difficultyConfig.color} border-0 text-xs`}>
                {difficultyConfig.label}
              </Badge>
            </div>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Genetics"
        description="Manage strains and genetic library for cultivation"
        breadcrumbs={[{ label: "Cultivation", href: "/plants" }, { label: "Genetics" }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode("table")}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          } else {
            setIsDialogOpen(true);
          }
        }}>
          <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Strain
            </Button>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingGenetic ? "Edit Strain" : "Add New Strain"}</DialogTitle>
              <DialogDescription>
                {editingGenetic ? "Update strain information" : "Register a new genetic in your library"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                    <Label htmlFor="strain-name">Strain Name *</Label>
                    <Input 
                      id="strain-name" 
                      placeholder="e.g., Purple Punch" 
                      value={formData.strainName}
                      onChange={(e) => setFormData({ ...formData, strainName: e.target.value })}
                    />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strain-type">Strain Type</Label>
                      <Select 
                        value={formData.strainType} 
                        onValueChange={(value) => setFormData({ ...formData, strainType: value })}
                      >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indica">Indica</SelectItem>
                      <SelectItem value="sativa">Sativa</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                      <Select 
                        value={formData.source} 
                        onValueChange={(value) => setFormData({ ...formData, source: value })}
                      >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seed_company">Seed Company</SelectItem>
                      <SelectItem value="clone_vendor">Clone Vendor</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="thc">THC Potential (%)</Label>
                      <Input 
                        id="thc" 
                        type="number" 
                        step="0.1" 
                        placeholder="22.5" 
                        value={formData.thcPotential}
                        onChange={(e) => setFormData({ ...formData, thcPotential: e.target.value })}
                      />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cbd">CBD Potential (%)</Label>
                      <Input 
                        id="cbd" 
                        type="number" 
                        step="0.1" 
                        placeholder="0.2" 
                        value={formData.cbdPotential}
                        onChange={(e) => setFormData({ ...formData, cbdPotential: e.target.value })}
                      />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flowering">Flowering Time (days)</Label>
                      <Input 
                        id="flowering" 
                        type="number" 
                        placeholder="60" 
                        value={formData.floweringDays}
                        onChange={(e) => setFormData({ ...formData, floweringDays: e.target.value })}
                      />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yield">Avg. Yield (oz/plant)</Label>
                      <Input 
                        id="yield" 
                        type="number" 
                        step="0.1" 
                        placeholder="4.0" 
                        value={formData.avgYield}
                        onChange={(e) => setFormData({ ...formData, avgYield: e.target.value })}
                      />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineage">Lineage</Label>
                    <Input 
                      id="lineage" 
                      placeholder="Parent 1 x Parent 2" 
                      value={formData.lineage}
                      onChange={(e) => setFormData({ ...formData, lineage: e.target.value })}
                    />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Growing notes, characteristics..." 
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
              </div>
                  <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingGenetic ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      editingGenetic ? "Update Strain" : "Add Strain"
                    )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Dna className="w-5 h-5" />
                {viewingGenetic?.strainName || viewingGenetic?.strain_name || viewingGenetic?.name || "Genetic Details"}
              </DialogTitle>
              <DialogDescription>
                Complete information about this genetic strain
              </DialogDescription>
            </DialogHeader>
            {viewingGenetic && (
              <div className="space-y-6 py-4">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Strain Name</Label>
                    <p className="font-medium">{viewingGenetic.strainName || viewingGenetic.strain_name || viewingGenetic.name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Strain Type</Label>
                    <Badge className={`${getTypeConfig(viewingGenetic.strainType || "hybrid").color} border-0 capitalize`}>
                      {viewingGenetic.strainType || "Hybrid"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Source</Label>
                    <p className="font-medium">{getSourceLabel(viewingGenetic.source || "internal")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Difficulty</Label>
                    <Badge className={`${getDifficultyConfig(viewingGenetic.difficulty || viewingGenetic.difficulty_level).color} border-0`}>
                      {getDifficultyConfig(viewingGenetic.difficulty || viewingGenetic.difficulty_level).label}
                    </Badge>
                  </div>
                </div>

                {/* Cannabinoids */}
                <div>
                  <Label className="text-muted-foreground mb-2 block">Cannabinoids</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">THC</span>
                        <span className="font-medium">
                          {viewingGenetic.thcPotential ?? viewingGenetic.cannabinoids?.thc ?? viewingGenetic.thc_content ?? 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${((viewingGenetic.thcPotential ?? viewingGenetic.cannabinoids?.thc ?? viewingGenetic.thc_content ?? 0) / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">CBD</span>
                        <span className="font-medium">
                          {viewingGenetic.cbdPotential ?? viewingGenetic.cannabinoids?.cbd ?? viewingGenetic.cbd_content ?? 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full"
                          style={{ width: `${((viewingGenetic.cbdPotential ?? viewingGenetic.cannabinoids?.cbd ?? viewingGenetic.cbd_content ?? 0) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Growth Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Flowering Time</Label>
                    <p className="font-medium">
                      {viewingGenetic.floweringDays ?? viewingGenetic.timing?.flowering ?? viewingGenetic.flowering_time ?? "N/A"} days
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Average Yield</Label>
                    <p className="font-medium">
                      {viewingGenetic.avgYield ?? viewingGenetic.yield?.indoor ?? viewingGenetic.yield_indoor ?? "N/A"} oz
                    </p>
                  </div>
                </div>

                {/* Lineage */}
                {viewingGenetic.lineage || viewingGenetic.geneticLineage || viewingGenetic.genetic_lineage ? (
                  <div>
                    <Label className="text-muted-foreground">Lineage</Label>
                    <p className="font-medium">
                      {viewingGenetic.lineage || viewingGenetic.geneticLineage || viewingGenetic.genetic_lineage}
                    </p>
                  </div>
                ) : null}

                {/* Terpene Profile */}
                {viewingGenetic.terpeneProfile && viewingGenetic.terpeneProfile.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Terpene Profile</Label>
                    <div className="flex flex-wrap gap-2">
                      {viewingGenetic.terpeneProfile.map((terpene: string) => (
                        <Badge key={terpene} variant="outline">{terpene}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {viewingGenetic.notes || viewingGenetic.growthNotes || viewingGenetic.growth_notes ? (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {viewingGenetic.notes || viewingGenetic.growthNotes || viewingGenetic.growth_notes}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Strains"
          value={genetics.length}
          icon={<Dna className="w-5 h-5" />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Hybrids"
          value={genetics.filter((g) => g.strainType === "hybrid").length}
          icon={<Leaf className="w-5 h-5" />}
          iconColor="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title="Max THC"
          value={`${maxThc}%`}
          icon={<Percent className="w-5 h-5" />}
          iconColor="bg-success/10 text-success"
          trend="up"
          change="Top performer"
        />
        <StatCard
          title="Avg. Flower Days"
          value={avgFlowerDays}
          icon={<Clock className="w-5 h-5" />}
          iconColor="bg-amber-500/10 text-amber-600"
        />
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <DataTable
          data={genetics as Record<string, unknown>[]}
          columns={columns as Column<Record<string, unknown>>[]}
          rowActions={rowActions as RowAction<Record<string, unknown>>[]}
          searchable
          searchPlaceholder="Search strains..."
          searchKeys={["name", "lineage", "strainType"]}
          pagination
          pageSize={10}
          loading={isLoading}
          getRowId={(row) => String(row.id)}
          emptyState={
            <EmptyState
              icon={Dna}
              title="No strains found"
              description="Add your first genetic strain to get started"
              action={{
                label: "Add Strain",
                onClick: () => setIsDialogOpen(true),
                icon: Plus,
              }}
            />
          }
        />
      ) : (
        genetics.length === 0 ? (
          <EmptyState
            icon={Dna}
            title="No strains found"
            description="Add your first genetic strain to get started"
            action={{
              label: "Add Strain",
              onClick: () => setIsDialogOpen(true),
              icon: Plus,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {genetics.map((strain) => (
              <StrainCard key={strain.id} strain={strain} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Genetics;
