import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api/realApi";
import { useGenetics, useHarvestBatches, useRooms } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Plus,
  Scale,
  Leaf,
  FlaskConical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

// Import common components
import { PageHeader, StatCard, DataTable, StatusBadge } from "@/components/common";
import type { Column, RowAction } from "@/components/common";

type InventoryType = "flower" | "trim" | "concentrate" | "edible" | "other";

interface InventoryLot {
  id: string;
  lot_number: string;
  inventory_type: string;
  current_weight_lbs: number;
  thc_percent: number | null;
  cbd_percent: number | null;
  qa_status: string;
  created_at: string;
  genetics?: { name: string; strain_type: string } | null;
  rooms?: { name: string } | null;
}

const Inventory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLot, setNewLot] = useState({
    harvest_batch_id: "",
    lot_number: "",
    inventory_type: "" as InventoryType | "",
    genetic_id: "",
    room_id: "",
    initial_weight_lbs: "",
    thc_percent: "",
    cbd_percent: "",
    notes: "",
  });

  // Fetch inventory lots
  const { data: inventory, isLoading } = useQuery({
    queryKey: ["inventory-lots"],
    queryFn: async () => {
      const data = await inventoryApi.getAll();
      return (Array.isArray(data) ? data : []).map((lot: any) => ({
        ...lot,
        lot_number: lot.itemName || lot.lot_number,
        inventory_type: lot.itemType || lot.inventory_type,
        current_weight_lbs: lot.quantity || lot.current_weight_lbs,
        thc_percent: lot.thcPercentage || lot.thc_percent,
        cbd_percent: lot.cbdPercentage || lot.cbd_percent,
        genetics: lot.geneticName
          ? { name: lot.geneticName, strain_type: "hybrid" }
          : (lot.genetic ? { name: lot.genetic.name, strain_type: lot.genetic.strain_type } : null),
        rooms: lot.location ? { name: lot.location } : null,
      }));
    },
  });

  // Fetch genetics
  const { data: geneticsData } = useGenetics();
  const genetics = geneticsData
    ? geneticsData.map((g: any) => ({
        id: g.id,
        name: g.strainName || g.name,
        strain_type: g.geneticLineage || "hybrid",
      }))
    : [];

  // Fetch harvest batches (for inventory creation)
  const { data: harvestBatchesData } = useHarvestBatches();
  const harvestBatches = harvestBatchesData
    ? harvestBatchesData.filter((h: any) => 
        // Only show harvest batches in drying, curing, or completed status
        ['drying', 'curing', 'completed'].includes(h.status || 'drying')
      )
    : [];

  // Fetch rooms
  const { data: roomsData } = useRooms();
  const rooms = roomsData || [];

  // Create inventory lot
  const createLot = useMutation({
    mutationFn: async (lotData: typeof newLot) => {
      if (!lotData.harvest_batch_id) {
        throw new Error("Harvest batch is required");
      }
      if (!lotData.room_id) {
        throw new Error("Room is required");
      }

      const lot = await inventoryApi.create({
        harvestBatchId: parseInt(lotData.harvest_batch_id),
        itemName: lotData.lot_number,
        itemType: lotData.inventory_type || "flower",
        geneticId: lotData.genetic_id ? parseInt(lotData.genetic_id) : undefined,
        roomId: parseInt(lotData.room_id),
        quantity: parseFloat(lotData.initial_weight_lbs) * 453.592, // Convert lbs to grams
        unit: "g",
        thcPercentage: lotData.thc_percent ? parseFloat(lotData.thc_percent) : undefined,
        cbdPercentage: lotData.cbd_percent ? parseFloat(lotData.cbd_percent) : undefined,
        notes: lotData.notes || undefined,
      });

      return lot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-lots"] });
      setIsDialogOpen(false);
      setNewLot({
        harvest_batch_id: "",
        lot_number: "",
        inventory_type: "",
        genetic_id: "",
        room_id: "",
        initial_weight_lbs: "",
        thc_percent: "",
        cbd_percent: "",
        notes: "",
      });
      toast({
        title: "Inventory lot created",
        description: "New inventory lot has been added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate stats
  const stats = {
    totalLots: inventory?.length || 0,
    totalWeight:
      inventory?.reduce((sum, l) => sum + Number(l.current_weight_lbs), 0) || 0,
    flowerWeight:
      inventory
        ?.filter((l) => l.inventory_type === "flower")
        .reduce((sum, l) => sum + Number(l.current_weight_lbs), 0) || 0,
    trimWeight:
      inventory
        ?.filter((l) => l.inventory_type === "trim")
        .reduce((sum, l) => sum + Number(l.current_weight_lbs), 0) || 0,
  };

  const getTypeBadgeStatus = (type: string) => {
    const statusMap: Record<string, "success" | "warning" | "info" | "default"> = {
      flower: "success",
      trim: "warning",
      shake: "warning",
      seeds: "info",
      clones: "info",
      mother_plants: "info",
    };
    return statusMap[type] || "default";
  };

  const getQaStatus = (status: string): "success" | "warning" | "danger" | "pending" => {
    const statusMap: Record<string, "success" | "warning" | "danger" | "pending"> = {
      passed: "success",
      pending: "pending",
      failed: "danger",
    };
    return statusMap[status] || "pending";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newLot.harvest_batch_id ||
      !newLot.lot_number ||
      !newLot.inventory_type ||
      !newLot.genetic_id ||
      !newLot.room_id ||
      !newLot.initial_weight_lbs
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including harvest batch and room.",
        variant: "destructive",
      });
      return;
    }
    createLot.mutate(newLot);
  };

  const inventoryTypes: InventoryType[] = [
    "flower",
    "trim",
    "shake",
    "seeds",
    "clones",
    "mother_plants",
  ];

  // Define table columns
  const columns: Column<InventoryLot>[] = [
    {
      key: "lot_number",
      header: "Lot Number",
      sortable: true,
      cell: (row) => (
        <span className="font-medium font-mono text-foreground">
          {row.lot_number}
        </span>
      ),
    },
    {
      key: "inventory_type",
      header: "Type",
      sortable: true,
      cell: (row) => (
        <Badge
          variant="outline"
          className={`capitalize ${
            row.inventory_type === "flower"
              ? "bg-success-light text-success border-success/20"
              : row.inventory_type === "trim"
              ? "bg-warning-light text-warning border-warning/20"
              : "bg-info-light text-info border-info/20"
          }`}
        >
          {row.inventory_type.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "genetics",
      header: "Strain",
      sortable: true,
      cell: (row) => (
        <span className="text-foreground">{row.genetics?.name || "-"}</span>
      ),
    },
    {
      key: "current_weight_lbs",
      header: "Weight",
      sortable: true,
      cell: (row) => (
        <span className="font-medium">{row.current_weight_lbs} lbs</span>
      ),
    },
    {
      key: "thc_percent",
      header: "THC %",
      sortable: true,
      cell: (row) => (
        <span>{row.thc_percent ? `${row.thc_percent}%` : "-"}</span>
      ),
    },
    {
      key: "cbd_percent",
      header: "CBD %",
      sortable: true,
      cell: (row) => (
        <span>{row.cbd_percent ? `${row.cbd_percent}%` : "-"}</span>
      ),
    },
    {
      key: "qa_status",
      header: "QA Status",
      sortable: true,
      cell: (row) => (
        <StatusBadge
          status={getQaStatus(row.qa_status)}
          label={row.qa_status}
          size="sm"
        />
      ),
    },
    {
      key: "rooms",
      header: "Location",
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.rooms?.name || "Unassigned"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  // Define row actions
  const rowActions: RowAction<InventoryLot>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => console.log("View:", row.id),
    },
    {
      label: "Edit",
      icon: <Edit className="w-4 h-4" />,
      onClick: (row) => console.log("Edit:", row.id),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (row) => console.log("Delete:", row.id),
      variant: "destructive",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Inventory"
        description="Manage inventory lots and track product weights"
        breadcrumbs={[{ label: "Inventory" }]}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Inventory
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Inventory Lot</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="harvest_batch_id">Harvest Batch *</Label>
                  <Select
                    value={newLot.harvest_batch_id}
                    onValueChange={(value) =>
                      setNewLot({ ...newLot, harvest_batch_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select harvest batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {harvestBatches?.map((hb: any) => (
                        <SelectItem key={hb.id} value={String(hb.id)}>
                          {hb.harvestName || hb.harvest_name || `Harvest ${hb.id}`} 
                          {hb.status && ` (${hb.status})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a harvest batch in drying, curing, or completed status
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room_id">Room *</Label>
                  <Select
                    value={newLot.room_id}
                    onValueChange={(value) =>
                      setNewLot({ ...newLot, room_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms?.filter((r: any) => r.isActive !== false).map((room: any) => (
                        <SelectItem key={room.id} value={String(room.id)}>
                          {room.name} ({room.roomType || room.room_type || "Unknown"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lot_number">Lot Number *</Label>
                  <Input
                    id="lot_number"
                    placeholder="LOT-2024-001"
                    value={newLot.lot_number}
                    onChange={(e) =>
                      setNewLot({ ...newLot, lot_number: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inventory_type">Type *</Label>
                  <Select
                    value={newLot.inventory_type}
                    onValueChange={(value) =>
                      setNewLot({ ...newLot, inventory_type: value as InventoryType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type
                            .replace("_", " ")
                            .charAt(0)
                            .toUpperCase() +
                            type.replace("_", " ").slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genetic_id">Genetics *</Label>
                  <Select
                    value={newLot.genetic_id}
                    onValueChange={(value) =>
                      setNewLot({ ...newLot, genetic_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select strain" />
                    </SelectTrigger>
                    <SelectContent>
                      {genetics?.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name} ({g.strain_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initial_weight_lbs">Weight (lbs) *</Label>
                  <Input
                    id="initial_weight_lbs"
                    type="number"
                    step="0.01"
                    placeholder="10.00"
                    value={newLot.initial_weight_lbs}
                    onChange={(e) =>
                      setNewLot({ ...newLot, initial_weight_lbs: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="thc_percent">THC %</Label>
                    <Input
                      id="thc_percent"
                      type="number"
                      step="0.1"
                      placeholder="22.5"
                      value={newLot.thc_percent}
                      onChange={(e) =>
                        setNewLot({ ...newLot, thc_percent: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cbd_percent">CBD %</Label>
                    <Input
                      id="cbd_percent"
                      type="number"
                      step="0.1"
                      placeholder="0.5"
                      value={newLot.cbd_percent}
                      onChange={(e) =>
                        setNewLot({ ...newLot, cbd_percent: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={newLot.notes}
                    onChange={(e) =>
                      setNewLot({ ...newLot, notes: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createLot.isPending}
                  >
                    {createLot.isPending ? "Creating..." : "Add Inventory"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Lots"
          value={stats.totalLots}
          icon={<Package className="w-6 h-6" />}
          iconColor="bg-primary-light text-primary"
        />
        <StatCard
          title="Total Weight"
          value={`${stats.totalWeight.toFixed(1)} lbs`}
          icon={<Scale className="w-6 h-6" />}
          iconColor="bg-info-light text-info"
        />
        <StatCard
          title="Flower"
          value={`${stats.flowerWeight.toFixed(1)} lbs`}
          icon={<Leaf className="w-6 h-6" />}
          iconColor="bg-success-light text-success"
        />
        <StatCard
          title="Trim"
          value={`${stats.trimWeight.toFixed(1)} lbs`}
          icon={<FlaskConical className="w-6 h-6" />}
          iconColor="bg-warning-light text-warning"
        />
      </div>

      {/* Data Table */}
      <DataTable
        data={(inventory as InventoryLot[]) || []}
        columns={columns}
        rowActions={rowActions}
        searchable
        searchPlaceholder="Search by lot number or strain..."
        searchKeys={["lot_number", "genetics.name"]}
        pagination
        pageSize={10}
        loading={isLoading}
        onExport={() => console.log("Export inventory")}
        getRowId={(row) => row.id}
      />
    </div>
  );
};

export default Inventory;
