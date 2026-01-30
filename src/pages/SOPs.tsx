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
  FileText,
  Plus,
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Download,
  Users,
  Calendar,
  Loader2,
  FolderOpen,
  Star,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/common";

interface SOP {
  id: string;
  title: string;
  category: string;
  version: string;
  status: string;
  lastUpdated: string;
  author: string;
  reviewDate: string;
  description: string;
  steps: number;
  completionRate: number;
  isFavorite: boolean;
}

interface TrainingRecord {
  id: string;
  sopId: string;
  sopTitle: string;
  employee: string;
  completedDate: string | null;
  status: string;
  score: number | null;
}

const SOPs = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock SOPs
  const sops: SOP[] = [
    {
      id: "SOP-001",
      title: "Plant Propagation from Clone",
      category: "Cultivation",
      version: "2.1",
      status: "active",
      lastUpdated: "2024-12-01",
      author: "John Smith",
      reviewDate: "2025-06-01",
      description: "Standard procedure for propagating plants from clone cuttings",
      steps: 12,
      completionRate: 95,
      isFavorite: true,
    },
    {
      id: "SOP-002",
      title: "Nutrient Solution Preparation",
      category: "Cultivation",
      version: "1.5",
      status: "active",
      lastUpdated: "2024-11-15",
      author: "Jane Doe",
      reviewDate: "2025-05-15",
      description: "Mixing and preparation of nutrient solutions for different growth stages",
      steps: 8,
      completionRate: 88,
      isFavorite: true,
    },
    {
      id: "SOP-003",
      title: "Harvest Processing",
      category: "Harvest",
      version: "3.0",
      status: "active",
      lastUpdated: "2024-12-10",
      author: "Mike Johnson",
      reviewDate: "2025-06-10",
      description: "Complete harvest workflow from cutting to drying",
      steps: 15,
      completionRate: 100,
      isFavorite: false,
    },
    {
      id: "SOP-004",
      title: "Waste Disposal Protocol",
      category: "Compliance",
      version: "2.0",
      status: "active",
      lastUpdated: "2024-12-05",
      author: "Sarah Williams",
      reviewDate: "2025-06-05",
      description: "Compliant waste disposal with dual-witness verification",
      steps: 10,
      completionRate: 100,
      isFavorite: false,
    },
    {
      id: "SOP-005",
      title: "IPM Treatment Application",
      category: "IPM",
      version: "1.8",
      status: "under_review",
      lastUpdated: "2024-12-15",
      author: "John Smith",
      reviewDate: "2024-12-20",
      description: "Application procedures for pest management treatments",
      steps: 9,
      completionRate: 75,
      isFavorite: false,
    },
    {
      id: "SOP-006",
      title: "Quality Control Inspection",
      category: "Quality",
      version: "1.2",
      status: "draft",
      lastUpdated: "2024-12-17",
      author: "Jane Doe",
      reviewDate: null,
      description: "Pre-packaging quality inspection checklist",
      steps: 14,
      completionRate: 0,
      isFavorite: false,
    },
  ];

  // Mock training records
  const trainingRecords: TrainingRecord[] = [
    {
      id: "TR-001",
      sopId: "SOP-001",
      sopTitle: "Plant Propagation from Clone",
      employee: "John Smith",
      completedDate: "2024-12-10",
      status: "completed",
      score: 95,
    },
    {
      id: "TR-002",
      sopId: "SOP-002",
      sopTitle: "Nutrient Solution Preparation",
      employee: "Jane Doe",
      completedDate: "2024-12-08",
      status: "completed",
      score: 88,
    },
    {
      id: "TR-003",
      sopId: "SOP-003",
      sopTitle: "Harvest Processing",
      employee: "Mike Johnson",
      completedDate: null,
      status: "in_progress",
      score: null,
    },
    {
      id: "TR-004",
      sopId: "SOP-004",
      sopTitle: "Waste Disposal Protocol",
      employee: "Sarah Williams",
      completedDate: null,
      status: "pending",
      score: null,
    },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { color: "bg-success/10 text-success", label: "Active", icon: <CheckCircle2 className="w-3 h-3" /> };
      case "under_review":
        return { color: "bg-warning/10 text-warning", label: "Under Review", icon: <Clock className="w-3 h-3" /> };
      case "draft":
        return { color: "bg-blue-500/10 text-blue-600", label: "Draft", icon: <Edit className="w-3 h-3" /> };
      case "archived":
        return { color: "bg-gray-500/10 text-gray-600", label: "Archived", icon: <FolderOpen className="w-3 h-3" /> };
      default:
        return { color: "bg-gray-500/10 text-gray-600", label: status, icon: null };
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Cultivation":
        return "bg-success/10 text-success";
      case "Harvest":
        return "bg-orange-500/10 text-orange-600";
      case "Compliance":
        return "bg-purple-500/10 text-purple-600";
      case "IPM":
        return "bg-blue-500/10 text-blue-600";
      case "Quality":
        return "bg-pink-500/10 text-pink-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const handleCreateSOP = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }, 1000);
  };

  const categories = [...new Set(sops.map((sop) => sop.category))];
  const filteredSOPs = sops.filter((sop) => {
    const matchesSearch =
      sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || sop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeSOPs = sops.filter((s) => s.status === "active").length;
  const underReview = sops.filter((s) => s.status === "under_review").length;
  const avgCompletion = Math.round(sops.reduce((sum, s) => sum + s.completionRate, 0) / sops.length);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Standard Operating Procedures"
        description="Manage SOPs, training materials, and compliance documentation"
        breadcrumbs={[{ label: "Operations", href: "/tasks" }, { label: "SOPs" }]}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create SOP
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New SOP</DialogTitle>
                <DialogDescription>Create a new standard operating procedure</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="SOP title..." />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cultivation">Cultivation</SelectItem>
                      <SelectItem value="harvest">Harvest</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="ipm">IPM</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Brief description of the SOP..." />
                </div>
                <div className="space-y-2">
                  <Label>Review Date</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSOP} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create SOP"
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
          title="Total SOPs"
          value={sops.length}
          icon={<FileText className="w-5 h-5" />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Active"
          value={activeSOPs}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Under Review"
          value={underReview}
          icon={<Clock className="w-5 h-5" />}
          iconColor="bg-warning/10 text-warning"
        />
        <StatCard
          title="Avg Training Completion"
          value={`${avgCompletion}%`}
          icon={<Users className="w-5 h-5" />}
          iconColor="bg-blue-500/10 text-blue-600"
        />
      </div>

      <Tabs defaultValue="sops" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sops">SOPs</TabsTrigger>
          <TabsTrigger value="training">Training Records</TabsTrigger>
        </TabsList>

        <TabsContent value="sops" className="space-y-6 mt-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search SOPs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* SOP Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSOPs.map((sop) => {
              const statusConfig = getStatusConfig(sop.status);
              return (
                <Card key={sop.id} className="hover:shadow-lg transition-all group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex items-center gap-2">
                        {sop.isFavorite && <Star className="w-4 h-4 text-warning fill-warning" />}
                        <Badge className={`${statusConfig.color} border-0`}>
                          {statusConfig.icon}
                          <span className="ml-1">{statusConfig.label}</span>
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-3">{sop.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{sop.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Category</span>
                        <Badge className={`${getCategoryColor(sop.category)} border-0`}>
                          {sop.category}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Version</span>
                        <span className="font-medium">v{sop.version}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Steps</span>
                        <span className="font-medium">{sop.steps} steps</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Training Completion</span>
                          <span className="font-medium">{sop.completionRate}%</span>
                        </div>
                        <Progress value={sop.completionRate} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">Last Updated</span>
                        <span>{new Date(sop.lastUpdated).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Training Records</CardTitle>
              <CardDescription>Employee SOP training status and completion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 border rounded-xl hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{record.employee}</h4>
                          <p className="text-sm text-muted-foreground">{record.sopTitle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {record.status === "completed" ? (
                          <>
                            <Badge className="bg-success/10 text-success border-0">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              Score: {record.score}%
                            </p>
                          </>
                        ) : record.status === "in_progress" ? (
                          <Badge className="bg-blue-500/10 text-blue-600 border-0">
                            <Clock className="w-3 h-3 mr-1" />
                            In Progress
                          </Badge>
                        ) : (
                          <Badge className="bg-warning/10 text-warning border-0">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {record.completedDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(record.completedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SOPs;
