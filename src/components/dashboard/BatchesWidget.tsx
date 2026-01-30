import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, Leaf, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Batch {
  id: string;
  strain: string;
  batchNumber: string;
  stage: string;
  plants: number;
  daysInStage: number;
}

interface BatchesWidgetProps {
  batches: Batch[];
  onViewAll?: () => void;
  onBatchClick?: (batchId: string) => void;
  isLoading?: boolean;
}

const stageConfig: Record<string, { color: string; bgColor: string }> = {
  clone: { color: "text-purple-600", bgColor: "bg-purple-100" },
  vegetative: { color: "text-green-600", bgColor: "bg-green-100" },
  flowering: { color: "text-pink-600", bgColor: "bg-pink-100" },
  harvest: { color: "text-amber-600", bgColor: "bg-amber-100" },
  drying: { color: "text-orange-600", bgColor: "bg-orange-100" },
  curing: { color: "text-yellow-600", bgColor: "bg-yellow-100" },
};

const BatchSkeleton = () => (
  <div className="flex items-center justify-between p-4 rounded-xl border bg-card animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-muted" />
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
    </div>
    <div className="text-right space-y-2">
      <div className="h-5 w-16 bg-muted rounded-full ml-auto" />
      <div className="h-3 w-24 bg-muted rounded" />
    </div>
  </div>
);

export const BatchesWidget = memo(
  ({ batches, onViewAll, onBatchClick, isLoading }: BatchesWidgetProps) => {
    if (isLoading) {
      return (
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-muted rounded animate-shimmer" />
              <div className="h-5 w-32 bg-muted rounded animate-shimmer" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <BatchSkeleton key={i} />
            ))}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="w-5 h-5 text-muted-foreground" />
              Active Batches
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {batches.length} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {batches.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Layers className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No active batches
              </p>
              <p className="text-xs text-muted-foreground">
                Start a new batch to get growing
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 flex-1">
                {batches.slice(0, 4).map((batch) => {
                  const stage = stageConfig[batch.stage] || {
                    color: "text-gray-600",
                    bgColor: "bg-gray-100",
                  };

                  return (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-card to-muted/20 hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer group"
                      onClick={() => onBatchClick?.(batch.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Leaf className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {batch.strain}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {batch.batchNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "mb-1.5 capitalize",
                            stage.bgColor,
                            stage.color,
                            "border-transparent"
                          )}
                        >
                          {batch.stage}
                        </Badge>
                        <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                          <span className="font-medium">{batch.plants}</span>{" "}
                          plants
                          <span className="mx-1">•</span>
                          <Calendar className="w-3 h-3" />
                          Day {batch.daysInStage}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {onViewAll && batches.length > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-muted-foreground hover:text-foreground"
                  onClick={onViewAll}
                >
                  View all {batches.length} batches
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }
);

BatchesWidget.displayName = "BatchesWidget";

export default BatchesWidget;
