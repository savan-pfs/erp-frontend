import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dna,
  Flower2,
  Sprout,
  Leaf,
  Flower,
  Scissors,
  Droplets,
  Package,
  Loader2,
  Info,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CultivationStage {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  count: number;
  active: boolean;
}

interface CultivationProgressProps {
  batches?: any[];
  genetics?: any[];
  mothers?: any[];
  rooms?: any[];
  harvestBatches?: any[];
  isLoading?: boolean;
}

const CultivationProgress = ({
  batches = [],
  genetics = [],
  mothers = [],
  rooms = [],
  harvestBatches = [],
  isLoading = false,
}: CultivationProgressProps) => {
  // Filter state - "all" or specific room ID
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>("all");
  
  // Create a map of room ID to room type for quick lookup
  const roomTypeMap = new Map(
    rooms.map((r) => [r.id, r.roomType || r.room_type])
  );
  
  // Filter batches based on selected room
  let filteredBatches = batches.filter((b) => b.isActive !== false);
  if (selectedRoomFilter !== "all") {
    const roomId = parseInt(selectedRoomFilter);
    if (!isNaN(roomId)) {
      filteredBatches = filteredBatches.filter((b) => {
        const batchRoomId = b.room?.id || b.roomId;
        // Handle both number and string comparisons
        return batchRoomId !== null && batchRoomId !== undefined && 
               (Number(batchRoomId) === roomId || String(batchRoomId) === String(roomId));
      });
    }
  }
  
  // Filter harvest batches based on selected room
  let filteredHarvestBatches = harvestBatches;
  if (selectedRoomFilter !== "all") {
    const roomId = parseInt(selectedRoomFilter);
    if (!isNaN(roomId)) {
      filteredHarvestBatches = harvestBatches.filter((h: any) => {
        const harvestRoomId = h.roomId || h.room_id;
        // Handle both number and string comparisons
        return harvestRoomId !== null && harvestRoomId !== undefined && 
               (Number(harvestRoomId) === roomId || String(harvestRoomId) === String(roomId));
      });
    }
  }
  
  // Filter active batches only
  const activeBatches = filteredBatches;
  // Calculate counts for each stage
  const stages: CultivationStage[] = [
    {
      id: "genetics",
      name: "Genetics",
      icon: Dna,
      color: "bg-purple-500",
      count: genetics.length,
      active: genetics.length > 0,
    },
    {
      id: "mothers",
      name: "Mother Plants",
      icon: Flower2,
      color: "bg-pink-500",
      count: mothers.length,
      active: mothers.length > 0,
    },
    {
      id: "propagation",
      name: "Propagation",
      icon: Sprout,
      color: "bg-green-500",
      count: activeBatches.filter(
        (b) => {
          const roomType = b.room?.id ? roomTypeMap.get(b.room.id) : null;
          return (
            roomType === "PROPAGATION" ||
            (b.batchType === "clone" && !roomType) ||
            (b.batchType === "seed" && !roomType)
          );
        }
      ).length,
      active:
        activeBatches.filter(
          (b) => {
            const roomType = b.room?.id ? roomTypeMap.get(b.room.id) : null;
            return (
              roomType === "PROPAGATION" ||
              (b.batchType === "clone" && !roomType) ||
              (b.batchType === "seed" && !roomType)
            );
          }
        ).length > 0,
    },
    {
      id: "vegetative",
      name: "Vegetative",
      icon: Leaf,
      color: "bg-emerald-500",
      count: activeBatches.filter((b) => {
        const roomType = b.room?.id ? roomTypeMap.get(b.room.id) : null;
        return roomType === "VEGETATIVE";
      }).length,
      active:
        activeBatches.filter((b) => {
          const roomType = b.room?.id ? roomTypeMap.get(b.room.id) : null;
          return roomType === "VEGETATIVE";
        }).length > 0,
    },
    {
      id: "flowering",
      name: "Flowering",
      icon: Flower,
      color: "bg-rose-500",
      count: activeBatches.filter((b) => {
        const roomType = b.room?.id ? roomTypeMap.get(b.room.id) : null;
        return roomType === "FLOWERING";
      }).length,
      active:
        activeBatches.filter((b) => {
          const roomType = b.room?.id ? roomTypeMap.get(b.room.id) : null;
          return roomType === "FLOWERING";
        }).length > 0,
    },
    {
      id: "harvest",
      name: "Harvest",
      icon: Scissors,
      color: "bg-amber-500",
      count: filteredHarvestBatches.filter((h: any) => 
        h.status === "harvesting" || h.status === "drying" || h.status === "curing" || h.status === "completed"
      ).length,
      active: filteredHarvestBatches.filter((h: any) => 
        h.status === "harvesting" || h.status === "drying" || h.status === "curing" || h.status === "completed"
      ).length > 0,
    },
    {
      id: "drying",
      name: "Drying",
      icon: Droplets,
      color: "bg-blue-500",
      count: filteredHarvestBatches.filter((h: any) => {
        const roomType = h.roomId ? roomTypeMap.get(h.roomId) : (h.room_type || null);
        return roomType === "DRYING" || h.status === "drying";
      }).length,
      active:
        filteredHarvestBatches.filter((h: any) => {
          const roomType = h.roomId ? roomTypeMap.get(h.roomId) : (h.room_type || null);
          return roomType === "DRYING" || h.status === "drying";
        }).length > 0,
    },
    {
      id: "curing",
      name: "Curing",
      icon: Package,
      color: "bg-indigo-500",
      count: filteredHarvestBatches.filter((h: any) => {
        const roomType = h.roomId ? roomTypeMap.get(h.roomId) : (h.room_type || null);
        return roomType === "CURING" || h.status === "curing";
      }).length,
      active:
        filteredHarvestBatches.filter((h: any) => {
          const roomType = h.roomId ? roomTypeMap.get(h.roomId) : (h.room_type || null);
          return roomType === "CURING" || h.status === "curing";
        }).length > 0,
    },
  ];

  // Calculate sequential progress based on cultivation flow
  // Flow: Genetics → Mothers → Propagation → Vegetative → Flowering → Harvest → Drying → Curing
  const flowOrder = ["genetics", "mothers", "propagation", "vegetative", "flowering", "harvest", "drying", "curing"];
  
  // Find the highest stage reached in the flow
  // Note: If harvest batches exist, we know batches have progressed through flowering
  // So we should consider flowering as "completed" even if no active batches are there now
  const hasHarvestBatches = filteredHarvestBatches.length > 0;
  const hasActiveFloweringBatches = stages.find(s => s.id === "flowering")?.active || false;
  
  let highestStageIndex = -1;
  for (let i = flowOrder.length - 1; i >= 0; i--) {
    const stageId = flowOrder[i];
    const stage = stages.find((s) => s.id === stageId);
    
    // Special case: If we have harvest batches, flowering stage is considered "completed"
    // even if no active batches are currently in flowering rooms
    if (stageId === "flowering" && hasHarvestBatches && !hasActiveFloweringBatches) {
      highestStageIndex = i;
      break;
    }
    
    if (stage && stage.active) {
      highestStageIndex = i;
      break;
    }
  }
  
  // Calculate progress based on sequential flow (not just count of active stages)
  const progressPercentage = highestStageIndex >= 0 
    ? ((highestStageIndex + 1) / flowOrder.length) * 100 
    : 0;

  // Find the current active stage (highest stage in flow)
  const currentStage = highestStageIndex >= 0 ? stages.find((s) => s.id === flowOrder[highestStageIndex]) : null;
  
  // Count active stages for badge
  const activeStages = stages.filter((s) => s.active).length;
  const totalStages = stages.length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cultivation Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Flower className="w-5 h-5 text-primary" />
            Cultivation Progress
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {activeStages}/{totalStages} Active
          </Badge>
        </div>
        {/* Room Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedRoomFilter} onValueChange={setSelectedRoomFilter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Filter by room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {rooms
                  .filter((r) => r.isActive !== false)
                  .map((room) => (
                    <SelectItem key={room.id} value={String(room.id)}>
                      {room.name} ({room.roomType || room.room_type || "Unknown"})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {selectedRoomFilter !== "all" && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>Showing data for:</span>
              <Badge variant="secondary" className="text-xs">
                {rooms.find((r) => String(r.id) === selectedRoomFilter)?.name || "Selected Room"}
              </Badge>
              <span className="text-muted-foreground">
                ({activeBatches.length} batches, {filteredHarvestBatches.length} harvest batches)
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Message */}
        {hasHarvestBatches && !hasActiveFloweringBatches && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Flow Explanation</p>
              <p className="text-xs">
                Stages show current active items. If batches have been harvested, they move from plant batches (Propagation/Vegetative/Flowering) 
                to harvest batches (Harvest/Drying/Curing). Inactive stages indicate no current batches in those rooms, but batches may have already progressed through them.
              </p>
            </div>
          </div>
        )}
        
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          {currentStage && (
            <p className="text-xs text-muted-foreground">
              Current Stage: <span className="font-medium">{currentStage.name}</span>
            </p>
          )}
        </div>

        {/* Flow Arrow Indicator */}
        {highestStageIndex >= 0 && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
            <span>Flow:</span>
            {flowOrder.map((stageId, idx) => {
              const stage = stages.find((s) => s.id === stageId);
              const isActive = stage?.active || false;
              const isCompleted = idx <= highestStageIndex;
              const isCurrent = idx === highestStageIndex;
              
              // Special handling: If harvest batches exist, flowering is considered completed
              if (stageId === "flowering" && hasHarvestBatches && !hasActiveFloweringBatches) {
                return (
                  <span key={stageId} className="flex items-center gap-1">
                    <span className={cn(
                      "font-medium",
                      isCurrent ? "text-primary" : isCompleted ? "text-muted-foreground line-through" : "text-muted-foreground opacity-50"
                    )}>
                      {stage?.name || stageId}
                    </span>
                    {idx < flowOrder.length - 1 && <span className="text-muted-foreground">→</span>}
                  </span>
                );
              }
              
              return stage ? (
                <span key={stageId} className="flex items-center gap-1">
                  <span className={cn(
                    "font-medium",
                    isCurrent ? "text-primary" : isCompleted && !isActive ? "text-muted-foreground line-through" : isActive ? "text-primary" : "text-muted-foreground opacity-50"
                  )}>
                    {stage.name}
                  </span>
                  {idx < flowOrder.length - 1 && <span className="text-muted-foreground">→</span>}
                </span>
              ) : null;
            })}
          </div>
        )}

        {/* Stage Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = stage.active;
            const stageFlowIndex = flowOrder.indexOf(stage.id);
            const isCompleted = stageFlowIndex >= 0 && stageFlowIndex < highestStageIndex;
            const isCurrent = stageFlowIndex === highestStageIndex;
            
            // Special case: If harvest batches exist, flowering is considered completed
            const isFloweringCompleted = stage.id === "flowering" && hasHarvestBatches && !hasActiveFloweringBatches;

            return (
              <div
                key={stage.id}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : isFloweringCompleted
                    ? "border-primary/30 bg-primary/2 border-dashed"
                    : "border-muted bg-muted/30",
                  isCurrent && "ring-2 ring-primary ring-offset-2"
                )}
              >
                {/* Stage Icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isActive
                      ? `${stage.color} text-white shadow-md`
                      : isFloweringCompleted
                      ? "bg-muted/50 text-muted-foreground border-2 border-dashed border-primary/30"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Stage Name */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {stage.name}
                  </p>
                  {stage.count > 0 && (
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className="mt-1 text-xs"
                    >
                      {stage.count}
                    </Badge>
                  )}
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* Stage Details */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {stages
              .filter((s) => s.active)
              .map((stage) => {
                const Icon = stage.icon;
                return (
                  <div
                    key={stage.id}
                    className="flex items-center gap-2 p-2 rounded bg-muted/50"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{stage.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {stage.count} {stage.count === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CultivationProgress;
