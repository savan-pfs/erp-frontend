import { useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlantLabel, PlantLabelCompact, PlantLabelSheet } from "./PlantLabel";
import {
  Printer,
  QrCode,
  CheckCircle2,
  X,
  Search,
  Filter,
  Eye,
  Download,
  Settings2,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  Tag,
  Leaf,
  Home,
  Calendar,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Plant {
  id: string;
  tag: string;
  batch: string;
  strain: string;
  room: string;
  stage: string;
  plantedDate?: string;
}

interface PlantLabelDialogProps {
  plants: Plant[];
  trigger?: React.ReactNode;
}

const stageColors: Record<string, string> = {
  clone: "bg-blue-100 text-blue-700 border-blue-200",
  seedling: "bg-cyan-100 text-cyan-700 border-cyan-200",
  vegetative: "bg-green-100 text-green-700 border-green-200",
  flowering: "bg-purple-100 text-purple-700 border-purple-200",
  harvest: "bg-amber-100 text-amber-700 border-amber-200",
  drying: "bg-stone-100 text-stone-700 border-stone-200",
  curing: "bg-orange-100 text-orange-700 border-orange-200",
};

export const PlantLabelDialog = ({ plants, trigger }: PlantLabelDialogProps) => {
  const [selectedPlants, setSelectedPlants] = useState<Set<string>>(
    new Set(plants.map((p) => p.id))
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [labelSize, setLabelSize] = useState<"standard" | "compact">("standard");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const printRef = useRef<HTMLDivElement>(null);

  // Get unique stages and rooms for filters
  const stages = useMemo(() => [...new Set(plants.map((p) => p.stage))], [plants]);
  const rooms = useMemo(() => [...new Set(plants.map((p) => p.room))], [plants]);

  // Filter plants
  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      const matchesSearch =
        searchQuery === "" ||
        plant.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.strain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.batch.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStage = stageFilter === "all" || plant.stage === stageFilter;
      const matchesRoom = roomFilter === "all" || plant.room === roomFilter;
      return matchesSearch && matchesStage && matchesRoom;
    });
  }, [plants, searchQuery, stageFilter, roomFilter]);

  const selectedPlantData = useMemo(
    () =>
      plants
        .filter((p) => selectedPlants.has(p.id))
        .map((p) => ({
          plantTag: p.tag,
          batch: p.batch,
          strain: p.strain,
          room: p.room,
          stage: p.stage,
          plantedDate: p.plantedDate,
        })),
    [plants, selectedPlants]
  );

  const handlePrint = () => {
    if (selectedPlantData.length === 0) {
      return;
    }

    setIsPrinting(true);

    setTimeout(() => {
      const printContent = printRef.current;
      if (!printContent) {
        setIsPrinting(false);
        return;
      }

      const printWindow = window.open("", "_blank", "width=900,height=700");
      if (!printWindow) {
        alert("Please allow popups to print labels");
        setIsPrinting(false);
        return;
      }

      const labelWidth = labelSize === "compact" ? "2in" : "4in";
      const labelHeight = labelSize === "compact" ? "1in" : "2.5in";
      const gridCols = labelSize === "compact" ? "repeat(4, 2in)" : "repeat(2, 4in)";

      const printStyles = `
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: letter; margin: 0.5in; }
          body { 
            margin: 0; 
            padding: 0.5in; 
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif; 
            background: white; 
          }
          .label-sheet { 
            display: grid; 
            grid-template-columns: ${gridCols}; 
            gap: 0.25in; 
            justify-content: center;
          }
          .plant-label { 
            width: ${labelWidth}; 
            height: ${labelHeight}; 
            page-break-inside: avoid; 
            break-inside: avoid; 
          }
          .plant-label img { display: block; }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            padding: 15px;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 12px;
            border: 1px solid #bbf7d0;
          }
          .print-header h1 {
            font-size: 18px;
            font-weight: 700;
            color: #166534;
            margin-bottom: 4px;
          }
          .print-header p {
            font-size: 13px;
            color: #15803d;
          }
          .no-print-controls {
            margin-top: 30px;
            text-align: center;
            padding: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .no-print-controls button {
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            border-radius: 8px;
            margin: 0 8px;
            transition: all 0.2s;
          }
          .btn-print {
            background: linear-gradient(135deg, #1a9e7a 0%, #16a34a 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(26, 158, 122, 0.3);
          }
          .btn-print:hover { transform: translateY(-2px); }
          .btn-close {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
          }
          @media print {
            body { padding: 0; }
            .no-print-controls, .print-header { display: none !important; }
          }
        </style>
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Plant Labels - ${new Date().toISOString().split("T")[0]}</title>
            ${printStyles}
          </head>
          <body>
            <div class="print-header">
              <h1>🌿 Plant Labels Ready</h1>
              <p>${selectedPlantData.length} label${selectedPlantData.length !== 1 ? "s" : ""} • ${labelSize === "compact" ? "Compact" : "Standard"} size • Letter paper</p>
            </div>
            ${printContent.innerHTML}
            <div class="no-print-controls">
              <button class="btn-print" onclick="window.print()">🖨️ Print Labels</button>
              <button class="btn-close" onclick="window.close()">✕ Close</button>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() { window.print(); }, 800);
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
      setTimeout(() => setIsPrinting(false), 2000);
    }, 1000);
  };

  const togglePlant = (plantId: string) => {
    const newSelected = new Set(selectedPlants);
    if (newSelected.has(plantId)) {
      newSelected.delete(plantId);
    } else {
      newSelected.add(plantId);
    }
    setSelectedPlants(newSelected);
  };

  const selectAll = () => setSelectedPlants(new Set(filteredPlants.map((p) => p.id)));
  const deselectAll = () => setSelectedPlants(new Set());
  const selectFiltered = () => {
    const newSelected = new Set(selectedPlants);
    filteredPlants.forEach((p) => newSelected.add(p.id));
    setSelectedPlants(newSelected);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button className="gap-2">
              <QrCode className="w-4 h-4" />
              Generate Labels
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Tag className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold">
                  Generate Plant Labels
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Create printable labels with QR codes for compliance tracking
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background">
                  {selectedPlants.size} selected
                </Badge>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {plants.length} total
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Main Content */}
          <Tabs defaultValue="select" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4 border-b">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="select" className="gap-2">
                  <List className="w-4 h-4" />
                  Select Plants
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings2 className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Select Plants Tab */}
            <TabsContent value="select" className="flex-1 overflow-hidden m-0 p-6">
              <div className="h-full flex flex-col gap-4">
                {/* Search and Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by tag, strain, or batch..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="w-[150px]">
                      <Leaf className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      {stages.map((stage) => (
                        <SelectItem key={stage} value={stage} className="capitalize">
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={roomFilter} onValueChange={setRoomFilter}>
                    <SelectTrigger className="w-[150px]">
                      <Home className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rooms</SelectItem>
                      {rooms.map((room) => (
                        <SelectItem key={room} value={room}>
                          {room}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1 border rounded-lg p-1">
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8 w-8 p-0"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-8 w-8 p-0"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Selection Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        filteredPlants.length > 0 &&
                        filteredPlants.every((p) => selectedPlants.has(p.id))
                      }
                      onCheckedChange={(checked) => {
                        if (checked) selectFiltered();
                        else {
                          const newSelected = new Set(selectedPlants);
                          filteredPlants.forEach((p) => newSelected.delete(p.id));
                          setSelectedPlants(newSelected);
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {filteredPlants.length} plants shown
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Plant List/Grid */}
                <ScrollArea className="flex-1 border rounded-xl">
                  {viewMode === "list" ? (
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0 z-10">
                        <tr>
                          <th className="p-3 text-left w-12"></th>
                          <th className="p-3 text-left font-semibold">Plant Tag</th>
                          <th className="p-3 text-left font-semibold">Strain</th>
                          <th className="p-3 text-left font-semibold">Batch</th>
                          <th className="p-3 text-left font-semibold">Room</th>
                          <th className="p-3 text-left font-semibold">Stage</th>
                          <th className="p-3 text-left font-semibold">Planted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlants.map((plant) => (
                          <tr
                            key={plant.id}
                            className={cn(
                              "border-b transition-colors cursor-pointer",
                              selectedPlants.has(plant.id)
                                ? "bg-primary/5 hover:bg-primary/10"
                                : "hover:bg-muted/30"
                            )}
                            onClick={() => togglePlant(plant.id)}
                          >
                            <td className="p-3">
                              <Checkbox
                                checked={selectedPlants.has(plant.id)}
                                onCheckedChange={() => togglePlant(plant.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="p-3 font-mono font-bold text-primary">
                              {plant.tag}
                            </td>
                            <td className="p-3 font-medium">{plant.strain}</td>
                            <td className="p-3 font-mono text-muted-foreground text-xs">
                              {plant.batch}
                            </td>
                            <td className="p-3">{plant.room}</td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "capitalize text-xs",
                                  stageColors[plant.stage.toLowerCase()] ||
                                    "bg-gray-100 text-gray-700"
                                )}
                              >
                                {plant.stage}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">
                              {plant.plantedDate
                                ? new Date(plant.plantedDate).toLocaleDateString()
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
                      {filteredPlants.map((plant) => (
                        <Card
                          key={plant.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            selectedPlants.has(plant.id)
                              ? "ring-2 ring-primary bg-primary/5"
                              : "hover:bg-muted/30"
                          )}
                          onClick={() => togglePlant(plant.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <Checkbox
                                checked={selectedPlants.has(plant.id)}
                                onCheckedChange={() => togglePlant(plant.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Badge
                                variant="outline"
                                className={cn(
                                  "capitalize text-xs",
                                  stageColors[plant.stage.toLowerCase()]
                                )}
                              >
                                {plant.stage}
                              </Badge>
                            </div>
                            <div className="font-mono font-bold text-primary text-sm mb-1">
                              {plant.tag}
                            </div>
                            <div className="text-sm font-medium truncate">
                              {plant.strain}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {plant.room} • {plant.batch}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="flex-1 overflow-hidden m-0 p-6">
              <div className="h-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">Label Preview</span>
                    <Badge variant="secondary">
                      {selectedPlantData.length} label
                      {selectedPlantData.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Size:</Label>
                    <Select
                      value={labelSize}
                      onValueChange={(v) => setLabelSize(v as "standard" | "compact")}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (4×2.5")</SelectItem>
                        <SelectItem value="compact">Compact (2×1")</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedPlantData.length > 0 ? (
                  <ScrollArea className="flex-1 border rounded-xl bg-muted/20 p-6">
                    <div
                      className={cn(
                        "grid gap-4 justify-center",
                        labelSize === "compact" ? "grid-cols-4" : "grid-cols-2"
                      )}
                      style={{ transform: "scale(0.6)", transformOrigin: "top center" }}
                    >
                      {selectedPlantData.slice(0, 8).map((plant, index) =>
                        labelSize === "compact" ? (
                          <PlantLabelCompact key={index} {...plant} />
                        ) : (
                          <PlantLabel key={index} {...plant} />
                        )
                      )}
                    </div>
                    {selectedPlantData.length > 8 && (
                      <div className="text-center mt-6 text-muted-foreground">
                        +{selectedPlantData.length - 8} more labels will be printed
                      </div>
                    )}
                  </ScrollArea>
                ) : (
                  <div className="flex-1 flex items-center justify-center border rounded-xl bg-muted/10">
                    <div className="text-center">
                      <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No plants selected</p>
                      <p className="text-sm text-muted-foreground/70">
                        Select plants from the first tab to preview labels
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="flex-1 overflow-hidden m-0 p-6">
              <div className="max-w-lg space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Label Size
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Card
                      className={cn(
                        "cursor-pointer transition-all",
                        labelSize === "standard" && "ring-2 ring-primary"
                      )}
                      onClick={() => setLabelSize("standard")}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-16 h-10 border-2 border-dashed border-muted-foreground/30 rounded mx-auto mb-2" />
                        <div className="font-medium">Standard</div>
                        <div className="text-xs text-muted-foreground">4" × 2.5"</div>
                      </CardContent>
                    </Card>
                    <Card
                      className={cn(
                        "cursor-pointer transition-all",
                        labelSize === "compact" && "ring-2 ring-primary"
                      )}
                      onClick={() => setLabelSize("compact")}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-10 h-5 border-2 border-dashed border-muted-foreground/30 rounded mx-auto mb-2" />
                        <div className="font-medium">Compact</div>
                        <div className="text-xs text-muted-foreground">2" × 1"</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Print Information</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Labels are optimized for Letter size paper (8.5" × 11")</p>
                    <p>
                      • Standard labels: 2 per row, Compact labels: 4 per row
                    </p>
                    <p>• QR codes contain plant tracking data for compliance</p>
                    <p>• Use high-quality paper for best scanning results</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedPlantData.length > 0 ? (
                <span>
                  Ready to print{" "}
                  <span className="font-semibold text-foreground">
                    {selectedPlantData.length}
                  </span>{" "}
                  {labelSize} label{selectedPlantData.length !== 1 ? "s" : ""}
                </span>
              ) : (
                <span>Select plants to generate labels</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePrint}
                disabled={selectedPlantData.length === 0 || isPrinting}
                className="min-w-[140px]"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Labels
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden printable content */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "8.5in",
          height: "11in",
          overflow: "hidden",
          zIndex: -1,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <div ref={printRef}>
          {selectedPlantData.length > 0 && (
            <PlantLabelSheet plants={selectedPlantData} compact={labelSize === "compact"} />
          )}
        </div>
      </div>
    </>
  );
};
